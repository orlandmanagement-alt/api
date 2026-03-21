import { jsonOk, jsonError } from "../../_lib/response.js";

export async function onRequestPost(context) {
    const { env, request } = context;
    try {
        const body = await request.json(); // { amount, method, account }
        const userId = "TALENT_ID_FROM_SESSION";
        const id = `WDRA-${Date.now()}`;
        const now = Math.floor(Date.now() / 1000);

        // 1. Cek kecukupan saldo
        const wallet = await env.DB.prepare("SELECT balance FROM wallet_balances WHERE user_id = ?").bind(userId).first();
        if (!wallet || wallet.balance < body.amount) return jsonError("Saldo tidak mencukupi!");
        if (body.amount < 50000) return jsonError("Minimal penarikan Rp 50.000");

        // 2. Insert Request & Potong Saldo (Debit)
        await env.DB.prepare("INSERT INTO payout_requests (id, user_id, amount, method, account_details, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
            .bind(id, userId, body.amount, body.method, body.account, now, now).run();
            
        await env.DB.prepare("UPDATE wallet_balances SET balance = balance - ?, updated_at = ? WHERE user_id = ?")
            .bind(body.amount, now, userId).run();

        return jsonOk({ message: "Permintaan pencairan dikirim! Tunggu konfirmasi admin 1x24 jam." });
    } catch (e) {
        return jsonError(e.message);
    }
}
