export function jsonOk(data = {}, headers = {}) {
    return new Response(JSON.stringify({ status: "ok", ...data }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...headers }
    });
}

export function jsonError(message, status = 400, headers = {}) {
    return new Response(JSON.stringify({ status: "error", message }), {
        status,
        headers: { "Content-Type": "application/json", ...headers }
    });
}
