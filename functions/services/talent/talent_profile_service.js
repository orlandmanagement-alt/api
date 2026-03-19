import { getTalentProfileRow, ensureTalentProfileSeedRow, updateTalentProfileRow } from "../../repos/talent_repo.js";

function nowSec() { return Math.floor(Date.now() / 1000); }
function normLoc(s) { return String(s||"").trim().toLowerCase().replace(/[^a-z0-9\s-]/g,"").replace(/\s+/g," ").slice(0,80); }
function toInt(v) { if(v == null) return null; const n = parseInt(String(v), 10); return Number.isFinite(n) ? n : null; }
function cleanCsv(arrOrStr) {
  let arr = Array.isArray(arrOrStr) ? arrOrStr : (typeof arrOrStr === "string" ? arrOrStr.split(",") : []);
  return arr.map(x => String(x || "").trim().toLowerCase()).filter(Boolean).slice(0,40).join(",");
}

function calcProgressAndScore(p) {
  const fields = [!!p.name, !!p.gender, !!p.dob, !!p.location, (p.height_cm != null && p.height_cm > 0), !!p.category_csv];
  const progress = Math.round((fields.filter(Boolean).length / fields.length) * 100);
  let score = progress * 80 + (p.verified_email ? 600 : 0) + (p.verified_phone ? 600 : 0) + (p.verified_identity ? 1200 : 0);
  return { progress_pct: progress, score: Math.max(0, Math.min(10000, score)) };
}

export async function getTalentProfileService(env, auth) {
  if(!auth.roles.includes('talent')) return { error: "talent_only", status: 403 };
  if(!env.DB_TALENT) return { error: "talent_profiles_missing", status: 500, hint: "DB_TALENT belum di-binding." };
  
  const profile = await getTalentProfileRow(env, auth.uid);
  return { profile: profile || null };
}

export async function putTalentProfileService(env, auth, body) {
  if(!auth.roles.includes('talent')) return { error: "talent_only", status: 403 };
  if(!env.DB_TALENT) return { error: "talent_profiles_missing", status: 500 };

  const now = nowSec();
  const dob = (body.dob != null) ? String(body.dob).trim().slice(0,10) : null;
  let age_years = null;
  if(dob && /^\d{4}-\d{2}-\d{2}$/.test(dob)){
    try { age_years = Math.max(0, Math.min(120, new Date().getUTCFullYear() - parseInt(dob.slice(0,4), 10))); } catch{}
  }

  const patch = {
    name: (body.name != null) ? String(body.name).trim().slice(0,80) : null,
    gender: (body.gender != null) ? String(body.gender).trim().slice(0,20) : null,
    dob, age_years,
    location: (body.location != null) ? String(body.location).trim().slice(0,80) : null,
    location_norm: (body.location != null) ? normLoc(body.location) : null,
    height_cm: (body.height_cm != null) ? Math.max(0, Math.min(300, toInt(body.height_cm) || 0)) : null,
    category_csv: (body.category != null) ? cleanCsv(body.category) : null
  };

  const u = await env.DB.prepare("SELECT full_name FROM users WHERE id = ? LIMIT 1").bind(auth.uid).first();
  await ensureTalentProfileSeedRow(env, auth.uid, u?.full_name || null, now);

  const cur = await getTalentProfileRow(env, auth.uid);
  const merged = { ...(cur || {}), ...(Object.fromEntries(Object.entries(patch).filter(([,v]) => v !== null && v !== undefined))) };
  const { progress_pct, score } = calcProgressAndScore(merged);

  await updateTalentProfileRow(env, auth.uid, patch, score, progress_pct, now);
  return { updated: true, progress_pct, score };
}
