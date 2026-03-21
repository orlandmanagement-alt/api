import { jsonOk, jsonError } from "../../_lib/response.js";

export async function onRequestPost(context) {
    const { env, request } = context;
    try {
        const body = await request.json();
        const userId = "USER_ID_FROM_SESSION";
        const id = `REQ-${Date.now()}`;
        const now = Math.floor(Date.now() / 1000);

        await env.DB.prepare(`
            INSERT INTO wallet_requests (id, user_id, type, amount, bank_name, bank_account_number, bank_account_name, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(id, userId, body.type, body.amount, body.bank, body.acc_num, body.acc_name, now, now).run();

        return jsonOk({ message: "Permintaan berhasil dikirim dan menunggu verifikasi admin" });
    } catch (e) {
        return jsonError(e.message);
    }
}
