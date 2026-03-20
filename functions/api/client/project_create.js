import { jsonOk, jsonError } from "../../../_lib/response.js";
import { requireAuth } from "../../../_lib/session.js";

export async function onRequestPost(context) {
    const { request, env } = context;
    const auth = await requireAuth(env, request);
    if (!auth.ok) return auth.res;
    
    // SMART BINDING: Mencari binding DB_CLIENT jika ada, jika tidak pakai DB bawaan
    const db = env.DB_CLIENT || env.DB_DASHBOARD || env.DB;

    const body = await request.json().catch(() => ({}));
    const now = Math.floor(Date.now() / 1000);

    try {
        if (!body.title) return jsonError("Judul proyek wajib diisi.", 400);

        const projId = `proj_${crypto.randomUUID()}`;
        
        // Simpan Data Proyek Utama
        await db.prepare("INSERT INTO projects (id, owner_user_id, title, status, created_at) VALUES (?, ?, ?, 'published', ?)")
            .bind(projId, auth.uid, body.title, now).run();

        // Simpan Custom Roles (Menggunakan kolom script_link untuk menyimpan spesifikasi dinamis)
        if (body.roles && Array.isArray(body.roles)) {
            for (const r of body.roles) {
                const roleId = `role_${crypto.randomUUID()}`;
                const title = r.role_name || 'Karakter Belum Dinamai';
                const customSpecs = JSON.stringify({
                    gender: r.gender, category: r.category, location: r.location,
                    age_min: r.age_min, age_max: r.age_max,
                    height_min: r.height_min, height_max: r.height_max,
                    description: r.description
                });

                await db.prepare("INSERT INTO project_roles (id, project_id, title, created_at, script_link) VALUES (?, ?, ?, ?, ?)")
                    .bind(roleId, projId, title, now, customSpecs).run();
            }
        }
        return jsonOk({ message: "Proyek berhasil diterbitkan!", project_id: projId });
    } catch (e) {
        // EXPOSE ERROR SQL: Memunculkan pesan error D1 yang sebenarnya ke Layar Frontend
        return jsonError(`DB Error: ${e.message}`, 500); 
    }
}
