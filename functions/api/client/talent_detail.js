import { jsonOk, jsonError } from "../../_lib/response.js";
import { parseCookies } from "../../_lib/cookies.js";

export async function onRequestGet({ request, env }) {
    try {
        // 1. Autentikasi Client
        const cookies = parseCookies(request);
        if (!cookies.sid) return jsonError("Unauthorized", 401);
        const now = Math.floor(Date.now() / 1000);
        const session = await env.DB.prepare("SELECT user_id, role FROM sessions WHERE id = ? AND expires_at > ?").bind(cookies.sid, now).first();
        if (!session || session.role !== 'client') return jsonError("Akses ditolak", 403);

        // 2. Ambil Parameter
        const url = new URL(request.url);
        const talentId = url.searchParams.get("id");
        if (!talentId) return jsonError("ID Talent tidak valid", 400);

        // 3. Tarik Data Lengkap
        const query = `
            SELECT 
                t.*, u.full_name
            FROM talent_profiles t
            JOIN users u ON t.user_id = u.id
            WHERE t.user_id = ?
        `;
        const talent = await env.DB.prepare(query).bind(talentId).first();

        if (!talent) return jsonError("Talent tidak ditemukan", 404);

        // Parsing JSON Aman
        const parseJSON = (str, fallback) => { try { return str ? JSON.parse(str) : fallback; } catch(e) { return fallback; } };

        // 4. Susun Respon
        return jsonOk({
            data: {
                user_id: talent.user_id,
                full_name: talent.full_name,
                profession: talent.talent_type || "Uncategorized",
                gender: talent.gender || "-",
                city: talent.city || "-",
                height: talent.height_cm || "-",
                bio: talent.bio || "Belum ada deskripsi profil.",
                skills: parseJSON(talent.skills, []),
                photos: parseJSON(talent.photos, {}),
                rates: parseJSON(talent.rates, {}),
                progress: talent.profile_progress
            }
        });
    } catch (e) { return jsonError("Server Error (talent_detail)", 500); }
}
