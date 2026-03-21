import { jsonOk, jsonError } from "../../_lib/response.js";
import { WalletRepo } from "../../repos/wallet_repo.js";

export async function onRequestGet(context) {
    const { env, request } = context;
    // Ambil userId dari session (me)
    const userId = "USER_ID_DARI_SESSION"; 

    try {
        const balance = await WalletRepo.getBalance(env.DB, userId);
        const history = await env.DB.prepare("SELECT * FROM wallet_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 10")
            .bind(userId).all();
            
        return jsonOk({ 
            balance: balance ? balance.balance : 0,
            history: history.results 
        });
    } catch (e) {
        return jsonError(e.message);
    }
}
