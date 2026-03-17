import { nowSec, hasRole } from "../../_lib.js";
import { getTalentProfileRow, ensureTalentProfileSeedRow, updateTalentProfileRow } from "../../repos/talent_repo.js";

function normLoc(s){
  return String(s||"")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g,"")
    .replace(/\s+/g," ")
    .slice(0,80);
}

function toInt(v){
  if(v == null) return null;
  const n = parseInt(String(v), 10);
  return Number.isFinite(n) ? n : null;
}

function cleanCsv(arrOrStr){
  let arr = [];
  if(Array.isArray(arrOrStr)) arr = arrOrStr;
  else if(typeof arrOrStr === "string") arr = arrOrStr.split(",");
  return arr.map(x => String(x || "").trim().toLowerCase()).filter(Boolean).slice(0,40).join(",");
}

function calcProgressAndScore(p){
  const fields = [
    !!p.name,
    !!p.gender,
    !!p.dob,
    !!p.location,
    (p.height_cm != null && p.height_cm > 0),
    !!p.category_csv
  ];
  const filled = fields.filter(Boolean).length;
  const progress = Math.round((filled / fields.length) * 100);

  const vEmail = Number(p.verified_email||0) ? 1 : 0;
  const vPhone = Number(p.verified_phone||0) ? 1 : 0;
  const vId    = Number(p.verified_identity||0) ? 1 : 0;

  let score = progress * 80;
  score += vEmail ? 600 : 0;
  score += vPhone ? 600 : 0;
  score += vId ? 1200 : 0;
  score = Math.max(0, Math.min(10000, score));

  return { progress_pct: progress, score };
}

export async function getTalentProfile(env, auth){
  if(!hasRole(auth.roles, ["talent"])) {
    return { error: "talent_only", status: 403 };
  }

  const chk = await env.DB.prepare(`
    SELECT name FROM sqlite_master WHERE type='table' AND name='talent_profiles' LIMIT 1
  `).first();

  if(!chk) {
    return {
      error: "talent_profiles_missing",
      status: 500,
      hint: "paste db/talent_profiles.sql to D1 console"
    };
  }

  const profile = await getTalentProfileRow(env, auth.uid);
  return { profile: profile || null };
}

export async function putTalentProfile(env, auth, body){
  if(!hasRole(auth.roles, ["talent"])) {
    return { error: "talent_only", status: 403 };
  }

  const chk = await env.DB.prepare(`
    SELECT name FROM sqlite_master WHERE type='table' AND name='talent_profiles' LIMIT 1
  `).first();

  if(!chk) {
    return {
      error: "talent_profiles_missing",
      status: 500,
      hint: "paste db/talent_profiles.sql to D1 console"
    };
  }

  const now = nowSec();

  const dob = (body.dob != null) ? String(body.dob).trim().slice(0,10) : null;
  let age_years = null;
  if(dob && /^\d{4}-\d{2}-\d{2}$/.test(dob)){
    try{
      const y = parseInt(dob.slice(0,4), 10);
      const thisY = new Date().getUTCFullYear();
      age_years = Math.max(0, Math.min(120, thisY - y));
    }catch{}
  }

  const patch = {
    name: (body.name != null) ? String(body.name).trim().slice(0,80) : null,
    gender: (body.gender != null) ? String(body.gender).trim().slice(0,20) : null,
    dob,
    age_years,
    location: (body.location != null) ? String(body.location).trim().slice(0,80) : null,
    height_cm: (body.height_cm != null) ? Math.max(0, Math.min(300, toInt(body.height_cm) || 0)) : null,
    category_csv: (body.category != null) ? cleanCsv(body.category) : null
  };
  patch.location_norm = patch.location ? normLoc(patch.location) : null;

  const u = await env.DB.prepare(`
    SELECT display_name FROM users WHERE id = ? LIMIT 1
  `).bind(auth.uid).first();

  await ensureTalentProfileSeedRow(env, auth.uid, u?.display_name || null, now);

  const cur = await getTalentProfileRow(env, auth.uid);
  const merged = {
    ...(cur || {}),
    ...(Object.fromEntries(Object.entries(patch).filter(([,v]) => v !== null && v !== undefined)))
  };

  const { progress_pct, score } = calcProgressAndScore(merged);
  await updateTalentProfileRow(env, auth.uid, patch, score, progress_pct, now);

  return {
    updated: true,
    progress_pct,
    score
  };
}
