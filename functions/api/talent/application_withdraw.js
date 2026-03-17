export async function onRequestPost(ctx){
  const mod = await import("./project_applications.js");
  const req = await ctx.request.clone().json().catch(() => ({}));
  const nextReq = new Request(ctx.request.url, {
    method: "POST",
    headers: ctx.request.headers,
    body: JSON.stringify({ ...req, action: "withdraw" })
  });
  return mod.onRequestPost({ ...ctx, request: nextReq });
}
