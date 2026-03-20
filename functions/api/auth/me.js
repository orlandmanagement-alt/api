import { jsonOk, jsonUnauthorized, jsonError } from "../../_lib/response.js";
import { requireAuth } from "../../_lib/session.js";

export async function onRequestGet({ request, env }) {
    try {
        // 1. Cek validitas cookie menggunakan fungsi session.js bawaan Anda
        const auth = await requireAuth(env, request);
        if (!auth.ok) return auth.res; // Akan mengembalikan jsonUnauthorized jika gagal

        // 2. Ambil data dasar user dari tabel users
        const user = await env.DB.prepare("SELECT id, full_name, email, role FROM users WHERE id = ?").bind(auth.uid).first();
        if (!user) return jsonUnauthorized("User tidak ditemukan di database.");

        // 3. Kembalikan data user agar frontend mengizinkan masuk ke Dashboard
        return jsonOk({ 
            user: { 
                id: user.id, 
                full_name: user.full_name, 
                email: user.email, 
                role: user.role 
            } 
        });
    } catch (e) {
        return jsonError("Terjadi kesalahan pada server saat verifikasi sesi.", 500);
    }
}
