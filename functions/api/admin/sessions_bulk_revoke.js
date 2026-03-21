import { jsonOk, jsonError } from "../../_lib/response.js";

export async function onRequestPost(context) {
    const { env, request } = context;
    try {
        const body = await request.json();
        await env.DB.prepare("UPDATE user_sessions SET is_read = 1 WHERE id = ?")
            .bind(body.session_id).run();
        return jsonOk({ message: "Sesi berhasil dihentikan" });
    } catch (e) {
        return jsonError(e.message);
    }
}
