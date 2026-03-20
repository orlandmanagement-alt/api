import { jsonOk, jsonError } from "../../_lib/response.js";
import { parseCookies } from "../../_lib/cookies.js";

export async function onRequestGet({ request, env }) {
    try {
        // 1. Autentikasi (Cek JWT/Session dari Cookie)
        const cookies = parseCookies(request);
        if (!cookies.sid) return jsonError("Sesi tidak valid / Belum login", 401);

        const now = Math.floor(Date.now() / 1000);
        const session = await env.DB.prepare("SELECT user_id FROM sessions WHERE id = ? AND expires_at > ?").bind(cookies.sid, now).first();
        if (!session) return jsonError("Sesi kadaluarsa", 401);

        // 2. Ambil Data Dasar dari tabel Users
        const user = await env.DB.prepare("SELECT full_name, email, phone FROM users WHERE id = ?").bind(session.user_id).first();
        if (!user) return jsonError("User tidak ditemukan", 404);

        // 3. Ambil Data Profil
        let profile = await env.DB.prepare("SELECT * FROM talent_profiles WHERE user_id = ?").bind(session.user_id).first();

        // 4. LAZY CREATION: Jika profil belum ada, buatkan baris kosong secara otomatis
        if (!profile) {
            const newId = crypto.randomUUID();
            await env.DB.prepare("INSERT INTO talent_profiles (id, user_id, created_at, updated_at) VALUES (?, ?, ?, ?)").bind(newId, session.user_id, now, now).run();
            profile = { id: newId, user_id: session.user_id };
        }

        // 5. Helper Parsing JSON yang aman
        const parseJSON = (str, fallback) => { try { return str ? JSON.parse(str) : fallback; } catch(e) { return fallback; } };

        // 6. Rangkai Data untuk dikirim ke Frontend
        return jsonOk({
            data: {
                full_name: user.full_name,
                email: user.email,
                phone: user.phone,
                profession: profile.talent_type || "",
                personal: {
                    gender: profile.gender || "",
                    dob: profile.birth_date || "",
                    loc: profile.city || "",
                    height: profile.height_cm || ""
                },
                bio: profile.bio || "",
                rates: parseJSON(profile.rates, { hourly: "", project: "" }),
                skills: parseJSON(profile.skills, []),
                photos: parseJSON(profile.photos, { headshot: "", side: "", full: "" }),
                public_slug: profile.public_slug || "",
                profile_progress: profile.profile_progress || 0,
                visibility_status: profile.visibility_status || "private"
            }
        });
    } catch (e) {
        return jsonError("Server Error (profile_get)", 500);
    }
}
