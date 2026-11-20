const test = require("node:test"), assert = require("node:assert");
const Bul = require("../shared/bulletin.js"), api = require("../api/bul.js");
test("sav: progresso da conta, o mais novo vence", () => {
  const st = Bul.newStore(), mk = (ts, cr) => ({ k: "sav", id: "bob", by: "Bob", ts, d: { p: { cr }, s: {} } });
  assert.ok(Bul.merge(st, mk(5, 1))); assert.ok(!Bul.merge(st, mk(3, 9))); assert.ok(Bul.merge(st, mk(9, 7))); assert.equal(st.sav.bob.d.p.cr, 7);
  assert.ok(!Bul.valid({ k: "sav", id: "alice", by: "Bob", ts: 1, d: { p: {}, s: {} } }));   // id precisa ser a conta de quem publica
  assert.ok(!Bul.valid({ k: "sav", id: "bob", by: "Bob", ts: 1, del: true }));
});
test("API /api/bul (memória): salva e devolve itens válidos, ignora inválidos", async () => {
  const call = (method, body, url) => new Promise((res) => { const r = { setHeader() {}, end(t) { res(JSON.parse(t)); } }; api({ method, body, url: url || "/api/bul" }, r); });
  const ok = await call("POST", { items: [{ k: "sav", id: "zed", by: "Zed", ts: 5, d: { p: {}, s: {} } }, { k: "acct", id: "x", ts: 1, d: {} }] });
  assert.equal(ok.saved, 1); const g = await call("GET"); assert.ok(g.items.some((i) => i.id === "zed")); assert.ok(!g.items.some((i) => i.k === "acct"));
});
