import { jsonOk, jsonError } from "../../_lib/response.js";

export async function onRequestGet(context) {
    const { env } = context;
    const userId = "CLIENT_USER_ID_FROM_SESSION";

    try {
        const history = await env.DB.prepare(`
            SELECT 
                t.id, t.amount, t.purpose, t.status, t.created_at,
                p.title as project_name
            FROM wallet_transactions t
            LEFT JOIN projects p ON t.reference_id = p.id
            WHERE t.user_id = ? AND t.type = 'debit'
            ORDER BY t.created_at DESC
        `).bind(userId).all();

        return jsonOk({ history: history.results });
    } catch (e) {
        return jsonError(e.message);
    }
}
