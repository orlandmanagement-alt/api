export const TalentRepo = {
    async getProfile(db, userId) {
        return await db.prepare("SELECT * FROM talent_profiles WHERE user_id = ?").bind(userId).first();
    },
    async saveProfile(db, userId, data) {
        const now = Math.floor(Date.now() / 1000);
        return await db.prepare(`
            INSERT INTO talent_profiles (id, user_id, full_name, gender, age, height, weight, city, photo_url, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                full_name = excluded.full_name,
                gender = excluded.gender,
                age = excluded.age,
                height = excluded.height,
                weight = excluded.weight,
                city = excluded.city,
                photo_url = COALESCE(excluded.photo_url, talent_profiles.photo_url),
                updated_at = excluded.updated_at
        `).bind(`TLNT-${userId}`, userId, data.name, data.gender, data.age, data.height, data.weight, data.city, data.photo_url, now, now).run();
    }
};
