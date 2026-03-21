export const ClientRepo = {
    async getProfile(db, userId) {
        return await db.prepare("SELECT * FROM client_profiles WHERE user_id = ?").bind(userId).first();
    },
    async upsertProfile(db, userId, data) {
        const id = `CLNT-${Date.now()}`;
        const now = Math.floor(Date.now() / 1000);
        return await db.prepare(`
            INSERT INTO client_profiles (id, user_id, company_name, company_description, website_url, office_address, contact_phone, updated_at, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                company_name = excluded.company_name,
                company_description = excluded.company_description,
                website_url = excluded.website_url,
                office_address = excluded.office_address,
                contact_phone = excluded.contact_phone,
                updated_at = excluded.updated_at
        `).bind(id, userId, data.name, data.desc, data.web, data.address, data.phone, now, now).run();
    }
};
