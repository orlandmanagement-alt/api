import { jsonOk, jsonError } from "../../_lib/response.js";
import { TalentProfileService } from "../../services/talent/talent_profile_service.js";

export async function onRequestPost(context) {
    const { env, request } = context;
    try {
        const body = await request.json();
        const userId = body.user_id; // Diambil dari session auth middleware
        
        await TalentProfileService.updateFullProfile(env.DB_TALENT, userId, body);
        return jsonOk({ message: "Data fisik talent berhasil diperbarui" });
    } catch (e) {
        return jsonError(e.message);
    }
}
