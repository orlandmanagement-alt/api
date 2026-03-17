import { nowSec, normEmail, randomB64, pbkdf2Hash, sha256Base64, hasRole, revokeAllSessionsForUser } from "../../_lib.js";
import {
  ensureRole, getAdminUsers, getUserByEmail, createUser, attachUserRole,
  updateUserStatus, updateUserDisplayName, updateUserPassword, deleteAdminRoles
} from "../../repos/users_repo.js";

export async function listAdminUsersService(env, auth, query){
  if(!hasRole(auth.roles, ["super_admin","admin","staff"])) return { error: "forbidden", status: 403 };

  const q = String(query.q || "").trim().toLowerCase();
  const limit = Math.min(200, Math.max(1, Number(query.limit || "50")));

  const users = (await getAdminUsers(env, q, limit)).filter(u => {
    const s = new Set(u.roles);
    return s.has("super_admin") || s.has("admin") || s.has("staff");
  });

  return { users };
}

export async function createAdminUserService(env, auth, body){
  if(!hasRole(auth.roles, ["super_admin","admin"])) return { error: "forbidden", status: 403 };

  const email = normEmail(body.email);
  const display_name = String(body.display_name || "").trim();
  const role = String(body.role || "staff").trim();
  const password = String(body.password || "");

  if(!email.includes("@") || password.length < 10) return { error: "email/password", status: 400 };
  if(!["staff","admin","super_admin"].includes(role)) return { error: "role", status: 400 };
  if(role === "super_admin" && !hasRole(auth.roles, ["super_admin"])) return { error: "super_admin_only", status: 403 };

  const used = await getUserByEmail(env, email);
  if(used) return { error: "email_used", status: 409 };

  const now = nowSec();
  const user_id = crypto.randomUUID();
  const salt = randomB64(16);
  const iter = 100000;
  const hash = await pbkdf2Hash(password, salt, iter);

  let email_hash = "";
  try{
    email_hash = await sha256Base64(email + "|" + (env.HASH_PEPPER || ""));
  }catch{
    email_hash = email;
  }

  await createUser(env, {
    user_id,
    email_norm: email,
    email_hash,
    display_name: display_name || email,
    status: "active",
    created_at: now,
    updated_at: now,
    password_hash: hash,
    password_salt: salt,
    password_iter: iter,
    password_algo: "pbkdf2_sha256"
  });

  const role_id = await ensureRole(env, role, now);
  await attachUserRole(env, user_id, role_id, now);

  return { created: true, user_id };
}

export async function patchAdminUserService(env, auth, body){
  if(!hasRole(auth.roles, ["super_admin","admin"])) return { error: "forbidden", status: 403 };

  const action = String(body.action || "");
  const user_id = String(body.user_id || "");
  if(!user_id) return { error: "user_id", status: 400 };
  const now = nowSec();

  if(action === "disable" || action === "enable"){
    const status = action === "disable" ? "disabled" : "active";
    await updateUserStatus(env, user_id, status, now);
    return { updated: true };
  }

  if(action === "update_profile"){
    const display_name = String(body.display_name || "").trim();
    const status = String(body.status || "").trim();
    if(display_name) await updateUserDisplayName(env, user_id, display_name, now);
    if(status === "active" || status === "disabled") await updateUserStatus(env, user_id, status, now);
    return { updated: true };
  }

  if(action === "reset_password"){
    const new_password = String(body.new_password || "");
    if(new_password.length < 10) return { error: "min10", status: 400 };

    const salt = randomB64(16);
    const iter = 100000;
    const hash = await pbkdf2Hash(new_password, salt, iter);
    await updateUserPassword(env, user_id, hash, salt, iter, now);
    return { updated: true };
  }

  if(action === "revoke_sessions"){
    await revokeAllSessionsForUser(env, user_id, "admin_revoke_sessions");
    return { revoked: true };
  }

  if(action === "set_roles"){
    const roles = Array.isArray(body.roles) ? body.roles.map(String).filter(Boolean) : [];
    if(!roles.length) return { error: "roles", status: 400 };
    if(roles.includes("super_admin") && !hasRole(auth.roles, ["super_admin"])) return { error: "super_admin_only", status: 403 };

    await deleteAdminRoles(env, user_id);
    for(const nm of roles){
      if(!["super_admin","admin","staff"].includes(nm)) continue;
      const rid = await ensureRole(env, nm, now);
      await attachUserRole(env, user_id, rid, now);
    }
    return { updated: true };
  }

  return { error: "unknown_action", status: 400 };
}
