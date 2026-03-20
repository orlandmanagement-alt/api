import { jsonOk, jsonError } from "../../_lib/response.js";
import { parseCookies } from "../../_lib/cookies.js";

// Helper Pembuat URL SEO
function generateSlug(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 5);
}

export async function onRequestPost({ request, env }) {
    try {
        // 1. Autentikasi
        const cookies = parseCookies(request);
        if (!cookies.sid) return jsonError("Unauthorized", 401);

        const now = Math.floor(Date.now() / 1000);
        const session = await env.DB.prepare("SELECT user_id FROM sessions WHERE id = ? AND expires_at > ?").bind(cookies.sid, now).first();
        if (!session) return jsonError("Session expired", 401);

        // 2. Ambil Payload dari Frontend
        const body = await request.json().catch(() => ({}));

        // 3. Kalkulator Progress Profil (0-100%)
        let score = 0; const maxScore = 9;
        if (body.full_name) score++;
        if (body.profession) score++;
        if (body.personal?.gender) score++;
        if (body.personal?.dob) score++;
        if (body.personal?.loc) score++;
        if (body.personal?.height) score++;
        if (body.bio && body.bio.length > 20) score++;
        if (body.skills && body.skills.length > 0) score++;
        if (body.photos?.headshot) score++; // Foto Headshot wajib untuk nilai penuh
        
        const progress = Math.round((score / maxScore) * 100);

        // 4. Manajemen Public Slug
        let currentProfile = await env.DB.prepare("SELECT public_slug FROM talent_profiles WHERE user_id = ?").bind(session.user_id).first();
        let slug = currentProfile?.public_slug;
        
        // Buat slug baru JIKA belum punya dan nama sudah diisi
        if (!slug && body.full_name) {
            slug = generateSlug(body.full_name);
        }

        // 5. Update Tabel Utama (users) untuk Nama & HP
        if (body.full_name || body.contacts?.phone) {
            await env.DB.prepare("UPDATE users SET full_name = COALESCE(?, full_name), phone = COALESCE(?, phone) WHERE id = ?")
                .bind(body.full_name || null, body.contacts?.phone || null, session.user_id).run();
        }

        // 6. TODO: Cloudflare R2 Upload Logic (Skala Besar)
        // Di masa depan, proses upload Base64 (body.photos.headshot) dilakukan di sini,
        // lalu ubah nilai body.photos.headshot menjadi URL dari R2 bucket.
        const finalPhotosJSON = JSON.stringify(body.photos || {});

        // 7. Update Tabel Talent Profiles
        const query = `
            UPDATE talent_profiles
            SET
                talent_type = ?,
                gender = ?,
                birth_date = ?,
                city = ?,
                height_cm = ?,
                bio = ?,
                skills = ?,
                rates = ?,
                photos = ?,
                public_slug = ?,
                profile_progress = ?,
                updated_at = ?
            WHERE user_id = ?
        `;

        await env.DB.prepare(query).bind(
            body.profession || null,
            body.personal?.gender || null,
            body.personal?.dob || null,
            body.personal?.loc || null,
            parseInt(body.personal?.height) || null,
            body.bio || null,
            JSON.stringify(body.skills || []),
            JSON.stringify(body.rates || {}),
            finalPhotosJSON,
            slug || null,
            progress,
            now,
            session.user_id
        ).run();

        return jsonOk({ 
            message: "Profil berhasil diperbarui", 
            progress: progress, 
            public_slug: slug 
        });

    } catch (e) {
        return jsonError("Server Error (profile_update)", 500);
    }
}
