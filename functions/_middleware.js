export async function onRequest(context) {
    const { request } = context;
    // Tangkap asal domain yang me-request (Talent/Client/SSO)
    const origin = request.headers.get("Origin") || "*";
    
    // 1. Tangani Preflight Request (Cek keamanan dari Browser)
    if (request.method === "OPTIONS") {
        return new Response(null, {
            headers: {
                "Access-Control-Allow-Origin": origin,
                "Access-Control-Allow-Methods": "GET, HEAD, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization, Cookie",
                "Access-Control-Allow-Credentials": "true",
                "Access-Control-Max-Age": "86400", // Cache preflight 24 jam
            }
        });
    }

    // 2. Teruskan request ke fungsi API yang sebenarnya
    const response = await context.next();
    
    // 3. Suntikkan Header CORS yang benar ke respons balasan
    const newResponse = new Response(response.body, response);
    newResponse.headers.set("Access-Control-Allow-Origin", origin);
    newResponse.headers.set("Access-Control-Allow-Credentials", "true");
    
    return newResponse;
}
