import { jsonOk, jsonError } from "../../_lib/response.js";

export async function onRequestGet(context) {
    const { env, request } = context;
    const url = new URL(request.url);
    const projectId = url.searchParams.get("id");

    if (!projectId) return jsonError("Project ID diperlukan", 400);

    try {
        // Ambil Data Proyek
        const project = await env.DB.prepare("SELECT * FROM projects WHERE id = ?").bind(projectId).first();
        
        // Ambil Data Kriteria/Roles
        const roles = await env.DB.prepare("SELECT * FROM project_roles WHERE project_id = ?").bind(projectId).all();
        
        // Ambil Statistik Pelamar (Count)
        const stats = await env.DB.prepare(`
            SELECT project_role_id, status, COUNT(*) as total 
            FROM project_applications 
            WHERE project_id = ? 
            GROUP BY project_role_id, status
        `).bind(projectId).all();

        return jsonOk({ 
            project, 
            roles: roles.results, 
            stats: stats.results 
        });
    } catch (e) {
        return jsonError(e.message);
    }
}
