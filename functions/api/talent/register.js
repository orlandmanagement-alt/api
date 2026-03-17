import { json, readJson } from "../../_lib.js";
import { registerTalentFromInvite } from "../../services/talent/talent_register_service.js";

export async function onRequestPost({ request, env }){
  const body = await readJson(request) || {};
  const result = await registerTalentFromInvite(env, body);

  if(result?.error){
    let st = "server_error";
    if(result.status === 400) st = "invalid_input";
    else if(result.status === 403) st = "forbidden";
    else if(result.status === 409) st = "conflict";
    return json(result.status || 500, st, result);
  }

  return json(200, "ok", result);
}
