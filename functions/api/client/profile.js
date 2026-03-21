import { jsonOk, jsonError } from "../../_lib/response.js";

export async function onRequest(context) {
    const { request, env } = context;
    const method = request.method;

    // 1. Ambil Session (Asumsi session tersimpan di Header atau Cookie)
    // Anda harus memiliki helper getSession yang mengecek ke env.DB_SSO
    const sessionId = request.headers.get("Authorization")?.replace("Bearer ", "");
    const session = await env.DB_SSO.prepare("SELECT user_id, role FROM sessions WHERE id = ? AND expires_at > ?")
        .bind(sessionId, Math.floor(Date.now() / 1000)).first();

    if (!session || session.role !== 'client') {
        return jsonError("Unauthorized: Akses khusus Client", 401);
    }

    const userId = session.user_id;

    // 2. ROUTING CRUD
    try {
        if (method === "GET") {
            // Ambil data profil dari client_database
            const profile = await env.DB_CLIENT.prepare(
                "SELECT * FROM client_profiles WHERE user_id = ?"
            ).bind(userId).first();
            
            return jsonOk({ profile });
        } 

        if (method === "POST" || method === "PUT") {
            const body = await request.json();
            
            // Cek apakah profil sudah ada
            const existing = await env.DB_CLIENT.prepare(
                "SELECT id FROM client_profiles WHERE user_id = ?"
            ).bind(userId).first();

            const now = Math.floor(Date.now() / 1000);

            if (existing) {
                // UPDATE
                await env.DB_CLIENT.prepare(`
                    UPDATE client_profiles SET 
                        company_name = ?, 
                        industry_type = ?, 
                        contact_name = ?, 
                        contact_phone = ?, 
                        website_url = ?, 
                        updated_at = ? 
                    WHERE user_id = ?`)
                .bind(
                    body.company_name, 
                    body.industry_type, 
                    body.contact_name, 
                    body.contact_phone, 
                    body.website_url, 
                    now, 
                    userId
                ).run();
            } else {
                // INSERT (Jika pertama kali)
                const newId = `CL-${Date.now()}`;
                await env.DB_CLIENT.prepare(`
                    INSERT INTO client_profiles (id, user_id, company_name, industry_type, contact_name, contact_phone, created_at, updated_at) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
                .bind(newId, userId, body.company_name, body.industry_type, body.contact_name, body.contact_phone, now, now)
                .run();
            }

            return jsonOk({ message: "Profil berhasil diperbarui!" });
        }
    } catch (e) {
        return jsonError(`Database Error: ${e.message}`, 500);
    }
}
