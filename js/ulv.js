/* Ultra Learn Voyage — jornada de ciência e gestão de uma missão tripulada a Marte (modo separado da campanha original).
   Dentro da nave ou no departamento de ciências, cada capítulo mistura: briefing técnico → quiz temático → painel de gestão
   com números reais simplificados → evento de decisão. O conhecimento dos quizzes melhora a eficácia da gestão. */
let U = null, ulvRaf = 0, ulvTok = 0;
const ulvDefault = () => ({ V: { crew: 4, arch: "conj", sup: { o2: 300, h2o: 300, food: 300 }, dv: 0, dvF: 1, pow: 0, health: 100, morale: 100, rad: 0, data: 0, risk: 0, day: 0, loadLife: 6, payload: 0, sci: 1, propReady: 0, seed: Math.floor(Math.random() * 90000) + 1000 }, i: 0 });
const ulvData = () => { P.ulv = P.ulv && Array.isArray(P.ulv.best) ? P.ulv : { best: [], run: null, finished: 0 }; return P.ulv; };
const clone = (o) => JSON.parse(JSON.stringify(o));
const ulvRank = (avg) => (avg >= 85 ? "Comandante de Missão" : avg >= 70 ? "Diretor de Voo" : avg >= 50 ? "Engenheiro de Missão" : "Tripulante em treinamento");
const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\*(.+?)\*/g, "<i>$1</i>");

function ulvHome() {
  screen("ulv"); ulvData(); const run = P.ulv.run, el = $("#ulv"), best = P.ulv.best, done = best.filter((x) => x != null).length;
  el.innerHTML = `<div class="top"><button id="ubk">← Menu</button><h2>🚀 Ultra Learn Voyage</h2><span class="mu">${done}/${ULV.length} capítulos · melhor média: ${done ? Math.round(best.filter((x) => x != null).reduce((a, b) => a + b, 0) / done) : "—"}</span></div>
  <div class="pill w"><b>Comande uma missão real a Marte.</b> Você está dentro da nave ou no departamento de ciências e controla tudo com <b>ciência</b> e <b>gestão de recursos</b>: arquitetura da missão, Δv, suporte à vida, energia, comunicação com atraso, radiação, risco, entrada e pouso, recursos locais e retorno.
  <br><span class="mu">Cada capítulo tem um briefing técnico, um quiz temático (4 perguntas), um painel de gestão com números e uma decisão de emergência. O que você aprende nos quizzes melhora o desempenho da gestão. A campanha original continua intacta no Modo Solo.</span></div>
  <div class="row w">${run ? `<button class="pri" id="ucont">▶ Continuar: capítulo ${run.i + 1} · ${esc(ULV[run.i].title)}</button><button id="unew">Nova jornada</button>` : `<button class="pri" id="unew">▶ Começar a jornada</button>`}</div>
  <div class="w" id="ulist">${ULV.map((c, i) => { const b = best[i], cur = run && run.i === i, ok = b != null; return `<div class="up"><div><span class="tag">${c.dept == "ship" ? "🛰 Ponte da nave" : "🔬 Departamento de ciências"} · capítulo ${i + 1}</span><br><b>${c.icon} ${esc(c.title)}</b></div><span>${ok ? `✔ ${b}/100` : cur ? "▶ em andamento" : "🔒"}</span></div>`; }).join("")}</div>
  ${P.ulv.finished ? `<div class="pill w">🏆 Jornadas concluídas: <b>${P.ulv.finished}</b>${P.ulv.rank ? " · melhor título: <b>" + esc(P.ulv.rank) + "</b>" : ""}</div>` : ""}`;
  $("#ubk").onclick = () => { ulvStop(); menu(); }; const nw = $("#unew"); if (nw) nw.onclick = () => { P.ulv.run = ulvDefault(); saveP(); ulvChapter(0, true); }; const ct = $("#ucont"); if (ct) ct.onclick = () => ulvChapter(run.i, false);
  ulvAnim();
}
function ulvBack() { if (U && U.step && U.step !== "done") { ulvHome(); U = null; } else { ulvStop(); menu(); } }
function ulvStop() { cancelAnimationFrame(ulvRaf); ulvRaf = 0; ulvTok++; const cv = $("#ulvcv"); if (cv) cv.style.display = "none"; }

// ---------- capítulo ----------
function ulvChapter(i, fresh) {
  const run = ulvData().run || (P.ulv.run = ulvDefault()); run.i = i; const ch = ULV[i];
  U = { i, ch, V: run.V, snap: clone(run.V), step: "brief", qi: 0, qok: 0, sim: 0, ev: 0, inp: {}, attempt: 0 };
  ch.controls.forEach((c) => (U.inp[c.id] = c.val)); screen("ulv"); ulvRender(); ulvAnim();
}
const insight = () => U.qok / 4;
function gauges() {
  const V = U.V, g = (ic, n, v, max, cls) => `<div class="ug"><span>${ic} ${n}</span><u><i style="width:${clamp(v / max * 100, 0, 100)}%;background:${cls}"></i></u><b>${typeof v === "number" ? Math.round(v) : v}</b></div>`;
  return `<div class="ugs">${g("❤", "Saúde", V.health, 100, V.health < 40 ? "var(--bad)" : "var(--ok)")}${g("🙂", "Moral", V.morale, 100, V.morale < 40 ? "var(--bad)" : "#d78bff")}${g("☢", "Radiação (mSv)", V.rad, 600, V.rad > 420 ? "var(--bad)" : "#ffb347")}${g("🫁", "Autonomia (d)", ULV_SUP(V), 400, "#4aa3ff")}${g("🚀", "Δv margem (m/s)", V.dv, 1500, "#ffe14a")}${g("⚠", "Risco", V.risk, 100, V.risk > 60 ? "var(--bad)" : "#ff9a3c")}${g("🔬", "Dados científicos", V.data, 150, "#4fe3ff")}</div>`;
}
function ulvRender() {
  const el = $("#ulv"), ch = U.ch, V = U.V; const head = `<div class="top"><button id="ubk">← Capítulos</button><h2>${ch.icon} ${esc(ch.title)}</h2><span class="tag">${ch.dept == "ship" ? "🛰 Ponte da nave" : "🔬 Departamento de ciências"} · cap. ${U.i + 1}/${ULV.length} · dia ${V.day}</span></div>${gauges()}`;
  let body = "";
  if (U.step === "brief") body = `<div class="pill w ulb"><div class="cpu-lab">BRIEFING TÉCNICO</div>${ch.brief.map((t) => `<p>${md(t)}</p>`).join("")}</div><div class="row w"><button class="pri" id="unext">Ir para o quiz do capítulo →</button></div>`;
  else if (U.step === "quiz") { const q = ch.quiz[U.qi]; body = `<div class="pill w ulb"><div class="cpu-lab">QUIZ TEMÁTICO · ${U.qi + 1}/${ch.quiz.length} · acertos ${U.qok}</div><h3 style="margin:8px 0">${esc(q[0])}</h3><div class="opts" id="uo">${q[1].map((o, k) => `<button data-k="${k}">${esc(o)}</button>`).join("")}</div><div id="uf"></div></div>`; }
  else if (U.step === "sim") body = `<div class="pill w ulb"><div class="cpu-lab">PAINEL DE GESTÃO · conhecimento aplicado: +${Math.round(insight() * 100)}% de eficácia</div><div id="uctl">${ch.controls.map((c) => ctl(c)).join("")}</div></div><div class="pill w ulb" id="uprev"></div><div class="row w"><button class="pri" id="urun">Executar fase</button></div>`;
  else if (U.step === "event") { const e = ch.event; body = `<div class="pill w ulb"><div class="cpu-lab">EVENTO DE DECISÃO</div><h3 style="margin:8px 0">${esc(e.t)}</h3><div class="opts" id="ue">${e.opts.map((o, k) => `<button data-k="${k}">${esc(o[0])}</button>`).join("")}</div><div id="uef"></div></div>`; }
  else if (U.step === "done") { const tot = U.sim + U.qok * 10 + U.ev; body = `<div class="pill w ulb"><div class="cpu-lab">RESULTADO DO CAPÍTULO</div><h2 style="margin:6px 0">${tot}/100</h2><p>Gestão: <b>${U.sim}</b>/50 · Quiz: <b>${U.qok * 10}</b>/40 · Evento: <b>${U.ev}</b>/10</p><p class="mu">${ULV_FONTE}</p><div id="urew"></div></div><div class="row w" id="ubtn"></div>`; }
  el.innerHTML = head + body; $("#ubk").onclick = () => { ulvHome(); }; ulvWire();
}
const ctl = (c) => c.type === "select" ? `<label class="f" style="margin:8px 0">${esc(c.label)}<select data-c="${c.id}">${c.opts.map((o, k) => `<option value="${k}" ${+U.inp[c.id] === k ? "selected" : ""}>${esc(o)}</option>`).join("")}</select></label>` : `<label class="f" style="margin:8px 0">${esc(c.label)}: <b id="v_${c.id}">${U.inp[c.id]}${c.unit || ""}</b>${c.hint ? ` <small class="mu">${esc(c.hint)}</small>` : ""}<input type="range" data-c="${c.id}" min="${c.min}" max="${c.max}" step="${c.step}" value="${U.inp[c.id]}"></label>`;
function preview() {
  const r = U.ch.run(U.inp, clone(U.V), insight()), el = $("#uprev"); if (!el) return;
  el.innerHTML = `<div class="cpu-lab">PRÉVIA (nada foi executado ainda) · eficácia estimada ${r.score}/50</div>${r.L.map(([ok, t]) => `<div class="${ok ? "dn" : ""}" style="padding:2px 0">${ok ? "✔" : "⚠"} ${esc(t)}</div>`).join("")}${r.fail ? `<div style="color:var(--bad);margin-top:6px">⛔ ${esc(r.fail)}</div>` : ""}`;
}
function ulvWire() {
  const ch = U.ch;
  if (U.step === "brief") $("#unext").onclick = () => { U.step = "quiz"; ulvRender(); };
  if (U.step === "quiz") { const q = ch.quiz[U.qi]; $("#uo").querySelectorAll("button").forEach((b) => (b.onclick = () => { const k = +b.dataset.k, hit = k === q[2]; $("#uo").querySelectorAll("button").forEach((x) => { x.disabled = true; if (+x.dataset.k === q[2]) x.classList.add("sel"); }); if (hit) U.qok++; $("#uf").innerHTML = `<p style="margin:10px 0"><b class="${hit ? "dn" : ""}">${hit ? "✔ Correto!" : "✖ Não foi dessa vez."}</b><br><span class="mu">${esc(q[3])}</span></p><button class="pri" id="uqn">${U.qi + 1 >= ch.quiz.length ? "Ir ao painel de gestão →" : "Próxima"}</button>`; $("#uqn").onclick = () => { if (++U.qi >= ch.quiz.length) U.step = "sim"; ulvRender(); }; })); }
  if (U.step === "sim") {
    $("#uctl").querySelectorAll("[data-c]").forEach((i) => (i.oninput = i.onchange = () => { const c = ch.controls.find((x) => x.id === i.dataset.c); U.inp[c.id] = c.type === "select" ? +i.value : +i.value; const lb = $("#v_" + c.id); if (lb) lb.textContent = i.value + (c.unit || ""); preview(); }));
    preview(); $("#urun").onclick = () => {
      U.attempt++; const r = ch.run(U.inp, clone(U.V), insight());
      if (r.fail) { $("#uprev").innerHTML = `<div class="cpu-lab">RESULTADO</div>${r.L.map(([ok, t]) => `<div class="${ok ? "dn" : ""}">${ok ? "✔" : "⚠"} ${esc(t)}</div>`).join("")}<p style="color:var(--bad)"><b>⛔ ${esc(r.fail)}</b> Ajuste o painel e execute de novo.</p>`; return; }
      U.sim = r.score; r.apply(U.V); U.V.seed = (U.V.seed || 7) + 1; U.simLines = r.L; U.step = "event"; ulvRender();
      $("#ulv").insertAdjacentHTML("beforeend", `<div class="pill w ulb"><div class="cpu-lab">FASE EXECUTADA · eficácia ${r.score}/50</div>${r.L.map(([ok, t]) => `<div class="${ok ? "dn" : ""}" style="padding:2px 0">${ok ? "✔" : "⚠"} ${esc(t)}</div>`).join("")}</div>`);
    };
  }
  if (U.step === "event") { const e = ch.event; $("#ue").querySelectorAll("button").forEach((b) => (b.onclick = () => { const o = e.opts[+b.dataset.k]; $("#ue").querySelectorAll("button").forEach((x) => (x.disabled = true)); b.classList.add("sel"); U.ev = o[1]; const V = U.V; if (o[1] >= 10) V.risk = Math.max(0, V.risk - 3); else { V.health = Math.max(0, V.health - 4); V.risk += 6; } $("#uef").innerHTML = `<p style="margin:10px 0"><b class="${o[1] >= 10 ? "dn" : ""}">${o[1] >= 10 ? "✔ Boa decisão!" : o[1] > 0 ? "◐ Pode melhorar." : "✖ Decisão perigosa."}</b><br><span class="mu">${esc(o[2])}</span></p><button class="pri" id="uen">Concluir capítulo →</button>`; $("#uen").onclick = ulvFinish; })); }
  if (U.step === "done") ulvDone();
}
function ulvFinish() {
  if (U.V.health <= 0) { $("#ulv").innerHTML = `<div class="pill w ulb"><h2>⛔ Missão perdida</h2><p>A saúde da tripulação chegou a zero. Revise o briefing, melhore o painel de gestão e tente o capítulo de novo.</p></div><div class="row w"><button class="pri" id="uretry">Tentar de novo</button><button id="ubk">Capítulos</button></div>`; $("#uretry").onclick = () => { const run = P.ulv.run; run.V = clone(U.snap); ulvChapter(U.i, false); }; $("#ubk").onclick = ulvHome; return; }
  U.step = "done"; ulvRender();
}
function ulvDone() {
  const tot = U.sim + U.qok * 10 + U.ev, d = ulvData(), first = d.best[U.i] == null, mult = first ? 1 : .2; d.best[U.i] = Math.max(d.best[U.i] || 0, tot);
  const coins = Math.round(earn((60 + tot * 2.4) * mult)), pp = Math.round((first ? 3 : 0) + tot / 25); P.pp += pp; save();
  const run = d.run; run.V = U.V; const last = U.i >= ULV.length - 1; let extra = "";
  if (!last) run.i = U.i + 1; else { const avg = Math.round(d.best.reduce((a, b) => a + (b || 0), 0) / ULV.length), rk = ulvRank(avg), bonus = Math.round(earn(2500)); P.pp += 60; d.finished = (d.finished || 0) + 1; d.rank = (!d.rank || avg >= (d.rankAvg || 0)) ? rk : d.rank; d.rankAvg = Math.max(d.rankAvg || 0, avg); d.run = null; extra = `<p><b class="dn">🏆 Jornada concluída! Título: ${esc(rk)} (média ${avg}/100) · bônus +${bonus} 🪙 e +60 PP.</b></p>`; save(); }
  saveP(); $("#urew").innerHTML = `<p>Recompensa: <b>+${coins} 🪙</b> e <b>+${pp} PP</b>${EV.mult > 1 ? ` (evento x${EV.mult})` : ""}${first ? "" : " (repetição: 20%)"}.</p>${extra}`;
  const b = $("#ubtn"); b.innerHTML = last ? `<button class="pri" id="uhome">Ver capítulos</button><button id="umenu">Menu</button>` : `<button class="pri" id="unx">Próximo capítulo →</button><button id="uhome">Capítulos</button>`;
  if (!last) $("#unx").onclick = () => ulvChapter(U.i + 1, false); $("#uhome").onclick = () => { U = null; ulvHome(); }; if ($("#umenu")) $("#umenu").onclick = () => { ulvStop(); menu(); };
}
// ---------- fundo animado: janela da nave / laboratório ----------
function ulvAnim() {
  cancelAnimationFrame(ulvRaf); const tok = ++ulvTok; let cv = $("#ulvcv"); if (!cv) { cv = document.createElement("canvas"); cv.id = "ulvcv"; $("#ulv").parentElement.insertBefore(cv, $("#ulv")); }
  const x = cv.getContext("2d"), st = Array.from({ length: 110 }, () => [Math.random(), Math.random(), Math.random() * .8 + .2]);
  const loop = (t) => {
    if (tok !== ulvTok) return;
    if (!$("#ulv").classList.contains("on")) { cv.style.display = "none"; return; } cv.style.display = "block"; if (cv.width !== innerWidth || cv.height !== innerHeight) { cv.width = innerWidth; cv.height = innerHeight; } const w = cv.width, h = cv.height, ship = !U || U.ch.dept === "ship";
    x.fillStyle = ship ? "#050914" : "#07140f"; x.fillRect(0, 0, w, h);
    if (ship) { st.forEach((s) => { s[0] = (s[0] - s[2] * .0016 + 1) % 1; x.fillStyle = `rgba(255,255,255,${.3 + s[2] * .6})`; x.fillRect(s[0] * w, s[1] * h, s[2] * 2, s[2] * 2); }); const p = U ? clamp(U.V.day / 210, 0, 1) : .3;
      x.fillStyle = "#2f6fd0"; x.beginPath(); x.arc(w * (.12 - p * .1), h * .78, 26 - p * 12, 0, 7); x.fill(); x.fillStyle = "#b5532f"; x.beginPath(); x.arc(w * (.9 + (1 - p) * .1), h * .25, 22 + p * 60, 0, 7); x.fill(); }
    else { x.strokeStyle = "rgba(79,227,176,.12)"; x.lineWidth = 1; for (let i = 0; i < w; i += 48) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.stroke(); } for (let j = 0; j < h; j += 48) { x.beginPath(); x.moveTo(0, j); x.lineTo(w, j); x.stroke(); } const y = ((t / 18) % h); x.fillStyle = "rgba(79,227,176,.07)"; x.fillRect(0, y, w, 40); }
    setTimeout(() => { ulvRaf = requestAnimationFrame(loop); }, 40);
  }; ulvRaf = requestAnimationFrame(loop);
}
