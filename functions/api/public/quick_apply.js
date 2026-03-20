import { jsonOk, jsonError } from "../../_lib/response.js";

export async function onRequestPost({ request, env }) {
    try {
        const body = await request.json().catch(() => ({}));
        
        if (!body.project_id || !body.category_id) return jsonError("Link Casting tidak valid.", 400);
        if (!body.name || !body.phone || !body.photo_base64) return jsonError("Nama, WhatsApp, dan Foto wajib diisi!", 400);

        const extraId = crypto.randomUUID();
        const now = Math.floor(Date.now() / 1000);

        let finalPhotoUrl = "";

        // ==========================================
        // R2 INTERCEPTION ENGINE (Base64 -> R2 URL)
        // ==========================================
        if (body.photo_base64 && body.photo_base64.startsWith('data:image')) {
            try {
                const base64Data = body.photo_base64.split(',')[1];
                const byteString = atob(base64Data);
                const arrayBuffer = new ArrayBuffer(byteString.length);
                const uint8Array = new Uint8Array(arrayBuffer);
                for (let i = 0; i < byteString.length; i++) { 
                    uint8Array[i] = byteString.charCodeAt(i); 
                }

                const fileName = `extras/${extraId}.jpg`;
                
                // Cek apakah R2 sudah di-binding
                if (env.MEDIA_BUCKET) {
                    await env.MEDIA_BUCKET.put(fileName, arrayBuffer, { 
                        httpMetadata: { contentType: 'image/jpeg', cacheControl: 'public, max-age=31536000' } 
                    });
                    const origin = new URL(request.url).origin;
                    finalPhotoUrl = `${origin}/functions/api/media/${fileName}`;
                } else {
                    // Fallback jika R2 belum siap (Simpan Base64 ke DB)
                    finalPhotoUrl = body.photo_base64;
                }
            } catch(e) {
                console.log("R2 Upload Error:", e);
                finalPhotoUrl = body.photo_base64;
            }
        } else {
            finalPhotoUrl = body.photo_base64; // Jika sudah berupa URL
        }

        // Insert ke D1 Database dengan URL R2 yang bersih
        await env.DB.prepare(`
            INSERT INTO project_extras (id, project_id, category_id, name, phone, age, height, weight, gender, status, photo_base64, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'FREE', ?, ?)
        `).bind(
            extraId, body.project_id, body.category_id, body.name, body.phone, 
            parseInt(body.age) || 0, parseInt(body.height) || 0, parseInt(body.weight) || 0, 
            body.gender || 'Pria', finalPhotoUrl, now
        ).run();

        return jsonOk({ message: "Data berhasil masuk ke Database Sutradara!" });
    } catch (e) { 
        return jsonError("Terjadi kesalahan server.", 500); 
    }
}
