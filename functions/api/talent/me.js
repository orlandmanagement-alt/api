import { json, requirePortalAuth } from "../../_lib.js";
import { getTalentMe } from "../../services/talent/talent_me_service.js";

export async function onRequestGet({ request, env }) {
  const a = await requirePortalAuth(env, request, "talent");
  if (!a.ok) return a.res;
  return json(200, "ok", await getTalentMe(env, a));
}
