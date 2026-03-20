import { jsonOk, jsonError } from "../../_lib/response.js";
import { parseCookies } from "../../_lib/cookies.js";

export async function onRequestGet({ request, env }) {
    try {
        const cookies = parseCookies(request);
        if (!cookies.sid) return jsonError("Unauthorized", 401);
        const now = Math.floor(Date.now() / 1000);
        const session = await env.DB.prepare("SELECT user_id, role FROM sessions WHERE id = ? AND expires_at > ?").bind(cookies.sid, now).first();
        if (!session) return jsonError("Session expired", 401);

        // Ambil data sertifikat + Nama Proyek + Nama Perusahaan Client
        const query = `
            SELECT c.certificate_no, c.issue_date, p.title as project_title, cp.company_name
            FROM project_certificates c
            JOIN projects p ON c.project_id = p.id
            JOIN client_profiles cp ON c.issued_by_client_id = cp.user_id
            WHERE c.talent_user_id = ?
            ORDER BY c.issue_date DESC
        `;
        const { results } = await env.DB.prepare(query).bind(session.user_id).all();
        return jsonOk({ items: results });
    } catch (e) { return jsonError("Server Error", 500); }
}
