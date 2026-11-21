const test = require("node:test"), assert = require("node:assert"), crypto = require("node:crypto");
const bul = require("../api/bul.js"), reset = require("../api/reset.js"), Bul = require("../shared/bulletin.js");
const hashPw = (pw) => { const salt = crypto.randomBytes(16).toString("hex"); return `p1:150000:${salt}:` + crypto.pbkdf2Sync(pw, Buffer.from(salt, "hex"), 150000, 32, "sha256").toString("hex"); };
const call = (fn, method, body, url) => new Promise((res) => { const r = { setHeader() {}, end: (t) => res({ code: r.statusCode, body: t }) }; fn({ method, body, url: url || "/x", headers: { host: "localhost:8080" } }, r); });
const json = async (fn, body) => JSON.parse((await call(fn, "POST", body)).body);
test("redefinir senha: e-mail guardado só criptografado, link único, nova senha vale, e-mail/segredos não vazam", async () => {
  process.env.MARS_DEV_MAIL = "1";
  const created = Date.now() - 1000, old = hashPw("senhaantiga"), acct = (pass, extra) => ({ k: "acct", id: "maria", ts: created, d: Object.assign({ name: "Maria", cc: "BR", pass, created }, extra || {}) });
  assert.equal(JSON.parse((await call(bul, "POST", { items: [acct(old)] }, "/api/bul")).body).saved, 1);
  // cliente não pode postar pwts (sequestro de conta)
  assert.equal(JSON.parse((await call(bul, "POST", { items: [acct(hashPw("hacker"), { pwts: Date.now() })] }, "/api/bul")).body).saved, 0);
  assert.equal((await json(reset, { op: "setemail", u: "Maria", p: "errada", email: "maria@exemplo.com" })).ok, false);
  assert.equal((await json(reset, { op: "request", u: "Maria" })).err, "noemail");
  assert.ok((await json(reset, { op: "setemail", u: "Maria", p: "senhaantiga", email: "Maria@Exemplo.com" })).ok);
  const rq = await json(reset, { op: "request", u: "Maria" }); assert.ok(rq.ok && rq.devLink && rq.hint === "m***@exemplo.com");
  assert.equal((await json(reset, { op: "request", u: "Maria" })).ok, false, "limite de pedidos");
  assert.equal((await json(reset, { op: "poll", id: rq.id, secret: "x" })).state, "none");
  assert.equal((await json(reset, { op: "poll", id: rq.id, secret: rq.secret })).state, "pending");
  const t = new URL(rq.devLink).searchParams.get("t"); const c = await call(reset, "GET", null, "/api/reset?op=confirm&t=" + t); assert.equal(c.code, 200);
  const pl = await json(reset, { op: "poll", id: rq.id, secret: rq.secret }); assert.equal(pl.state, "verified"); assert.ok(pl.ticket);
  assert.equal((await json(reset, { op: "set", id: rq.id, ticket: "errado", pass: hashPw("nova") })).ok, false);
  const nova = hashPw("senhanova"); assert.ok((await json(reset, { op: "set", id: rq.id, ticket: pl.ticket, pass: nova })).ok);
  assert.equal((await json(reset, { op: "set", id: rq.id, ticket: pl.ticket, pass: hashPw("outra") })).ok, false, "uso único");
  const items = JSON.parse((await call(bul, "GET", null, "/api/bul")).body).items, a = items.find((i) => i.k === "acct" && i.id === "maria");
  assert.equal(a.d.pass, nova); assert.ok(a.d.pwts > 0); assert.ok(!items.some((i) => i.k === "rst"), "nada de rst: na API pública");
  assert.ok(!JSON.stringify(items).includes("exemplo.com"));
  // clientes: só a nuvem (trusted) troca o hash; gossip não
  const st = Bul.newStore(); Bul.merge(st, acct(old));
  assert.ok(!Bul.merge(st, a, false), "par não pode trocar"); assert.equal(st.acct.maria.d.pass, old);
  assert.ok(Bul.merge(st, a, true), "nuvem troca"); assert.equal(st.acct.maria.d.pass, nova);
  assert.ok(!Bul.merge(st, acct(old), true), "hash antigo não volta"); assert.ok(!Bul.merge(st, acct(hashPw("x"), { pwts: 1 }), true), "pwts menor ignorado");
});
