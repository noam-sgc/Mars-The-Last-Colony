const test = require("node:test"), assert = require("node:assert"), fs = require("fs"), path = require("path");
const { FACTS, QUIZ, FONTE } = new Function(fs.readFileSync(path.join(__dirname, "..", "js", "espaco.js"), "utf8") + ";return {FACTS,QUIZ,FONTE}")();
test("fonte aparece só como referência: nenhum texto de pergunta/fato cita a agência", () => {
  const body = JSON.stringify([FACTS, QUIZ]); assert.ok(!/NASA/i.test(body));
  assert.match(FONTE, /NASA/);
});
test("quiz: perguntas bem formadas, sem repetição", () => {
  assert.ok(QUIZ.length >= 50);
  QUIZ.forEach((q, i) => { assert.equal(q[1].length, 4, "opções #" + i); assert.ok(q[2] >= 0 && q[2] < 4); assert.equal(new Set(q[1]).size, 4, "opções repetidas #" + i); assert.ok(q[3].length > 5); });
  assert.equal(new Set(QUIZ.map((q) => q[0])).size, QUIZ.length);
});
test("fatos: título e texto presentes, sem repetição", () => {
  assert.ok(FACTS.length >= 40); FACTS.forEach((f) => assert.ok(f[0] && f[1].length > 40)); assert.equal(new Set(FACTS.map((f) => f[0])).size, FACTS.length);
});

test("Ultra Learn Voyage: 10 capítulos com briefing, 4 perguntas bem formadas, controles e evento com decisão correta", () => {
  const ULV = new Function("esc", fs.readFileSync(path.join(__dirname, "..", "js", "ulv-data.js"), "utf8") + ";return ULV")();
  assert.equal(ULV.length, 10);
  ULV.forEach((c) => {
    assert.ok(c.brief.length >= 4 && c.controls.length >= 2 && typeof c.run === "function");
    assert.equal(c.quiz.length, 4); c.quiz.forEach((q) => { assert.equal(q[1].length, 4); assert.ok(q[2] >= 0 && q[2] < 4); assert.ok(q[3].length > 10); });
    assert.ok(c.event.opts.some((o) => o[1] >= 10) && c.event.opts.length === 3);
    assert.ok(!/NASA/i.test(JSON.stringify([c.brief, c.quiz, c.event, c.title])), "agência só como fonte");
  });
});
