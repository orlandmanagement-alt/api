import { jsonOk, jsonError } from "../../_lib/response.js";
import { parseCookies } from "../../_lib/cookies.js";

export async function onRequestGet({ request, env }) {
    try {
        const cookies = parseCookies(request);
        if (!cookies.sid) return jsonError("Unauthorized", 401);
        
        const now = Math.floor(Date.now() / 1000);
        const session = await env.DB.prepare("SELECT user_id, role FROM sessions WHERE id = ? AND expires_at > ?").bind(cookies.sid, now).first();
        if (!session || session.role !== 'client') return jsonError("Akses ditolak", 403);

        const user = await env.DB.prepare("SELECT full_name, email, phone FROM users WHERE id = ?").bind(session.user_id).first();
        if (!user) return jsonError("User tidak ditemukan", 404);

        let profile = await env.DB.prepare("SELECT * FROM client_profiles WHERE user_id = ?").bind(session.user_id).first();

        // LAZY CREATION: Buat profil kosong jika Client baru pertama kali buka
        if (!profile) {
            const newId = crypto.randomUUID();
            // Default company_name diisi nama user sementara
            await env.DB.prepare("INSERT INTO client_profiles (id, user_id, company_name, contact_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)")
                .bind(newId, session.user_id, user.full_name, user.full_name, now, now).run();
            profile = { id: newId, company_name: user.full_name, contact_name: user.full_name, verification_status: 'unverified' };
        }

        const parseJSON = (str, fallback) => { try { return str ? JSON.parse(str) : fallback; } catch(e) { return fallback; } };

        return jsonOk({
            data: {
                email: user.email,
                company_name: profile.company_name || "",
                industry_type: profile.industry_type || "",
                contact_name: profile.contact_name || "",
                contact_phone: profile.contact_phone || user.phone || "",
                website_url: profile.website_url || "",
                billing: parseJSON(profile.billing_json, { npwp: "", company_address: "" }),
                verification_status: profile.verification_status || "unverified"
            }
        });
    } catch (e) { return jsonError("Server Error", 500); }
}
