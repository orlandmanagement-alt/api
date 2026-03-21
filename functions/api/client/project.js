import { jsonOk, jsonError } from "../../_lib/response.js";

export async function onRequest(context) {
    const { request, env } = context;
    const dbApi = env.DB; // api_database (Pusat Proyek)
    const method = request.method;

    // TODO: Ambil userId dari Middleware Auth (SSO)
    // Sementara kita gunakan placeholder id untuk testing, 
    // pastikan middleware sso sudah aktif.
    const userId = "USER_FROM_SSO"; 

    try {
        if (method === "GET") {
            // Ambil semua proyek milik client ini
            const projects = await dbApi.prepare(
                "SELECT * FROM projects WHERE owner_user_id = ? ORDER BY created_at DESC"
            ).bind(userId).all();
            return jsonOk({ projects: projects.results });
        }

        if (method === "POST") {
            const body = await request.json();
            const projId = `PRJ-${Date.now()}`;
            const now = Math.floor(Date.now() / 1000);

            await dbApi.prepare(`
                INSERT INTO projects (id, owner_user_id, title, status, created_at)
                VALUES (?, ?, ?, ?, ?)
            `).bind(projId, userId, body.title, 'draft', now).run();

            return jsonOk({ id: projId, message: "Proyek berhasil dibuat!" });
        }
    } catch (e) {
        return jsonError(e.message, 500);
    }
}
