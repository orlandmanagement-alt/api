import { jsonOk, jsonError } from "../_lib/response.js";

export async function onRequestGet({ env }) {
    let status = {
        database_d1: "🔴 DISCONNECTED",
        storage_r2: "🔴 DISCONNECTED",
        system: "ONLINE"
    };

    // Cek koneksi D1 Database
    try {
        if (env.DB) {
            await env.DB.prepare("SELECT 1").first();
            status.database_d1 = "🟢 CONNECTED (OK)";
        }
    } catch(e) { status.database_d1 = "🔴 ERROR: " + e.message; }

    // Cek koneksi R2 Bucket
    try {
        if (env.MEDIA_BUCKET) {
            status.storage_r2 = "🟢 CONNECTED (OK)";
        } else {
            status.storage_r2 = "🟡 PENDING (Belum di-binding di Dashboard Cloudflare)";
        }
    } catch(e) { status.storage_r2 = "🔴 ERROR"; }

    return jsonOk({ data: status, message: "Orland System Diagnostic" });
}
