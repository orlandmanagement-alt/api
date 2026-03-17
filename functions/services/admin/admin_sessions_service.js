import { nowSec, hasRole, auditEvent, sha256Base64 } from "../../_lib.js";
import {
  getSessionUser,
  getSessionsByUser,
  revokeSessionRow,
  revokeUserSessionsRows,
  rotateUserSessionVersion
} from "../../repos/admin_repo.js";

async function hashIp(env, ip){
  const pepper = String(env.HASH_PEPPER || "");
  return await sha256Base64(String(ip || "") + "|" + pepper);
}

function canManage(auth){
  return hasRole(auth.roles, ["super_admin", "admin", "security_admin"]);
}

export async function getAdminSessionsIndex(env, auth, query){
  if(!canManage(auth)) return { error: "forbidden", status: 403 };

  const user_id = String(query.user_id || "").trim();
  if(!user_id) return { error: "user_id_required", status: 400 };

  const user = await getSessionUser(env, user_id);
  if(!user) return { error: "user_not_found", status: 404 };

  const rows = await getSessionsByUser(env, user_id);

  return {
    user: {
      id: String(user.id || ""),
      email_norm: user.email_norm || null,
      display_name: user.display_name || null,
      status: user.status || null,
      session_version: Number(user.session_version || 1),
      locked_until: user.locked_until == null ? null : Number(user.locked_until),
      lock_reason: user.lock_reason || null
    },
    items: rows.map(x => ({
      id: String(x.id || ""),
      user_id: String(x.user_id || ""),
      created_at: Number(x.created_at || 0),
      expires_at: Number(x.expires_at || 0),
      revoked_at: x.revoked_at == null ? null : Number(x.revoked_at),
      ip_hash: x.ip_hash || null,
      ua_hash: x.ua_hash || null,
      ip_prefix_hash: x.ip_prefix_hash || null,
      last_seen_at: x.last_seen_at == null ? null : Number(x.last_seen_at),
      role_snapshot: x.role_snapshot || null,
      roles_json: x.roles_json || null,
      session_version: Number(x.session_version || 1),
      revoke_reason: x.revoke_reason || null
    }))
  };
}

export async function postAdminSessionRevoke(env, auth, request, body){
  if(!canManage(auth)) return { error: "forbidden", status: 403 };

  const sid = String(body.sid || "").trim();
  if(!sid) return { error: "sid_required", status: 400 };

  const row = await env.DB.prepare(`
    SELECT id, user_id, revoked_at
    FROM sessions
    WHERE id = ?
    LIMIT 1
  `).bind(sid).first();

  if(!row) return { error: "session_not_found", status: 404 };

  const now = nowSec();
  await revokeSessionRow(env, sid, now, "admin_revoke_session");

  let ipHash = null;
  try{
    ipHash = await hashIp(env, request.headers.get("CF-Connecting-IP") || "");
  }catch{}

  try{
    await auditEvent(env, request, {
      actor_user_id: auth.uid,
      action: "admin_revoke_session",
      ip_hash: ipHash,
      http_status: 200,
      meta: {
        target_user_id: row.user_id || null,
        target_sid: sid
      }
    });
  }catch{}

  return {
    revoked: true,
    sid,
    user_id: row.user_id || null
  };
}

export async function postAdminSessionRevokeAll(env, auth, request, body){
  if(!canManage(auth)) return { error: "forbidden", status: 403 };

  const user_id = String(body.user_id || "").trim();
  if(!user_id) return { error: "user_id_required", status: 400 };

  const user = await getSessionUser(env, user_id);
  if(!user) return { error: "user_not_found", status: 404 };

  const now = nowSec();
  await revokeUserSessionsRows(env, user_id, now, "admin_revoke_all_sessions");

  let ipHash = null;
  try{
    ipHash = await hashIp(env, request.headers.get("CF-Connecting-IP") || "");
  }catch{}

  try{
    await auditEvent(env, request, {
      actor_user_id: auth.uid,
      action: "admin_revoke_all_sessions",
      ip_hash: ipHash,
      http_status: 200,
      meta: {
        target_user_id: user_id,
        target_email_norm: user.email_norm || null
      }
    });
  }catch{}

  return {
    revoked: true,
    user_id
  };
}

export async function postAdminSessionRotateVersion(env, auth, request, body){
  if(!canManage(auth)) return { error: "forbidden", status: 403 };

  const user_id = String(body.user_id || "").trim();
  const revoke_sessions = body.revoke_sessions !== false;

  if(!user_id) return { error: "user_id_required", status: 400 };

  const user = await getSessionUser(env, user_id);
  if(!user) return { error: "user_not_found", status: 404 };

  const currentVersion = Number(user.session_version || 1);
  const nextVersion = currentVersion + 1;
  const now = nowSec();

  await rotateUserSessionVersion(env, user_id, nextVersion, now);

  if(revoke_sessions){
    await revokeUserSessionsRows(env, user_id, now, "session_version_rotated");
  }

  let ipHash = null;
  try{
    ipHash = await hashIp(env, request.headers.get("CF-Connecting-IP") || "");
  }catch{}

  try{
    await auditEvent(env, request, {
      actor_user_id: auth.uid,
      action: "admin_rotate_session_version",
      ip_hash: ipHash,
      http_status: 200,
      meta: {
        target_user_id: user_id,
        target_email_norm: user.email_norm || null,
        old_session_version: currentVersion,
        new_session_version: nextVersion,
        revoke_sessions
      }
    });
  }catch{}

  return {
    rotated: true,
    user_id,
    old_session_version: currentVersion,
    new_session_version: nextVersion,
    revoke_sessions
  };
}
