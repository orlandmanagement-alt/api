import { getTalentMeRow } from "../../repos/talent_repo.js";
export async function getTalentMeService(env, auth) {
  if(!auth.roles.includes('talent')) return { error: "forbidden", status: 403 };
  const row = await getTalentMeRow(env, auth.uid);
  if(!row) return { error: "not_found", status: 404 };
  return { user: row };
}
