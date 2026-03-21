import { jsonOk, jsonError } from "../../_lib/response.js";

export async function onRequestGet(context) {
    const { env } = context;
    const userId = "TALENT_ID_FROM_SESSION";

    try {
        const stats = await env.DB.prepare(`
            SELECT 
                status, 
                COUNT(*) as total 
            FROM project_applications 
            WHERE talent_user_id = ? 
            GROUP BY status
        `).bind(userId).all();

        return jsonOk({ stats: stats.results });
    } catch (e) {
        return jsonError(e.message);
    }
}
