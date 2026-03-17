import { json, requirePortalAuth } from "../../_lib.js";
import { getClientMe } from "../../services/client/client_me_service.js";

export async function onRequestGet({ request, env }) {
  const a = await requirePortalAuth(env, request, "client");
  if (!a.ok) return a.res;
  return json(200, "ok", await getClientMe(env, a));
}
