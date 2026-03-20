import { jsonOk, jsonError } from "../../_lib/response.js";

export async function onRequestGet({ request, env }) {
    try {
        const url = new URL(request.url);
        const userId = url.searchParams.get("id");
        if (!userId) return jsonError("ID Talent tidak valid", 400);

        // Ambil nama dari tabel users
        const user = await env.DB.prepare("SELECT full_name FROM users WHERE id = ? AND role = 'talent'").bind(userId).first();
        if (!user) return jsonError("Talent tidak ditemukan", 404);

        // Ambil data profil publik (Tanpa mengekspos nomor HP, NIK, atau rekening bank!)
        const profile = await env.DB.prepare("SELECT talent_type, gender, city, height_cm, bio, photos, skills, rating_score FROM talent_profiles WHERE user_id = ?").bind(userId).first();
        
        if (!profile) return jsonError("Profil Talent belum diatur", 404);

        // Parsing JSON dengan aman
        const parseJSON = (str, fallback) => { try { return str ? JSON.parse(str) : fallback; } catch(e) { return fallback; } };
        
        const publicData = {
            name: user.full_name,
            profession: profile.talent_type || 'New Face',
            gender: profile.gender || '-',
            city: profile.city || 'Indonesia',
            height: profile.height_cm || '-',
            bio: profile.bio || '',
            photos: parseJSON(profile.photos, {}),
            skills: parseJSON(profile.skills, []),
            score: profile.rating_score || 0
        };

        return jsonOk({ data: publicData });
    } catch (e) { return jsonError("Server Error", 500); }
}
