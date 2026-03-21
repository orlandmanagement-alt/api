import { jsonOk, jsonError } from "../../_lib/response.js";

export async function onRequestGet(context) {
    const { env } = context;
    try {
        // Ambil 15 aktivitas terbaru (foto baru yang diupload talent)
        const feed = await env.DB_TALENT.prepare(`
            SELECT 
                t.full_name, t.city, t.user_id,
                m.public_url, m.created_at
            FROM talent_profiles t
            JOIN media_assets m ON t.user_id = m.user_id
            WHERE m.category = 'gallery'
            ORDER BY m.created_at DESC
        `).all();
        
        return jsonOk({ feed: feed.results });
    } catch (e) {
        return jsonError(e.message);
    }
}
