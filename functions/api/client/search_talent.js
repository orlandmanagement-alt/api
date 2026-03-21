import { jsonOk, jsonError } from "../../_lib/response.js";

export async function onRequestGet(context) {
    const { env, request } = context;
    const url = new URL(request.url);
    
    // Ambil kriteria dari URL
    const gender = url.searchParams.get("gender");
    const minHeight = url.searchParams.get("min_h") || 0;
    const city = url.searchParams.get("city");

    try {
        let query = "SELECT * FROM talent_profiles WHERE height >= ?";
        let params = [minHeight];

        if(gender) {
            query += " AND gender = ?";
            params.push(gender);
        }
        if(city) {
            query += " AND city LIKE ?";
            params.push(`%${city}%`);
        }

        query += " ORDER BY created_at DESC LIMIT 50";

        const results = await env.DB_TALENT.prepare(query).bind(...params).all();
        return jsonOk({ talents: results.results });
    } catch (e) {
        return jsonError(e.message);
    }
}
