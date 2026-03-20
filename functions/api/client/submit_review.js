import { jsonOk, jsonError } from "../../_lib/response.js";
import { parseCookies } from "../../_lib/cookies.js";

export async function onRequestPost({ request, env }) {
    try {
        const cookies = parseCookies(request);
        const now = Math.floor(Date.now() / 1000);
        const session = await env.DB.prepare("SELECT user_id, role FROM sessions WHERE id = ? AND expires_at > ?").bind(cookies.sid, now).first();
        if (!session || session.role !== 'client') return jsonError("Akses ditolak", 403);

        const body = await request.json();
        const { project_id, talent_id, rating, comment } = body;

        if (!project_id || !talent_id || !rating) return jsonError("Data tidak lengkap", 400);

        // Cek apakah review sudah pernah ada agar tidak spam
        const exist = await env.DB.prepare("SELECT id FROM reviews WHERE project_id = ? AND reviewer_id = ? AND target_id = ?").bind(project_id, session.user_id, talent_id).first();
        if(exist) return jsonError("Anda sudah memberikan ulasan untuk Talent ini di proyek yang sama.", 409);

        // Insert Review
        const reviewId = crypto.randomUUID();
        await env.DB.prepare("INSERT INTO reviews (id, project_id, reviewer_id, target_id, rating, comment, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
            .bind(reviewId, project_id, session.user_id, talent_id, rating, comment || '', now).run();

        // ==========================================
        // ALGORITMA UPDATE SKOR TALENT (Max 10.000)
        // ==========================================
        const { results } = await env.DB.prepare("SELECT AVG(rating) as avg_rating FROM reviews WHERE target_id = ?").bind(talent_id).all();
        const avgRating = results[0].avg_rating || rating;
        
        // Konversi Rating 1-5 menjadi Poin 10.000
        const newScore = Math.round((avgRating / 5) * 10000);
        
        await env.DB.prepare("UPDATE talent_profiles SET rating_score = ? WHERE user_id = ?").bind(newScore, talent_id).run();

        // ==========================================
        // KIRIM NOTIFIKASI KE TALENT
        // ==========================================
        const notifId = crypto.randomUUID();
        const msg = `Klien telah memberikan ulasan ${rating} Bintang untuk kinerja Anda! Skor kredibilitas Anda sekarang ${newScore.toLocaleString('id-ID')}.`;
        await env.DB.prepare("INSERT INTO notifications (id, user_id, title, message, action_url, created_at) VALUES (?, ?, ?, ?, '#', ?)")
            .bind(notifId, talent_id, "Ulasan Baru Diterima! 🌟", msg, now).run();

        return jsonOk({ message: "Ulasan berhasil dikirim! Skor Talent telah diperbarui." });
    } catch (e) { return jsonError("Server Error", 500); }
}
