import { jsonOk, jsonError } from "../../_lib/response.js";
import { parseCookies } from "../../_lib/cookies.js";

export async function onRequestPost({ request, env }) {
    try {
        const cookies = parseCookies(request);
        if (!cookies.sid) return jsonError("Unauthorized", 401);

        const now = Math.floor(Date.now() / 1000);
        const session = await env.DB.prepare("SELECT user_id FROM sessions WHERE id = ? AND expires_at > ?").bind(cookies.sid, now).first();
        if (!session) return jsonError("Session expired", 401);

        const body = await request.json().catch(() => ({}));
        if (!body.project_id) return jsonError("ID Proyek tidak valid.", 400);

        // 1. Validasi: Apakah proyek masih buka?
        const project = await env.DB.prepare("SELECT status FROM projects WHERE id = ?").bind(body.project_id).first();
        if (!project) return jsonError("Proyek tidak ditemukan.", 404);
        if (project.status !== 'open') return jsonError("Maaf, pendaftaran proyek ini sudah ditutup.", 403);

        // 2. Validasi: Apakah Talent sudah melamar sebelumnya? (Mencegah Spam)
        const existing = await env.DB.prepare("SELECT id FROM project_applications WHERE project_id = ? AND talent_user_id = ?").bind(body.project_id, session.user_id).first();
        if (existing) return jsonError("Anda sudah melamar proyek ini sebelumnya.", 409);

        // 3. Proses Lamaran
        const appId = crypto.randomUUID();
        await env.DB.prepare("INSERT INTO project_applications (id, project_id, talent_user_id, status, applied_at) VALUES (?, ?, ?, 'pending', ?)")
            .bind(appId, body.project_id, session.user_id, now).run();

        return jsonOk({ message: "Berhasil melamar proyek! Silakan tunggu persetujuan dari Client." });
    } catch (e) {
        return jsonError("Server Error (project_apply)", 500);
    }
}
