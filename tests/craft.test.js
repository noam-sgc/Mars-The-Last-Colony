const test = require("node:test"), assert = require("node:assert"), fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "..", "js", "craft.js"), "utf8");
const { craftName, CRAFT } = new Function(src.slice(src.indexOf("const CRAFT"), src.indexOf("const POI_NAMES")) + ";return {craftName,CRAFT}")();
test("rovers: nomes reais de Marte primeiro, depois repete com número", () => {
  assert.deepEqual(CRAFT.rover.slice(0, 5), ["Sojourner", "Spirit", "Opportunity", "Curiosity", "Perseverance"]);
  assert.equal(craftName("rover", 0), "Sojourner"); assert.equal(craftName("rover", 4), "Perseverance");
  assert.equal(craftName("rover", 5), "2º Sojourner"); assert.equal(craftName("rover", 11), "3º Spirit");
});
test("sondas: nomes reais e repetição numerada", () => { assert.equal(craftName("probe", 0), "Mariner 4"); assert.equal(craftName("probe", CRAFT.probe.length), "2º Mariner 4"); });
test("Phobos-1: 15 fases separadas no catálogo, 60 no total", () => {
  const d = fs.readFileSync(path.join(__dirname, "..", "js", "data.js"), "utf8");
  assert.match(d, /P1_START = 45/); const m = d.match(/const PHOBOS = \[([\s\S]*?)\n\];/); assert.ok(m);
  assert.equal((m[1].match(/^\s*\["/gm) || []).length, 15);
});
