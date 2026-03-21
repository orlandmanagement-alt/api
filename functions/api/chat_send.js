import { jsonOk, jsonError } from "../_lib/response.js";

export async function onRequestPost(context) {
    const { env, request } = context;
    try {
        const body = await request.json(); // { room_id, message }
        const userId = "USER_ID_FROM_SESSION";
        const msgId = `MSG-${Date.now()}`;
        const now = Math.floor(Date.now() / 1000);

        await env.DB.prepare("INSERT INTO chat_messages (id, room_id, sender_id, message_text, created_at) VALUES (?, ?, ?, ?, ?)")
            .bind(msgId, body.room_id, userId, body.message, now).run();

        await env.DB.prepare("UPDATE chat_rooms SET last_message = ?, updated_at = ? WHERE id = ?")
            .bind(body.message, now, body.room_id).run();

        return jsonOk({ success: true });
    } catch (e) {
        return jsonError(e.message);
    }
}
