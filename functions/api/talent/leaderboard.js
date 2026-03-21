import { jsonOk, jsonError } from "../../_lib/response.js";

export async function onRequestGet(context) {
    const { env } = context;
    try {
        // Ambil Top 10 Talent berdasarkan jumlah proyek selesai
        const topTalents = await env.DB_TALENT.prepare(`
            SELECT 
                t.user_id, t.full_name, t.city,
                COUNT(p.id) as total_projects,
                AVG(p.rating) as avg_rating
            FROM talent_profiles t
            LEFT JOIN api_database.project_applications p ON t.user_id = p.talent_user_id
            WHERE p.status = 'completed'
            GROUP BY t.user_id
            ORDER BY total_projects DESC, avg_rating DESC
            LIMIT 10
        `).all();
        
        return jsonOk({ leaderboard: topTalents.results });
    } catch (e) {
        return jsonError(e.message);
    }
}
