import { jsonOk, jsonError } from "../../_lib/response.js";

export async function onRequestGet(context) {
    const { env, request } = context;
    const userId = "USER_ID_FROM_SESSION"; 

    try {
        const sessions = await env.DB.prepare(
            "SELECT * FROM user_sessions WHERE user_id = ? AND is_revoked = 0 ORDER BY last_active DESC"
        ).bind(userId).all();
        
        return jsonOk({ sessions: sessions.results });
    } catch (e) {
        return jsonError(e.message);
    }
}
