import { jsonOk, jsonError } from "../../_lib/response.js";

export async function onRequestPost(context) {
    const { env, request } = context;
    try {
        const body = await request.json(); // { old_pass, new_pass }
        const userId = "USER_ID_FROM_SESSION";

        // 1. Verifikasi Password Lama (Mockup logikanya)
        const user = await env.DB_SSO.prepare("SELECT * FROM users WHERE id = ?").bind(userId).first();
        if (body.old_pass !== user.password) {
            return jsonError("Password lama salah!");
        }

        // 2. Update ke Password Baru
        await env.DB_SSO.prepare("UPDATE users SET password = ?, updated_at = ? WHERE id = ?")
            .bind(body.new_pass, Math.floor(Date.now()/1000), userId).run();

        return jsonOk({ message: "Password berhasil diperbarui secara aman." });
    } catch (e) {
        return jsonError(e.message);
    }
}
