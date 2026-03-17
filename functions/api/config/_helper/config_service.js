import {
  getSettingsByPrefix,
  upsertSetting,
  ensureConfigTables,
  listSettingsAudit,
  createSnapshotRow,
  listSnapshotsRows,
  getSnapshotRow
} from "./config_queries.js";
import {
  normalizeBool,
  normalizeInt,
  normalizeString
} from "./config_validator.js";

function rowsToObject(rows){
  const obj = {};
  for(const r of (rows || [])){
    obj[r.k] = r.v;
  }
  return obj;
}

export async function getGlobalSettings(env){
  const rows = await getSettingsByPrefix(env, "");
  return rowsToObject(rows);
}

export async function saveGlobalSettings(env, payload, actor){
  const entries = Object.entries(payload || {});
  for(const [k, v] of entries){
    await upsertSetting(env, k, String(v), actor);
  }
  return { updated: entries.length };
}

export async function getSettingsByKeys(env, keys){
  const current = await getGlobalSettings(env);
  const out = {};
  for(const key of (keys || [])){
    out[key] = Object.prototype.hasOwnProperty.call(current, key) ? current[key] : "";
  }
  return out;
}

export async function saveScopedSettings(env, payload, actor, allowedKeys){
  const src = payload || {};
  const keys = Array.isArray(allowedKeys) ? allowedKeys : [];
  let updated = 0;

  for(const key of keys){
    if(!Object.prototype.hasOwnProperty.call(src, key)) continue;
    const raw = src[key];
    const value =
      typeof raw === "boolean" ? String(raw) :
      raw == null ? "" :
      String(raw);
    await upsertSetting(env, key, value, actor);
    updated += 1;
  }

  return {
    updated,
    settings: await getSettingsByKeys(env, keys)
  };
}

export async function getEffectiveGlobalSettings(env){
  const rows = await getSettingsByPrefix(env, "");
  const cfg = rowsToObject(rows);

  return {
    auth: {
      session_ttl_min:
        normalizeInt(cfg["auth.session_ttl_min"], 60, 43200, 20160),
      cookie_domain:
        normalizeString(cfg["auth.cookie_domain"], ".orlandmanagement.com"),
      allow_multi_role:
        normalizeBool(cfg["auth.allow_multi_role"])
    },

    otp: {
      expiry_sec:
        normalizeInt(cfg["otp.expiry_sec"], 60, 900, 300),
      resend_cooldown_sec:
        normalizeInt(cfg["otp.resend_cooldown_sec"], 10, 300, 30),
      default_channel:
        normalizeString(cfg["otp.default_channel"], "email")
    },

    verification: {
      require_email:
        normalizeBool(cfg["verification.require_email"]),
      require_phone:
        normalizeBool(cfg["verification.require_phone"])
    },

    security: {
      mfa_required_admin:
        normalizeBool(cfg["security.mfa_required_admin"]),
      ip_block_enabled:
        normalizeBool(cfg["security.ip_block_enabled"])
    },

    project: {
      finish_bulk_enabled:
        normalizeBool(cfg["project.finish_bulk_enabled"]),
      archive_enabled:
        normalizeBool(cfg["project.archive_enabled"])
    },

    ui: {
      default_theme:
        normalizeString(cfg["ui.default_theme"], "light")
    },

    cms: {
      blogspot_sync_enabled:
        normalizeBool(cfg["cms.blogspot_sync_enabled"])
    }
  };
}

export async function getConfigAudit(env, limit = 100){
  await ensureConfigTables(env);
  return await listSettingsAudit(env, limit);
}

export async function createConfigSnapshot(env, snapshotName, actor){
  await ensureConfigTables(env);
  const current = await getGlobalSettings(env);
  return await createSnapshotRow(
    env,
    snapshotName || ("Snapshot " + new Date().toISOString()),
    JSON.stringify(current),
    actor
  );
}

export async function listConfigSnapshots(env, limit = 50){
  await ensureConfigTables(env);
  return await listSnapshotsRows(env, limit);
}

export async function restoreConfigSnapshot(env, snapshotId, actor){
  await ensureConfigTables(env);
  const row = await getSnapshotRow(env, snapshotId);
  if(!row) return { restored: false, reason: "snapshot_not_found" };

  let payload = {};
  try{
    payload = JSON.parse(String(row.value_json || "{}")) || {};
  }catch{
    payload = {};
  }

  const res = await saveGlobalSettings(env, payload, actor);
  return {
    restored: true,
    snapshot_id: row.id,
    snapshot_name: row.snapshot_name,
    updated: res.updated || 0
  };
}

export async function getConfigHealth(env){
  await ensureConfigTables(env);
  const current = await getGlobalSettings(env);

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
