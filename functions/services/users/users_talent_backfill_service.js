import { hasRole, nowSec } from "../../_lib.js";
import {
  talentBackfillRows,
  insertTalentBackfillRow
} from "../../repos/users_repo.js";

export async function postTalentBackfillService(env, auth, query){
  if(!hasRole(auth.roles, ["super_admin","admin","staff"])) {
    return { error: "forbidden", status: 403 };
  }

  const limit = Math.min(5000, Math.max(1, Number(query.limit || "500")));

  const chk = await env.DB.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table' AND name='talent_profiles'
    LIMIT 1
  `).first();

  if(!chk){
    return {
      error: "talent_profiles_missing",
      status: 500,
      hint: "apply db/talent_profiles.sql to D1 first"
    };
  }

  const rows = await talentBackfillRows(env, limit);
  if(!rows.length){
    return { created: 0 };
  }

  const now = nowSec();
  let ok = 0;

  for(const row of rows){
    try{
      await insertTalentBackfillRow(env, row, now);
      ok++;
    }catch{}
  }

  return { created: ok };
}
