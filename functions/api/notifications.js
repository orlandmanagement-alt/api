import { jsonOk, jsonError } from "../_lib/response.js";
import { parseCookies } from "../_lib/cookies.js";

export async function onRequestGet({ request, env }) {
    try {
        const cookies = parseCookies(request);
        const now = Math.floor(Date.now() / 1000);
        const session = await env.DB.prepare("SELECT user_id FROM sessions WHERE id = ? AND expires_at > ?").bind(cookies.sid, now).first();
        if (!session) return jsonError("Unauthorized", 401);

        const { results } = await env.DB.prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20").bind(session.user_id).all();
        const unread = results.filter(n => n.is_read === 0).length;

        return jsonOk({ data: { items: results, unread_count: unread } });
    } catch (e) { return jsonError("Server Error", 500); }
}

export async function onRequestPost({ request, env }) {
    try {
        const cookies = parseCookies(request);
        const now = Math.floor(Date.now() / 1000);
        const session = await env.DB.prepare("SELECT user_id FROM sessions WHERE id = ? AND expires_at > ?").bind(cookies.sid, now).first();
        if (!session) return jsonError("Unauthorized", 401);

        // Mark all as read
        await env.DB.prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ?").bind(session.user_id).run();
        return jsonOk({ message: "Semua notifikasi dibaca" });
    } catch (e) { return jsonError("Server Error", 500); }
}
