import { jsonOk, jsonError } from "../../_lib/response.js";

export async function onRequestPost(context) {
    const { env, request } = context;
    try {
        const body = await request.json(); // { id, r2_key }
        await env.MY_BUCKET.delete(body.r2_key);
        await env.DB.prepare("DELETE FROM media_assets WHERE id = ?").bind(body.id).run();
        return jsonOk({ message: "Aset berhasil dihapus" });
    } catch (e) {
        return jsonError(e.message);
    }
}
