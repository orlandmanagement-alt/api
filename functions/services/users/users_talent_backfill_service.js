import { hasRole, nowSec } from "../../_lib.js";
import { insertTalentBackfillRow } from "../../repos/users_repo.js";

export async function postTalentBackfillService(env, auth, query){
  if(!hasRole(auth.roles, ["super_admin","admin","staff"])) return { error: "forbidden", status: 403 };
  if(!env.DB_TALENT) return { error: "talent_db_missing", status: 500 };

  const limit = Math.min(5000, Math.max(1, Number(query.limit || "500")));
  const now = nowSec();
  
  // Cross DB Sinkronisasi
  const users = await env.DB.prepare("SELECT id, full_name FROM users WHERE role='talent' LIMIT ?").bind(limit).all();
  let ok = 0;
  
  for(const row of (users.results || [])){
    try{
      await insertTalentBackfillRow(env, row.id, row.full_name, now);
      ok++;
    }catch{}
  }

  return { created: ok, processed: (users.results || []).length };
}
