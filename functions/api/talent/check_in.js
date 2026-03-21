import { jsonOk, jsonError } from "../../_lib/response.js";

export async function onRequestPost(context) {
    const { env, request } = context;
    try {
        const body = await request.json(); // { project_id, lat, lng, loc_name }
        const userId = "TALENT_ID_FROM_SESSION";
        const id = `ATT-${Date.now()}`;
        const now = Math.floor(Date.now() / 1000);

        await env.DB.prepare(`
            INSERT INTO talent_presences (id, project_id, talent_user_id, check_in_at, latitude, longitude, location_name, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(id, body.project_id, userId, now, body.lat, body.lng, body.loc_name, now).run();

        return jsonOk({ message: "Check-in berhasil! Selamat bekerja." });
    } catch (e) {
        return jsonError(e.message);
    }
}
