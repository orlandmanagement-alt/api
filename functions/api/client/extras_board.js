import { jsonOk, jsonError } from "../../_lib/response.js";
import { parseCookies } from "../../_lib/cookies.js";

export async function onRequestGet({ request, env }) {
    try {
        const cookies = parseCookies(request);
        const now = Math.floor(Date.now() / 1000);
        const session = await env.DB.prepare("SELECT user_id FROM sessions WHERE id = ? AND expires_at > ?").bind(cookies.sid, now).first();
        if (!session) return jsonError("Unauthorized", 401);

        // Ambil project milik client ini
        const { results: projects } = await env.DB.prepare("SELECT id, title, location FROM projects WHERE client_id = ?").bind(session.user_id).all();
        
        // Ambil semua kategori extras untuk project tsb
        const pIds = projects.map(p => p.id);
        let categories = [];
        let extras = [];
        
        if(pIds.length > 0) {
            const placeholders = pIds.map(() => '?').join(',');
            const catRes = await env.DB.prepare(`SELECT * FROM extras_categories WHERE project_id IN (${placeholders})`).bind(...pIds).all();
            categories = catRes.results;
            
            const extRes = await env.DB.prepare(`SELECT * FROM project_extras WHERE project_id IN (${placeholders}) ORDER BY created_at DESC`).bind(...pIds).all();
            extras = extRes.results;
        }

        return jsonOk({ data: { projects, categories, extras } });
    } catch (e) { return jsonError("Server Error", 500); }
}

export async function onRequestPost({ request, env }) {
    try {
        const body = await request.json();
        if (body.action === 'create_category') {
            const id = crypto.randomUUID();
            await env.DB.prepare("INSERT INTO extras_categories (id, project_id, title, target_qty) VALUES (?, ?, ?, ?)").bind(id, body.project_id, body.title || 'OPSI BARU', body.target_qty || 50).run();
            return jsonOk({ message: "Kategori / Page berhasil dibuat", id });
        }
        return jsonError("Aksi tidak valid");
    } catch (e) { return jsonError("Server Error", 500); }
}
