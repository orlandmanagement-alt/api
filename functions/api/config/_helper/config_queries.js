export async function getSetting(env, key){
  return await env.DB.prepare(`
    SELECT v
    FROM app_settings
    WHERE k = ?
  `).bind(key).first();
}

export async function getSettingsByPrefix(env, prefix){
  const r = await env.DB.prepare(`
    SELECT k,v
    FROM app_settings
    WHERE k LIKE ?
  `).bind(prefix + "%").all();

  return r.results || [];
}

export async function upsertSetting(env, key, value, actor){

  const now = Math.floor(Date.now()/1000);

  const old = await getSetting(env,key);

  await env.DB.prepare(`
    INSERT INTO app_settings (k,v,updated_at,updated_by)
    VALUES (?,?,?,?)
    ON CONFLICT(k) DO UPDATE SET
      v=excluded.v,
      updated_at=excluded.updated_at,
      updated_by=excluded.updated_by
  `).bind(
    key,
    value,
    now,
    actor || null
  ).run();

  await env.DB.prepare(`
    INSERT INTO app_settings_audit
    (id,k,old_v,new_v,changed_at,changed_by)
    VALUES (?,?,?,?,?,?)
  `).bind(
    "cfg_"+crypto.randomUUID(),
    key,
    old ? old.v : null,
    value,
    now,
    actor || null
  ).run();
}


export async function ensureConfigTables(env){
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS app_settings (
      k TEXT PRIMARY KEY,
      v TEXT NOT NULL,
      updated_at INTEGER NOT NULL,
      updated_by TEXT
    )
  `).run()

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS app_settings_snapshots (
      id TEXT PRIMARY KEY,
      snapshot_name TEXT NOT NULL,
      value_json TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      created_by TEXT
    )
  `).run()

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS app_settings_audit (
      id TEXT PRIMARY KEY,
      k TEXT NOT NULL,
      old_v TEXT,
      new_v TEXT NOT NULL,
      changed_at INTEGER NOT NULL,
      changed_by TEXT
    )
  `).run()
}

export async function listSettingsAudit(env, limit = 100){
  const r = await env.DB.prepare(`
    SELECT id,k,old_v,new_v,changed_at,changed_by
    FROM app_settings_audit
    ORDER BY changed_at DESC
    LIMIT ?
  `).bind(Number(limit || 100)).all()
  return r.results || []
}

export async function createSnapshotRow(env, snapshotName, valueJson, actor){
  const now = Math.floor(Date.now()/1000)
  const id = "cfgsnap_" + crypto.randomUUID()
  await env.DB.prepare(`
    INSERT INTO app_settings_snapshots (id,snapshot_name,value_json,created_at,created_by)
    VALUES (?,?,?,?,?)
  `).bind(id, snapshotName, valueJson, now, actor || null).run()
  return { id, snapshot_name: snapshotName, created_at: now, created_by: actor || null }
}

export async function listSnapshotsRows(env, limit = 50){
  const r = await env.DB.prepare(`
    SELECT id,snapshot_name,created_at,created_by
    FROM app_settings_snapshots
    ORDER BY created_at DESC
    LIMIT ?
  `).bind(Number(limit || 50)).all()
  return r.results || []
}

export async function getSnapshotRow(env, snapshotId){
  return await env.DB.prepare(`
    SELECT id,snapshot_name,value_json,created_at,created_by
    FROM app_settings_snapshots
    WHERE id = ?
    LIMIT 1
  `).bind(snapshotId).first()
}
