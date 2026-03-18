#!/data/data/com.termux/files/usr/bin/bash
set -eu

echo "[1/6] remove legacy helper directories"
rm -rf functions/api/admin/_helper
rm -rf functions/api/admin/mfa/_helper
rm -rf functions/api/admin/registry/_helper
rm -rf functions/api/admin/users/_helper
rm -rf functions/api/config/plugins/_helper
rm -rf functions/api/users/client/_helper
rm -rf functions/api/users/talent/_helper
rm -rf functions/api/users/_helper
rm -rf functions/api/verification/_helper
rm -rf functions/api/security/_core

echo "[2/6] remove legacy duplicate routes"
rm -f functions/api/dashboard_summary.js

rm -f functions/api/client/project_invites_get.js
rm -f functions/api/client/project_shortlists_get.js

rm -f functions/api/talent/project_apply.js
rm -f functions/api/talent/invite_detail.js
rm -f functions/api/talent/invite_respond.js

echo "[3/6] remove legacy config routes not aligned to new service structure"
rm -f functions/api/config/blogspot.js
rm -f functions/api/config/cron-global.js

echo "[4/6] remove legacy verification routes not yet migrated to services"
rm -f functions/api/verification/admin_reviews.js
rm -f functions/api/verification/audit_summary.js
rm -f functions/api/verification/cleanup_preview.js
rm -f functions/api/verification/cleanup_run.js
rm -f functions/api/verification/cron_cleanup.js
rm -f functions/api/verification/cron_status.js
rm -f functions/api/verification/enable-two-step.js
rm -f functions/api/verification/fulfill-email.js
rm -f functions/api/verification/request-kyc.js
rm -f functions/api/verification/review_kyc.js
rm -f functions/api/verification/seed.js
rm -f functions/api/verification/send-email.js
rm -f functions/api/verification/send-phone-otp.js
rm -f functions/api/verification/submit-kyc.js
rm -f functions/api/verification/verify-phone-otp.js

echo "[5/6] rewrite final route files so they no longer depend on deleted helpers"

cat > functions/api/dashboard/summary.js <<'ROUTE'
import { json, requireAuth } from "../../_lib.js";
import { getDashboardSummaryService } from "../../services/dashboard/dashboard_service.js";

export async function onRequestGet({ request, env }){
  const auth = await requireAuth(env, request);
  if(!auth.ok) return auth.res;

  const result = await getDashboardSummaryService(env, auth);
  if(result?.error){
    const st = result.status || 500;
    const name = st === 403 ? "forbidden" : "server_error";
    return json(st, name, result);
  }

  return json(200, "ok", result);
}
ROUTE

cat > functions/api/client/me.js <<'ROUTE'
import { json, requirePortalAuth } from "../../_lib.js";
import { getClientMeService } from "../../services/client/client_me_service.js";

export async function onRequestGet({ request, env }){
  const auth = await requirePortalAuth(env, request, "client");
  if(!auth.ok) return auth.res;

  const result = await getClientMeService(env, auth);
  if(result?.error){
    return json(result.status || 500, result.status === 404 ? "not_found" : "server_error", result);
  }

  return json(200, "ok", result);
}
ROUTE

cat > functions/api/client/project_invites.js <<'ROUTE'
import { json, requireAuth } from "../../_lib.js";
import { listClientInvitesService, createClientInviteService } from "../../services/client/client_invites_service.js";

export async function onRequestGet({ request, env }){
  const auth = await requireAuth(env, request);
  if(!auth.ok) return auth.res;

  const url = new URL(request.url);
  const result = await listClientInvitesService(env, auth, {
    project_id: url.searchParams.get("project_id") || ""
  });

  if(result?.error){
    const st = result.status || 500;
    const name = st === 403 ? "forbidden" : "server_error";
    return json(st, name, result);
  }

  return json(200, "ok", result);
}

export async function onRequestPost({ request, env }){
  const auth = await requireAuth(env, request);
  if(!auth.ok) return auth.res;

  let body = {};
  try{ body = await request.json(); }catch{}

  const result = await createClientInviteService(env, auth, body);
  if(result?.error){
    const st = result.status || 500;
    let name = "server_error";
    if(st === 400) name = "invalid_input";
    else if(st === 403) name = "forbidden";
    else if(st === 404) name = "not_found";
    else if(st === 409) name = "conflict";
    return json(st, name, result);
  }

  return json(200, "ok", result);
}
ROUTE

cat > functions/api/client/project_shortlists.js <<'ROUTE'
import { json, requireAuth } from "../../_lib.js";
import { listClientShortlistsService, createClientShortlistService } from "../../services/client/client_shortlists_service.js";

export async function onRequestGet({ request, env }){
  const auth = await requireAuth(env, request);
  if(!auth.ok) return auth.res;

  const url = new URL(request.url);
  const result = await listClientShortlistsService(env, auth, {
    project_id: url.searchParams.get("project_id") || ""
  });

  if(result?.error){
    const st = result.status || 500;
    const name = st === 403 ? "forbidden" : "server_error";
    return json(st, name, result);
  }

  return json(200, "ok", result);
}

export async function onRequestPost({ request, env }){
  const auth = await requireAuth(env, request);
  if(!auth.ok) return auth.res;

  let body = {};
  try{ body = await request.json(); }catch{}

  const result = await createClientShortlistService(env, auth, body);
  if(result?.error){
    const st = result.status || 500;
    let name = "server_error";
    if(st === 400) name = "invalid_input";
    else if(st === 403) name = "forbidden";
    else if(st === 404) name = "not_found";
    else if(st === 409) name = "conflict";
    return json(st, name, result);
  }

  return json(200, "ok", result);
}
ROUTE

cat > functions/api/client/project_bookings.js <<'ROUTE'
import { json, requireAuth } from "../../_lib.js";
import { listClientBookingsService, createClientBookingService, patchClientBookingService } from "../../services/client/client_bookings_service.js";

export async function onRequestGet({ request, env }){
  const auth = await requireAuth(env, request);
  if(!auth.ok) return auth.res;

  const url = new URL(request.url);
  const result = await listClientBookingsService(env, auth, {
    project_id: url.searchParams.get("project_id") || ""
  });

  if(result?.error){
    const st = result.status || 500;
    const name = st === 403 ? "forbidden" : "server_error";
    return json(st, name, result);
  }

  return json(200, "ok", result);
}

export async function onRequestPost({ request, env }){
  const auth = await requireAuth(env, request);
  if(!auth.ok) return auth.res;

  let body = {};
  try{ body = await request.json(); }catch{}

  const mode = String(body.mode || "").trim().toLowerCase();
  const result = mode === "patch"
    ? await patchClientBookingService(env, auth, body)
    : await createClientBookingService(env, auth, body);

  if(result?.error){
    const st = result.status || 500;
    let name = "server_error";
    if(st === 400) name = "invalid_input";
    else if(st === 403) name = "forbidden";
    else if(st === 404) name = "not_found";
    else if(st === 409) name = "conflict";
    return json(st, name, result);
  }

  return json(200, "ok", result);
}
ROUTE

cat > functions/api/talent/me.js <<'ROUTE'
import { json, requirePortalAuth } from "../../_lib.js";
import { getTalentMeService } from "../../services/talent/talent_me_service.js";

export async function onRequestGet({ request, env }){
  const auth = await requirePortalAuth(env, request, "talent");
  if(!auth.ok) return auth.res;

  const result = await getTalentMeService(env, auth);
  if(result?.error){
    return json(result.status || 500, result.status === 404 ? "not_found" : "server_error", result);
  }

  return json(200, "ok", result);
}
ROUTE

cat > functions/api/talent/profile.js <<'ROUTE'
import { json, requireAuth } from "../../_lib.js";
import { getTalentProfileService, putTalentProfileService } from "../../services/talent/talent_profile_service.js";

export async function onRequestGet({ request, env }){
  const auth = await requireAuth(env, request);
  if(!auth.ok) return auth.res;

  const result = await getTalentProfileService(env, auth);
  if(result?.error){
    const st = result.status || 500;
    let name = "server_error";
    if(st === 403) name = "forbidden";
    else if(st === 404) name = "not_found";
    return json(st, name, result);
  }

  return json(200, "ok", result);
}

export async function onRequestPut({ request, env }){
  const auth = await requireAuth(env, request);
  if(!auth.ok) return auth.res;

  let body = {};
  try{ body = await request.json(); }catch{}

  const result = await putTalentProfileService(env, auth, body);
  if(result?.error){
    const st = result.status || 500;
    let name = "server_error";
    if(st === 400) name = "invalid_input";
    else if(st === 403) name = "forbidden";
    else if(st === 404) name = "not_found";
    return json(st, name, result);
  }

  return json(200, "ok", result);
}
ROUTE

cat > functions/api/talent/project_applications.js <<'ROUTE'
import { json, requireAuth } from "../../_lib.js";
import { listTalentApplicationsService, applyTalentProjectService, withdrawTalentApplicationService } from "../../services/talent/talent_applications_service.js";

export async function onRequestGet({ request, env }){
  const auth = await requireAuth(env, request);
  if(!auth.ok) return auth.res;

  const result = await listTalentApplicationsService(env, auth);
  if(result?.error){
    const st = result.status || 500;
    const name = st === 403 ? "forbidden" : "server_error";
    return json(st, name, result);
  }

  return json(200, "ok", result);
}

export async function onRequestPost({ request, env }){
  const auth = await requireAuth(env, request);
  if(!auth.ok) return auth.res;

  let body = {};
  try{ body = await request.json(); }catch{}

  const action = String(body.action || "").trim().toLowerCase();
  const result = action === "withdraw"
    ? await withdrawTalentApplicationService(env, auth, body)
    : await applyTalentProjectService(env, auth, body);

  if(result?.error){
    const st = result.status || 500;
    let name = "server_error";
    if(st === 400) name = "invalid_input";
    else if(st === 403) name = "forbidden";
    else if(st === 404) name = "not_found";
    else if(st === 409) name = "conflict";
    return json(st, name, result);
  }

  return json(200, "ok", result);
}
ROUTE

cat > functions/api/talent/project_invites_detail.js <<'ROUTE'
import { json, requireAuth } from "../../_lib.js";
import { getTalentInviteDetailService } from "../../services/talent/talent_invites_service.js";

export async function onRequestGet({ request, env }){
  const auth = await requireAuth(env, request);
  if(!auth.ok) return auth.res;

  const url = new URL(request.url);
  const result = await getTalentInviteDetailService(env, auth, {
    invite_id: url.searchParams.get("invite_id") || ""
  });

  if(result?.error){
    const st = result.status || 500;
    let name = "server_error";
    if(st === 400) name = "invalid_input";
    else if(st === 403) name = "forbidden";
    else if(st === 404) name = "not_found";
    return json(st, name, result);
  }

  return json(200, "ok", result);
}
ROUTE

cat > functions/api/talent/project_invites_respond.js <<'ROUTE'
import { json, requireAuth } from "../../_lib.js";
import { respondTalentInviteService } from "../../services/talent/talent_invites_service.js";

export async function onRequestPost({ request, env }){
  const auth = await requireAuth(env, request);
  if(!auth.ok) return auth.res;

  let body = {};
  try{ body = await request.json(); }catch{}

  const result = await respondTalentInviteService(env, auth, body);
  if(result?.error){
    const st = result.status || 500;
    let name = "server_error";
    if(st === 400) name = "invalid_input";
    else if(st === 403) name = "forbidden";
    else if(st === 404) name = "not_found";
    else if(st === 409) name = "conflict";
    return json(st, name, result);
  }

  return json(200, "ok", result);
}
ROUTE

cat > functions/api/talent/register.js <<'ROUTE'
import { json } from "../../_lib.js";
import { registerTalentService } from "../../services/talent/talent_register_service.js";

export async function onRequestPost({ request, env }){
  let body = {};
  try{ body = await request.json(); }catch{}

  const result = await registerTalentService(env, body);
  if(result?.error){
    const st = result.status || 500;
    let name = "server_error";
    if(st === 400) name = "invalid_input";
    else if(st === 403) name = "forbidden";
    else if(st === 404) name = "not_found";
    else if(st === 409) name = "conflict";
    return json(st, name, result);
  }

  return json(200, "ok", result);
}
ROUTE

cat > functions/api/users/admin.js <<'ROUTE'
import { onRequestGet, onRequestPost, onRequestPut } from "../../services/users/users_admin_service.js";
export { onRequestGet, onRequestPost, onRequestPut };
ROUTE

cat > functions/api/users/client.js <<'ROUTE'
import { onRequestGet } from "../../services/users/users_client_service.js";
export { onRequestGet };
ROUTE

cat > functions/api/users/lifecycle.js <<'ROUTE'
import { onRequestGet, onRequestPost } from "../../services/users/users_lifecycle_service.js";
export { onRequestGet, onRequestPost };
ROUTE

cat > functions/api/users/offboarding.js <<'ROUTE'
import { onRequestGet, onRequestPost } from "../../services/users/users_offboarding_service.js";
export { onRequestGet, onRequestPost };
ROUTE

cat > functions/api/users/options.js <<'ROUTE'
import { onRequestGet } from "../../services/users/users_options_service.js";
export { onRequestGet };
ROUTE

cat > functions/api/users/talent_backfill.js <<'ROUTE'
import { onRequestPost } from "../../services/users/users_talent_backfill_service.js";
export { onRequestPost };
ROUTE

cat > functions/api/users/talent.js <<'ROUTE'
import { onRequestGet } from "../../services/users/users_talent_service.js";
export { onRequestGet };
ROUTE

cat > functions/api/users/talent/index.js <<'ROUTE'
import { onRequestGet } from "../../../services/users/users_talent_service.js";
export { onRequestGet };
ROUTE

cat > functions/api/users/talent/detail.js <<'ROUTE'
import { onRequestGet } from "../../../services/users/users_talent_service.js";
export { onRequestGet };
ROUTE

cat > functions/api/users/talent/invite.js <<'ROUTE'
import { onRequestPost } from "../../../services/users/users_talent_service.js";
export { onRequestPost };
ROUTE

cat > functions/api/users/talent/profile.js <<'ROUTE'
import { onRequestPost } from "../../../services/users/users_talent_service.js";
export { onRequestPost };
ROUTE

cat > functions/api/verification/healthcheck.js <<'ROUTE'
import { json, requireAuth } from "../../_lib.js";
import { getVerificationHealthService } from "../../services/verification/verification_service.js";

export async function onRequestGet({ request, env }){
  const auth = await requireAuth(env, request);
  if(!auth.ok) return auth.res;

  const result = await getVerificationHealthService(env, auth);
  if(result?.error){
    const st = result.status || 500;
    const name = st === 403 ? "forbidden" : "server_error";
    return json(st, name, result);
  }

  return json(200, "ok", result);
}
ROUTE

cat > functions/api/verification/recent_events.js <<'ROUTE'
import { json, requireAuth } from "../../_lib.js";
import { getVerificationRecentEventsService } from "../../services/verification/verification_service.js";

export async function onRequestGet({ request, env }){
  const auth = await requireAuth(env, request);
  if(!auth.ok) return auth.res;

  const url = new URL(request.url);
  const result = await getVerificationRecentEventsService(env, auth, {
    limit: url.searchParams.get("limit") || "100"
  });

  if(result?.error){
    const st = result.status || 500;
    const name = st === 403 ? "forbidden" : "server_error";
    return json(st, name, result);
  }

  return json(200, "ok", result);
}
ROUTE

echo "[6/6] remove empty directories and output final tree"
find functions -type d -empty -delete
find functions -maxdepth 5 -type f | sort > tools/final_api_tree.txt

echo "DONE"
