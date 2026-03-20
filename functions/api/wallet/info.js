import { jsonOk, jsonError } from "../../_lib/response.js";
import { parseCookies } from "../../_lib/cookies.js";

export async function onRequestGet({ request, env }) {
    try {
        const cookies = parseCookies(request);
        const now = Math.floor(Date.now() / 1000);
        const session = await env.DB.prepare("SELECT user_id, role FROM sessions WHERE id = ? AND expires_at > ?").bind(cookies.sid, now).first();
        if (!session) return jsonError("Unauthorized", 401);

        // Pastikan dompet ada, jika tidak, buatkan (Lazy Initialization)
        let wallet = await env.DB.prepare("SELECT balance FROM wallets WHERE user_id = ?").bind(session.user_id).first();
        if (!wallet) {
            await env.DB.prepare("INSERT INTO wallets (user_id, balance, updated_at) VALUES (?, 0, ?)").bind(session.user_id, now).run();
            wallet = { balance: 0 };
        }

        // Ambil riwayat transaksi terbaru (Maksimal 10)
        const { results: history } = await env.DB.prepare("SELECT trx_type, amount, note, created_at FROM point_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 10").bind(session.user_id).all();

        return jsonOk({ data: { balance: wallet.balance, history: history || [] } });
    } catch (e) { return jsonError("Server Error", 500); }
}
