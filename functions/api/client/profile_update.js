import { jsonOk, jsonError } from "../../../_lib/response.js";
import { requireAuth } from "../../../_lib/session.js";

export async function onRequestPost(context) {
    const { request, env } = context;
    const auth = await requireAuth(env, request);
    if (!auth.ok) return auth.res;
    
    // SMART BINDING
    const db = env.DB_CLIENT || env.DB;

    const body = await request.json().catch(() => ({}));
    const now = Math.floor(Date.now() / 1000);

    try {
        let org = await db.prepare("SELECT id FROM client_organizations WHERE owner_user_id = ?").bind(auth.uid).first();
        let orgId = org ? org.id : `org_${crypto.randomUUID()}`;

        if (!org) {
            await db.prepare("INSERT INTO client_organizations (id, owner_user_id, name, industry_type, company_type, website_url, status, verification_status, created_at, updated_at) VALUES (?, ?, ?, ?, '', '', 'active', 'unverified', ?, ?)")
                .bind(orgId, auth.uid, body.company_name || 'Nama Perusahaan', body.industry_type || '', now, now).run();
            
            await db.prepare("INSERT INTO client_profiles (id, organization_id, contact_name, contact_phone, contact_email, billing_json, address_json, notes, updated_at) VALUES (?, ?, ?, ?, '', ?, '{}', '', ?)")
                .bind(`cprof_${crypto.randomUUID()}`, orgId, body.contact_name || '', body.contact_phone || '', JSON.stringify(body.billing || {}), now).run();
        } else {
            await db.prepare("UPDATE client_organizations SET name = ?, industry_type = ?, updated_at = ? WHERE id = ?")
                .bind(body.company_name || 'Nama Perusahaan', body.industry_type || '', now, orgId).run();
            
            await db.prepare("UPDATE client_profiles SET contact_name = ?, contact_phone = ?, billing_json = ?, updated_at = ? WHERE organization_id = ?")
                .bind(body.contact_name || '', body.contact_phone || '', JSON.stringify(body.billing || {}), now, orgId).run();
        }

        return jsonOk({ message: "Profil berhasil diperbarui!" });
    } catch (e) {
        return jsonError(`DB Error: ${e.message}`, 500);
    }
}
