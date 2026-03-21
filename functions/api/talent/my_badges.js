import { jsonOk, jsonError } from "../../_lib/response.js";

export async function onRequestGet(context) {
    const { env } = context;
    const userId = "TALENT_ID_FROM_SESSION";

    try {
        const badges = await env.DB.prepare(`
            SELECT b.label, b.icon_code, b.color_hex 
            FROM talent_badges tb
            JOIN master_badges b ON tb.badge_id = b.id
            WHERE tb.user_id = ?
        `).bind(userId).all();

        return jsonOk({ badges: badges.results });
    } catch (e) {
        return jsonError(e.message);
    }
}
