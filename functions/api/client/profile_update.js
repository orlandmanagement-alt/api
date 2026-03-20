import { jsonOk, jsonError } from "../../../_lib/response.js";
import { requireAuth } from "../../../_lib/session.js";

export async function onRequestPost(context) {
    const { request, env } = context;
    const auth = await requireAuth(env, request);
    if (!auth.ok) return auth.res;

    const body = await request.json().catch(() => ({}));
    const now = Math.floor(Date.now() / 1000);

    try {
        // Cek apakah client sudah punya data organisasi
        let org = await env.DB.prepare("SELECT id FROM client_organizations WHERE owner_user_id = ?").bind(auth.uid).first();
        let orgId = org ? org.id : `org_${crypto.randomUUID()}`;

        if (!org) {
            // Insert Baru
            await env.DB.prepare("INSERT INTO client_organizations (id, owner_user_id, name, industry_type, status, verification_status, created_at, updated_at) VALUES (?, ?, ?, ?, 'active', 'unverified', ?, ?)")
                .bind(orgId, auth.uid, body.company_name || 'Nama Perusahaan', body.industry_type || '', now, now).run();
            
            await env.DB.prepare("INSERT INTO client_profiles (id, organization_id, contact_name, contact_phone, billing_json, address_json, updated_at) VALUES (?, ?, ?, ?, ?, '{}', ?)")
                .bind(`cprof_${crypto.randomUUID()}`, orgId, body.contact_name || '', body.contact_phone || '', JSON.stringify(body.billing || {}), now).run();
        } else {
            // Update Data Lama
            await env.DB.prepare("UPDATE client_organizations SET name = ?, industry_type = ?, updated_at = ? WHERE id = ?")
                .bind(body.company_name || 'Nama Perusahaan', body.industry_type || '', now, orgId).run();
            
            await env.DB.prepare("UPDATE client_profiles SET contact_name = ?, contact_phone = ?, billing_json = ?, updated_at = ? WHERE organization_id = ?")
                .bind(body.contact_name || '', body.contact_phone || '', JSON.stringify(body.billing || {}), now, orgId).run();
        }

        return jsonOk({ message: "Profil perusahaan berhasil diperbarui!" });
    } catch (e) {
        return jsonError("Terjadi kesalahan sistem saat menyimpan profil.", 500);
    }
}
