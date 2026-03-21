import { jsonOk, jsonError } from "../../_lib/response.js";

export async function onRequestPost(context) {
    const { env, request } = context;
    try {
        const body = await request.json(); 
        const userId = "CLIENT_ID_FROM_SESSION";
        const now = Math.floor(Date.now() / 1000);

        await env.DB.prepare(`
            INSERT INTO project_briefs (id, project_id, client_user_id, script_url, wardrobe_notes, call_sheet_url, other_instructions, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(project_id) DO UPDATE SET
                script_url = excluded.script_url,
                wardrobe_notes = excluded.wardrobe_notes,
                call_sheet_url = excluded.call_sheet_url,
                other_instructions = excluded.other_instructions,
                updated_at = excluded.updated_at
        `).bind(`BRF-${Date.now()}`, body.project_id, userId, body.script, body.wardrobe, body.call_sheet, body.notes, now).run();

        return jsonOk({ message: "Brief produksi berhasil diperbarui!" });
    } catch (e) {
        return jsonError(e.message);
    }
}
