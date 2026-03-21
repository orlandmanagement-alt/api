import { jsonOk, jsonError } from "../../_lib/response.js";

export async function onRequestPost(context) {
    const { env, request } = context;
    try {
        const body = await request.json();
        const userId = "ADMIN_ID_FROM_SESSION";
        const id = `ANN-${Date.now()}`;
        const now = Math.floor(Date.now() / 1000);

        await env.DB.prepare(`
            INSERT INTO announcements (id, author_id, title, content, priority, banner_url, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(id, userId, body.title, body.content, body.priority, body.banner, now, now).run();

        return jsonOk({ message: "Pengumuman berhasil disiarkan!" });
    } catch (e) {
        return jsonError(e.message);
    }
}
