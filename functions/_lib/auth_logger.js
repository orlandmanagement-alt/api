export async function logAuth(db, data) {
    const id = `AUTH-${Date.now()}`;
    const now = Math.floor(Date.now() / 1000);
    return await db.prepare(`
        INSERT INTO auth_logs (id, user_id, event_type, ip_address, user_agent, location_city, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(id, data.userId, data.event, data.ip, data.ua, data.city || 'Unknown', now).run();
}
