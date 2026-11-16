const test = require("node:test"), assert = require("node:assert"), fs = require("fs"), path = require("path");
const { FACTS, QUIZ } = new Function(fs.readFileSync(path.join(__dirname, "..", "js", "nasa.js"), "utf8") + ";return {FACTS,QUIZ}")();
test("quiz: perguntas bem formadas, sem repetição", () => {
  assert.ok(QUIZ.length >= 50);
  QUIZ.forEach((q, i) => { assert.equal(q[1].length, 4, "opções #" + i); assert.ok(q[2] >= 0 && q[2] < 4); assert.equal(new Set(q[1]).size, 4, "opções repetidas #" + i); assert.ok(q[3].length > 5); });
  assert.equal(new Set(QUIZ.map((q) => q[0])).size, QUIZ.length);
});
test("fatos: título e texto presentes, sem repetição", () => {
  assert.ok(FACTS.length >= 40); FACTS.forEach((f) => assert.ok(f[0] && f[1].length > 40)); assert.equal(new Set(FACTS.map((f) => f[0])).size, FACTS.length);
});
