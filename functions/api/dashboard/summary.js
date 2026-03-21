import { jsonOk, jsonError } from "../../_lib/response.js";

export async function onRequestGet(context) {
    const { env, request } = context;
    const userId = "USER_ID_FROM_SESSION"; 

    try {
        // Ambil Jumlah Proyek Aktif
        const projects = await env.DB.prepare(
            "SELECT COUNT(*) as total FROM projects WHERE owner_user_id = ? AND status != 'closed'"
        ).bind(userId).first();

        // Ambil Jumlah Pelamar Baru (Status: submitted)
        const applicants = await env.DB.prepare(
            "SELECT COUNT(*) as total FROM project_applications WHERE project_id IN (SELECT id FROM projects WHERE owner_user_id = ?) AND status = 'submitted'"
        ).bind(userId).first();

        // Ambil Saldo Dompet
        const wallet = await env.DB.prepare(
            "SELECT balance FROM wallet_balances WHERE user_id = ?"
        ).bind(userId).first();

        return jsonOk({ 
            stats: {
                active_projects: projects.total || 0,
                new_applicants: applicants.total || 0,
                balance: wallet ? wallet.balance : 0
            }
        });
    } catch (e) {
        return jsonError(e.message);
    }
}
