import { jsonOk, jsonError } from "../../_lib/response.js";
import { parseCookies } from "../../_lib/cookies.js";

export async function onRequestPost({ request, env }) {
    try {
        const cookies = parseCookies(request);
        if (!cookies.sid) return jsonError("Unauthorized", 401);
        
        const now = Math.floor(Date.now() / 1000);
        const session = await env.DB.prepare("SELECT user_id, role FROM sessions WHERE id = ? AND expires_at > ?").bind(cookies.sid, now).first();
        if (!session || session.role !== 'client') return jsonError("Akses ditolak", 403);

        const body = await request.json().catch(() => ({}));
        if (!body.company_name) return jsonError("Nama Perusahaan wajib diisi", 400);

        // Update Tabel Utama (Update nama di tabel users juga agar sinkron dengan SSO)
        await env.DB.prepare("UPDATE users SET full_name = ? WHERE id = ?").bind(body.contact_name || body.company_name, session.user_id).run();

        // Update Profil Client
        const query = `
            UPDATE client_profiles
            SET company_name = ?, industry_type = ?, contact_name = ?, contact_phone = ?, website_url = ?, billing_json = ?, updated_at = ?
            WHERE user_id = ?
        `;
        
        await env.DB.prepare(query).bind(
            body.company_name,
            body.industry_type || null,
            body.contact_name || null,
            body.contact_phone || null,
            body.website_url || null,
            JSON.stringify(body.billing || {}),
            now,
            session.user_id
        ).run();

        return jsonOk({ message: "Profil Perusahaan berhasil diperbarui" });
    } catch (e) { return jsonError("Server Error", 500); }
}
