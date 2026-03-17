export function json(status, st, data) {
  return new Response(JSON.stringify({ status: st, data }, null, 0), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}
