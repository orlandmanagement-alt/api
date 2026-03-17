import { hasRole } from "../../_lib.js";
import { listTalentUsers, getTalentUserDetail } from "../../repos/users_repo.js";

function normLoc(s){
  return String(s||"").trim().toLowerCase().replace(/\s+/g," ");
}

function csvToArr(s){
  return String(s||"").split(",").map(x=>x.trim()).filter(Boolean);
}

export async function listTalentUsersService(env, auth, query){
  if(!hasRole(auth.roles, ["super_admin","admin","staff"])) return { error: "forbidden", status: 403 };

  const rows = await listTalentUsers(env, {
    q: String(query.q || "").trim().toLowerCase(),
    location: normLoc(query.location || ""),
    gender: String(query.gender || "").trim(),
    age_min: Number(query.age_min || "0") || 0,
    age_max: Number(query.age_max || "0") || 0,
    height_min: Number(query.height_min || "0") || 0,
    height_max: Number(query.height_max || "0") || 0,
    score_min: Number(query.score_min || "0") || 0,
    progress_min: Number(query.progress_min || "0") || 0,
    limit: Math.min(200, Math.max(1, Number(query.limit || "50")))
  });

  return {
    users: rows.map(x => ({
      id:x.id,
      email_norm:x.email_norm,
      display_name:x.display_name,
      status:x.status,
      created_at:x.created_at,
      updated_at:x.updated_at,
      last_login_at:x.last_login_at,
      profile: {
        gender:x.gender||"",
        age_years:x.age_years ?? null,
        height_cm:x.height_cm ?? null,
        location:x.tp_location||"",
        location_norm:x.location_norm||"",
        category_csv:x.category_csv||"",
        score:x.score ?? 0,
        progress_pct:x.progress_pct ?? 0,
        verified_email:Number(x.verified_email||0),
        verified_phone:Number(x.verified_phone||0),
        verified_identity:Number(x.verified_identity||0)
      }
    }))
  };
}

export async function getTalentUserDetailService(env, auth, id){
  if(!hasRole(auth.roles, ["super_admin","admin","staff"])) return { error: "forbidden", status: 403 };
  if(!id) return { error: "id", status: 400 };

  const row = await getTalentUserDetail(env, id);
  if(!row) return { error: "not_found", status: 404 };

  return {
    user: row.user,
    profile: row.profile ? { ...row.profile, category: csvToArr(row.profile.category_csv) } : null
  };
}
