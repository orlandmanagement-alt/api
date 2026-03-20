import { jsonOk, jsonError } from "../../../_lib/response.js";
import { requireAuth } from "../../../_lib/session.js";

export async function onRequestPost(context) {
    const { request, env } = context;
    const auth = await requireAuth(env, request);
    if (!auth.ok) return auth.res;

    const body = await request.json().catch(() => ({}));
    const now = Math.floor(Date.now() / 1000);

    try {
        if (!body.title) return jsonError("Judul proyek wajib diisi.", 400);

        const projId = `proj_${crypto.randomUUID()}`;
        
        // 1. Simpan ke tabel projects
        await env.DB.prepare("INSERT INTO projects (id, owner_user_id, title, status, created_at) VALUES (?, ?, ?, 'published', ?)")
            .bind(projId, auth.uid, body.title, now).run();

        // 2. Simpan multi-role ke tabel project_roles
        if (body.roles && Array.isArray(body.roles)) {
            for (const r of body.roles) {
                const roleId = `role_${crypto.randomUUID()}`;
                const title = r.role_name || 'Karakter Belum Dinamai';
                
                // Trik: Simpan detail custom (gender, usia, deskripsi) sebagai JSON di kolom script_link
                const customSpecs = JSON.stringify({
                    gender: r.gender, category: r.category, location: r.location,
                    age_min: r.age_min, age_max: r.age_max,
                    height_min: r.height_min, height_max: r.height_max,
                    description: r.description
                });

                await env.DB.prepare("INSERT INTO project_roles (id, project_id, title, created_at, script_link) VALUES (?, ?, ?, ?, ?)")
                    .bind(roleId, projId, title, now, customSpecs).run();
            }
        }

        return jsonOk({ message: "Proyek dan Peran berhasil diterbitkan!", project_id: projId });
    } catch (e) {
        return jsonError("Terjadi kesalahan sistem saat menyimpan proyek.", 500);
    }
}
