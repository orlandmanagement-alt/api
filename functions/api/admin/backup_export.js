import { jsonOk, jsonError } from "../../_lib/response.js";

export async function onRequestGet(context) {
    const { env } = context;
    try {
        // Ambil data dari semua database yang terhubung
        const projects = await env.DB.prepare("SELECT * FROM projects").all();
        const talents = await env.DB_TALENT.prepare("SELECT * FROM talent_profiles").all();
        const clients = await env.DB_CLIENT.prepare("SELECT * FROM client_profiles").all();
        const transactions = await env.DB.prepare("SELECT * FROM wallet_transactions").all();

        const backupData = {
            version: "1.0",
            timestamp: Math.floor(Date.now() / 1000),
            data: {
                projects: projects.results,
                talents: talents.results,
                clients: clients.results,
                transactions: transactions.results
            }
        };

        return jsonOk(backupData);
    } catch (e) {
        return jsonError(e.message);
    }
}
