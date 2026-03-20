import { jsonOk, jsonError } from "../../_lib/response.js";

// BISA DIAKSES TANPA LOGIN - Untuk mengisi dropdown HTML saat halaman dimuat
export async function onRequestGet({ env }) {
    try {
        const { results } = await env.DB.prepare("SELECT group_name, label FROM master_categories WHERE is_active = 1 ORDER BY label ASC").all();
        
        // Mengelompokkan data berdasarkan group_name
        const grouped = results.reduce((acc, curr) => {
            if (!acc[curr.group_name]) acc[curr.group_name] = [];
            acc[curr.group_name].push(curr.label);
            return acc;
        }, {});

        return jsonOk({ data: grouped });
    } catch (e) { return jsonError("Server Error", 500); }
}
