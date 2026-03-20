import { jsonOk, jsonError } from "../../_lib/response.js";
import { parseCookies } from "../../_lib/cookies.js";

export async function onRequestGet({ request, env }) {
    try {
        const cookies = parseCookies(request);
        const now = Math.floor(Date.now() / 1000);
        const session = await env.DB.prepare("SELECT role FROM sessions WHERE id = ? AND expires_at > ?").bind(cookies.sid, now).first();
        if (!session || session.role !== 'admin') return jsonError("Akses ditolak", 403);

        const { results } = await env.DB.prepare("SELECT * FROM master_categories ORDER BY group_name ASC, label ASC").all();
        return jsonOk({ items: results });
    } catch (e) { return jsonError("Server Error", 500); }
}
