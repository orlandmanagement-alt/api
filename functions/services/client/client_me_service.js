import { getClientMeRow } from "../../repos/client_repo.js";

export async function getClientMe(env, auth) {
  const u = await getClientMeRow(env, auth.uid);
  return {
    id: u?.id,
    email_norm: u?.email_norm,
    display_name: u?.display_name,
    status: u?.status,
    roles: auth.roles,
    portal: "client"
  };
}
