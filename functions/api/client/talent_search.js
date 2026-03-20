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

        // 2. Ambil Parameter Pencarian dari URL
        const url = new URL(request.url);
        const q_keyword = url.searchParams.get("keyword") || "";
        const q_gender = url.searchParams.get("gender") || "";
        const q_loc = url.searchParams.get("location") || "";

        // 3. Merakit SQL Dinamis
        // Kita hanya menampilkan talent yang profilnya minimal 50% lengkap
        let query = `
            SELECT 
                t.user_id, t.public_slug, t.talent_type, t.gender, t.city, t.height_cm, 
                t.profile_progress, t.photos, u.full_name
            FROM talent_profiles t
            JOIN users u ON t.user_id = u.id
            WHERE t.profile_progress >= 50
        `;
        
        let params = [];

        if (q_gender) { query += ` AND t.gender = ?`; params.push(q_gender); }
        if (q_loc) { query += ` AND t.city LIKE ?`; params.push(`%${q_loc}%`); }
        if (q_keyword) { 
            query += ` AND (t.talent_type LIKE ? OR u.full_name LIKE ?)`; 
            params.push(`%${q_keyword}%`, `%${q_keyword}%`); 
        }

        query += ` ORDER BY t.profile_progress DESC LIMIT 50`; // Sortir dari profil terlengkap

        // 4. Eksekusi Kueri
        const stmt = env.DB.prepare(query);
        const { results } = await stmt.bind(...params).all();

        return jsonOk({ items: results });
    } catch (e) { return jsonError("Server Error (talent_search)", 500); }
}
