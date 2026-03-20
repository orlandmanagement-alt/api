import { jsonOk, jsonError } from "../../_lib/response.js";
import { parseCookies } from "../../_lib/cookies.js";

export async function onRequestPost({ request, env }) {
    try {
        const cookies = parseCookies(request);
        const now = Math.floor(Date.now() / 1000);
        const session = await env.DB.prepare("SELECT user_id, role FROM sessions WHERE id = ? AND expires_at > ?").bind(cookies.sid, now).first();
        if (!session || session.role !== 'client') return jsonError("Akses ditolak", 403);

        const body = await request.json().catch(() => ({}));
        if (!body.title || !body.description) return jsonError("Judul dan deskripsi wajib diisi", 400);

        const projectId = crypto.randomUUID();

        // 1. Simpan Proyek Induk
        await env.DB.prepare(`
            INSERT INTO projects (id, client_id, title, description, location, event_date, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 'open', ?)
        `).bind(projectId, session.user_id, body.title, body.description, body.location || '', body.event_date || '', now).run();

        // 2. Simpan Multi-Roles (Termasuk Script Link untuk Self-Tape)
        if (body.roles && Array.isArray(body.roles) && body.roles.length > 0) {
            const stmts = body.roles.map(r => {
                const roleId = crypto.randomUUID();
                return env.DB.prepare(`
                    INSERT INTO project_roles (id, project_id, role_name, category, gender, age_min, age_max, height_min, height_max, location, description, script_link)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).bind(
                    roleId, projectId, r.role_name || 'Kebutuhan Talent', r.category || '', r.gender || 'Semua',
                    parseInt(r.age_min) || 0, parseInt(r.age_max) || 99, 
                    parseInt(r.height_min) || 0, parseInt(r.height_max) || 300,
                    r.location || body.location || '', r.description || '', r.script_link || ''
                );
            });
            if(stmts.length > 0) await env.DB.batch(stmts);
        }

        return jsonOk({ message: "Casting Call & Naskah berhasil dipublikasikan!", project_id: projectId });
    } catch (e) { return jsonError("Server Error", 500); }
}
