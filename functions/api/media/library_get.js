import { jsonOk, jsonError } from "../../_lib/response.js";

export async function onRequestGet(context) {
    const { env, request } = context;
    const userId = "USER_ID_FROM_SESSION";
    try {
        const assets = await env.DB.prepare(
            "SELECT * FROM media_assets WHERE user_id = ? ORDER BY created_at DESC"
        ).bind(userId).all();
        return jsonOk({ assets: assets.results });
    } catch (e) {
        return jsonError(e.message);
    }
}
