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
  assert.ok(R.isAdmin("admvinnil") && R.isAdmin("ADMLefaar") && !R.isArtist("ADMVinnil") && R.isArtist("ADMKezle") && R.isArtist("ADMLefaar"));
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
  assert.equal((await a.ask({ t: "reg", u: "ADMFalso", p: "secret1", c: "BR" })).ok, false);   // outros nomes ADM* continuam proibidos
  const adm = await a.ask({ t: "reg", u: "ADMKezle", p: "secret1", c: "BR" });                   // quem cria primeiro fica com o nome reservado
  assert.ok(adm.ok && adm.me.role === "artist");
  assert.equal((await client(h).ask({ t: "reg", u: "admkezle", p: "outra123", c: "BR" })).ok, false);
  assert.equal((await client(h).ask({ t: "login", u: "ADMKezle", p: "outra123" })).ok, false);
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
test("catálogo: só ADMKezle/ADMLefaar publicam; ADMVinnil (admin) não", async () => {
  const h = mk(); await h.ensureAdmins({ ADMVinnil: "a1a1a1", ADMKezle: "b2b2b2", ADMLefaar: "c3c3c3" });
  const v = client(h), k = client(h), u = client(h), l = client(h);
  await v.ask({ t: "login", u: "ADMVinnil", p: "a1a1a1" }); await k.ask({ t: "login", u: "ADMKezle", p: "b2b2b2" }); await l.ask({ t: "login", u: "ADMLefaar", p: "c3c3c3" }); await u.ask({ t: "reg", u: "Zeca", p: "secret1", c: "BR" });
  const item = { n: "Traje Aurora", l: "s", c: 300, col: "#33ccff" };
  assert.equal((await v.ask({ t: "cat.pub", kind: "cos", item })).ok, false);
  assert.ok((await v.ask({ t: "adm.msg", text: "admin sem estúdio" })).ok);
  assert.ok((await l.ask({ t: "cat.pub", kind: "cos", item })).ok);
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

test("estúdio: cosméticos de todas as camadas (inclui capacete e mochila) são aceitos", async () => {
  const h = mk(); await h.ensureAdmins({ ADMVinnil: "a1a1a1", ADMKezle: "b2b2b2", ADMLefaar: "c3c3c3" });
  const k = client(h); await k.ask({ t: "login", u: "ADMKezle", p: "b2b2b2" });
  for (const l of ["s", "p", "w", "h", "b", "qualquer"]) { const r = await k.ask({ t: "cat.pub", kind: "cos", item: { n: "Item " + l, l, c: 100, col: "#33ccff" } }); assert.ok(r.ok, "camada " + l); }
  assert.deepEqual(h.store.catalog.cos.map((c) => c.l), ["s", "p", "w", "h", "b", "s"]);
});

test("mural global: contas (a mais antiga vence), eventos só de admin, itens só de desenhista, mesclagem converge", () => {
  const B = require("../shared/bulletin.js"), a = B.newStore(), b = B.newStore();
  const acct = (n, created, pass) => ({ k: "acct", id: n.toLowerCase(), ts: created, d: { name: n, cc: "BR", pass: "p1:1000:aa:" + pass, created } });
  assert.ok(B.merge(a, acct("ADMKezle", 200, "bb")));
  assert.ok(B.merge(a, acct("ADMKezle", 100, "aa")), "conta mais antiga assume o nome");
  assert.ok(!B.merge(a, acct("ADMKezle", 300, "cc")), "mais nova é ignorada");
  assert.equal(a.acct.admkezle.d.pass, "p1:1000:aa:aa");
  assert.ok(!B.merge(a, acct("x", 1, "aa")), "nome inválido");
  const ev = (by, mult) => ({ k: "ev", id: "e1", by, ts: 10, d: { name: "Maratona", start: 1, end: 9, mult } });
  assert.ok(!B.merge(a, ev("Joao", 5)), "evento de não-admin recusado"); assert.ok(B.merge(a, ev("ADMVinnil", 5)));
  assert.ok(!B.merge(a, { k: "cos", id: "u_c_1", by: "ADMVinnil", ts: 1, d: { id: "u_c_1", n: "X" } }), "ADMVinnil não é desenhista");
  assert.ok(B.merge(a, { k: "cos", id: "u_c_1", by: "ADMLefaar", ts: 1, d: { id: "u_c_1", n: "X" } }));
  assert.ok(B.merge(a, { k: "ev", id: "e1", by: "ADMVinnil", ts: 20, del: true }), "tombstone mais novo remove"); assert.equal(B.live(a, "ev").length, 0);
  B.all(a).forEach((it) => B.merge(b, it)); assert.deepEqual(JSON.stringify(B.all(a).sort((x, y) => x.id < y.id ? -1 : 1)), JSON.stringify(B.all(b).sort((x, y) => x.id < y.id ? -1 : 1)));
  assert.ok(B.batches(Array.from({ length: 50 }, (_, i) => acct("User" + i, i, "aa")), 1500).length > 1);
});

test("hub: ações globais emitem itens para o mural e ingest aplica itens recebidos", async () => {
  const out = [], h = new Hub({ store: {}, hash, verify, onGlobal: (it) => out.push(it) }); await h.ensureAdmins({ ADMVinnil: "a1a1a1", ADMKezle: "b2b2b2", ADMLefaar: "c3c3c3" });
  const v = client(h), k = client(h), u = client(h); await v.ask({ t: "login", u: "ADMVinnil", p: "a1a1a1" }); await k.ask({ t: "login", u: "ADMKezle", p: "b2b2b2" });
  await v.ask({ t: "adm.msg", text: "Olá mundo" }); await v.ask({ t: "adm.ev.add", ev: { name: "Maratona", start: 1, end: 9e12, mult: 3 } }); await k.ask({ t: "cat.pub", kind: "cos", item: { n: "Traje", l: "s", c: 50, col: "#fff000" } });
  assert.deepEqual(out.map((x) => x.k), ["msg", "ev", "cos"]);
  const r = await u.ask({ t: "reg", u: "Nova1", p: "secret1", c: "BR" }); assert.ok(r.ok); assert.equal(out.pop().k, "acct");
  // outro mundo recebe os mesmos itens
  const h2 = new Hub({ store: {}, hash, verify }), c2 = client(h2); out.forEach((it) => h2.ingest(it)); h2.ingest({ k: "acct", id: "nova1", ts: 5, d: { name: "Nova1", cc: "BR", pass: "hx", created: 5 } });
  assert.equal(h2.store.events.length, 1); assert.equal(h2.store.catalog.cos.length, 1); assert.ok(h2.store.users.nova1);
  assert.ok(h2.ingest({ k: "ev", id: out[1].id, by: "ADMVinnil", ts: 99, del: true })); assert.equal(h2.store.events.length, 0);
});
