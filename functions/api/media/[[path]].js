export async function onRequestGet({ request, env, params }) {
    try {
        // Gabungkan array path menjadi string (misal: profiles/uuid.jpg)
        const filePath = params.path.join('/');
        
        if (!env.MEDIA_BUCKET) return new Response('R2 Binding Missing', { status: 500 });

        // Ambil objek dari R2
        const object = await env.MEDIA_BUCKET.get(filePath);
        
        if (!object) return new Response('Image Not Found', { status: 404 });

        // Set Headers agar gambar ter-cache di browser Klien/Talent (Super Cepat!)
        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('etag', object.httpEtag);
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');
        headers.set('Access-Control-Allow-Origin', '*');

        return new Response(object.body, { headers });
    } catch (e) {
        return new Response('Internal Error', { status: 500 });
    }
}
