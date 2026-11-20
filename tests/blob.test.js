const test = require("node:test"), assert = require("node:assert"), path = require("node:path");
test("API com Vercel Blob (SDK simulado): grava, lê com since e mescla", async () => {
  const files = new Map(); let clock = 1000;
  const sdk = require.resolve("@vercel/blob"); require.cache[sdk] = { id: sdk, filename: sdk, loaded: true, exports: {
    put: async (p, body) => { files.set(p, { body, at: clock += 10 }); return { url: "https://blob.test/" + p, pathname: p }; },
    list: async ({ prefix }) => ({ blobs: [...files].filter(([p]) => p.startsWith(prefix)).map(([p, f]) => ({ pathname: p, url: "https://blob.test/" + p, uploadedAt: new Date(f.at).toISOString() })), hasMore: false }) } };
  const f0 = global.fetch; global.fetch = async (u) => { const p = decodeURIComponent(u.replace("https://blob.test/", "").split("?")[0]); const f = files.get(p); return { ok: !!f, json: async () => JSON.parse(f.body) }; };
  process.env.BLOB_READ_WRITE_TOKEN = "t"; delete process.env.KV_REST_API_URL; delete require.cache[require.resolve("../api/bul.js")];
  const api = require("../api/bul.js");
  const call = (method, body, url) => new Promise((res) => api({ method, body, url: url || "/api/bul" }, { setHeader() {}, end: (t) => res(JSON.parse(t)) }));
  const sav = (ts, cr) => ({ k: "sav", id: "bob", by: "Bob", ts, d: { p: { cr }, s: {} } });
  assert.equal((await call("POST", { items: [sav(5, 1)] })).saved, 1);
  assert.equal((await call("POST", { items: [sav(3, 9)] })).saved, 0);   // mais antigo não sobrescreve
  assert.equal((await call("POST", { items: [sav(9, 7)] })).saved, 1);
  const g = await call("GET"); assert.equal(g.items.length, 1); assert.equal(g.items[0].d.p.cr, 7);
  assert.equal((await call("GET", null, "/api/bul?since=" + g.now)).items.length, 0);
  global.fetch = f0; delete process.env.BLOB_READ_WRITE_TOKEN; delete require.cache[require.resolve("../api/bul.js")];
});
