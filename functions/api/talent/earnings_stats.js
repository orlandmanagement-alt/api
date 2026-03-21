import { jsonOk, jsonError } from "../../_lib/response.js";

export async function onRequestGet(context) {
    const { env } = context;
    const userId = "TALENT_ID_FROM_SESSION"; 

    try {
        const stats = await env.DB.prepare(`
            SELECT 
                strftime('%m', datetime(created_at, 'unixepoch')) as month,
                SUM(amount) as total
            FROM wallet_transactions
            WHERE user_id = ? AND type = 'credit' AND purpose LIKE '%Honor%'
            GROUP BY month
            ORDER BY month ASC
            LIMIT 12
        `).bind(userId).all();
        
        return jsonOk({ stats: stats.results });
    } catch (e) {
        return jsonError(e.message);
    }
}
