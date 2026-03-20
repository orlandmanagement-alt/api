import { jsonOk, jsonError } from "../../_lib/response.js";
import { parseCookies } from "../../_lib/cookies.js";

export async function onRequestGet({ request, env }) {
    try {
        const cookies = parseCookies(request);
        if (!cookies.sid) return jsonError("Unauthorized", 401);

        const now = Math.floor(Date.now() / 1000);
        const session = await env.DB.prepare("SELECT user_id FROM sessions WHERE id = ? AND expires_at > ?").bind(cookies.sid, now).first();
        if (!session) return jsonError("Session expired", 401);

        // Ambil daftar proyek yang statusnya 'open'
        const query = `
            SELECT id, title, description, location, event_date, status, created_at 
            FROM projects 
            WHERE status = 'open' 
            ORDER BY created_at DESC 
            LIMIT 50
        `;
        const { results } = await env.DB.prepare(query).all();

        return jsonOk({ items: results });
    } catch (e) {
        return jsonError("Server Error (projects_list)", 500);
    }
}
