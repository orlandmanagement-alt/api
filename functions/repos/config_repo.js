export async function listAppSettings(env){
  const r = await env.DB.prepare(`
    SELECT k, v
    FROM app_settings
    ORDER BY k ASC
  `).all();
  return r.results || [];
}

export async function getAppSettingsByPrefix(env, prefix){
  const r = await env.DB.prepare(`
    SELECT k, v
    FROM app_settings
    WHERE k LIKE ?
    ORDER BY k ASC
  `).bind(String(prefix || "") + "%").all();
  return r.results || [];
}

export async function upsertAppSetting(env, key, value, actor){
  const now = Math.floor(Date.now() / 1000);

  let hasUpdatedBy = false;
  try{
    const r = await env.DB.prepare(`PRAGMA table_info(app_settings)`).all();
    hasUpdatedBy = (r.results || []).some(x => String(x.name || "") === "updated_by");
  }catch{}

  if(hasUpdatedBy){
    await env.DB.prepare(`
      INSERT INTO app_settings (k, v, updated_at, updated_by)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(k) DO UPDATE SET
        v = excluded.v,
        updated_at = excluded.updated_at,
        updated_by = excluded.updated_by
    `).bind(key, value, now, actor || null).run();
  }else{
    await env.DB.prepare(`
      INSERT INTO app_settings (k, v, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(k) DO UPDATE SET
        v = excluded.v,
        updated_at = excluded.updated_at
    `).bind(key, value, now).run();
  }

  return { k: key, v: value, updated_at: now, updated_by: actor || null };
}

export async function ensureConfigTables(env){
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS app_settings (
      k TEXT PRIMARY KEY,
      v TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `).run();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS app_settings_snapshots (
      id TEXT PRIMARY KEY,
      snapshot_name TEXT NOT NULL,
      value_json TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      created_by TEXT
    )
  `).run();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS app_settings_audit (
      id TEXT PRIMARY KEY,
      k TEXT NOT NULL,
      old_v TEXT,
      new_v TEXT NOT NULL,
      changed_at INTEGER NOT NULL,
      changed_by TEXT
    )
  `).run();
}

export async function listSettingsAudit(env, limit){
  const r = await env.DB.prepare(`
    SELECT id, k, old_v, new_v, changed_at, changed_by
    FROM app_settings_audit
    ORDER BY changed_at DESC
    LIMIT ?
  `).bind(Number(limit || 100)).all();

  return r.results || [];
}

export async function createSnapshotRow(env, snapshotName, valueJson, actor){
  const now = Math.floor(Date.now() / 1000);
  const id = "cfgsnap_" + crypto.randomUUID();

  await env.DB.prepare(`
    INSERT INTO app_settings_snapshots (id, snapshot_name, value_json, created_at, created_by)
    VALUES (?, ?, ?, ?, ?)
  `).bind(id, snapshotName, valueJson, now, actor || null).run();

  return {
    id,
    snapshot_name: snapshotName,
    value_json: valueJson,
    created_at: now,
    created_by: actor || null
  };
}

export async function listSnapshotsRows(env, limit){
  const r = await env.DB.prepare(`
    SELECT id, snapshot_name, created_at, created_by
    FROM app_settings_snapshots
    ORDER BY created_at DESC
    LIMIT ?
  `).bind(Number(limit || 50)).all();

  return r.results || [];
}

export async function getSnapshotRow(env, snapshotId){
  return await env.DB.prepare(`
    SELECT id, snapshot_name, value_json, created_at, created_by
    FROM app_settings_snapshots
    WHERE id = ?
    LIMIT 1
  `).bind(snapshotId).first();
}
