import { jsonOk, jsonError } from "../../../_lib/response.js";
import { requireAuth } from "../../../_lib/session.js";

// Helper untuk Upload Base64 ke Cloudflare R2
async function uploadToR2(env, base64String, userId, type) {
    if (!env.R2_BUCKET || !base64String.startsWith('data:image')) return base64String; // Skip jika bukan base64 baru atau R2 tidak ada
    
    try {
        const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        const typeMatch = matches[1];
        const buffer = Uint8Array.from(atob(matches[2]), c => c.charCodeAt(0));
        
        const ext = typeMatch.split('/')[1] || 'jpg';
        const key = `talents/${userId}/${type}_${Date.now()}.${ext}`;
        
        await env.R2_BUCKET.put(key, buffer, { httpMetadata: { contentType: typeMatch } });
        
        // Ganti URL dengan domain public R2 Anda (Asumsi: storage.orlandmanagement.com)
        return `https://storage.orlandmanagement.com/${key}`;
    } catch(e) {
        console.log("R2 Upload Error:", e);
        return base64String; // Fallback tetap simpan base64 jika R2 gagal
    }
}

export async function onRequestPost(context) {
    const { request, env } = context;
    const auth = await requireAuth(env, request);
    if (!auth.ok) return auth.res;

    const db = env.DB_TALENT || env.DB;
    const body = await request.json().catch(() => ({}));
    const now = Math.floor(Date.now() / 1000);

    try {
        // 1. Ekstrak dan Upload Foto ke R2 secara paralel (jika ada foto base64 baru)
        if (body.photos) {
            if (body.photos.headshot?.length > 1000) body.photos.headshot = await uploadToR2(env, body.photos.headshot, auth.uid, 'headshot');
            if (body.photos.side?.length > 1000) body.photos.side = await uploadToR2(env, body.photos.side, auth.uid, 'side');
            if (body.photos.full?.length > 1000) body.photos.full = await uploadToR2(env, body.photos.full, auth.uid, 'full');
        }

        const profileJson = JSON.stringify(body);

        // 2. Simpan ke Database
        const exist = await db.prepare("SELECT id FROM talent_profiles WHERE user_id = ?").bind(auth.uid).first();
        
        if (exist) {
            await db.prepare("UPDATE talent_profiles SET profile_json = ?, updated_at = ? WHERE user_id = ?")
                .bind(profileJson, now, auth.uid).run();
        } else {
            const newId = `tprof_${crypto.randomUUID()}`;
            await db.prepare("INSERT INTO talent_profiles (id, user_id, profile_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?)")
                .bind(newId, auth.uid, profileJson, now, now).run();
        }

        return jsonOk({ message: "Profil dan Foto berhasil disimpan!", saved_state: body });
    } catch (e) {
        return jsonError(`Gagal menyimpan profil: ${e.message}`, 500);
    }
}
