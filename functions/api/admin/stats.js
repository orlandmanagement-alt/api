import { jsonOk, jsonError } from "../../_lib/response.js";
import { parseCookies } from "../../_lib/cookies.js";

export async function onRequestGet({ request, env }) {
    try {
        const cookies = parseCookies(request);
        const now = Math.floor(Date.now() / 1000);
        const session = await env.DB.prepare("SELECT role FROM sessions WHERE id = ? AND expires_at > ?").bind(cookies.sid, now).first();
        if (!session || session.role !== 'admin') return jsonError("Akses ditolak", 403);

        // Menghitung metrik utama menggunakan eksekusi paralel (batch) agar super cepat
        const batch = await env.DB.batch([
            env.DB.prepare("SELECT COUNT(*) as total FROM users WHERE role = 'talent'"),
            env.DB.prepare("SELECT COUNT(*) as total FROM users WHERE role = 'client'"),
            env.DB.prepare("SELECT COUNT(*) as total FROM projects WHERE status = 'open'"),
            env.DB.prepare("SELECT COUNT(*) as total FROM project_applications")
        ]);

        const stats = {
            total_talent: batch[0].results[0].total || 0,
            total_client: batch[1].results[0].total || 0,
            active_projects: batch[2].results[0].total || 0,
            total_applications: batch[3].results[0].total || 0
        };

        // Mengambil 5 aktivitas pendaftaran terbaru
        const { results: recentUsers } = await env.DB.prepare("SELECT full_name, role, created_at FROM users WHERE role IN ('talent', 'client') ORDER BY created_at DESC LIMIT 5").all();

        return jsonOk({ data: { stats, recent_users: recentUsers } });
    } catch (e) { return jsonError("Server Error", 500); }
}
