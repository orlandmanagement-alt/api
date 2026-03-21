import { jsonOk, jsonError } from "../../_lib/response.js";
import { ClientMeService } from "../../services/client/client_me_service.js";

export async function onRequestPost(context) {
    const { env, request } = context;
    try {
        const body = await request.json();
        const userId = "USER_ID_FROM_SESSION";
        
        await ClientMeService.updateProfile(env.DB, userId, body);
        return jsonOk({ message: "Profil Perusahaan Berhasil Diperbarui" });
    } catch (e) {
        return jsonError(e.message);
    }
}
