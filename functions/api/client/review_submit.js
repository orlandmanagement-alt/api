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
        if (!body.application_id || !body.rating) return jsonError("Data tidak lengkap", 400);

        // Validasi: Pastikan talent ini memang disetujui (bekerja) di proyek si client
        const appRow = await env.DB.prepare(`
            SELECT a.talent_user_id, a.project_id, p.client_id 
            FROM project_applications a JOIN projects p ON a.project_id = p.id 
            WHERE a.id = ? AND a.status = 'approved'
        `).bind(body.application_id).first();
        if (!appRow || appRow.client_id !== session.user_id) return jsonError("Akses ilegal atau Talent belum disetujui.", 403);

        // Cek apakah sudah pernah direview
        const exist = await env.DB.prepare("SELECT id FROM talent_reviews WHERE application_id = ?").bind(body.application_id).first();
        if (exist) return jsonError("Anda sudah memberikan ulasan untuk talent ini.", 409);

        const reviewId = crypto.randomUUID();
        await env.DB.prepare(`
            INSERT INTO talent_reviews (id, application_id, project_id, client_user_id, talent_user_id, rating, review_text, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(reviewId, body.application_id, appRow.project_id, session.user_id, appRow.talent_user_id, body.rating, body.review_text || "", now).run();

        // ==========================================
        // SISTEM KALKULASI 10.000 POIN ORLAND
        // ==========================================
        // 1 Bintang = 2000 Poin. (Cth: Rating Rata-rata 4.5 = 9000 Poin).
        const avgRow = await env.DB.prepare("SELECT AVG(rating) as avg_rating FROM talent_reviews WHERE talent_user_id = ?").bind(appRow.talent_user_id).first();
        const average = avgRow?.avg_rating || body.rating;
        const newScore = Math.round(average * 2000);

        // Update skor ke profil talent
        await env.DB.prepare("UPDATE talent_profiles SET rating_score = ? WHERE user_id = ?").bind(newScore, appRow.talent_user_id).run();

        return jsonOk({ message: "Ulasan berhasil dikirim. Terima kasih!" });
    } catch (e) { return jsonError("Server Error", 500); }
}
