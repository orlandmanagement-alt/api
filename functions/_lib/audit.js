export async function logAudit(db, data) {
    const id = `AUDIT-${Date.now()}`;
    const now = Math.floor(Date.now() / 1000);
    return await db.prepare(`
        INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, old_value, new_value, ip_address, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, data.userId, data.action, data.type, data.refId, data.old, data.new, data.ip, now).run();
}
