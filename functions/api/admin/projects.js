import { jsonOk, jsonError, jsonForbidden } from "../../_lib/response.js";
import { parseCookies } from "../../_lib/cookies.js";

export async function onRequestPost({ request, env }) {
    const cookies = parseCookies(request);
    const now = Math.floor(Date.now() / 1000);
    const session = await env.DB.prepare("SELECT role FROM sessions WHERE id = ? AND expires_at > ?").bind(cookies.sid, now).first();
    if (!session || session.role !== 'admin') return jsonForbidden();

    const body = await request.json();
    const { id, action } = body;

    if (action === 'delete') {
        await env.DB.prepare("DELETE FROM projects WHERE id = ?").bind(id).run();
        return jsonOk({ message: "Proyek dihapus permanen" });
    }
    
    if (action === 'toggle_status') {
        await env.DB.prepare("UPDATE projects SET status = CASE WHEN status = 'open' THEN 'closed' ELSE 'open' END WHERE id = ?").bind(id).run();
        return jsonOk({ message: "Status proyek diubah" });
    }

    return jsonError("Aksi tidak dikenal");
}
