import { jsonOk, jsonError, jsonForbidden } from "../../_lib/response.js";
import { parseCookies } from "../../_lib/cookies.js";

export async function onRequestGet({ request, env }) {
    const cookies = parseCookies(request);
    const now = Math.floor(Date.now() / 1000);
    const session = await env.DB.prepare("SELECT role FROM sessions WHERE id = ? AND expires_at > ?").bind(cookies.sid, now).first();
    if (!session || session.role !== 'admin') return jsonForbidden();

    const url = new URL(request.url);
    const role = url.searchParams.get("role") || "talent";

    const { results } = await env.DB.prepare("SELECT id, full_name, email, is_active, created_at FROM users WHERE role = ? ORDER BY created_at DESC").bind(role).all();
    return jsonOk({ items: results });
}
