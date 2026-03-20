import { jsonOk, jsonError } from "../../_lib/response.js";

// Endpoint ini BISA DIAKSES TANPA LOGIN (Untuk Landing Page WhatsApp)
export async function onRequestGet({ request, env }) {
    try {
        const url = new URL(request.url);
        const projectId = url.searchParams.get("id");
        if (!projectId) return jsonError("ID Proyek tidak valid", 400);

        // Ambil detail proyek dan nama perusahaan client (JOIN)
        const query = `
            SELECT p.id, p.title, p.description, p.location, p.event_date, p.status, p.created_at,
                   c.company_name
            FROM projects p
            LEFT JOIN client_profiles c ON p.client_id = c.user_id
            WHERE p.id = ?
        `;
        const project = await env.DB.prepare(query).bind(projectId).first();

        if (!project) return jsonError("Proyek tidak ditemukan", 404);
        
        return jsonOk({ data: project });
    } catch (e) { return jsonError("Server Error", 500); }
}
