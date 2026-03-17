import { hasRole } from "../../_lib.js";
import { listClientUsers } from "../../repos/users_repo.js";

function b64e(s){
  const u = new TextEncoder().encode(String(s));
  let bin=""; for(const c of u) bin += String.fromCharCode(c);
  return btoa(bin).replaceAll("+","-").replaceAll("/","_").replaceAll("=","");
}

function b64d(s){
  s = String(s||"").replaceAll("-","+").replaceAll("_","/");
  while(s.length%4) s += "=";
  const bin = atob(s);
  const u8 = new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++) u8[i]=bin.charCodeAt(i);
  return new TextDecoder().decode(u8);
}

function parseCursor(cur){
  if(!cur) return null;
  try{
    const j = JSON.parse(b64d(cur));
    const created_at = Number(j.created_at||0);
    const id = String(j.id||"");
    if(!created_at || !id) return null;
    return { created_at, id };
  }catch{
    return null;
  }
}

function makeCursor(row){
  return b64e(JSON.stringify({
    created_at: Number(row.created_at || 0),
    id: String(row.id || "")
  }));
}

export async function listClientUsersService(env, auth, query){
  if(!hasRole(auth.roles, ["super_admin","admin","staff"])) return { error: "forbidden", status: 403 };

  const q = String(query.q || "").trim().toLowerCase();
  const limit = Math.max(1, Math.min(200, Number(query.limit || "50")));
  const cursor = parseCursor(query.cursor);

  const list = await listClientUsers(env, q, limit, cursor);
  const hasMore = list.length > limit;
  const page = hasMore ? list.slice(0, limit) : list;
  const next_cursor = hasMore ? makeCursor(page[page.length - 1]) : null;

  return { rows: page, next_cursor };
}
