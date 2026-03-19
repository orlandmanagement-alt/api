import { onRequestPost as basePost } from "./project_applications.js";

export async function onRequestPost(ctx){
  const body = await ctx.request.clone().json().catch(() => ({}));
  const nextReq = new Request(ctx.request.url, {
    method: "POST", headers: ctx.request.headers,
    body: JSON.stringify({ ...body, action: "withdraw" })
  });
  return basePost({ ...ctx, request: nextReq });
}
