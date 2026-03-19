import { getClientMeRow } from "../../repos/client_repo.js";
export async function getClientMeService(env, auth) {
  if(!auth.roles.includes('client') && !auth.roles.includes('super_admin')) return { error: "forbidden", status: 403 };
  const row = await getClientMeRow(env, auth.uid);
  if(!row) return { error: "not_found", status: 404 };
  return { user: row };
}
