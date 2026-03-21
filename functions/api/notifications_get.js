import { jsonOk, jsonError } from "../_lib/response.js";

export async function onRequestGet(context) {
    const { env, request } = context;
    const userId = "USER_ID_FROM_SESSION"; 
    try {
        const data = await env.DB.prepare(
            "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20"
        ).bind(userId).all();
        
        return jsonOk({ notifications: data.results });
    } catch (e) {
        return jsonError(e.message);
    }
}
