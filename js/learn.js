/* Quiz Espacial (muitas moedas) e Fatos Espaciais (PP e moedas só se ler até o fim; pular não dá nada). */
const QZ = { PER_Q: 40, PER_Q_REPEAT: 4, ROUND: 15, BONUS80: 300, BONUS100: 600, FACT_COINS: 25, FACT_PP: 2 };
const learnData = () => { P.facts = Array.isArray(P.facts) ? P.facts : []; P.quiz = P.quiz && Array.isArray(P.quiz.ok) ? P.quiz : { ok: [], day: "" }; return P; };
const today = () => new Date().toISOString().slice(0, 10);
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const learnClose = () => { $("#adm").classList.remove("on"); };

// ---------- Quiz ----------
function quizHome() {
  learnData(); const ok = P.quiz.ok.length, left = QUIZ.length - ok, bonusOk = P.quiz.day !== today();
  openModal(`<div class="up"><b style="font-size:18px">🛰 Quiz Espacial</b><button id="cls">Fechar</button></div>
  <p class="mu">${QUIZ.length} perguntas sobre Marte, missões e o Sistema Solar. Cada pergunta respondida certa pela <b>primeira vez</b> rende <b>${QZ.PER_Q} 🪙</b> (+1 PP); repetidas rendem ${QZ.PER_Q_REPEAT} 🪙. Errar não tira nada.</p>
  <div class="pill" style="text-align:center">Acertos inéditos: <b>${ok}/${QUIZ.length}</b> · faltam <b>${left}</b> · potencial: <b>${left * QZ.PER_Q} 🪙</b>${EV.mult > 1 ? ` · <span class="chip">moedas x${EV.mult} no evento!</span>` : ""}</div>
  <p class="mu">Bônus de rodada (1 vez por dia): <b>${QZ.BONUS80} 🪙 + 10 PP</b> com 80% de acertos e <b>+${QZ.BONUS100} 🪙 + 20 PP</b> com 100%. ${bonusOk ? "<b class='dn'>Disponível hoje!</b>" : "Já recebido hoje."}</p>
  <div class="opts"><button class="pri" id="qr">Rodada de ${QZ.ROUND} perguntas (prioriza as inéditas)</button><button id="qa">Quiz completo (${QUIZ.length} perguntas)</button></div>`);
  $("#cls").onclick = learnClose; $("#qr").onclick = () => quizRun(QZ.ROUND); $("#qa").onclick = () => quizRun(QUIZ.length);
}
function quizRun(n) {
  learnData(); const idx = QUIZ.map((_, i) => i), fresh = shuffle(idx.filter((i) => !P.quiz.ok.includes(i))), seen = shuffle(idx.filter((i) => P.quiz.ok.includes(i)));
  const ids = fresh.concat(seen).slice(0, n), st = { i: 0, right: 0, newRight: 0, coins: 0, pp: 0 };
  const step = () => {
    if (st.i >= ids.length) return done();
    const q = QUIZ[ids[st.i]], order = shuffle([0, 1, 2, 3]);
    openModal(`<div class="up"><b>🛰 Quiz Espacial · ${st.i + 1}/${ids.length}</b><span>✔ ${st.right} · 🪙 ${Math.round(st.coins)}</span></div><div class="tb" style="margin:6px 0"><u><i style="width:${st.i / ids.length * 100}%;background:var(--ac)"></i></u></div>
    <h3 style="margin:10px 0">${esc(q[0])}</h3><div class="opts" id="qo">${order.map((k) => `<button data-k="${k}">${esc(q[1][k])}</button>`).join("")}</div><div id="qf"></div>`);
    $("#qo").querySelectorAll("button").forEach((b) => (b.onclick = () => {
      const k = +b.dataset.k, hit = k === q[2], first = hit && !P.quiz.ok.includes(ids[st.i]); $("#qo").querySelectorAll("button").forEach((x) => { x.disabled = true; if (+x.dataset.k === q[2]) x.classList.add("sel"); });
      if (hit) { st.right++; const c = earn(first ? QZ.PER_Q : QZ.PER_Q_REPEAT); st.coins += c; if (first) { P.quiz.ok.push(ids[st.i]); P.pp += 1; st.pp += 1; st.newRight++; } save(); saveP(); }
      $("#qf").innerHTML = `<p style="margin:10px 0"><b class="${hit ? "dn" : ""}">${hit ? "✔ Correto!" : "✖ Não foi dessa vez."}</b> ${hit ? `+${Math.round(earn0(first))} 🪙${first ? " · +1 PP" : ""}` : ""}<br><span class="mu">📡 ${esc(q[3])}</span><br><small class="mu">${esc(FONTE)}</small></p><button class="pri" id="qn">${st.i + 1 >= ids.length ? "Ver resultado" : "Próxima"}</button>`;
      $("#qn").onclick = () => { st.i++; step(); };
    }));
  };
  const earn0 = (first) => (first ? QZ.PER_Q : QZ.PER_Q_REPEAT) * EV.mult;
  const done = () => {
    const pct = st.right / ids.length; let bonus = 0, bpp = 0, msg = "";
    if (P.quiz.day !== today() && ids.length >= 10 && pct >= .8) { bonus += QZ.BONUS80; bpp += 10; if (pct === 1) { bonus += QZ.BONUS100; bpp += 20; } bonus = earn(bonus); P.pp += bpp; P.quiz.day = today(); msg = `<p><b class="dn">🏅 Bônus de rodada: +${Math.round(bonus)} 🪙 e +${bpp} PP!</b></p>`; }
    else if (pct >= .8) msg = `<p class="mu">Bônus do dia já recebido.</p>`; else msg = `<p class="mu">Acerte 80% ou mais para ganhar o bônus de rodada (1 vez por dia).</p>`;
    st.coins += bonus; P.w = P.w || 0; save(); saveP();
    openModal(`<h2>Resultado: ${st.right}/${ids.length} (${Math.round(pct * 100)}%)</h2><p>Você ganhou <b>${Math.round(st.coins)} 🪙</b> e <b>${st.pp + bpp} PP</b>${EV.mult > 1 ? ` (evento x${EV.mult} aplicado)` : ""}. Perguntas inéditas acertadas: ${st.newRight}.</p>${msg}<div class="row"><button class="pri" id="qagain">Jogar de novo</button><button id="qc">Fechar</button></div>`);
    $("#qagain").onclick = quizHome; $("#qc").onclick = () => { learnClose(); if ($("#menu").classList.contains("on")) menu(); };
  };
  step();
}

// ---------- Fatos ----------
let factLast = -1e9;
/** Mostra um fato. Só dá recompensa se for inédito e o jogador ler até o fim (botão libera após o tempo de leitura). */
function showFact(i, onDone) {
  learnData(); const f = FACTS[i], read = P.facts.includes(i), words = f[1].split(/\s+/).length, secs = read ? 0 : clamp(Math.round(words * .3), 6, 20);
  openModal(`<div class="up"><b>📡 Fato espacial ${i + 1}/${FACTS.length}</b><span class="chip">${read ? "já lido" : "ainda não lido"}</span></div><h3 style="margin:10px 0 6px">${esc(f[0])}</h3><p style="font-size:15px;line-height:1.55">${esc(f[1])}</p>
  <p class="mu">${read ? "Você já ganhou a recompensa deste fato." : `Leia com calma: ao terminar, ganhe <b>${Math.round(QZ.FACT_COINS * EV.mult)} 🪙</b> e <b>${QZ.FACT_PP} PP</b>. Se pular, não ganha nada (o fato continua disponível depois).`}</p>
  <p class="mu" style="margin:0 0 6px"><small>${esc(FONTE)}</small></p><div class="tb"><u><i id="fbar" style="width:0;background:var(--ok)"></i></u></div><div class="row" style="margin-top:8px"><button class="pri" id="fok" ${read ? "" : "disabled"}>${read ? "Fechar" : "Li e entendi (" + secs + "s)"}</button>${read ? "" : `<button class="gh" id="fskip">Pular (sem recompensa)</button>`}</div>`);
  const fin = (reward) => { clearInterval(t); if (reward) { const c = earn(QZ.FACT_COINS); P.pp += QZ.FACT_PP; P.facts.push(i); save(); saveP(); toast(`📡 Fato lido! +${Math.round(c)} 🪙 e +${QZ.FACT_PP} PP`); } learnClose(); if (onDone) onDone(); };
  let left = secs; const t0 = performance.now(), t = setInterval(() => { const e = (performance.now() - t0) / 1000; left = Math.max(0, secs - e); const b = $("#fbar"), ok = $("#fok"); if (!b || !ok) return clearInterval(t); b.style.width = (secs ? Math.min(100, e / secs * 100) : 100) + "%"; if (!read) { ok.disabled = left > 0; ok.textContent = left > 0 ? `Li e entendi (${Math.ceil(left)}s)` : "Li e entendi ✔"; } }, 200);
  $("#fok").onclick = () => { if ($("#fok").disabled) return; fin(!read); }; const sk = $("#fskip"); if (sk) sk.onclick = () => fin(false);
}
function nextUnread() { learnData(); const l = FACTS.map((_, i) => i).filter((i) => !P.facts.includes(i)); return l.length ? l[Math.floor(Math.random() * l.length)] : -1; }
function factsHome() {
  learnData(); const n = P.facts.length, nx = nextUnread();
  openModal(`<div class="up"><b style="font-size:18px">📡 Fatos Espaciais</b><button id="cls">Fechar</button></div><p class="mu">Fatos reais sobre exploração espacial. <b>Ler até o fim rende ${Math.round(QZ.FACT_COINS * EV.mult)} 🪙 e ${QZ.FACT_PP} PP</b>; pular não rende nada. Lidos: <b>${n}/${FACTS.length}</b>.</p>
  <div class="row"><button class="pri" id="fn" ${nx < 0 ? "disabled" : ""}>${nx < 0 ? "Você leu todos!" : "Ler um fato novo"}</button></div><h3 style="margin-top:12px">Todos os fatos</h3><div style="max-height:40vh;overflow:auto">${FACTS.map((f, i) => `<div class="up"><div>${P.facts.includes(i) ? "✔" : "○"} ${esc(f[0])}</div><button data-f="${i}" style="font-size:12px">${P.facts.includes(i) ? "Reler" : "Ler"}</button></div>`).join("")}</div>`);
  $("#cls").onclick = learnClose; if (nx >= 0) $("#fn").onclick = () => showFact(nx, factsHome); $("#admb").querySelectorAll("[data-f]").forEach((b) => (b.onclick = () => showFact(+b.dataset.f, factsHome)));
}
/** Antes de uma fase: oferece um fato inédito (no máximo 1 a cada 3 min). Resolver/pular segue para a fase. */
function factBeforePhase(go) { const nx = nextUnread(); if (nx < 0 || performance.now() - factLast < 180000) return go(); factLast = performance.now(); showFact(nx, go); }
