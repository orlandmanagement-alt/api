import { jsonOk, jsonError } from "../../_lib/response.js";
import { parseCookies } from "../../_lib/cookies.js";

export async function onRequestGet({ request, env }) {
    try {
        const cookies = parseCookies(request);
        if (!cookies.sid) return jsonError("Unauthorized", 401);

        const now = Math.floor(Date.now() / 1000);
        const session = await env.DB.prepare("SELECT user_id FROM sessions WHERE id = ? AND expires_at > ?").bind(cookies.sid, now).first();
        if (!session) return jsonError("Session expired", 401);

        // Melakukan JOIN (Penggabungan) tabel aplikasi dan detail proyek
        const query = `
            SELECT 
                a.id as application_id, 
                a.status as application_status, 
                a.applied_at, 
                p.id as project_id, 
                p.title, 
                p.location, 
                p.event_date, 
                p.status as project_status 
            FROM project_applications a
            JOIN projects p ON a.project_id = p.id
            WHERE a.talent_user_id = ?
            ORDER BY a.applied_at DESC
        `;
        const { results } = await env.DB.prepare(query).bind(session.user_id).all();

        return jsonOk({ items: results });
    } catch (e) {
        return jsonError("Server Error (my_applications)", 500);
    }
}
