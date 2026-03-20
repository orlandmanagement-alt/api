import { jsonOk, jsonError } from "../_lib/response.js";
import { parseCookies } from "../_lib/cookies.js";

export async function onRequestPost({ request, env }) {
    try {
        // Validasi keamanan: Hanya user login yang bisa upload
        const cookies = parseCookies(request);
        const now = Math.floor(Date.now() / 1000);
        const session = await env.DB.prepare("SELECT user_id FROM sessions WHERE id = ? AND expires_at > ?").bind(cookies.sid, now).first();
        if (!session) return jsonError("Unauthorized. Silakan login.", 401);

        const body = await request.json().catch(() => ({}));
        const { image_base64, folder = "profiles" } = body;
        
        if (!image_base64) return jsonError("Data gambar kosong", 400);
        if (!env.MEDIA_BUCKET) return jsonError("R2 Bucket belum di-binding ke MEDIA_BUCKET", 500);

        // Pisahkan header base64 (data:image/jpeg;base64,...)
        const base64Data = image_base64.split(',')[1];
        if (!base64Data) return jsonError("Format gambar tidak valid", 400);

        // Konversi Base64 ke Binary ArrayBuffer (Standard Web API Worker)
        const byteString = atob(base64Data);
        const arrayBuffer = new ArrayBuffer(byteString.length);
        const uint8Array = new Uint8Array(arrayBuffer);
        for (let i = 0; i < byteString.length; i++) {
            uint8Array[i] = byteString.charCodeAt(i);
        }

        // Generate nama file unik
        const fileName = `${folder}/${crypto.randomUUID()}.jpg`;

        // Simpan ke Cloudflare R2
        await env.MEDIA_BUCKET.put(fileName, arrayBuffer, {
            httpMetadata: { contentType: 'image/jpeg', cacheControl: 'public, max-age=31536000' }
        });

        // Kembalikan URL Proxy internal kita
        const origin = new URL(request.url).origin;
        const fileUrl = `${origin}/functions/api/media/${fileName}`;

        return jsonOk({ message: "Upload berhasil", url: fileUrl });
    } catch (e) { 
        return jsonError("Server Error: " + e.message, 500); 
    }
}
