import { jsonOk, jsonError } from "../../_lib/response.js";
import { parseCookies } from "../../_lib/cookies.js";

export async function onRequestPost({ request, env }) {
    try {
        const cookies = parseCookies(request);
        const now = Math.floor(Date.now() / 1000);
        const session = await env.DB.prepare("SELECT user_id FROM sessions WHERE id = ? AND expires_at > ?").bind(cookies.sid, now).first();
        if (!session) return jsonError("Unauthorized", 401);

        const body = await request.json().catch(() => ({}));
        
        let photosJson = body.photos || '{}';
        
        // ==========================================
        // R2 INTERCEPTION ENGINE UNTUK HEADSHOT TALENT
        // ==========================================
        try {
            let photosObj = JSON.parse(photosJson);
            
            if (photosObj.headshot && photosObj.headshot.startsWith('data:image')) {
                const base64Data = photosObj.headshot.split(',')[1];
                const byteString = atob(base64Data);
                const arrayBuffer = new ArrayBuffer(byteString.length);
                const uint8Array = new Uint8Array(arrayBuffer);
                for (let i = 0; i < byteString.length; i++) { uint8Array[i] = byteString.charCodeAt(i); }

                const fileName = `profiles/${session.user_id}_${Date.now()}.jpg`;
                
                if (env.MEDIA_BUCKET) {
                    await env.MEDIA_BUCKET.put(fileName, arrayBuffer, { 
                        httpMetadata: { contentType: 'image/jpeg', cacheControl: 'public, max-age=31536000' } 
                    });
                    const origin = new URL(request.url).origin;
                    photosObj.headshot = `${origin}/functions/api/media/${fileName}`;
                }
            }
            // Konversi kembali menjadi string JSON untuk disimpan di DB
            photosJson = JSON.stringify(photosObj);
        } catch(e) {
            console.log("Error parsing photos:", e);
        }

        // Kalkulasi Profile Progress (Gamification)
        let progress = 20; // Default base
        if (body.gender) progress += 10;
        if (body.dob) progress += 10;
        if (body.city) progress += 10;
        if (body.height_cm) progress += 10;
        if (body.bio) progress += 10;
        if (photosJson.length > 20) progress += 30; // Jika ada foto

        // Simpan / Update Profil Talent
        await env.DB.prepare(`
            INSERT INTO talent_profiles (user_id, talent_type, gender, dob, city, height_cm, weight_kg, bio, photos, skills, profile_progress, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET 
                talent_type = excluded.talent_type, gender = excluded.gender, dob = excluded.dob, 
                city = excluded.city, height_cm = excluded.height_cm, weight_kg = excluded.weight_kg, 
                bio = excluded.bio, photos = excluded.photos, skills = excluded.skills, 
                profile_progress = excluded.profile_progress, updated_at = excluded.updated_at
        `).bind(
            session.user_id, body.talent_type || '', body.gender || '', body.dob || '', 
            body.city || '', parseInt(body.height_cm) || 0, parseInt(body.weight_kg) || 0, 
            body.bio || '', photosJson, body.skills || '[]', progress, now
        ).run();

        // Update nama user jika ada
        if (body.full_name) {
            await env.DB.prepare("UPDATE users SET full_name = ? WHERE id = ?").bind(body.full_name, session.user_id).run();
        }

        return jsonOk({ message: "Profil berhasil diperbarui!", progress: progress });
    } catch (e) { 
        return jsonError("Server Error", 500); 
    }
}
