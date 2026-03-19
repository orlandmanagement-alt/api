export async function onRequestGet(){ 
  return new Response("id,ip,reason\n1,192.168.0.1,Managed via Cloudflare WAF", { status: 200, headers: { "content-type": "text/csv" } }); 
}
