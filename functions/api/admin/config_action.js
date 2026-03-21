import { jsonOk, jsonError } from "../../_lib/response.js";
import { ConfigRepo } from "../../repos/config_repo.js";

export async function onRequest(context) {
    const { env, request } = context;
    try {
        if (request.method === "GET") {
            const data = await ConfigRepo.getAll(env.DB);
            return jsonOk({ configs: data.results });
        }
        if (request.method === "POST") {
            const body = await request.json(); // { key, value }
            await ConfigRepo.update(env.DB, body.key, body.value);
            return jsonOk({ message: "Konfigurasi diperbarui" });
        }
    } catch (e) {
        return jsonError(e.message);
    }
}
