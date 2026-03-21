export const ConfigRepo = {
    async getAll(db) {
        return await db.prepare("SELECT * FROM app_configs").all();
    },
    async update(db, key, value) {
        const now = Math.floor(Date.now() / 1000);
        return await db.prepare("UPDATE app_configs SET config_value = ?, updated_at = ? WHERE config_key = ?")
            .bind(value, now, key).run();
    }
};
