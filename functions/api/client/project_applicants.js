import { jsonOk, jsonError } from "../../_lib/response.js";
import { parseCookies } from "../../_lib/cookies.js";

export async function onRequestGet({ request, env }) {
    try {
        const cookies = parseCookies(request);
        const now = Math.floor(Date.now() / 1000);
        const session = await env.DB.prepare("SELECT user_id, role FROM sessions WHERE id = ? AND expires_at > ?").bind(cookies.sid, now).first();
        if (!session || session.role !== 'client') return jsonError("Akses ditolak", 403);

        const url = new URL(request.url);
        const projectId = url.searchParams.get("id");
        if (!projectId) return jsonError("ID Proyek diperlukan", 400);

        const project = await env.DB.prepare("SELECT id, title FROM projects WHERE id = ? AND client_id = ?").bind(projectId, session.user_id).first();
        if (!project) return jsonError("Proyek tidak ditemukan", 403);

        // Ambil Pelamar, Nama Role, dan Link Video Audisi (Self-Tape)
        const query = `
            SELECT a.id as application_id, a.status as app_status, a.applied_at, a.role_id, a.video_link,
                   u.full_name, t.user_id as talent_id, t.talent_type, t.gender, t.city, t.photos, t.profile_progress,
                   r.role_name
            FROM project_applications a
            JOIN users u ON a.talent_user_id = u.id
            JOIN talent_profiles t ON a.talent_user_id = t.user_id
            LEFT JOIN project_roles r ON a.role_id = r.id
            WHERE a.project_id = ?
            ORDER BY a.applied_at DESC
        `;
        const { results } = await env.DB.prepare(query).bind(projectId).all();
        
        const { results: roles } = await env.DB.prepare("SELECT id, role_name FROM project_roles WHERE project_id = ?").bind(projectId).all();

        return jsonOk({ data: { project_title: project.title, applicants: results, roles: roles || [] } });
    } catch (e) { return jsonError("Server Error", 500); }
}
