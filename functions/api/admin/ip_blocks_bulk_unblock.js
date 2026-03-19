import { jsonOk, jsonForbidden } from "../../_lib/response.js";
import { requireAuth } from "../../_lib/session.js";

// Bypass Endpoint: Fitur IP Block ditangani via Cloudflare WAF
export async function onRequestPost({ request, env }){
  const auth = await requireAuth(env, request);
  if(!auth.ok) return auth.res;
  if(!auth.roles.includes("super_admin")) return jsonForbidden();
  
  return jsonOk({ message: "Pengaturan IP Block kini dikelola sepenuhnya melalui Cloudflare WAF Dashboard.", requested: 0, affected: 0 });
}
