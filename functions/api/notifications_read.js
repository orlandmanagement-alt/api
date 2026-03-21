import { jsonOk, jsonError } from "../_lib/response.js";

export async function onRequestPost(context) {
    const { env, request } = context;
    try {
        const body = await request.json();
        await env.DB.prepare("UPDATE notifications SET is_read = 1 WHERE id = ?")
            .bind(body.id).run();
        return jsonOk({ success: true });
    } catch (e) {
        return jsonError(e.message);
    }
}
