import { jsonOk, jsonError } from "../../../_lib/response.js";
import { requireAuth } from "../../../_lib/session.js";

export async function onRequestGet(context) {
    const { request, env } = context;
    const auth = await requireAuth(env, request);
    if (!auth.ok) return auth.res;

    const db = env.DB_TALENT || env.DB;

    try {
        // Ambil data JSON mentah dari tabel (Asumsi kita simpan semua state UI dalam 1 kolom JSON untuk fleksibilitas)
        const profile = await db.prepare("SELECT profile_json FROM talent_profiles WHERE user_id = ?").bind(auth.uid).first();
        
        if (profile && profile.profile_json) {
            return jsonOk({ profile: JSON.parse(profile.profile_json) });
        }
        return jsonOk({ profile: null });
    } catch (e) {
        return jsonError("Gagal mengambil profil dari database", 500);
    }
}
