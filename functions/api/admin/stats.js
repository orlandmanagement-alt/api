import { jsonOk, jsonError } from "../../_lib/response.js";
import { ReportRepo } from "../../repos/report_repo.js";

export async function onRequestGet(context) {
    const { env, request } = context;
    const url = new URL(request.url);
    const month = url.searchParams.get("m") || new Date().getMonth() + 1;
    const year = url.searchParams.get("y") || new Date().getFullYear();

    try {
        const stats = await ReportRepo.getMonthlySummary(env.DB, month, year);
        const latest = await env.DB.prepare("SELECT * FROM wallet_transactions ORDER BY created_at DESC LIMIT 5").all();
        
        return jsonOk({ stats, latest: latest.results });
    } catch (e) {
        return jsonError(e.message);
    }
}
