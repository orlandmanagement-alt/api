import { jsonOk, jsonError } from "../../_lib/response.js";
import { parseCookies } from "../../_lib/cookies.js";

export async function onRequestPost({ request, env }) {
    try {
        const cookies = parseCookies(request);
        const now = Math.floor(Date.now() / 1000);
        const session = await env.DB.prepare("SELECT role FROM sessions WHERE id = ? AND expires_at > ?").bind(cookies.sid, now).first();
        if (!session || session.role !== 'admin') return jsonError("Akses ditolak", 403);

        const body = await request.json().catch(() => ({}));
        
        if (body.action === 'add') {
            if (!body.group_name || !body.label) return jsonError("Data tidak lengkap", 400);
            
            // Cek duplikasi
            const exist = await env.DB.prepare("SELECT id FROM master_categories WHERE group_name = ? AND LOWER(label) = ?").bind(body.group_name, body.label.toLowerCase()).first();
            if (exist) return jsonError("Kategori sudah ada di grup ini.", 409);

            const newId = crypto.randomUUID();
            await env.DB.prepare("INSERT INTO master_categories (id, group_name, label, is_active, created_at) VALUES (?, ?, ?, 1, ?)")
                .bind(newId, body.group_name, body.label, now).run();
            return jsonOk({ message: "Kategori berhasil ditambahkan." });
        }
        else if (body.action === 'toggle') {
            if (!body.id) return jsonError("ID diperlukan", 400);
            await env.DB.prepare("UPDATE master_categories SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END WHERE id = ?").bind(body.id).run();
            return jsonOk({ message: "Status kategori diubah." });
        }
        else if (body.action === 'delete') {
            if (!body.id) return jsonError("ID diperlukan", 400);
            await env.DB.prepare("DELETE FROM master_categories WHERE id = ?").bind(body.id).run();
            return jsonOk({ message: "Kategori dihapus." });
        }

        return jsonError("Aksi tidak valid", 400);
    } catch (e) { return jsonError("Server Error", 500); }
}
