import { TalentRepo } from "../../repos/talent_repo.js";

export const TalentProfileService = {
    async updateFullProfile(db, userId, data) {
        const now = Math.floor(Date.now() / 1000);
        // Mapping data fisik & bio ke database
        return await db.prepare(`
            UPDATE talent_profiles SET 
                full_name = ?, nickname = ?, gender = ?, age = ?, city = ?,
                height = ?, weight = ?, shoe_size = ?, shirt_size = ?,
                bio = ?, photo_url = COALESCE(?, photo_url), updated_at = ?
            WHERE user_id = ?
        `).bind(
            data.full_name, data.nickname, data.gender, data.age, data.city,
            data.height, data.weight, data.shoe_size, data.shirt_size,
            data.bio, data.photo_url, now, userId
        ).run();
    }
};
