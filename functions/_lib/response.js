export function json(status, st, data) {
  return new Response(JSON.stringify({ status: st, data }, null, 0), {
    status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });
}
export const jsonOk = (data = null) => json(200, "ok", data);
export const jsonInvalid = (data = null) => json(400, "invalid_input", data);
export const jsonUnauthorized = (data = null) => json(401, "unauthorized", data);
export const jsonForbidden = (data = null) => json(403, "forbidden", data);
export const jsonNotFound = (data = null) => json(404, "not_found", data);
export const jsonError = (data = null) => json(500, "server_error", data);
