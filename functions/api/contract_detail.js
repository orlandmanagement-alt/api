import { jsonOk, jsonError } from "../_lib/response.js";

export async function onRequestGet(context) {
    const { env, request } = context;
    const url = new URL(request.url);
    const projectId = url.searchParams.get("project_id");

    try {
        const contract = await env.DB.prepare(`
            SELECT c.*, p.title as project_name, p.budget 
            FROM project_contracts c
            JOIN projects p ON c.project_id = p.id
            WHERE c.project_id = ?
        `).bind(projectId).first();
        
        return jsonOk({ contract });
    } catch (e) {
        return jsonError(e.message);
    }
}
