export async function onRequestGet(){ 
  return new Response("metric,count\nAPI_Requests,Managed via Cloudflare Analytics", { status: 200, headers: { "content-type": "text/csv" } }); 
}
