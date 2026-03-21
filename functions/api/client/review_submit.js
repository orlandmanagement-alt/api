import { jsonOk, jsonError } from "../../_lib/response.js";

export async function onRequestPost(context) {
    const { env, request } = context;
    try {
        const body = await request.json(); // { project_id, talent_id, rating, comment }
        const clientId = "CLIENT_ID_FROM_SESSION";
        const id = `REV-${Date.now()}`;
        const now = Math.floor(Date.now() / 1000);

        // Simpan review
        await env.DB.prepare(`
            INSERT INTO project_reviews (id, project_id, client_user_id, talent_user_id, rating, comment, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(id, body.project_id, clientId, body.talent_id, body.rating, body.comment, now).run();

        // Update status aplikasi proyek menjadi 'reviewed'
        await env.DB.prepare("UPDATE project_applications SET status = 'reviewed' WHERE project_id = ? AND talent_user_id = ?")
            .bind(body.project_id, body.talent_id).run();

        return jsonOk({ message: "Terima kasih! Review Anda sangat berharga bagi Talent." });
    } catch (e) {
        return jsonError(e.message);
    }
}
