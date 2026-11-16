const test = require("node:test"), assert = require("node:assert");
const R = require("../shared/rules.js"), { Hub } = require("../shared/hub.js");
const hash = async (p) => "h" + p, verify = async (p, h) => h === "h" + p;
const mk = () => new Hub({ store: {}, hash, verify });
function client(hub) {
  const log = []; let rid = 0, pend = {};
  const c = hub.connect((m) => { if (m.t === "res" && pend[m.rid]) { pend[m.rid](m); delete pend[m.rid]; } else log.push(m); });
  return { c, log, ask: (m) => new Promise((r) => { m.rid = ++rid; pend[rid] = r; hub.handle(c, m); }) };
}
test("papéis: só 3 admins e 2 desenhistas", () => {
  assert.deepEqual(R.ADMINS, ["ADMVinnil", "ADMKezle", "ADMLefaar"]);
  assert.ok(R.isAdmin("admvinnil") && R.isAdmin("ADMLefaar") && R.isArtist("ADMVinnil") && R.isArtist("ADMKezle") && !R.isArtist("ADMLefaar"));
  assert.equal(R.roleOf("Joao"), "user");
});
test("eventos: x5 em 1/fev, 11/abr, 12/jun; x2 em feriados e fins de semana", () => {
  assert.equal(R.multiplier(new Date(2027, 1, 1)), 5); assert.equal(R.multiplier(new Date(2027, 3, 11)), 5); assert.equal(R.multiplier(new Date(2027, 5, 12)), 5);
  assert.equal(R.multiplier(new Date(2026, 11, 25)), 2);   // Natal
  assert.equal(R.multiplier(new Date(2026, 10, 14)), 2);   // sábado
  assert.equal(R.multiplier(new Date(2026, 10, 18)), 1);   // quarta comum
  assert.ok(R.activeEvents(new Date(2026, 10, 14))[0].suit.id.startsWith("ev_"));
});
test("registro, login, nomes reservados e países", async () => {
  const h = mk(), a = client(h);
  assert.equal((await a.ask({ t: "reg", u: "ADMKezle", p: "secret1", c: "BR" })).ok, false);
  assert.equal((await a.ask({ t: "reg", u: "ADMFalso", p: "secret1", c: "BR" })).ok, false);
  assert.equal((await a.ask({ t: "reg", u: "Joao", p: "123", c: "BR" })).ok, false);
  assert.equal((await a.ask({ t: "reg", u: "Joao", p: "secret1", c: "XX" })).ok, false);
  const r = await a.ask({ t: "reg", u: "Joao", p: "secret1", c: "PT" });
  assert.ok(r.ok && r.me.cc === "PT" && r.me.role === "user" && !r.me.vf);
  const b = client(h); assert.equal((await b.ask({ t: "login", u: "joao", p: "errada" })).ok, false);
  assert.ok((await b.ask({ t: "login", u: "joao", p: "secret1" })).ok);
  assert.ok((await client(h).ask({ t: "resume", token: r.token })).ok);
});
test("admin: mensagem global e eventos; usuário comum é recusado", async () => {
  const h = mk(); await h.ensureAdmins({ ADMVinnil: "pw-vinnil", ADMKezle: "pw-kezle", ADMLefaar: "pw-lefaar" });
  const u = client(h), adm = client(h);
  await u.ask({ t: "reg", u: "Maria", p: "secret1", c: "BR" }); await adm.ask({ t: "login", u: "ADMVinnil", p: "pw-vinnil" });
  assert.equal((await u.ask({ t: "adm.msg", text: "oi" })).ok, false);
  assert.ok((await adm.ask({ t: "adm.msg", text: "Manutenção às 20h" })).ok);
  assert.ok(u.log.some((m) => m.t === "gmsg" && m.text.includes("Manutenção")));
  assert.equal((await u.ask({ t: "adm.ev.add", ev: { name: "X", start: 1, end: 2 } })).ok, false);
  assert.ok((await adm.ask({ t: "adm.ev.add", ev: { name: "Evento ADM", start: Date.now() - 1000, end: Date.now() + 1e6, mult: 3 } })).ok);
  assert.ok(u.log.some((m) => m.t === "events" && m.events.length === 1));
});
test("catálogo: só ADMVinnil/ADMKezle publicam; ADMLefaar (admin) não", async () => {
  const h = mk(); await h.ensureAdmins({ ADMVinnil: "a1a1a1", ADMKezle: "b2b2b2", ADMLefaar: "c3c3c3" });
  const v = client(h), k = client(h), u = client(h), l = client(h);
  await v.ask({ t: "login", u: "ADMVinnil", p: "a1a1a1" }); await k.ask({ t: "login", u: "ADMKezle", p: "b2b2b2" }); await l.ask({ t: "login", u: "ADMLefaar", p: "c3c3c3" }); await u.ask({ t: "reg", u: "Zeca", p: "secret1", c: "BR" });
  const item = { n: "Traje Aurora", l: "s", c: 300, col: "#33ccff" };
  assert.equal((await l.ask({ t: "cat.pub", kind: "cos", item })).ok, false);
  assert.ok((await l.ask({ t: "adm.msg", text: "admin sem estúdio" })).ok);
  assert.ok((await v.ask({ t: "cat.pub", kind: "cos", item })).ok);
  assert.equal((await u.ask({ t: "cat.pub", kind: "cos", item })).ok, false);
  const r = await k.ask({ t: "cat.pub", kind: "cos", item }); assert.ok(r.ok);
  assert.ok((await k.ask({ t: "cat.pub", kind: "part", item: { n: "Torre", shape: "tower", k: "oxy" } })).ok);
  assert.ok((await k.ask({ t: "cat.pub", kind: "up", item: { n: "Super", pm: { eff: 0.2 } } })).ok);
  assert.ok(u.log.some((m) => m.t === "cat" && m.catalog.cos.length >= 1));
});
test("amigos: pedido, aceite e selo de verificado (amigo de admin)", async () => {
  const h = mk(); await h.ensureAdmins({ ADMVinnil: "a1a1a1", ADMKezle: "b2b2b2", ADMLefaar: "c3c3c3" });
  const a = client(h), v = client(h); await a.ask({ t: "reg", u: "Ana", p: "secret1", c: "BR" }); await v.ask({ t: "login", u: "ADMVinnil", p: "a1a1a1" });
  let us = (await a.ask({ t: "users" })).users; assert.ok(us.length === 4 && us.find((x) => x.u === "ADMVinnil").vf && !us.find((x) => x.u === "Ana").vf);
  await a.ask({ t: "fr", op: "add", u: "ADMVinnil" }); await v.ask({ t: "fr", op: "acc", u: "Ana" });
  us = (await v.ask({ t: "users" })).users; assert.ok(us.find((x) => x.u === "Ana").vf, "amigo de admin é verificado");
  await v.ask({ t: "fr", op: "rm", u: "Ana" }); us = (await v.ask({ t: "users" })).users; assert.ok(!us.find((x) => x.u === "Ana").vf);
});
test("chat global, DM, grupo e sala", async () => {
  const h = mk(), a = client(h), b = client(h);
  await a.ask({ t: "reg", u: "Ana", p: "secret1", c: "BR" }); await b.ask({ t: "reg", u: "Beto", p: "secret1", c: "AR" });
  assert.ok((await a.ask({ t: "chat", ch: "global", m: "olá <b>mundo</b>" })).ok);
  assert.ok(b.log.some((m) => m.t === "chat" && m.ch === "global" && !m.m.includes("<")));
  await new Promise((r) => setTimeout(r, 650));
  assert.ok((await a.ask({ t: "chat", ch: "dm:Beto", m: "psiu" })).ok); assert.ok(b.log.some((m) => m.ch === "dm:Ana" && m.m === "psiu"));
  assert.ok((await a.ask({ t: "party", op: "inv", u: "Beto" })).ok); const inv = b.log.find((m) => m.t === "party.inv");
  assert.ok(inv); assert.ok((await b.ask({ t: "party", op: "acc", id: inv.id })).ok);
  await new Promise((r) => setTimeout(r, 650)); assert.ok((await a.ask({ t: "chat", ch: "party", m: "grupo!" })).ok);
  await a.ask({ t: "join", room: "g-AB12" }); await b.ask({ t: "join", room: "g-AB12" });
  await new Promise((r) => setTimeout(r, 650)); assert.ok((await b.ask({ t: "chat", ch: "room", m: "na sala" })).ok);
  assert.ok(a.log.some((m) => m.ch === "room" && m.m === "na sala"));
  assert.ok((await a.ask({ t: "party", op: "go", code: "AB12" })).ok); assert.ok(b.log.some((m) => m.t === "party.go" && m.code === "AB12"));
});
test("perfil: itens de admin são removidos de usuários comuns", async () => {
  const h = mk(), a = client(h); await a.ask({ t: "reg", u: "Ana", p: "secret1", c: "BR" });
  await a.ask({ t: "prof", data: { p: { own: ["s0", "adm_s1"], eq: { s: "adm_s1", p: "p0", w: "w0" }, cr: 10 }, s: { coins: 99 } } });
  const b = client(h), r = await b.ask({ t: "login", u: "Ana", p: "secret1" });
  assert.deepEqual(r.prof.p.own, ["s0"]); assert.equal(r.prof.p.eq.s, "s0"); assert.equal(r.prof.p.cr, 10);
});

test("modo sem servidor: contas ADM vêm de hashes de configuração e só entram com a senha certa", async () => {
  const h = mk(); h.setAdminHashes({ ADMVinnil: "hvinnil", ADMKezle: "hkezle", ADMLefaar: "hlefaar" });
  const a = client(h); assert.equal((await a.ask({ t: "login", u: "ADMKezle", p: "errada" })).ok, false);
  const r = await a.ask({ t: "login", u: "ADMKezle", p: "kezle" }); assert.ok(r.ok && r.me.role === "artist");
  assert.equal((await client(h).ask({ t: "login", u: "ADMLefaar", p: "lefaar" })).me.role, "admin");
  h.setAdminHashes({ ADMKezle: "hnova" }); assert.equal((await client(h).ask({ t: "login", u: "ADMKezle", p: "kezle" })).ok, false);
  assert.ok((await client(h).ask({ t: "login", u: "ADMKezle", p: "nova" })).ok);
});
