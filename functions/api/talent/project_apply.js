import { jsonOk, jsonError } from "../../_lib/response.js";
import { parseCookies } from "../../_lib/cookies.js";

export async function onRequestPost({ request, env }) {
    try {
        const cookies = parseCookies(request);
        const now = Math.floor(Date.now() / 1000);
        const session = await env.DB.prepare("SELECT user_id FROM sessions WHERE id = ? AND expires_at > ?").bind(cookies.sid, now).first();
        if (!session) return jsonError("Unauthorized", 401);

        const body = await request.json().catch(() => ({}));
        const projectId = body.project_id;
        // Body sekarang menerima array of objects: [{role_id: '..', video_link: '..'}, ..]
        const applicationData = body.applications || [];

        if (!projectId || applicationData.length === 0) return jsonError("Pilih minimal 1 peran dan sertakan video audisi!", 400);

        const stmts = [];
        for (const app of applicationData) {
            if (!app.role_id || !app.video_link) continue; // Skip jika data tidak lengkap per role

            // Validasi link video dasar (harus mengandung http/https)
            if (!app.video_link.startsWith('http')) continue;

            // Cek apakah sudah pernah melamar di peran ini
            const exist = await env.DB.prepare("SELECT id FROM project_applications WHERE project_id = ? AND role_id = ? AND talent_user_id = ?").bind(projectId, app.role_id, session.user_id).first();
            
            if (!exist) {
                const appId = crypto.randomUUID();
                stmts.push(env.DB.prepare(`
                    INSERT INTO project_applications (id, project_id, role_id, talent_user_id, video_link, status, applied_at)
                    VALUES (?, ?, ?, ?, ?, 'applied', ?)
                `).bind(appId, projectId, app.role_id, session.user_id, app.video_link, now));
            }
        }
        
        if (stmts.length > 0) await env.DB.batch(stmts);
        else return jsonError("Anda sudah melamar peran yang valid sebelumnya atau data video kosong.", 409);

        return jsonOk({ message: "Lamaran & Video Audisi berhasil dikirim!" });
    } catch (e) { return jsonError("Server Error", 500); }
}
