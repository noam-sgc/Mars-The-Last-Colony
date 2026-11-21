const test = require("node:test"), assert = require("node:assert"), fs = require("node:fs"), path = require("node:path");
test("sprites separados da animação: manifesto e atlas consistentes", () => {
  const dir = path.join(__dirname, "..", "assets", "sprites"), man = JSON.parse(fs.readFileSync(path.join(dir, "manifest.json"), "utf8"));
  const want = { bodies: 8, heads: 5, hh: 6, hairs: 26, helmets: 15, packs: 13, gloves: 16, devices: 21, flags: 10 };
  for (const k of Object.keys(want)) { assert.equal(man[k].n, want[k], k); assert.equal(man[k].r.length, want[k], k); assert.ok(fs.statSync(path.join(dir, k + ".png")).size > 5000, k + ".png"); }
  const src = fs.readFileSync(path.join(__dirname, "..", "js", "art2d.js"), "utf8"), pre = [...src.matchAll(/pd: \[([-\d, ]+)\]/g)].map((m) => m[1].split(",").map(Number));
  assert.equal(pre.length, 10, "10 personagens da arte");
  const idx = ["bodies", "heads", "hairs", "helmets", "packs", "gloves", "flags", "devices", "hh"];
  pre.forEach((p) => p.forEach((v, i) => assert.ok(v >= -1 && v < man[idx[i]].n, "preset fora do atlas: " + idx[i] + "=" + v)));
});
test("aparência 2D: pd e v2 são validados no servidor", async () => {
  const { Hub } = require("../shared/hub.js"); const h = new Hub({ store: {}, hash: async (x) => "p1:150000:aa:" + x, verify: async () => true });
  const u = { name: "Zed" }, out = h.sanitizeProf(u, { p: { look: { v2: 1, pd: [3, 3, 15, -1, -1, 4, 5, -1, -1] } }, s: {} }); assert.equal(out.p.look.v2, 1); assert.deepEqual(out.p.look.pd, [3, 3, 15, -1, -1, 4, 5, -1, -1]);
  const bad = h.sanitizeProf(u, { p: { look: { v2: 9, pd: [999, "x", 1, 1, 1, 1, 1, 1, 1] } }, s: {} }); assert.equal(bad.p.look.v2, 0); assert.deepEqual(bad.p.look.pd, [0, 0, 1, 1, 1, 1, 1, 1, 1]);   // valores inválidos viram o padrão de cada posição
});
