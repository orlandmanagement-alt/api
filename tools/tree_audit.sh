#!/data/data/com.termux/files/usr/bin/bash
set -u

OUT="tools/tree_audit_$(date +%Y%m%d_%H%M%S).txt"

{
  echo "TREE AUDIT $(date)"
  echo
  echo "[TOP LEVEL]"
  find functions -maxdepth 3 -type f | sort
  echo
  echo "[REPOS]"
  find functions/repos -maxdepth 2 -type f 2>/dev/null | sort
  echo
  echo "[SERVICES]"
  find functions/services -maxdepth 3 -type f 2>/dev/null | sort
  echo
  echo "[API]"
  find functions/api -maxdepth 4 -type f 2>/dev/null | sort
  echo
  echo "[POSSIBLE LEGACY HELPERS]"
  find functions -type f | grep '/_helper/' || true
  echo
  echo "[POSSIBLE DUPLICATE ROUTES]"
  find functions/api -type f | grep -E '(project_apply|application_withdraw|invite_detail|invite_respond|project_invites_get|project_invite_create|project_shortlists_get|project_shortlist_create|project_booking_create|booking_patch|dashboard_summary)\.js$' || true
  echo
  echo "[EMPTY DIRS]"
  find functions -type d -empty | sort || true
} > "$OUT"

echo "DONE: $OUT"
