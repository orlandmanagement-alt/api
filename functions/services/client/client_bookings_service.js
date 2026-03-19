import { listProjectBookings, createProjectBooking, patchProjectBooking } from "../../repos/client_repo.js";

function nowSec() { return Math.floor(Date.now() / 1000); }

export async function listClientBookingsService(env, auth, params) {
  if(!auth.roles.includes('client') && !auth.roles.includes('super_admin')) return { error: "forbidden_role", status: 403 };
  const rows = await listProjectBookings(env, params.project_id);
  return {
    items: rows.map(row => ({
      id: row.id, project_id: row.project_id, project_title: row.project_title || "",
      project_role_id: row.project_role_id, role_title: row.role_title || "",
      talent_user_id: row.talent_user_id, talent_name: row.talent_name || "",
      status: row.status || "", notes: row.notes || "",
      created_at: row.created_at || null, updated_at: row.updated_at || null
    }))
  };
}

export async function createClientBookingService(env, auth, body) {
  if(!auth.roles.includes('client') && !auth.roles.includes('super_admin')) return { error: "forbidden_role", status: 403 };
  return await createProjectBooking(env, {
    project_role_id: String(body.project_role_id || "").trim(),
    talent_user_id: String(body.talent_user_id || "").trim(),
    notes: String(body.notes || "").trim(),
    created_at: nowSec()
  });
}

export async function patchClientBookingService(env, auth, body) {
  if(!auth.roles.includes('client') && !auth.roles.includes('super_admin')) return { error: "forbidden_role", status: 403 };
  return await patchProjectBooking(env, {
    booking_id: String(body.booking_id || "").trim(),
    status: String(body.status || "").trim().toLowerCase(),
    notes: String(body.notes || "").trim(),
    updated_at: nowSec()
  });
}
