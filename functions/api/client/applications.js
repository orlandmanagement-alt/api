import { jsonOk, jsonError } from "../../_lib/response.js";

export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const method = request.method;

    try {
        if (method === "GET") {
            const roleId = url.searchParams.get("role_id");
            // Join dengan DB_TALENT (via user_id) untuk ambil Nama & Foto Profil
            // Catatan: Di Cloudflare D1, pastikan binding DB_TALENT aktif
            const apps = await env.DB.prepare(`
                SELECT a.*, t.full_name, t.photo_url 
                FROM project_applications a
                LEFT JOIN talent_database.talent_profiles t ON a.talent_user_id = t.user_id
                WHERE a.project_role_id = ?
            `).bind(roleId).all();
            
            return jsonOk({ applications: apps.results });
        }

        if (method === "POST") {
            const body = await request.json(); // { app_id, status }
            const now = Math.floor(Date.now() / 1000);

            await env.DB.prepare("UPDATE project_applications SET status = ?, updated_at = ? WHERE id = ?")
                .bind(body.status, now, body.app_id).run();

            return jsonOk({ message: `Status diperbarui ke ${body.status}` });
        }
    } catch (e) {
        return jsonError(e.message);
    }
}
