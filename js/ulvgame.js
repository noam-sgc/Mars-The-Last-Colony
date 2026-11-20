/* Ultra Learn Voyage dentro do jogo: cada capítulo é uma fase JOGÁVEL da colônia (mesmo mapa, construção, colonos, WASD),
   com sistemas extras para gerir — ☢ radiação, 🔧 peças de reposição, 🔬 dados científicos, falhas, tempestades solares e de poeira —
   e "terminais de conhecimento" espalhados pelo mapa: os fatos reais da missão aparecem ali, ligados a decisões que mudam o jogo.
   O quiz solto continua na aba principal; aqui o conteúdo é jogado, não lido. */
let UGPEND = null; const UGG = new THREE.Group(); sc.add(UGG);
const UG_TANK = { arq: "morale", dv: "fuel", eclss: "oxy", pow: "eff", com: "morale", rad: "rad", risk: "parts", edl: "fuel", isru: "water", ret: "fuel" };
const ugPhase = (i) => { const l = PH.map((p, k) => (!p.nav && !p.alien && k >= 2 ? k : -1)).filter((k) => k >= 0); return l[Math.min(l.length - 1, i * 2)]; };
/** Inicia o capítulo i como fase jogável. */
function ulvPlay(i) { UGPEND = i; start("solo", ugPhase(i)); }
function ugClear() { while (UGG.children.length) UGG.remove(UGG.children[0]); const u = document.getElementById("ux"); if (u) u.remove(); }
const _start = start; start = function (mode, ph) { _start(mode, ph); if (UGPEND != null) { const i = UGPEND; UGPEND = null; ugBegin(i); } };
const _clear = clear; clear = function () { _clear(); ugClear(); };

function ugBegin(i) {
  const ch = ULV[i]; ugClear(); const sh = ch.dept === "ship";
  G.ug = { i, ch, sh, rad: 0, parts: 6, data: 0, target: 50 + i * 8, term: [], flare: 0, dust: 0, nextFail: 50 + Math.random() * 25, nextFlare: 70 + Math.random() * 40, nextDust: 90 + Math.random() * 50, evDone: 0, evScore: null, shown: 0 };
  G.time = Math.round(G.time * 1.15);
  const n = Math.min(4, ch.quiz.length), sol = solids(false);
  for (let t = 0; t < n; t++) {
    let x = 0, z = 0; for (let k = 0; k < 40; k++) { const a = (t / n) * 6.283 + .6 + Math.random() * .5, r = 15 + Math.random() * 14; x = Math.cos(a) * r; z = Math.sin(a) * r; if (!sol.some((c) => Math.hypot(c.x - x, c.z - z) < c.r + 3)) break; }
    const g = new THREE.Group(), M = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .4, metalness: .5 }, o || {}));
    const base = new THREE.Mesh(new THREE.CylinderGeometry(.8, 1, .6, 10), M("#2a3040")); base.position.y = .3; g.add(base); const col = new THREE.Mesh(new THREE.CylinderGeometry(.25, .35, 2.2, 8), M("#4a5470")); col.position.y = 1.6; g.add(col);
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(.6), M("#22e6ff", { emissive: "#22e6ff", emissiveIntensity: 1, transparent: true, opacity: .9 })); gem.position.y = 3.3; g.add(gem); g.userData.gem = gem;
    const l = new THREE.PointLight(0x22e6ff, .8, 12); l.position.y = 3.3; g.add(l); g.position.set(x, H(x, z), z); UGG.add(g); G.ug.term.push({ g, x, z, ti: t, done: 0, ok: 0 });
  }
  const tb = $("#topbar"), u = document.createElement("div"); u.className = "pill"; u.id = "ux"; u.style.minWidth = "230px"; u.dataset.min = "☢🔧🔬 Missão"; tb.appendChild(u);
  toast(`${ch.icon} Capítulo ${i + 1}: ${esc(ch.title)}<br>${sh ? "🛰 Você está a bordo: falhas de sistema e tempestades solares." : "🔬 Operação em superfície: poeira, radiação e ciência."} Procure os <b>terminais ciano</b> no mapa (E) e use as <b>peças</b> sabiamente.`, 8000);
}
const ugNear = () => { const u = G.ug; if (!u) return null; let b = null, d = 5.5; u.term.forEach((t) => { const q = Math.hypot(t.x - PL.x, t.z - PL.z); if (!t.done && q < d) { d = q; b = t; } }); return b; };
const ugShelter = () => !!IN || (G.placed.some((p) => p.t === "hab" && Math.hypot(p.x - PL.x, p.z - PL.z) < 6));

const _tick = tick; tick = function (dt) { _tick(dt); if (G.run && G.ug && G.mode === "solo") ugTick(dt); };
function ugTick(dt) {
  const u = G.ug, t = performance.now() / 1000; u.shown += dt;
  u.term.forEach((q, i) => { const gm = q.g.userData.gem; gm.rotation.y = t * 1.5 + i; gm.position.y = 3.3 + Math.sin(t * 2 + i) * .15; if (q.done) { gm.material.color.set(q.ok ? "#46e07a" : "#ff6a4a"); gm.material.emissive.set(q.ok ? "#46e07a" : "#ff6a4a"); } });
  const shel = ugShelter(), habs = Math.min(5, cnt("hab")), inHab = IN && IN.p && IN.p.t === "hab";
  u.rad = clamp(u.rad + ((.12 * (1 - .08 * habs)) * (shel ? .25 : 1) + (u.flare > 0 && !shel ? 3.2 : 0) - (inHab ? .5 : 0)) * dt, 0, 100);
  u.data += (cnt("ctrl") * .35 + (u.sh ? .08 : .12) + cnt("rover") * .12) * dt;
  if (u.flare > 0) { u.flare -= dt; if (u.flare <= 0) toast("🌞 A tempestade solar passou."); }
  if (u.dust > 0) u.dust -= dt;
  if (u.shown > u.nextFlare) { u.nextFlare = u.shown + 80 + Math.random() * 60; u.flare = 14; toast("🌞 <b>TEMPESTADE SOLAR!</b> Abrigue-se num habitat ou entre num edifício (E) — a radiação sobe rápido ao ar livre.", 6000); }
  if (u.shown > u.nextDust && !u.sh) { u.nextDust = u.shown + 100 + Math.random() * 60; u.dust = 25; toast("🌪 Tempestade de poeira: painéis solares rendem 50% por 25 s.", 5000); }
  if (u.shown > u.nextFail) { u.nextFail = u.shown + 55 + Math.random() * 35; const k = K[Math.floor(Math.random() * K.length)];
    if (u.parts >= 1) { u.parts--; toast(`⚙ Falha em ${KN[k]}: uma peça de reposição foi usada (🔧 ${u.parts}).`, 4200); } else { G.tk[k] = clamp(G.tk[k] - 22, 0, 100); toast(`⚙ <b>Falha em ${KN[k]}</b> e sem peças de reposição: −22%! Responda terminais para ganhar peças.`, 5200); } }
  if (!u.evDone && u.shown > 55 + u.i * 4 && !DLG && !IN && !DR) ugEvent();
  if (u.rad >= 100 && G.run) { G.why = "Dose de radiação letal: faltou abrigo e blindagem"; end(false); }
  if (u.rad > 70 && !u.w70) { u.w70 = 1; toast("☢ Radiação alta! Fique em habitats (recupera) e acerte terminais de radiação.", 5000); } if (u.rad < 55) u.w70 = 0;
}
const _tank = tank; tank = function (dt) { if (G.ug && G.ug.dust > 0) { const p = PH[G.ph], s = p.storm; p.storm = true; try { _tank(dt); } finally { p.storm = s; } } else _tank(dt); };

// ---------- terminais: fato + decisão ----------
function ugOpen(t) {
  const u = G.ug, ch = u.ch, q = ch.quiz[t.ti], fact = ch.brief[t.ti] || ch.brief[0]; DLG = { ug: 1 }; G.paused = true;
  openDlgHTML(`<div class="dlgh"><div class="av">${ch.icon}</div><div><b>Terminal ${t.ti + 1}/${u.term.length} · ${esc(ch.title)}</b><div class="mu">${ch.dept === "ship" ? "🛰 Sistema de bordo" : "🔬 Centro de ciência"}</div></div></div>
  <p class="ugf">${md(fact)}</p><p><b>Decisão de campo:</b> ${esc(q[0])}</p><div class="opts">${q[1].map((o, i) => `<button data-o="${i}">${esc(o)}</button>`).join("")}</div>`);
  $("#dlgb").querySelectorAll("[data-o]").forEach((b) => (b.onclick = () => ugAnswer(t, q, +b.dataset.o)));
}
function ugEffect(good) {
  const u = G.ug, k = UG_TANK[u.ch.id]; let m;
  if (good) { u.parts = Math.min(9, u.parts + 1); u.data += 10; const c = Math.round(earn(20 + u.i * 4)); if (k === "rad") { u.rad = Math.max(0, u.rad - 22); m = "☢ −22 de radiação"; } else if (k === "parts") { u.parts = Math.min(9, u.parts + 2); m = "🔧 +2 peças extras"; } else { G.tk[k] = clamp(G.tk[k] + 12, 0, 100); m = `${KN[k]} +12%`; } return `✔ +1 🔧 · +10 🔬 · +${c} 🪙 · ${m}`; }
  if (k === "rad") u.rad = Math.min(100, u.rad + 10); else if (k === "parts") u.parts = Math.max(0, u.parts - 1); else G.tk[k] = clamp(G.tk[k] - 8, 0, 100); return `✖ ${k === "rad" ? "☢ +10 de radiação" : k === "parts" ? "🔧 −1 peça" : KN[k] + " −8%"}`;
}
function ugAnswer(t, q, o) {
  const good = o === q[2]; t.done = 1; t.ok = good; const eff = ugEffect(good); save();
  $("#dlgb").innerHTML = `<div class="dlgh"><div class="av">${good ? "✅" : "❌"}</div><div><b>${good ? "Decisão correta!" : "Decisão arriscada"}</b><div class="mu">${eff}</div></div></div><p>${good ? "" : "<b>Correto:</b> " + esc(q[1][q[2]]) + "<br>"}${esc(q[3])}</p><div class="opts"><button id="ugc" class="pri">Continuar</button></div><small class="mu">${esc(ULV_FONTE)}</small>`;
  $("#ugc").onclick = closeDlg;
}
function ugEvent() {
  const u = G.ug, ev = u.ch.event; u.evDone = 1; DLG = { ug: 1 }; G.paused = true;
  openDlgHTML(`<div class="dlgh"><div class="av">🚨</div><div><b>Emergência de missão</b><div class="mu">${esc(u.ch.title)}</div></div></div><p>${esc(ev.t)}</p><div class="opts">${ev.opts.map((o, i) => `<button data-o="${i}">${esc(o[0])}</button>`).join("")}</div>`);
  $("#dlgb").querySelectorAll("[data-o]").forEach((b) => (b.onclick = () => { const o = ev.opts[+b.dataset.o], sc0 = o[1]; u.evScore = sc0;
    let m; if (sc0 >= 8) { u.data += 25; u.parts = Math.min(9, u.parts + 2); const c = Math.round(earn(40 + u.i * 6)); m = `✔ Melhor decisão: +25 🔬 · +2 🔧 · +${c} 🪙`; } else if (sc0 >= 3) { u.data += 8; m = "➖ Decisão aceitável: +8 🔬"; } else { u.rad = Math.min(100, u.rad + 15); u.parts = Math.max(0, u.parts - 1); K.forEach((k) => (G.tk[k] = clamp(G.tk[k] - 6, 0, 100))); m = "✖ Decisão ruim: ☢ +15 · 🔧 −1 · tanques −6%"; } save();
    $("#dlgb").innerHTML = `<div class="dlgh"><div class="av">${sc0 >= 8 ? "✅" : sc0 >= 3 ? "➖" : "❌"}</div><div><b>${esc(m)}</b></div></div><p>${esc(o[2])}</p><div class="opts"><button id="ugc" class="pri">Continuar</button></div>`; $("#ugc").onclick = closeDlg; }));
}
const _onE = INP.onE; INP.onE = function () { if (G.run && G.ug && !IN && !DR && !DLG && G.mode === "solo") { const t = ugNear(); if (t) return ugOpen(t); } _onE(); };

// ---------- objetivos, HUD e fim de fase ----------
const _goals = goals; goals = function () {
  let ok = _goals(); const u = G.ug; if (!u) return ok; const n = u.term.filter((t) => t.done).length, d = n >= u.term.length, dd = u.data >= u.target;
  $("#gl").innerHTML += `<div class="tag" style="margin-top:6px">Ultra Learn · ${esc(u.ch.title)}</div><div class="${d ? "dn" : ""}">${d ? "✔" : "○"} Terminais ${n}/${u.term.length}</div><div class="${dd ? "dn" : ""}">${dd ? "✔" : "○"} Dados científicos ${Math.floor(u.data)}/${u.target}</div><div class="${u.evDone ? "dn" : ""}">${u.evDone ? "✔" : "○"} Emergência de missão</div>`;
  return ok && d && dd && u.evDone;
};
const _hud = hud; hud = function () {
  _hud(); const u = G.ug; if (!u || G.mode !== "solo") return; const el = $("#ux"); if (!el) return;
  const b = (ic, v, mx, bad) => `<div class="tb"><span>${ic}</span><u><i style="width:${clamp(v / mx * 100, 0, 100)}%;background:${bad ? (v > 70 ? "var(--bad)" : v > 45 ? "#ffb347" : "var(--ok)") : "#4aa8ff"}"></i></u><b style="width:42px;text-align:right">${Math.floor(v)}</b></div>`;
  el.innerHTML = `${b("☢", u.rad, 100, 1)}${b("🔧", u.parts, 9)}${b("🔬", u.data, u.target)}<small class="mu">${u.flare > 0 ? "<b style='color:var(--bad)'>🌞 TEMPESTADE SOLAR — abrigue-se!</b>" : u.dust > 0 ? "🌪 poeira" : u.ch.icon + " cap. " + (u.i + 1)}</small>`;
  const t = ugNear(); if (t && !DLG && !DR) { setHint($("#hint"), `${TOUCH ? "Toque" : "E"} · usar terminal ${t.ti + 1} (${u.ch.title})`); setAct(TOUCH ? "Terminal" : ""); }
};
const _win = win; win = function () {
  const u = G.ug; if (!u) return _win(); const n = u.term.filter((t) => t.ok).length, avg = Math.round(K.reduce((a, k) => a + G.tk[k], 0) / 6), evs = u.evScore == null ? 0 : u.evScore;
  const tot = Math.round(n / u.term.length * 40 + avg * .3 + evs * 2 + (u.rad < 50 ? 10 : 0)), d = ulvData(), first = d.best[u.i] == null, mult = first ? 1 : .2; d.best[u.i] = Math.max(d.best[u.i] || 0, tot);
  const coins = Math.round(earn((60 + tot * 2.4) * mult)), pp = Math.round((first ? 3 : 0) + tot / 25); P.pp += pp; save();
  const bs = d.best.filter((x) => x != null); if (bs.length >= ULV.length) { const a = bs.reduce((x, y) => x + y, 0) / bs.length; d.finished = (d.finished || 0) + (first ? 1 : 0); d.rank = ulvRank(a); }
  saveP(); u.tot = tot; u.coins = coins; u.pp = pp; u.n = n; _win();
};
const _end = end; end = function (w, rw) {
  _end(w, rw); const u = G.ug; if (!u) return; const rp = $("#rp");
  if (w) rp.innerHTML += `<br><b>🚀 Capítulo ${u.i + 1} concluído:</b> ${u.n}/${u.term.length} terminais corretos · nota ${u.tot}/100 · bônus ULV +${u.coins} 🪙 e +${u.pp} PP. ☢ ${Math.round(u.rad)}% · 🔧 ${u.parts}.`;
  const b = $("#rb"); b.innerHTML = ""; const add = (t, f) => { const x = document.createElement("button"); x.textContent = t; x.onclick = () => { $("#res").classList.remove("on"); f(); }; b.appendChild(x); };
  if (w && u.i + 1 < ULV.length) add("▶ Próximo capítulo", () => ulvPlay(u.i + 1)); add(w ? "Jogar de novo" : "Tentar de novo", () => ulvPlay(u.i)); add("Capítulos", () => { clear(); ulvHome(); }); add("Menu", () => { clear(); menu(); });
};
