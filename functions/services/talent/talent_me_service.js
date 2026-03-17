import { getTalentMeRow } from "../../repos/talent_repo.js";

export async function getTalentMe(env, auth) {
  const u = await getTalentMeRow(env, auth.uid);
  return {
    id: u?.id,
    email_norm: u?.email_norm,
    display_name: u?.display_name,
    status: u?.status,
    roles: auth.roles,
    portal: "talent"
  };
}
