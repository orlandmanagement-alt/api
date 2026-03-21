import { jsonOk, jsonError } from "../../_lib/response.js";

export async function onRequestGet(context) {
    const { env, request } = context;
    const userId = "USER_ID_FROM_SESSION"; 
    try {
        const logs = await env.DB_SSO.prepare(
            "SELECT * FROM auth_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 30"
        ).bind(userId).all();
        return jsonOk({ logs: logs.results });
    } catch (e) {
        return jsonError(e.message);
    }
}
