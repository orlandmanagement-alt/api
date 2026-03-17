import { nowSec, normEmail, randomB64, pbkdf2Hash, sha256Base64 } from "../../_lib.js";
import { createTalentInviteRegistration, markInviteUsed, ensureTalentProfileSeedRow } from "../../repos/talent_repo.js";

async function ensureRole(env, name){
  let r = await env.DB.prepare(`
    SELECT id FROM roles WHERE name=? LIMIT 1
  `).bind(name).first();

  if(r) return r.id;

  const id = "role_" + String(name || "talent");
  await env.DB.prepare(`
    INSERT OR IGNORE INTO roles (id,name,created_at) VALUES (?,?,?)
  `).bind(id, name, nowSec()).run();

  return id;
}

export async function registerTalentFromInvite(env, body){
  const token = String(body.token || "").trim();
  const email = normEmail(body.email);
  const password = String(body.password || "");
  const display_name = String(body.display_name || "").trim() || "Talent";

  if(!token) return { error: "missing_token", status: 400 };
  if(!email.includes("@") || password.length < 10) return { error: "email/password", status: 400 };

  const now = nowSec();
  const pepper = env.HASH_PEPPER || "";
  const email_hash = await sha256Base64(email + "|" + pepper);
  const token_hash = await sha256Base64(token + "|" + (pepper || "pepper"));

  const inv = await env.DB.prepare(`
    SELECT id,role,expires_at,used_at
    FROM invites
    WHERE id=? AND email_hash=? AND role='talent'
    LIMIT 1
  `).bind(token_hash, email_hash).first();

  if(!inv) return { error: "invite_invalid", status: 403 };
  if(inv.used_at) return { error: "invite_used", status: 409 };
  if(now > Number(inv.expires_at || 0)) return { error: "invite_expired", status: 403 };

  const used = await env.DB.prepare(`
    SELECT id FROM users WHERE email_norm=? LIMIT 1
  `).bind(email).first();

  if(used) return { error: "email_used", status: 409 };

  const role_id = await ensureRole(env, "talent");
  const user_id = crypto.randomUUID();
  const salt = randomB64(16);
  const iter = 100000;
  const hash = await pbkdf2Hash(password, salt, iter);

  await createTalentInviteRegistration(env, {
    user_id,
    email_norm: email,
    email_hash,
    display_name,
    password_hash: hash,
    password_salt: salt,
    password_iter: iter,
    now
  });

  await env.DB.prepare(`
    INSERT INTO user_roles (user_id,role_id,created_at) VALUES (?,?,?)
  `).bind(user_id, role_id, now).run();

  await markInviteUsed(env, now, user_id, token_hash);

  const chk = await env.DB.prepare(`
    SELECT name FROM sqlite_master WHERE type='table' AND name='talent_profiles' LIMIT 1
  `).first();

  if(chk){
    await ensureTalentProfileSeedRow(env, user_id, display_name, now);
  }

  return {
    created: true,
    user_id
  };
}
