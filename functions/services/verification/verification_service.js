import { hasRole } from "../../_lib.js";

export async function getVerificationHealthService(env, auth){
  if(!hasRole(auth.roles, ["super_admin", "admin", "security_admin", "staff"])){
    return { error: "forbidden", status: 403 };
  }

  const pending = await env.DB.prepare(`
    SELECT COUNT(*) AS pending_reviews
    FROM user_verifications
    WHERE status = 'pending'
  `).first().catch(() => ({ pending_reviews: 0 }));

  const approved = await env.DB.prepare(`
    SELECT COUNT(*) AS approved_reviews
    FROM user_verifications
    WHERE status = 'approved'
  `).first().catch(() => ({ approved_reviews: 0 }));

  const rejected = await env.DB.prepare(`
    SELECT COUNT(*) AS rejected_reviews
    FROM user_verifications
    WHERE status = 'rejected'
  `).first().catch(() => ({ rejected_reviews: 0 }));

  return {
    pending_reviews: Number(pending?.pending_reviews || 0),
    approved_reviews: Number(approved?.approved_reviews || 0),
    rejected_reviews: Number(rejected?.rejected_reviews || 0)
  };
}

export async function getVerificationRecentEventsService(env, auth, query){
  if(!hasRole(auth.roles, ["super_admin", "admin", "security_admin", "staff"])){
    return { error: "forbidden", status: 403 };
  }

  const limit = Math.min(500, Math.max(1, Number(query.limit || "100")));

  const rows = await env.DB.prepare(`
    SELECT id, user_id, kind, status, reviewed_by_user_id, reviewed_at, created_at, updated_at
    FROM user_verifications
    ORDER BY updated_at DESC, created_at DESC
    LIMIT ?
  `).bind(limit).all().catch(() => ({ results: [] }));

  return {
    items: (rows.results || []).map(x => ({
      id: String(x.id || ""),
      user_id: x.user_id || null,
      kind: x.kind || "",
      status: x.status || "",
      reviewed_by_user_id: x.reviewed_by_user_id || null,
      reviewed_at: x.reviewed_at == null ? null : Number(x.reviewed_at),
      created_at: Number(x.created_at || 0),
      updated_at: Number(x.updated_at || 0)
    }))
  };
}
