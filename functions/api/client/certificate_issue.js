import { jsonOk, jsonError } from "../../_lib/response.js";
import { parseCookies } from "../../_lib/cookies.js";

export async function onRequestPost({ request, env }) {
    try {
        const cookies = parseCookies(request);
        if (!cookies.sid) return jsonError("Unauthorized", 401);
        const now = Math.floor(Date.now() / 1000);
        const session = await env.DB.prepare("SELECT user_id, role FROM sessions WHERE id = ? AND expires_at > ?").bind(cookies.sid, now).first();
        if (!session || session.role !== 'client') return jsonError("Akses ditolak", 403);

        const body = await request.json().catch(() => ({}));
        if (!body.application_id) return jsonError("Data tidak lengkap", 400);

        // Validasi: Pastikan lamaran ini milik proyek si Client dan statusnya 'approved'
        const appRow = await env.DB.prepare(`
            SELECT a.talent_user_id, a.project_id, p.client_id, p.title 
            FROM project_applications a 
            JOIN projects p ON a.project_id = p.id 
            WHERE a.id = ? AND a.status = 'approved'
        `).bind(body.application_id).first();
        
        if (!appRow || appRow.client_id !== session.user_id) return jsonError("Talent belum disetujui atau akses ilegal.", 403);

        // Cek apakah sertifikat sudah pernah diterbitkan
        const exist = await env.DB.prepare("SELECT id FROM project_certificates WHERE application_id = ?").bind(body.application_id).first();
        if (exist) return jsonError("Sertifikat sudah diterbitkan sebelumnya.", 409);

        // Generate Nomor Sertifikat Unik (Cth: ORL-2026-X8F9)
        const certNo = "ORL-" + new Date().getFullYear() + "-" + Math.random().toString(36).substring(2, 6).toUpperCase();
        const certId = crypto.randomUUID();

        // Insert ke Database
        await env.DB.prepare(`
            INSERT INTO project_certificates (id, certificate_no, application_id, project_id, talent_user_id, issued_by_client_id, issue_date, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'issued')
        `).bind(certId, certNo, body.application_id, appRow.project_id, appRow.talent_user_id, session.user_id, now).run();

        return jsonOk({ message: "Sertifikat berhasil diterbitkan ke Talent!" });
    } catch (e) { return jsonError("Server Error", 500); }
}
