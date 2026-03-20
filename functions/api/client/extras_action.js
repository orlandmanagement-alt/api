import { jsonOk, jsonError } from "../../_lib/response.js";
import { parseCookies } from "../../_lib/cookies.js";

export async function onRequestPost({ request, env }) {
    try {
        const cookies = parseCookies(request);
        const now = Math.floor(Date.now() / 1000);
        const session = await env.DB.prepare("SELECT user_id FROM sessions WHERE id = ? AND expires_at > ?").bind(cookies.sid, now).first();
        if (!session) return jsonError("Unauthorized", 401);

        const body = await request.json();
        
        if (body.action === 'update_status') {
            await env.DB.prepare("UPDATE project_extras SET status = ? WHERE id = ?").bind(body.status, body.id).run();
            return jsonOk({ message: "Status diubah" });
        } else if (body.action === 'update_field') {
            const allowed = ['name', 'age', 'height', 'weight', 'note', 'agency'];
            if(!allowed.includes(body.field)) return jsonError("Field tidak valid");
            await env.DB.prepare(`UPDATE project_extras SET ${body.field} = ? WHERE id = ?`).bind(body.value, body.id).run();
            return jsonOk({ message: "Data diupdate" });
        } else if (body.action === 'delete_extra') {
            await env.DB.prepare("DELETE FROM project_extras WHERE id = ?").bind(body.id).run();
            return jsonOk({ message: "Data dihapus permanen" });
        }

        return jsonError("Aksi tidak valid");
    } catch (e) { return jsonError("Server Error", 500); }
}
