import { jsonOk, jsonError } from "../../_lib/response.js";
import { UsersTalentService } from "../../services/users/users_talent_service.js";

export async function onRequestGet(context) {
    const { env, request } = context;
    const url = new URL(request.url);
    
    const filters = {
        gender: url.searchParams.get("gender"),
        age_min: url.searchParams.get("age_min"),
        age_max: url.searchParams.get("age_max"),
        city: url.searchParams.get("city")
    };

    try {
        const talents = await UsersTalentService.findTalent(env.DB_TALENT, filters);
        return jsonOk({ talents });
    } catch (e) {
        return jsonError(e.message);
    }
}
