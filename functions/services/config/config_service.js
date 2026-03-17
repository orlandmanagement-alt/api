import { hasRole } from "../../_lib.js";
import {
  listAppSettings,
  getAppSettingsByPrefix,
  upsertAppSetting,
  ensureConfigTables,
  listSettingsAudit,
  createSnapshotRow,
  listSnapshotsRows,
  getSnapshotRow
} from "../../repos/config_repo.js";

function rowsToObject(rows){
  const out = {};
  for(const r of (rows || [])){
    out[r.k] = r.v;
  }
  return out;
}

function normalizeBool(v){
  return v === true || v === "true" || v === "1";
}

function normalizeInt(v, min, max, def){
  let n = parseInt(v || 0, 10);
  if(Number.isNaN(n)) return def;
  if(min !== undefined && n < min) n = min;
  if(max !== undefined && n > max) n = max;
  return n;
}

function normalizeString(v, def){
  const s = String(v || "").trim();
  return s || def;
}

export async function requireConfigAccessService(auth, write = false){
  const allow = write
    ? hasRole(auth.roles, ["super_admin", "admin"])
    : hasRole(auth.roles, ["super_admin", "admin", "staff"]);

  if(!allow){
    return { error: "forbidden", status: 403 };
  }

  return { ok: true };
}

export async function getGlobalSettingsService(env, auth){
  const access = await requireConfigAccessService(auth, false);
  if(access.error) return access;

  const rows = await listAppSettings(env);
  return { settings: rowsToObject(rows) };
}

export async function saveGlobalSettingsService(env, auth, body){
  const access = await requireConfigAccessService(auth, true);
  if(access.error) return access;

  const entries = Object.entries(body || {});
  let updated = 0;

  for(const [k, v] of entries){
    await upsertAppSetting(env, String(k), String(v ?? ""), auth.uid || null);
    updated++;
  }

  return { updated };
}

export async function getEffectiveGlobalSettingsService(env, auth){
  const access = await requireConfigAccessService(auth, false);
  if(access.error) return access;

  const rows = await listAppSettings(env);
  const cfg = rowsToObject(rows);

  return {
    auth: {
      session_ttl_min: normalizeInt(cfg["auth.session_ttl_min"], 60, 43200, 20160),
      cookie_domain: normalizeString(cfg["auth.cookie_domain"], ".orlandmanagement.com"),
      allow_multi_role: normalizeBool(cfg["auth.allow_multi_role"])
    },
    otp: {
      expiry_sec: normalizeInt(cfg["otp.expiry_sec"], 60, 900, 300),
      resend_cooldown_sec: normalizeInt(cfg["otp.resend_cooldown_sec"], 10, 300, 30),
      default_channel: normalizeString(cfg["otp.default_channel"], "email")
    },
    verification: {
      require_email: normalizeBool(cfg["verification.require_email"]),
      require_phone: normalizeBool(cfg["verification.require_phone"])
    },
    security: {
      mfa_required_admin: normalizeBool(cfg["security.mfa_required_admin"]),
      ip_block_enabled: normalizeBool(cfg["security.ip_block_enabled"])
    },
    project: {
      finish_bulk_enabled: normalizeBool(cfg["project.finish_bulk_enabled"]),
      archive_enabled: normalizeBool(cfg["project.archive_enabled"])
    },
    ui: {
      default_theme: normalizeString(cfg["ui.default_theme"], "light")
    },
    cms: {
      blogspot_sync_enabled: normalizeBool(cfg["cms.blogspot_sync_enabled"])
    }
  };
}

export async function getScopedSettingsService(env, auth, keys){
  const access = await requireConfigAccessService(auth, false);
  if(access.error) return access;

  const rows = await listAppSettings(env);
  const current = rowsToObject(rows);
  const out = {};

  for(const key of (keys || [])){
    out[key] = Object.prototype.hasOwnProperty.call(current, key) ? current[key] : "";
  }

  return { settings: out };
}

export async function saveScopedSettingsService(env, auth, body, keys){
  const access = await requireConfigAccessService(auth, true);
  if(access.error) return access;

  let updated = 0;
  for(const key of (keys || [])){
    if(!Object.prototype.hasOwnProperty.call(body || {}, key)) continue;
    const raw = body[key];
    const value = typeof raw === "boolean" ? String(raw) : raw == null ? "" : String(raw);
    await upsertAppSetting(env, key, value, auth.uid || null);
    updated++;
  }

  const current = await getScopedSettingsService(env, auth, keys);
  return { updated, settings: current.settings || {} };
}

export async function getConfigAuditService(env, auth, limit){
  const access = await requireConfigAccessService(auth, false);
  if(access.error) return access;

  await ensureConfigTables(env);
  return { items: await listSettingsAudit(env, limit || 100) };
}

export async function createConfigSnapshotService(env, auth, body){
  const access = await requireConfigAccessService(auth, true);
  if(access.error) return access;

  await ensureConfigTables(env);
  const rows = await listAppSettings(env);
  const current = rowsToObject(rows);

  const row = await createSnapshotRow(
    env,
    String(body.snapshot_name || "").trim() || ("Snapshot " + new Date().toISOString()),
    JSON.stringify(current),
    auth.uid || null
  );

  return row;
}

export async function listConfigSnapshotsService(env, auth, limit){
  const access = await requireConfigAccessService(auth, false);
  if(access.error) return access;

  await ensureConfigTables(env);
  return { items: await listSnapshotsRows(env, limit || 50) };
}

export async function restoreConfigSnapshotService(env, auth, body){
  const access = await requireConfigAccessService(auth, true);
  if(access.error) return access;

  const snapshotId = String(body.snapshot_id || "").trim();
  if(!snapshotId) return { error: "snapshot_id_required", status: 400 };

  await ensureConfigTables(env);
  const row = await getSnapshotRow(env, snapshotId);
  if(!row) return { error: "snapshot_not_found", status: 404 };

  let payload = {};
  try{
    payload = JSON.parse(String(row.value_json || "{}")) || {};
  }catch{
    payload = {};
  }

  let updated = 0;
  for(const [k, v] of Object.entries(payload)){
    await upsertAppSetting(env, k, String(v ?? ""), auth.uid || null);
    updated++;
  }

  return {
    restored: true,
    snapshot_id: row.id,
    snapshot_name: row.snapshot_name,
    updated
  };
}

export async function getConfigHealthService(env, auth){
  const access = await requireConfigAccessService(auth, false);
  if(access.error) return access;

  await ensureConfigTables(env);
  const rows = await listAppSettings(env);
  const current = rowsToObject(rows);

  const required = [
    "auth.session_ttl_min",
    "auth.cookie_domain",
    "otp.expiry_sec",
    "otp.resend_cooldown_sec",
    "otp.default_channel",
    "verification.require_email",
    "verification.require_phone",
    "security.mfa_required_admin",
    "project.finish_bulk_enabled",
    "project.archive_enabled",
    "certificate.template_default",
    "certificate.numbering_prefix",
    "ui.default_theme",
    "cms.blogspot_sync_enabled"
  ];

  const missing = required.filter(
    k => !Object.prototype.hasOwnProperty.call(current, k) || String(current[k] || "").trim() === ""
  );

  return {
    ok: missing.length === 0,
    total_required: required.length,
    missing_count: missing.length,
    missing_keys: missing
  };
}
