#!/data/data/com.termux/files/usr/bin/bash
set -u

BASE="${1:-https://api.orlandmanagement.com}"
OUT="tools/smoke_results_$(date +%Y%m%d_%H%M%S).txt"

routes=(
  "/functions/api/dashboard_summary"
  "/functions/api/dashboard/summary"
  "/functions/api/client/me"
  "/functions/api/client/project_invites"
  "/functions/api/client/project_shortlists"
  "/functions/api/client/project_bookings"
  "/functions/api/talent/me"
  "/functions/api/talent/profile"
  "/functions/api/talent/project_applications"
  "/functions/api/talent/project_invites_detail?invite_id=test"
  "/functions/api/talent/project_invites_respond"
  "/functions/api/users/admin"
  "/functions/api/users/admin_users"
  "/functions/api/users/client"
  "/functions/api/users/client_users"
  "/functions/api/users/talent"
  "/functions/api/users/talent_users"
  "/functions/api/users/options"
  "/functions/api/users/lifecycle"
  "/functions/api/users/offboarding"
  "/functions/api/users/talent_backfill"
  "/functions/api/admin/security_kpi_get"
  "/functions/api/admin/sessions_monitor_get"
  "/functions/api/admin/users_security_monitor_get"
  "/functions/api/admin/sessions?user_id=test"
  "/functions/api/config/global"
  "/functions/api/config/global_effective"
  "/functions/api/config/otp"
  "/functions/api/config/analytics"
  "/functions/api/config/snapshots"
  "/functions/api/config/verify"
  "/functions/api/security/final-health"
  "/functions/api/security/mfa-policy"
  "/functions/api/security/login-timeline"
  "/functions/api/verification/healthcheck"
  "/functions/api/verification/recent_events"
)

{
  echo "SMOKE TEST START $(date)"
  echo "BASE=$BASE"
  echo
} > "$OUT"

for path in "${routes[@]}"; do
  url="${BASE}${path}"
  code="$(curl -k -s -o /dev/null -w "%{http_code}" "$url")"
  ctype="$(curl -k -sI "$url" | tr -d '\r' | awk -F': ' 'tolower($1)=="content-type"{print $2}' | tail -n1)"
  echo "[$code] $path | content-type=${ctype:-unknown}" >> "$OUT"
done

echo >> "$OUT"
echo "JSON BODY SAMPLES" >> "$OUT"
echo >> "$OUT"

sample_routes=(
  "/functions/api/dashboard_summary"
  "/functions/api/config/verify"
  "/functions/api/security/final-health"
  "/functions/api/verification/healthcheck"
)

for path in "${sample_routes[@]}"; do
  url="${BASE}${path}"
  echo "===== $path =====" >> "$OUT"
  curl -k -s "$url" >> "$OUT"
  echo >> "$OUT"
  echo >> "$OUT"
done

echo "DONE: $OUT"
