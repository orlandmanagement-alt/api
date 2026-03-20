import { jsonOk, jsonError } from "../../_lib/response.js";
import { parseCookies } from "../../_lib/cookies.js";

export async function onRequestGet({ request, env }) {
    try {
        const cookies = parseCookies(request);
        const now = Math.floor(Date.now() / 1000);
        const session = await env.DB.prepare("SELECT user_id, role FROM sessions WHERE id = ? AND expires_at > ?").bind(cookies.sid, now).first();
        if (!session || session.role !== 'talent') return jsonError("Akses ditolak", 403);

        // 1. Ambil Profil Talent
        const profile = await env.DB.prepare("SELECT * FROM talent_profiles WHERE user_id = ?").bind(session.user_id).first();
        
        // 2. Hitung Statistik Lamaran (Batch)
        const batch = await env.DB.batch([
            env.DB.prepare("SELECT COUNT(*) as total FROM project_applications WHERE talent_user_id = ?").bind(session.user_id),
            env.DB.prepare("SELECT COUNT(*) as approved FROM project_applications WHERE talent_user_id = ? AND status = 'approved'").bind(session.user_id),
            env.DB.prepare("SELECT COUNT(*) as invited FROM project_applications WHERE talent_user_id = ? AND status = 'invited'").bind(session.user_id)
        ]);

        const stats = {
            total_applied: batch[0].results[0].total || 0,
            total_approved: batch[1].results[0].approved || 0,
            total_invited: batch[2].results[0].invited || 0,
            progress: profile?.profile_progress || 0,
            score: profile?.rating_score || 0,
            type: profile?.talent_type || ""
        };

        // ==========================================
        // ALGORITMA SMART JOB MATCHING
        // ==========================================
        let recommended = [];
        
        // Ambil semua role dari proyek yang open
        const queryRoles = `
            SELECT r.*, p.title as project_title, c.company_name 
            FROM project_roles r
            JOIN projects p ON r.project_id = p.id
            LEFT JOIN client_profiles c ON p.client_id = c.user_id
            WHERE p.status = 'open'
        `;
        const { results: openRoles } = await env.DB.prepare(queryRoles).all();

        if (openRoles && openRoles.length > 0 && profile) {
            // Hitung umur talent dari DOB
            let talentAge = 25; // Default jika kosong
            if (profile.dob) {
                const birthYear = new Date(profile.dob).getFullYear();
                const currentYear = new Date().getFullYear();
                talentAge = currentYear - birthYear;
            }
            const talentHeight = profile.height_cm || 160;
            const talentGender = profile.gender || '';
            const talentCategory = profile.talent_type || '';

            // Hitung skor untuk setiap role
            const scoredRoles = openRoles.map(role => {
                let score = 0;
                
                // 1. Kategori Match (40%)
                if (role.category === talentCategory || role.category === '' || role.category === null) score += 40;
                
                // 2. Gender Match (30%)
                if (role.gender === 'Semua' || role.gender === talentGender) score += 30;
                
                // 3. Age Match (15%)
                if (talentAge >= role.age_min && talentAge <= role.age_max) score += 15;
                
                // 4. Height Match (15%)
                if (talentHeight >= role.height_min && talentHeight <= role.height_max) score += 15;

                return { ...role, match_score: score };
            });

            // Filter yang skornya >= 50, urutkan dari yang tertinggi, ambil 3 teratas
            recommended = scoredRoles
                .filter(r => r.match_score >= 50)
                .sort((a, b) => b.match_score - a.match_score)
                .slice(0, 3);
        }

        return jsonOk({ data: { stats, recommended } });
    } catch (e) { return jsonError("Server Error", 500); }
}
