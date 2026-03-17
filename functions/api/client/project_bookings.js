import { json, requireAuth, hasRole, readJson } from "../../_lib.js";
import { getClientBookings, postClientBooking, patchClientBooking } from "../../services/client/client_bookings_service.js";

function canAccessClient(roles){
  const set = new Set((roles || []).map(String));
  return set.has("client") || set.has("super_admin") || set.has("admin") || set.has("staff");
}

export async function onRequestGet({ request, env }){
  const auth = await requireAuth(env, request);
  if(!auth.ok) return auth.res;
  if(!canAccessClient(auth.roles || [])) return json(403, "forbidden", { message: "role_not_allowed" });

  const url = new URL(request.url);
  const projectId = String(url.searchParams.get("project_id") || "").trim();
  return json(200, "ok", await getClientBookings(env, projectId));
}

export async function onRequestPost({ request, env }){
  const auth = await requireAuth(env, request);
  if(!auth.ok) return auth.res;
  if(!hasRole(auth.roles || [], ["client", "super_admin", "admin"])) return json(403, "forbidden", { message: "role_not_allowed" });

  const body = await readJson(request) || {};
  if(!String(body.project_role_id || "").trim() || !String(body.talent_user_id || "").trim()){
    return json(400, "invalid_input", { message: "project_role_id_and_talent_user_id_required" });
  }

  const result = await postClientBooking(env, body);
  if (result?.error) {
    return json(result.status || 500, result.status === 409 ? "conflict" : result.status === 404 ? "not_found" : "server_error", result);
  }
  return json(200, "ok", result);
}

export async function onRequestPatch({ request, env }){
  const auth = await requireAuth(env, request);
  if(!auth.ok) return auth.res;
  if(!hasRole(auth.roles || [], ["client", "super_admin", "admin"])) return json(403, "forbidden", { message: "role_not_allowed" });

  const body = await readJson(request) || {};
  const bookingId = String(body.booking_id || "").trim();
  const status = String(body.status || "").trim().toLowerCase();
  const allowed = new Set(["pending", "confirmed", "cancelled", "completed"]);

  if(!bookingId) return json(400, "invalid_input", { message: "booking_id_required" });
  if(status && !allowed.has(status)) return json(400, "invalid_input", { message: "invalid_booking_status" });

  const result = await patchClientBooking(env, body);
  if (result?.error) {
    return json(result.status || 500, result.status === 404 ? "not_found" : "server_error", result);
  }
  return json(200, "ok", result);
}
