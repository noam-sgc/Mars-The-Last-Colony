/* Redefinição de senha por e-mail (sem servidor de jogo: usa o mesmo cofre do mural, em registros "rst:" que NUNCA saem na API pública).
   - setemail: guarda o e-mail da conta (criptografado) depois de conferir a senha atual.
   - request: gera um link único (30 min) e envia por e-mail; devolve um segredo de consulta só para a aba que pediu.
   - confirm (GET, abre pelo link do e-mail): marca como verificado. A aba que pediu detecta e abre "Redefinir senha".
   - poll / set: a aba original recebe uma permissão de uso único e envia o novo hash PBKDF2 (nunca a senha em texto).
   Envio: RESEND_API_KEY (+ MAIL_FROM) ou SMTP (SMTP_USER, SMTP_PASS, SMTP_HOST opcional; Gmail com senha de app funciona). */
const crypto = require("crypto");
const Bul = require("../shared/bulletin.js");
const { store } = require("./_store.js");

const sha = (x) => crypto.createHash("sha256").update(String(x)).digest("hex");
const rnd = (n) => crypto.randomBytes(n).toString("hex");
const SECRET = () => process.env.MARS_SECRET || process.env.BLOB_READ_WRITE_TOKEN || process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "mars-dev-secret";
const KEY = () => crypto.createHash("sha256").update("mars-mail|" + SECRET()).digest();
const enc = (t) => { const iv = crypto.randomBytes(12), c = crypto.createCipheriv("aes-256-gcm", KEY(), iv), ct = Buffer.concat([c.update(String(t), "utf8"), c.final()]); return { iv: iv.toString("hex"), ct: ct.toString("hex"), tag: c.getAuthTag().toString("hex") }; };
const dec = (o) => { const d = crypto.createDecipheriv("aes-256-gcm", KEY(), Buffer.from(o.iv, "hex")); d.setAuthTag(Buffer.from(o.tag, "hex")); return Buffer.concat([d.update(Buffer.from(o.ct, "hex")), d.final()]).toString("utf8"); };
const mask = (e) => { const [u, d] = e.split("@"); return u.slice(0, 1) + "***@" + d; };
const send = (res, code, obj) => { res.statusCode = code; res.setHeader("Content-Type", "application/json"); res.setHeader("Cache-Control", "no-store"); res.end(JSON.stringify(obj)); };
const html = (res, code, body) => { res.statusCode = code; res.setHeader("Content-Type", "text/html; charset=utf-8"); res.setHeader("Cache-Control", "no-store"); res.end(body); };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => "&#" + c.charCodeAt(0) + ";");

/** Confere a senha digitada contra o hash PBKDF2 "p1:iter:salt:hash" (mesmo formato do jogo). */
function verifyPw(pw, h) {
  const [v, it, salt, want] = String(h).split(":"); if (v !== "p1" || !salt || !want || !(+it > 0) || +it > 600000) return false;
  const got = crypto.pbkdf2Sync(String(pw), Buffer.from(salt, "hex"), +it, 32, "sha256").toString("hex");
  return got.length === want.length && crypto.timingSafeEqual(Buffer.from(got), Buffer.from(want));
}
async function sendMail(to, subject, text, htmlBody) {
  const from = process.env.MAIL_FROM || (process.env.SMTP_USER ? `Mars Colony <${process.env.SMTP_USER}>` : "Mars Colony <onboarding@resend.dev>");
  if (process.env.RESEND_API_KEY) {
    const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: "Bearer " + process.env.RESEND_API_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ from, to: [to], subject, text, html: htmlBody }) });
    if (!r.ok) throw new Error("resend " + r.status); return { sent: true };
  }
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    const nm = require("nodemailer"), t = nm.createTransport({ host: process.env.SMTP_HOST || "smtp.gmail.com", port: +(process.env.SMTP_PORT || 465), secure: (process.env.SMTP_PORT || "465") === "465", auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
    await t.sendMail({ from, to, subject, text, html: htmlBody }); return { sent: true };
  }
  if (process.env.MARS_DEV_MAIL) return { sent: false, dev: true };
  const e = new Error("mail-not-configured"); e.code = "NOMAIL"; throw e;
}

const get = async (d, f) => { const r = (await d.get([f]))[0]; return r && r.it ? r.it : null; };
const put = (d, f, it, at) => d.set([{ f, at: at || Date.now(), it: Object.assign({ k: "rst" }, it) }]);
const accountOf = async (d, name) => { const k = require("../shared/rules.js").key(name), row = (await d.get(["acct:" + k]))[0]; return row && row.it && row.it.d ? { k, d: row.it.d } : null; };

module.exports = async (req, res) => {
  const d = store(); if (!d) return send(res, 503, { ok: false, err: "Armazenamento não configurado" });
  try {
    const url = new URL(req.url, "http://x"); let b = req.body; if (typeof b === "string") { try { b = JSON.parse(b); } catch (e) { b = {}; } } b = b || {};
    const op = req.method === "GET" ? url.searchParams.get("op") : b.op, now = Date.now();
    const base = process.env.SITE_URL || (req.headers && req.headers.host ? (/localhost|127\./.test(req.headers.host) ? "http://" : "https://") + req.headers.host : "");

    if (op === "confirm" && req.method === "GET") {   // link do e-mail
      const t = String(url.searchParams.get("t") || ""), ix = t.length === 48 ? await get(d, "rst:tok:" + sha(t)) : null, rq = ix ? await get(d, "rst:req:" + ix.id) : null;
      const page = (ok, msg) => html(res, ok ? 200 : 400, `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Redefinir senha</title><body style="font-family:system-ui;background:#1a0f0a;color:#fde8d8;display:grid;place-items:center;height:100vh;margin:0"><div style="max-width:420px;text-align:center;padding:24px"><div style="font-size:54px">${ok ? "✅" : "⚠️"}</div><h2>${esc(msg)}</h2>${ok ? "<p>Volte para a <b>aba do jogo</b> em que você pediu a redefinição: a tela <b>Redefinir senha</b> já abriu lá.</p><p style='opacity:.7'>Você pode fechar esta aba.</p>" : "<p>Peça um novo e-mail de redefinição no jogo.</p>"}</div><script>${ok ? "setTimeout(function(){try{window.close()}catch(e){}},1500)" : ""}</script>`);
      if (!rq || rq.exp < now || rq.state === "used") return page(false, "Link expirado ou já usado");
      if (rq.state === "pending") await put(d, "rst:req:" + ix.id, Object.assign({}, rq, { state: "verified" }));
      return page(true, "E-mail verificado!");
    }
    if (req.method !== "POST") return send(res, 405, { ok: false });

    if (op === "setemail") {
      const email = String(b.email || "").trim().toLowerCase(), acc = await accountOf(d, b.u);
      if (!/^[^\s@]{1,64}@[^\s@]{1,200}\.[^\s@]{2,}$/.test(email) || email.length > 120) return send(res, 200, { ok: false, err: "E-mail inválido" });
      if (!acc || !verifyPw(b.p, acc.d.pass)) return send(res, 200, { ok: false, err: "Usuário ou senha incorretos" });
      await put(d, "rst:mail:" + acc.k, { e: enc(email) }); return send(res, 200, { ok: true, hint: mask(email) });
    }
    if (op === "request") {
      const acc = await accountOf(d, b.u); if (!acc) return send(res, 200, { ok: false, err: "Usuário não encontrado" });
      const mr = await get(d, "rst:mail:" + acc.k); if (!mr) return send(res, 200, { ok: false, err: "noemail" });
      const rl = await get(d, "rst:rl:" + acc.k); if (rl && now - rl.t < 45000) return send(res, 200, { ok: false, err: "Aguarde um minuto antes de pedir outro e-mail." });
      const email = dec(mr.e), token = rnd(24), secret = rnd(16), id = rnd(8);
      await put(d, "rst:req:" + id, { u: acc.k, name: acc.d.name, tokH: sha(token), secH: sha(secret), exp: now + 30 * 60000, state: "pending" });
      await put(d, "rst:tok:" + sha(token), { id }); await put(d, "rst:rl:" + acc.k, { t: now });
      const link = `${base}/api/reset?op=confirm&t=${token}`;
      const text = `Olá, ${acc.d.name}!\n\nRecebemos um pedido para redefinir a senha da sua conta no Mars: The Last Colony.\nAbra o link (vale por 30 minutos):\n${link}\n\nA tela de redefinição abrirá na aba do jogo onde você pediu. Se não foi você, ignore este e-mail: nada muda.`;
      const out = await sendMail(email, "Redefinir senha — Mars: The Last Colony", text, `<div style="font-family:system-ui"><h2>Redefinir senha</h2><p>Olá, <b>${esc(acc.d.name)}</b>! Recebemos um pedido para redefinir a senha da sua conta no <b>Mars: The Last Colony</b>.</p><p><a href="${esc(link)}" style="background:#ff6a2b;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:700">Redefinir minha senha</a></p><p style="color:#666">O link vale por 30 minutos. A tela de redefinição abre na aba do jogo onde você pediu. Se não foi você, ignore este e-mail.</p></div>`);
      return send(res, 200, Object.assign({ ok: true, id, secret, hint: mask(email), sent: !!out.sent }, out.dev && process.env.MARS_DEV_MAIL ? { devLink: link } : {}));
    }
    if (op === "poll") {
      const rq = await get(d, "rst:req:" + String(b.id || "")); if (!rq || sha(b.secret || "") !== rq.secH) return send(res, 200, { ok: false, state: "none" });
      if (rq.exp < now) return send(res, 200, { ok: true, state: "expired" }); if (rq.state === "used") return send(res, 200, { ok: true, state: "used" });
      if (rq.state === "pending") return send(res, 200, { ok: true, state: "pending" });
      const ticket = rnd(16); await put(d, "rst:req:" + b.id, Object.assign({}, rq, { state: "ready", tkH: sha(ticket) })); return send(res, 200, { ok: true, state: "verified", ticket, name: rq.name });
    }
    if (op === "set") {
      const rq = await get(d, "rst:req:" + String(b.id || "")), pass = String(b.pass || "");
      if (!rq || rq.state !== "ready" || rq.exp < now || sha(b.ticket || "") !== rq.tkH) return send(res, 200, { ok: false, err: "Pedido inválido ou expirado. Peça um novo e-mail." });
      const m = /^p1:(\d+):[0-9a-f]{16,64}:[0-9a-f]{64}$/.exec(pass); if (!m || +m[1] < 50000 || +m[1] > 600000) return send(res, 200, { ok: false, err: "Senha inválida" });
      const acc = await accountOf(d, rq.name); if (!acc) return send(res, 200, { ok: false, err: "Conta não encontrada" });
      const it = { k: "acct", id: acc.k, ts: now, d: { name: acc.d.name, cc: acc.d.cc, pass, created: acc.d.created, pwts: now } };
      await d.set([{ f: "acct:" + acc.k, at: now, it }]); await put(d, "rst:req:" + b.id, Object.assign({}, rq, { state: "used" }));
      return send(res, 200, { ok: true, name: acc.d.name });
    }
    return send(res, 400, { ok: false, err: "Operação desconhecida" });
  } catch (e) {
    if (e && e.code === "NOMAIL") return send(res, 200, { ok: false, err: "nomail" });
    return send(res, 500, { ok: false, err: "Erro ao processar" });
  }
};
