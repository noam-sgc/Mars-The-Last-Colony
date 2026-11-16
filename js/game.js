/* Núcleo do jogo: modos Solo/Sandbox/Multi, jogador (WASD), colonos, tanques, missões e fim de fase. */
let G = { run: false, placed: [], mode: "", tool: "solar" };
let yaw = .8, pit = .7, dist = 30;
const ray = new THREE.Raycaster();
const PL = { g: null, x: 0, z: 4, ry: 0, v: 0 };
const colG = new THREE.Group(); sc.add(colG);
const peerG = {};
let COL = [];

function toast(msg, ms) { const d = document.createElement("div"); d.className = "toast"; d.innerHTML = msg; $("#toasts").appendChild(d); setTimeout(() => d.remove(), ms || 3200); }
function screen(id) { ["auth", "menu", "cat", "hud", "lob", "wait", "ward", "lbd", "soc"].forEach((s) => $("#" + s).classList.toggle("on", s == id)); $("#chb").classList.toggle("on", !!ACC.user && id != "auth" && id != "ward"); if (id != "hud") $("#hint").style.display = "none"; }
function clear() {
  G.placed.forEach((p) => sc.remove(p.m)); G.placed = [];
  for (const k in peerG) { sc.remove(peerG[k].g); delete peerG[k]; }
  COL.forEach((c) => colG.remove(c.g)); COL = []; if (PL.g) { sc.remove(PL.g); PL.g = null; }
}
const cnt = (t) => G.placed.filter((p) => p.t == t).length;

function setWeather() {
  const st = G.mode == "solo" && PH[G.ph] && PH[G.ph].storm, al = G.mode == "solo" && PH[G.ph] && PH[G.ph].alien;
  UFOS.visible = !!al; sc.fog.color.set(al ? 0x2a6b60 : st ? 0x4a1c10 : 0x9a4526); sky.material.uniforms.mid.value.set(al ? 0x2a8f86 : st ? 0x6a2a18 : 0xc8663a); sky.material.uniforms.top.value.set(al ? 0x08142a : 0x1a0d1e);
}
function start(mode, ph) {
  if (mode == "nav") return navStart(ph);
  navOff(); clear(); closeInterior(true);
  G = { run: true, placed: [], mode, ph, tool: "solar", mats: 1e9, paused: false, time: 0, hold: 0, rate: {}, tk: { water: 30, food: 30, oxy: 30, fuel: 30, morale: 30, eff: 30 }, msd: {}, st: { talk: 0, tidy: 0, enter: new Set(), contact: 0 }, lastTalk: {}, useRP: false };
  if (mode == "solo") G.time = PH[ph].t + B("time");
  buildHud(); screen("hud");
  $("#ht").style.display = mode == "solo" ? "" : "none"; $("#hr").style.display = mode == "solo" ? "" : "none"; $("#hs").style.display = mode == "mp" ? "none" : "";
  $("#gl").style.display = mode == "solo" || mode == "mp" ? "" : "none"; $("#pk").style.display = mode == "mp" ? "block" : "none";
  $("#hrt").textContent = "Usar: não"; yaw = .8; pit = .75; dist = 40; pal(); setWeather();
  PL.x = 0; PL.z = 6; PL.g = av(P.eq); PL.g.position.set(PL.x, H(PL.x, PL.z), PL.z); sc.add(PL.g);
  spawnColonists(); if (mode == "mp") mpBegin(); sync();
  if (mode == "solo" && PH[ph].alien) toast("👽 Fase pacífica: aproxime-se dos emissários verdes e converse.", 4500);
}
function spawnColonists() {
  const want = Math.min(10, 3 + 2 * cnt("hab")), alien = G.mode == "solo" && PH[G.ph].alien ? 3 : 0, have = COL.filter((c) => !c.alien).length;
  for (let i = have; i < want; i++) addColonist(false, i);
  if (alien && !COL.some((c) => c.alien)) for (let i = 0; i < alien; i++) addColonist(true, i);
}
function addColonist(alien, i) {
  const a = Math.random() * 6.28, r = 9 + Math.random() * 12, x = Math.cos(a) * r, z = Math.sin(a) * r, g = mkColonist(1000 + i * 77 + (alien ? 5000 : 0) + Math.floor(Math.random() * 999), alien);
  g.position.set(x, H(x, z), z); colG.add(g); COL.push({ g, x, z, tx: x, tz: z, wait: Math.random() * 3, alien, info: g.userData.info, mood: 60 + Math.random() * 40 });
}
function pal() {
  const p = $("#pal"); p.innerHTML = "";
  const add = (txt, tool) => { const b = document.createElement("button"); b.textContent = txt; b.className = G.tool == tool ? "sel" : ""; b.onclick = () => { G.tool = tool; pal(); }; p.appendChild(b); };
  partKeys().forEach((k) => { const t = TY[k]; if (t.alien && G.mode == "solo" && G.ph < ALIEN_START) return; add(t.n + (G.mode == "solo" ? " · " + cost(k) : ""), k); });
  add("🖐 Interagir", "use"); add("Demolir", "del");
  const c = document.createElement("input"); c.type = "color"; c.value = S.color; c.title = "Cor do habitat"; c.oninput = () => { S.color = c.value; save(); }; p.appendChild(c);
}
function place(x, z) {
  x = Math.round(x / 4) * 4; z = Math.round(z / 4) * 4; if (Math.abs(x) > 130 || Math.abs(z) > 130) return;
  if (G.placed.some((p) => Math.hypot(p.x - x, p.z - z) < 4.5)) return;
  const c = G.mode == "solo" ? cost(G.tool) : 0, r = G.useRP ? Math.min(P.rp, c) : 0; if (S.coins < c - r) { toast("Moedas insuficientes"); return; }
  S.coins -= c - r; P.rp -= r; save(); if (r) saveP();
  const m = mk(G.tool, S.color); m.position.set(x, H(x, z), z); sc.add(m); G.placed.push({ t: G.tool, x, z, m, a: Math.random() * 6, ord: .6 }); spawnColonists(); sync();
}
function ownerOf(o) { return G.placed.findIndex((p) => { for (let q = o; q; q = q.parent) if (q === p.m) return true; return false; }); }
function click(e) {
  const r = cv.getBoundingClientRect(); ray.setFromCamera(new THREE.Vector2((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height * 2 - 1)), cam);
  const hc = ray.intersectObjects(COL.map((c) => c.g), true)[0];
  if (hc) { const c = COL.find((q) => { for (let o = hc.object; o; o = o.parent) if (o === q.g) return true; return false; }); if (c && Math.hypot(c.g.position.x - PL.x, c.g.position.z - PL.z) < 14) return talk(c); toast("Aproxime-se do colono (WASD) para conversar"); return; }
  if (G.tool == "use") { const h = ray.intersectObjects(G.placed.map((p) => p.m), true)[0]; if (h) { const i = ownerOf(h.object); if (i >= 0) return tryEnter(G.placed[i]); } return; }
  if (G.tool == "del") {
    const h = ray.intersectObjects(G.placed.map((p) => p.m), true)[0];
    if (h) { const i = ownerOf(h.object); if (i >= 0) { const p = G.placed.splice(i, 1)[0]; sc.remove(p.m); if (G.mode == "solo") { S.coins += Math.floor(cost(p.t) / 2); save(); } sync(); } } return;
  }
  const h = ray.intersectObject(ter)[0]; if (h) place(h.point.x, h.point.z);
}
function nearestBuilding(r) { let b = null, d = r || 9; G.placed.forEach((p) => { const q = Math.hypot(p.x - PL.x, p.z - PL.z); if (q < d) { d = q; b = p; } }); return b; }
function tryEnter(p) { if (Math.hypot(p.x - PL.x, p.z - PL.z) > 11) { toast("Aproxime-se do edifício (WASD) e toque nele de novo"); return; } openInterior(p); }
INP.onE = () => {
  if (IN) return interiorUse();
  if (!G.run || G.mode == "nav" || DLG) return;
  const c = nearestColonist(); if (c) return talk(c); const b = nearestBuilding(); if (b) openInterior(b);
};
function nearestColonist() { let b = null, d = 7; COL.forEach((c) => { const q = Math.hypot(c.g.position.x - PL.x, c.g.position.z - PL.z); if (q < d) { d = q; b = c; } }); return b; }

// ---------- diálogo com colonos ----------
let DLG = null;
function talkLines(c) {
  const t = G.tk, low = K.slice().sort((a, b) => t[a] - t[b])[0];
  if (c.alien) return ["Paz entre mundos, colono. Seu povo constrói bem.", "Nossa nave canta quando sua colônia está em equilíbrio.", "Trouxemos sementes de luz. Podemos trocar?"][Math.floor(Math.random() * 3)];
  const mood = ["Estou animado, o dia está ótimo!", "Tudo sob controle por aqui.", "Cansei um pouco, mas seguimos."][c.mood > 80 ? 0 : c.mood > 50 ? 1 : 2];
  return mood + (t[low] < 40 ? ` Mas o nível de ${KN[low].toLowerCase()} está preocupante (${Math.floor(t[low])}%).` : "");
}
function talk(c) {
  if (!G.run || DLG || G.mode == "nav") return; DLG = c; if (G.mode != "mp") G.paused = true;
  const render = (extra) => {
    const key = c.info.name, cd = key in G.lastTalk && performance.now() - G.lastTalk[key] < 20000, low = K.slice().sort((a, b) => G.tk[a] - G.tk[b])[0];
    $("#dlgb").innerHTML = `<div class="dlgh"><div class="av">${c.alien ? "👽" : "🧑‍🚀"}</div><div><b>${esc(c.info.name)}</b><div class="mu">${esc(c.info.job)} · humor ${Math.round(c.mood)}%</div></div></div><p>${extra || esc(talkLines(c))}</p>
    <div class="opts"><button id="d1" ${cd ? "disabled" : ""}>💬 Conversar ${cd ? "(aguarde)" : "(+moral)"}</button><button id="d2">📋 Pedir relatório</button><button id="d3" ${S.coins < 10 || cd ? "disabled" : ""}>🎁 Presentear (10 🪙)</button><button id="d4" class="gh">Fechar</button></div>`;
    $("#d1").onclick = () => { G.lastTalk[key] = performance.now(); G.tk.morale = clamp(G.tk.morale + 5, 0, 100); c.mood = clamp(c.mood + 10, 0, 100); G.st.talk++; if (c.alien) G.st.contact++; toast(c.alien ? "👽 Contato pacífico! +5 moral" : "💬 Boa conversa! +5 moral"); render("Obrigado por parar para conversar!"); };
    $("#d2").onclick = () => render(`Nível mais baixo: <b>${KN[low]}</b> (${Math.floor(G.tk[low])}%). ${G.mode == "solo" ? "Faltam " + Math.max(0, Math.ceil(G.time)) + " s." : ""} Dica: construa ${(CP[low] || []).map((x) => TY[x].n).slice(0, 2).join(" ou ")}, e arrume os edifícios por dentro para render mais.`);
    $("#d3").onclick = () => { S.coins -= 10; save(); G.lastTalk[key] = performance.now(); G.tk.morale = clamp(G.tk.morale + 9, 0, 100); c.mood = clamp(c.mood + 25, 0, 100); G.st.talk++; if (c.alien) G.st.contact++; toast("🎁 Presente entregue! +9 moral"); render("Que gentileza! Vou lembrar disso."); };
    $("#d4").onclick = closeDlg;
  };
  render(); $("#dlg").classList.add("on");
}
function closeDlg() { if (!DLG) return; DLG = null; $("#dlg").classList.remove("on"); if (G.mode != "mp" && !IN) G.paused = shopOpen(); }
const shopOpen = () => $("#shop").classList.contains("on");

// ---------- tanques ----------
const CP = { eff: ["solar", "solar", "ctrl"], water: ["drill", "purif"], food: ["green", "hydro"], oxy: ["oxy"], fuel: ["fuel"], morale: ["rec"] };
function stepTanks(tk, rate, items, crew, dt, storm, ups) {
  const pn = (tk.eff < 20 || tk.morale < 15) ? .6 : 1, pr = {}; K.forEach((k) => (pr[k] = 0));
  items.forEach((it) => { const t = TY[it.t]; if (!t || t.k == "crew") return; pr[t.k] += t.p * (t.k == "eff" ? (storm ? .5 : 1) : pn) * (it.o == null ? 1 : .75 + .5 * it.o); });
  K.forEach((k) => { const net = pr[k] * (1 + (ups ? B2("pm", k) : 0)) - CO[k] * crew * (1 - (ups ? B2("cr", k) : 0)); rate[k] = net; tk[k] = clamp(tk[k] + net * dt, 0, 100); });
}
function tank(dt) {
  const st = G.mode == "solo" && PH[G.ph].storm, items = mpItems() || G.placed.map((p) => ({ t: p.t, o: p.ord })), habs = items.filter((i) => i.t == "hab").length, crew = 2 + 3 * habs;
  stepTanks(G.tk, G.rate, items, crew, dt, st, true);
  const dec = dt / (400 * (1 + B("tidy"))); G.placed.forEach((p) => { p.ord = Math.max(0, p.ord - dec); });
}
const mpItems = () => (G.mode == "mp" ? mpMyItems() : null);

// ---------- missões ----------
function msProg(m) {
  switch (m.id) {
    case "talk": return G.st.talk; case "tidy": return G.st.tidy; case "enter": return G.st.enter.size; case "rec": return cnt("rec"); case "rover": return cnt("rover");
    case "morale": return G.time < PH[G.ph].t - 15 + B("time") ? Math.floor(G.tk.morale) : 0; case "contact": return G.st.contact;
  } return 0;
}
function missions(dt) {
  if (G.mode != "solo") return;
  PH[G.ph].ms.forEach((m) => { if (G.msd[m.id]) return; if (msProg(m) >= m.n) { G.msd[m.id] = 1; const v = earn(m.rw); save(); toast(`🎯 Missão cumprida: ${esc(m.txt)} · +${Math.round(v)} 🪙`, 4200); } });
}
function goals() {
  const ph = PH[G.ph], hb = cnt("hab") >= ph.hab; let ok = hb, s = `<b>Objetivos</b><div class="${hb ? "dn" : ""}">${hb ? "✔" : "○"} Habitats ${Math.min(cnt("hab"), ph.hab)}/${ph.hab}</div>`;
  Object.keys(ph.need).forEach((k) => { const n = G.placed.filter((p) => TY[p.t].k == k && !TY[p.t].alien).length, d = n >= ph.need[k] && G.tk[k] >= ph.tg; if (!d) ok = false; s += `<div class="${d ? "dn" : ""}">${d ? "✔" : "○"} ${KN[k]}: peças ${Math.min(n, ph.need[k])}/${ph.need[k]} · nível ${Math.floor(G.tk[k])}/${ph.tg}</div>`; });
  Object.keys(ph.parts).forEach((k) => { const n = cnt(k), d = n >= ph.parts[k]; if (!d) ok = false; s += `<div class="${d ? "dn" : ""}">${d ? "✔" : "○"} ${TY[k].n}: ${Math.min(n, ph.parts[k])}/${ph.parts[k]}</div>`; });
  s += `<div>Mantenha tudo por 5 s${G.hold > 0 ? " (" + G.hold.toFixed(1) + ")" : ""}</div>`;
  s += `<div class="tag" style="margin-top:6px">Missões bônus</div>` + ph.ms.map((m) => { const d = G.msd[m.id], p = Math.min(m.n, msProg(m)); return `<div class="${d ? "dn" : ""}">${d ? "✔" : "○"} ${esc(m.txt)} ${m.id == "morale" ? "" : p + "/" + m.n} <span class="mu">+${m.rw}🪙</span></div>`; }).join("");
  $("#gl").innerHTML = s; return ok;
}
function win() {
  const ph = PH[G.ph], avg = Math.round(K.reduce((a, k) => a + G.tk[k], 0) / 6); G.avg = avg; G.rank = avg >= 70 ? "Vitória excelente!" : avg >= 45 ? "Vitória estável" : "Vitória crítica";
  const raw = Math.round(ph.r * (1 + B("rw")) * (.7 + avg / 100 * .6) + Math.max(0, G.time)), rw = Math.round(earn(raw)); S.done[G.ph] = 1; save(); P.cr += 5; P.rp += 10 + 3 * G.ph; saveP(); end(true, rw);
}
function end(w, rw) {
  G.run = false; closeDlg(); $("#rt").textContent = w ? G.rank : G.why;
  const done = G.mode == "solo" ? PH[G.ph].ms.filter((m) => G.msd[m.id]).length + "/" + PH[G.ph].ms.length : "";
  $("#rp").innerHTML = w ? `Média dos tanques: ${G.avg}%. Você ganhou <b>${rw}</b> moedas${EV.mult > 1 ? ` (evento x${EV.mult} aplicado!)` : ""}; quanto mais cheios os tanques, maior o prêmio.<br>Pesquisa: +${10 + 3 * G.ph} RP · Missões bônus: ${done}.` : "A colônia não sustentou os tanques. Construa as peças de cada classe, arrume os edifícios por dentro ou compre upgrades.";
  const b = $("#rb"); b.innerHTML = ""; const add = (t, f) => { const x = document.createElement("button"); x.textContent = t; x.onclick = () => { $("#res").classList.remove("on"); f(); }; b.appendChild(x); };
  if (w && G.ph < PH.length - 1) add("Próxima fase", () => { const q = PH[G.ph + 1]; start(q.nav ? "nav" : "solo", G.ph + 1); }); else if (w) add("Ver final", () => fin(SV.fb)); else if (S.coins < 20) add("Ver final", () => fin(SV.fr)); else add("Tentar de novo", () => start(PH[G.ph].nav ? "nav" : "solo", G.ph));
  add("Loja", () => { menu(); shop(true); }); add("Catálogo", () => { clear(); cat(); }); $("#res").classList.add("on");
}
function tick(dt) {
  if (G.mode == "nav") { navTick(dt); return; }
  tank(dt); if (G.mode == "mp") mpTick(dt); if (G.mode != "solo") return;
  earn((1 + B("inc")) * dt); G.time -= dt; missions(dt);
  if (G.tk.oxy <= 0 || G.tk.water <= 0) { G.why = "Colapso: " + (G.tk.oxy <= 0 ? "sem oxigênio" : "sem água"); end(false); }
  else if (goals()) { G.hold += dt; if (G.hold >= 5) win(); } else G.hold = 0;
  if (G.run && G.time <= 0) { G.why = "Tempo esgotado"; end(false); }
}
function hud() {
  if (G.mode == "nav") { navHud(); return; }
  $("#hc").textContent = Math.floor(S.coins); $("#hrv").textContent = P.rp; if (G.mode == "solo") $("#ht").textContent = "⏱ " + Math.max(0, Math.ceil(G.time)) + " s";
  $("#tk").innerHTML = K.map((k) => `<div class="tb"><span>${KN[k]}</span><u><i style="width:${G.tk[k]}%;background:${TC[k]}"></i></u><em>${(G.rate[k] || 0) >= 0 ? "▲" : "▼"}</em><b style="width:36px;text-align:right">${Math.floor(G.tk[k])}%</b></div>`).join("");
  if (G.mode == "solo" && !G.paused) goals();
  const h = $("#hint"), c = nearestColonist(), b = nearestBuilding();
  if (c && !DLG) { h.textContent = `E · conversar com ${c.info.name}`; h.style.display = "block"; } else if (b) { h.textContent = `E · entrar em ${TY[b.t].n} (ordem ${Math.round(b.ord * 100)}%)`; h.style.display = "block"; } else h.style.display = "none";
}

// ---------- câmera e movimento ----------
function camU() {
  const tx = PL.x, tz = PL.z, ty = H(tx, tz) + 2.2;
  cam.position.set(tx + dist * Math.cos(pit) * Math.sin(yaw), ty + dist * Math.sin(pit), tz + dist * Math.cos(pit) * Math.cos(yaw));
  cam.lookAt(tx, ty, tz);
}
function movePlayer(dt, t) {
  if (!PL.g || DLG || (G.paused && G.mode != "mp") || IN) return;
  const [ax, ay] = INP.ax(), len = Math.hypot(ax, ay), s = Math.sin(yaw), c = Math.cos(yaw);
  let mx = 0, mz = 0; if (len > .05) { const k = Math.min(1, len); mx = (-s * ay + c * ax) / len * k; mz = (-c * ay - s * ax) / len * k; }
  PL.x = clamp(PL.x + mx * 9 * dt, -125, 125); PL.z = clamp(PL.z + mz * 9 * dt, -125, 125);
  G.placed.forEach((p) => { const dx = PL.x - p.x, dz = PL.z - p.z, d = Math.hypot(dx, dz); if (d < 3.1 && d > 0) { PL.x = p.x + dx / d * 3.1; PL.z = p.z + dz / d * 3.1; } });
  PL.v = Math.hypot(mx, mz); if (PL.v > .05) { const a = Math.atan2(mx, mz); let d = a - PL.ry; d = Math.atan2(Math.sin(d), Math.cos(d)); PL.ry += d * Math.min(1, dt * 12); }
  PL.g.position.set(PL.x, H(PL.x, PL.z), PL.z); PL.g.rotation.y = PL.ry; walkAnim(PL.g, t, PL.v);
}
function moveColonists(dt, t) {
  COL.forEach((c) => {
    const p = c.g.position; c.wait -= dt; let mv = 0;
    if (c.wait <= 0) { const dx = c.tx - p.x, dz = c.tz - p.z, d = Math.hypot(dx, dz); if (d < .5) { c.wait = 2 + Math.random() * 5; const a = Math.random() * 6.28, r = 6 + Math.random() * 22; c.tx = clamp(Math.cos(a) * r, -60, 60); c.tz = clamp(Math.sin(a) * r, -60, 60); } else { const sp = c.alien ? 1.6 : 2.1; if (!DLG || DLG !== c) { p.x += dx / d * sp * dt; p.z += dz / d * sp * dt; c.g.rotation.y = Math.atan2(dx, dz); mv = 1; } } }
    p.y = H(p.x, p.z) + (c.alien ? .35 + .15 * Math.sin(t * 3) : 0); walkAnim(c.g, t + c.mood, mv);
  });
}
