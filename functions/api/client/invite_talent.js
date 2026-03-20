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
        if (!body.talent_id || !body.project_id) return jsonError("Data tidak lengkap", 400);

        const project = await env.DB.prepare("SELECT title, client_id, status FROM projects WHERE id = ?").bind(body.project_id).first();
        if (!project || project.client_id !== session.user_id) return jsonError("Proyek tidak valid", 403);
        if (project.status !== 'open') return jsonError("Proyek sudah ditutup", 400);

        const exist = await env.DB.prepare("SELECT id FROM project_applications WHERE project_id = ? AND talent_user_id = ?").bind(body.project_id, body.talent_id).first();
        if (exist) return jsonError("Talent ini sudah melamar atau diundang sebelumnya.", 409);

        // Eksekusi Insert Undangan
        const appId = crypto.randomUUID();
        await env.DB.prepare("INSERT INTO project_applications (id, project_id, talent_user_id, status, applied_at) VALUES (?, ?, ?, 'invited', ?)")
            .bind(appId, body.project_id, body.talent_id, now).run();

        // FITUR BARU: KIRIM EMAIL NOTIFIKASI KE TALENT
        if (env.RESEND_API_KEY) {
            const talent = await env.DB.prepare("SELECT email, full_name FROM users WHERE id = ?").bind(body.talent_id).first();
            const client = await env.DB.prepare("SELECT company_name FROM client_profiles WHERE user_id = ?").bind(session.user_id).first();
            
            if (talent && talent.email) {
                const html = `<div style="font-family:sans-serif; padding:20px; color:#333;">
                    <h2>Undangan Eksklusif!</h2>
                    <p>Halo <b>${talent.full_name}</b>,</p>
                    <p>Perusahaan <b>${client?.company_name || 'Client Orland'}</b> baru saja mengundang Anda untuk bergabung di proyek <b>"${project.title}"</b>.</p>
                    <br><a href="https://talent.orlandmanagement.com" style="background-color:#6b8aed; color:white; padding:12px 24px; text-decoration:none; border-radius:5px; font-weight:bold; display:inline-block;">Cek Dashboard Sekarang</a>
                </div>`;
                
                // Fetch to Resend (Non-blocking / fire and forget)
                fetch('https://api.resend.com/emails', { 
                    method: 'POST', 
                    headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' }, 
                    body: JSON.stringify({ from: 'Orland Management <no-reply@orlandmanagement.com>', to: talent.email, subject: "Anda Diundang ke Proyek Baru!", html }) 
                }).catch(()=>console.log("Email error"));
            }
        }

        return jsonOk({ message: "Undangan & Email berhasil dikirim ke Talent!" });
    } catch (e) { return jsonError("Server Error", 500); }
}
