import { jsonOk, jsonError } from "../../_lib/response.js";
import { parseCookies } from "../../_lib/cookies.js";

export async function onRequestGet({ request, env }) {
    try {
        const cookies = parseCookies(request);
        const now = Math.floor(Date.now() / 1000);
        const session = await env.DB.prepare("SELECT user_id FROM sessions WHERE id = ? AND expires_at > ?").bind(cookies.sid, now).first();
        if (!session) return jsonError("Unauthorized", 401);

        const url = new URL(request.url);
        const projectId = url.searchParams.get("id");
        if (!projectId) return jsonError("ID Proyek diperlukan", 400);

        const { results: roles } = await env.DB.prepare("SELECT * FROM project_roles WHERE project_id = ?").bind(projectId).all();
        const profile = await env.DB.prepare("SELECT * FROM talent_profiles WHERE user_id = ?").bind(session.user_id).first();

        let scoredRoles = roles;
        if (profile && roles.length > 0) {
            let talentAge = 25;
            if (profile.dob) talentAge = new Date().getFullYear() - new Date(profile.dob).getFullYear();
            const talentHeight = profile.height_cm || 160;
            const talentGender = profile.gender || '';
            const talentCategory = profile.talent_type || '';

            scoredRoles = roles.map(role => {
                let score = 0;
                if (role.category === talentCategory || !role.category) score += 40;
                if (role.gender === 'Semua' || role.gender === talentGender) score += 30;
                if (talentAge >= role.age_min && talentAge <= role.age_max) score += 15;
                if (talentHeight >= role.height_min && talentHeight <= role.height_max) score += 15;
                return { ...role, match_score: score };
            });
        }

        return jsonOk({ items: scoredRoles });
    } catch (e) { return jsonError("Server Error", 500); }
}
