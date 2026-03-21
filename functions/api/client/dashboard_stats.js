import { jsonOk, jsonError } from "../../_lib/response.js";

export async function onRequestGet(context) {
    const { env } = context;
    const userId = "CLIENT_USER_ID_FROM_SESSION";

    try {
        const stats = await env.DB.prepare(`
            SELECT 
                (SELECT COUNT(*) FROM projects WHERE owner_user_id = ? AND status = 'active') as active_projects,
                (SELECT COUNT(*) FROM project_applications pa JOIN projects p ON pa.project_id = p.id WHERE p.owner_user_id = ? AND pa.status = 'submitted') as pending_applicants,
                (SELECT balance FROM wallet_balances WHERE user_id = ?) as current_balance
            FROM projects LIMIT 1
        `).bind(userId, userId, userId).first();

        return jsonOk({ stats });
    } catch (e) {
        return jsonError(e.message);
    }
}
