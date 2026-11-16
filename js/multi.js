/* Multiplayer: salas (cooperativo, equipes, todos contra todos), bots ilimitados, grupos e chat de sala. */
const MODES = { coop: { n: "Cooperativo", d: "Todos juntos: tanques compartilhados. Meta: tudo ≥ 50% por 30 s.", ic: "🤝" }, team: { n: "Equipes", d: "Duas equipes disputam: vence quem estabilizar primeiro ou tiver a maior pontuação em 8 min.", ic: "⚔️" }, ffa: { n: "Todos contra todos", d: "Cada um com sua colônia: maior pontuação em 6 min vence.", ic: "🏁" } };
const TEAMS = [{ n: "Equipe Ares", col: 0xff6a2b, css: "#ff6a2b" }, { n: "Equipe Phobos", col: 0x3aa0ff, css: "#3aa0ff" }];
const LIMIT = { coop: 0, team: 480, ffa: 360 };
let MP = { peers: [], bots: [], botP: {}, sims: {}, bc: 0 }, LP = [], sT = 0, MPmode = "coop";
const rc = () => Math.random().toString(36).slice(2, 6).toUpperCase();
const room = () => (MP.room ? "g-" + MP.code : null);
const mpSend = (patch) => { if (MP.room && NET.ready && ACC.user) NET.send({ t: "pres", room: "g-" + MP.code, patch }); };

// ---------- bots ilimitados ----------
const BN = "Aurora,Cratera,Valles,Olympus,Phobos,Deimos,Hellas,Tharsis,Utopia,Gale,Jezero,Elysium,Arcadia,Syrtis,Noctis,Argyre,Isidis,Cerberus,Medusa,Amazonis,Acidalia,Chryse,Xanthe,Sinai,Lunae,Aonia,Thaumasia,Daedalia,Solis,Margaritifer,Meridiani,Sirenum,Eridania,Ismenius,Boreum,Cydonia,Zephyria,Hesperia,Promethei,Malea".split(",");
function botDef(i) {
  const s = ["s1", "s2", "s3", "s4", "s5", "s6"], p = ["p1", "p2", "p3"], w = ["w0", "w1", "w2", "w3"], h = ["h0", "h1", "h2", "h3"], b = ["b0", "b1", "b2", "b3"];
  return { i, n: "Bot-" + BN[i % BN.length] + (i >= BN.length ? Math.floor(i / BN.length) + 1 : ""), lv: 1 + i % 5, sp: CL[i % 6], tm: i % 2, e: { s: s[i % s.length], p: p[i % 3], w: w[i % 4], h: h[(i >> 1) % 4], b: b[(i >> 2) % 4] } };
}
const botCap = () => clamp(Math.floor(400 / Math.max(1, MP.bc)), 1, 14);

// ---------- entidades (humanos + bots) ----------
const humans = () => {
  const l = (MP.peers || []).filter((p) => p.presence && p.presence.u != null);
  if (!l.some((p) => p.isMe || p.peer === NET.id)) l.push({ isMe: true, peer: "~", presence: { u: ACC.user || P.name || "Colono", jt: MP.jt, e: P.eq, tm: MP.tm, vf: ACC.vf, cc: ACC.cc, rl: ACC.role } });
  l.forEach((p) => { if (p.peer === NET.id) p.isMe = true; });
  return l.slice().sort((a, b) => ((a.presence.jt || 0) - (b.presence.jt || 0)) || (a.peer < b.peer ? -1 : 1));
};
const isHost = () => { const h = humans()[0]; return !!h && !!h.isMe; };
const mpMode = () => { const h = humans()[0]; return (h && h.presence && h.presence.md) || MPmode; };
const hostBc = () => { const h = humans()[0]; return h ? (h.isMe ? MP.bc : +h.presence.bc || 0) : 0; };
function entities() {
  const out = [], hs = humans(), host = hs[0];
  hs.forEach((p) => out.push({ id: p.peer, u: p.presence.u, tm: +p.presence.tm || 0, me: !!p.isMe, e: p.presence.e || DEF_EQ, vf: p.presence.vf, cc: p.presence.cc, rl: p.presence.rl, items: p.isMe ? G.placed.map((q) => ({ t: q.t, x: q.x, z: q.z, o: q.ord })) : arr(p.presence.b) }));
  const n = hostBc(), by = {};
  if (host && host.isMe) Object.keys(MP.botP).forEach((i) => (by[i] = MP.botP[i])); else ((host && host.presence.bb) || []).forEach((r) => { if (Array.isArray(r)) (by[r[0]] = by[r[0]] || []).push({ t: tdecode(r[1]), x: +r[2] || 0, z: +r[3] || 0 }); });
  for (let i = 0; i < n; i++) { const d = botDef(i); out.push({ id: "bot" + i, u: d.n, tm: d.tm, bot: true, e: d.e, lv: d.lv, sp: d.sp, i, items: (by[i] || []).filter((q) => q.t) }); }
  return out;
}
const arr = (a) => (Array.isArray(a) ? a.slice(0, 80).filter(Array.isArray).map((r) => ({ t: tdecode(r[0]), x: +r[1] || 0, z: +r[2] || 0 })).filter((r) => r.t) : []);
const myTeam = () => MP.tm || 0;
/** Peças que contam para os tanques do jogador local, conforme o modo. */
function mpMyItems() {
  const md = mpMode(), ents = MP.ents || [], mine = G.placed.map((p) => ({ t: p.t, o: p.ord }));
  if (md == "ffa") return mine;
  const others = ents.filter((e) => !e.me && (md == "coop" || e.tm == myTeam())).flatMap((e) => e.items.map((i) => ({ t: i.t })));
  return mine.concat(others);
}
const simCrew = (items) => 2 + 3 * items.filter((i) => i.t == "hab").length;
const avgTk = (tk) => Math.round(K.reduce((a, k) => a + tk[k], 0) / 6);
function scoreOf(ent, tk) { return avgTk(tk) * 10 + ent.items.length * 2; }

// ---------- sala ----------
function mpBegin() { MP.started = true; MP.t0 = performance.now(); MP.sims = {}; MP.holds = {}; MP.cT = 0; MP.th = 0; G.time = LIMIT[mpMode()] || 0; MP.ents = entities(); $("#pk").style.display = "block"; peersUpdate(); }
function mpStop() {
  clearInterval(MP.iv); if (MP.room && NET.ready && ACC.user) { NET.send({ t: "leave", room: "g-" + MP.code }); NET.send({ t: "pres", room: "lobby", patch: { g: null, u: null, n: null, bt: null, st: null, md: null } }); }
  MP = { peers: [], bots: [], botP: {}, sims: {}, bc: 0 }; chatSetRoom(false);
}
function lobPres() {
  if (!MP.room || !NET.ready || !ACC.user) return;
  const v = isHost() ? { g: MP.code, u: ACC.user, n: humans().length, bt: hostBc(), st: MP.started ? 1 : 0, md: mpMode() } : { g: null, u: null, n: null, bt: null, st: null, md: null }, s = JSON.stringify(v);
  if (s == MP.ls) return; MP.ls = s; NET.send({ t: "pres", room: "lobby", patch: v });
}
function sync() {
  if (!MP.room || !NET.ready || !ACC.user) return; clearTimeout(sT);
  sT = setTimeout(() => { const hs = isHost(), f = (a) => a.map((q) => [tcode(q.t), Math.round(q.x), Math.round(q.z)]);
    const patch = { u: ACC.user, jt: MP.jt, e: P.eq, tm: MP.tm, k: G.placed ? G.placed.length : 0, st: MP.started ? 1 : 0, b: f(G.placed.slice(-60)) };
    if (hs) { patch.md = MPmode; patch.bc = MP.bc; patch.bb = []; Object.keys(MP.botP).forEach((i) => MP.botP[i].slice(-botCap()).forEach((q) => { if (patch.bb.length < 420) patch.bb.push([+i, tcode(q.t), Math.round(q.x), Math.round(q.z)]); })); }
    mpSend(patch); lobPres(); }, 150);
}
// diferença incremental de peças de outros jogadores (evita recriar tudo)
const LOWC = { eff: 0xffd84a, water: 0x4aa3ff, food: 0x6fd45a, oxy: 0x7fe3ff, fuel: 0xff9a3c, morale: 0xd78bff, crew: 0xdfe9f2 };
function mkLow(t, col) { const g = new THREE.Group(), c = TY[t] ? LOWC[TY[t].k] : 0xcccccc, m = new THREE.Mesh(t == "hab" ? new THREE.CylinderGeometry(1.8, 1.8, 3.4, 10) : new THREE.CylinderGeometry(1.2, 1.5, 2.6, 8), new THREE.MeshLambertMaterial({ color: t == "hab" ? col : c })); m.position.y = 1.4; g.add(m); return g; }
function dgDiff(key, items, col) {
  let e = peerG[key]; if (!e) { e = peerG[key] = { g: new THREE.Group(), m: new Map(), col }; sc.add(e.g); }
  const want = new Map(items.map((a) => [a.t + "|" + a.x + "|" + a.z, a]));
  for (const [k, o] of e.m) if (!want.has(k)) { e.g.remove(o); e.m.delete(k); }
  let full = 0; e.m.forEach((o) => { if (o.userData.full) full++; });
  for (const [k, a] of want) if (!e.m.has(k)) { const hi = full < 40; const o = hi ? mk(a.t, col) : mkLow(a.t, col); o.userData.full = hi; if (hi) full++; o.position.set(a.x, H(a.x, a.z), a.z); e.g.add(o); e.m.set(k, o); }
}
function avatarsMP(list) {
  const sig = JSON.stringify(list.map((a) => [a.u, a.e, a.vf, a.tm])); if (peerG.av && peerG.av.s == sig) return; if (peerG.av) sc.remove(peerG.av.g);
  const g = new THREE.Group(); list.forEach((a, i) => { const an = i * 6.283 / Math.max(list.length, 1) + .5, x = Math.cos(an) * 10, z = Math.sin(an) * 10, v = av(a.e || {}); v.position.set(x, H(x, z), z); v.rotation.y = -an + 1.57; g.add(v);
    const l = lab((a.bot ? "🤖 " : "") + String(a.u || "?").slice(0, 16), { flag: a.cc ? MarsRules.flag(a.cc) : "", badge: a.rl == "admin" || a.rl == "artist" ? "adm" : a.vf ? "vf" : "", col: mpMode() != "coop" ? TEAMS[a.tm || 0].css : "#fff" }); l.position.set(x, H(x, z) + 5.4, z); g.add(l); });
  sc.add(g); peerG.av = { g, s: sig };
}
function peersUpdate() {
  if (G.mode != "mp" && !MP.waiting) return; const ents = (MP.ents = entities()), md = mpMode();
  ents.forEach((e) => { if (e.me) return; const col = md == "coop" ? (e.bot ? 0x8affc0 : 0x6fa8ff) : TEAMS[e.tm || 0].col; dgDiff(e.id, e.items, col); });
  for (const k in peerG) if (k != "av" && !ents.some((e) => e.id == k)) { sc.remove(peerG[k].g); delete peerG[k]; }
  if (G.mode == "mp") { avatarsMP(ents.filter((e) => !e.me).slice(0, 24).concat(ents.filter((e) => e.me))); renderPk(); }
  if (!MP.started && !isHost()) { const h = humans()[0]; if (h && h.presence.st) startMP(); }
}
function renderPk() {
  const ents = MP.ents || [], md = mpMode(), rows = scoreRows(ents);
  const nm = (e) => `${e.cc ? MarsRules.flag(e.cc) + " " : ""}${e.bot ? "🤖 " : ""}${esc(String(e.u).slice(0, 14))}${e.vf || e.rl == "admin" || e.rl == "artist" ? vfBadge(e.rl) : ""}`;
  let s = `<b>Sala ${esc(MP.code || "")}</b> · ${MODES[md].ic} ${MODES[md].n}${G.time > 0 ? `<br>⏱ ${Math.floor(G.time / 60)}:${String(Math.floor(G.time % 60)).padStart(2, "0")}` : ""}<br>`;
  if (md == "team") s += TEAMS.map((t, i) => { const r = rows.teams[i]; return `<div style="color:${t.css}"><b>${t.n}</b> · pts ${r ? r.score : 0}</div>`; }).join("");
  const list = rows.ents.slice(0, 12); s += list.map((r, i) => `<div style="${md != "coop" ? "color:" + TEAMS[r.e.tm || 0].css : ""}">${i + 1}. ${nm(r.e)}${r.e.me ? " (você)" : ""} · ${r.score}</div>`).join("");
  if (rows.ents.length > 12) s += `<div class="mu">+${rows.ents.length - 12} participantes</div>`; $("#pk").innerHTML = s;
}
function scoreRows(ents) {
  const md = mpMode(), out = { ents: [], teams: [] };
  ents.forEach((e) => { const tk = e.me ? G.tk : (MP.sims["e" + e.id] || { tk: { water: 30, food: 30, oxy: 30, fuel: 30, morale: 30, eff: 30 } }).tk; out.ents.push({ e, score: md == "ffa" ? scoreOf(e, tk) : e.items.length * 2 + (md == "coop" ? avgTk(G.tk) : 0) }); });
  if (md == "team") TEAMS.forEach((t, i) => { const s = MP.sims["t" + i], tk = i == myTeam() ? G.tk : (s ? s.tk : null); out.teams[i] = { score: tk ? avgTk(tk) * 10 + ents.filter((e) => e.tm == i).reduce((a, e) => a + e.items.length * 2, 0) : 0 }; });
  out.ents.sort((a, b) => b.score - a.score); return out;
}

// ---------- bots (lógica do anfitrião) ----------
function scopeTk(e) { const md = mpMode(); if (md == "coop") return G.tk; if (md == "team") return e.tm == myTeam() ? G.tk : (MP.sims["t" + e.tm] || { tk: G.tk }).tk; return (MP.sims["e" + e.id] || { tk: G.tk }).tk; }
function botThink(b, ents) {
  const mine = MP.botP[b.i] = MP.botP[b.i] || [], cap = botCap(); if (mine.length >= cap) return false;
  const me = ents.find((e) => e.id == "bot" + b.i); if (!me) return false; const tk = scopeTk(me), all = ents.flatMap((e) => e.items).concat(G.placed.map((q) => ({ t: q.t, x: q.x, z: q.z }))), habs = me.items.filter((a) => a.t == "hab").length;
  const srt = K.slice().sort((x, y) => tk[x] - tk[y]), cl = Math.random() < .5 + b.lv * .09 ? srt[0] : (tk[b.sp] < 70 ? b.sp : K[Math.floor(Math.random() * 6)]);
  const t = habs < 1 + Math.floor(me.items.length / 8) ? "hab" : CP[cl][Math.floor(Math.random() * CP[cl].length)];
  const idx = b.i, tries = 24;
  for (let k = 0; k < tries; k++) { const a = idx * 2.399 + k * .52 + me.items.length * .31, r = 16 + Math.sqrt(idx + 1) * 6.5 + Math.floor(k / 8) * 4 + me.items.length * .8, x = Math.round(Math.cos(a) * r / 4) * 4, z = Math.round(Math.sin(a) * r / 4) * 4;
    if (Math.abs(x) > 130 || Math.abs(z) > 130 || all.some((q) => Math.hypot(q.x - x, q.z - z) < 4.5)) continue; mine.push({ t, x, z }); return true; }
  return false;
}
function mpTick(dt) {
  MP.cT += dt; if (MP.cT >= 10) { MP.cT = 0; P.cr++; saveP(); }
  const md = mpMode(), ents = MP.ents || [];
  if (isHost() && MP.bc > 0) { MP.bt = (MP.bt || 0) - dt; if (MP.bt <= 0) { MP.bt = .35; let ch = false, n = 0; for (let q = 0; q < Math.min(6, MP.bc); q++) { const i = (MP.bi = ((MP.bi || 0) + 1) % MP.bc), d = botDef(i); d.cd = MP.cd && MP.cd[i] || 0; MP.cd = MP.cd || {}; MP.cd[i] = (MP.cd[i] || 0) - .35 * Math.min(6, MP.bc); if (MP.cd[i] <= 0) { MP.cd[i] = 6 - d.lv * .8 + Math.random() * 2; if (botThink(d, ents)) { ch = true; n++; } } } if (ch) { peersUpdate(); sync(); } } }
  // simulações dos demais (outras equipes / outros jogadores)
  if (md != "coop") { const scopes = md == "team" ? TEAMS.map((t, i) => ({ k: "t" + i, tm: i })) : ents.filter((e) => !e.me).map((e) => ({ k: "e" + e.id, e }));
    scopes.forEach((s) => { if (md == "team" && s.tm == myTeam()) return; const sim = (MP.sims[s.k] = MP.sims[s.k] || { tk: { water: 30, food: 30, oxy: 30, fuel: 30, morale: 30, eff: 30 }, rate: {} }); const items = md == "team" ? ents.filter((e) => !e.me && e.tm == s.tm).flatMap((e) => e.items) : s.e.items; stepTanks(sim.tk, sim.rate, items, simCrew(items), dt, false, false); }); }
  const need = md == "ffa" ? 60 : 50, ok = K.every((k) => G.tk[k] >= need); G.hold = ok ? G.hold + dt : 0;
  const goal = md == "ffa" ? 20 : 30, simOk = (s) => s && K.every((k) => s.tk[k] >= 50);
  let winner = null; if (md == "coop") { if (G.hold >= goal) winner = "coop"; } else if (md == "team") { MP.holds = MP.holds || {}; TEAMS.forEach((t, i) => { const tk = i == myTeam() ? G.tk : (MP.sims["t" + i] || {}).tk, o = tk && K.every((k) => tk[k] >= 50); MP.holds[i] = o ? (MP.holds[i] || 0) + dt : 0; if (MP.holds[i] >= goal && winner == null) winner = i; }); } else if (G.hold >= goal) winner = "me";
  if (md != "coop") { G.time -= dt; if (G.time <= 0) winner = winner == null ? "time" : winner; }
  const extra = md == "coop" ? "" : `<div>⏱ ${Math.max(0, Math.ceil(G.time))} s</div>`;
  $("#gl").innerHTML = `<b>${MODES[md].ic} ${MODES[md].n}</b><div class="mu">${md == "coop" ? "Todos os tanques ≥ 50% por 30 s" : md == "team" ? "Estabilize sua equipe primeiro (≥ 50% por 30 s) ou lidere em pontos" : "Tanques ≥ 60% por 20 s ou maior pontuação ao fim"}</div><div class="${ok ? "dn" : ""}">${ok ? "✔" : "○"} ${G.hold.toFixed(0)}/${goal} s</div>${extra}<div>Créditos: ${P.cr}</div>`;
  if (winner != null && G.run) mpWin(winner);
  MP.th = (MP.th || 0) + dt; if (MP.th > 1) { MP.th = 0; renderPk(); }
}
function mpWin(winner) {
  G.run = false; closeInterior(); const md = mpMode(), ents = MP.ents || entities(), rows = scoreRows(ents), avg = avgTk(G.tk);
  let won = false, title = "Fim de partida";
  if (md == "coop") { won = true; title = "Colônia cooperativa estabilizada!"; }
  else if (md == "team") { const w = typeof winner == "number" ? winner : (rows.teams[0].score >= rows.teams[1].score ? 0 : 1); won = w == myTeam(); title = `${TEAMS[w].n} venceu!`; }
  else { const top = rows.ents[0]; won = !!top && top.e.me; title = top ? `${top.e.bot ? "🤖 " : ""}${top.e.u} venceu!` : "Fim"; }
  const myRank = rows.ents.findIndex((r) => r.e.me) + 1, mine = G.placed.length, mvp = md == "coop" && ents.every((e) => e.me || e.items.length <= mine);
  const cr = (won ? 30 : 10) + Math.round(avg / 4), pp = won ? 20 + Math.round(avg / 5) + (mvp ? 10 : 0) : 5, coins = Math.round(earn(won ? 100 : 30));
  P.cr += cr; P.pp += pp; if (won) P.w = (P.w || 0) + 1; save(); saveP(); if (won) lbWin(pp, mine * 10 + avg);
  $("#rt").textContent = title; $("#rp").innerHTML = `${won ? "🏆 Vitória! " : ""}Média dos tanques: ${avg}%. Sua posição: ${myRank}º de ${rows.ents.length}.${mvp ? " Você foi o MVP!" : ""}<br>Ganhou ${coins} moedas${EV.mult > 1 ? ` (evento x${EV.mult})` : ""}, ${cr} créditos e ${pp} PP.<br><div class="mu" style="margin-top:6px">${rows.ents.slice(0, 5).map((r, i) => `${i + 1}. ${r.e.bot ? "🤖 " : ""}${esc(r.e.u)} — ${r.score}`).join("<br>")}</div>`;
  const b = $("#rb"); b.innerHTML = ""; [["Guarda-roupa", () => { mpStop(); ward(); }], ["Leaderboard", () => { mpStop(); board(); }], ["Menu", () => menu()]].forEach(([t, f]) => { const x = document.createElement("button"); x.textContent = t; x.onclick = () => { $("#res").classList.remove("on"); f(); }; b.appendChild(x); }); $("#res").classList.add("on");
}
async function lbGet() { const r = await NET.ask({ t: "lb" }); return r.ok ? r.rows : []; }
function lbWin(pp, score) { if (ACC.user) NET.send({ t: "win", pp, score }); }
async function board() {
  screen("lbd"); const l = $("#lbl"); l.textContent = "Carregando…"; const a = (await lbGet()).sort((x, y) => (y.pp || 0) - (x.pp || 0) || (y.wins || 0) - (x.wins || 0)).slice(0, 20); l.innerHTML = "";
  if (!a.length) { l.textContent = "Nenhuma vitória registrada ainda."; return; }
  a.forEach((r, i) => { const d = document.createElement("div"); d.className = "up"; d.innerHTML = `<div>${i + 1}. ${esc(String(r.name || "?").slice(0, 16))}</div><span>${+r.wins || 0} vitórias · ${+r.pp || 0} PP</span>`; l.appendChild(d); });
}
$("#lbb").onclick = () => menu();

// ---------- lobby e sala de espera ----------
function lobbyPlayer() { return `${MarsRules.flag(ACC.cc)} <b>${esc(ACC.user)}</b>${vfBadge(ACC.role, ACC.vf)}${roleChip(ACC.role)}`; }
function renderLobby() {
  const el = $("#lob"); if (!el.classList.contains("on")) return; const gs = LP.filter((q) => !(q.peer === NET.id) && q.presence && q.presence.g);
  if (!el.dataset.built) { el.dataset.built = 1; el.innerHTML = `<div class="top"><button id="lb">← Voltar</button><h2>Multiplayer</h2></div><div class="pill w" id="lacc"></div>
    <div class="pill w"><b>Modo da partida</b><div class="row" id="lmodes" style="margin-top:6px"></div><p class="mu" id="lmd" style="margin:6px 0 0"></p></div>
    <div class="top w"><button id="lq" class="pri">Entrar rápido</button><button id="lc">Criar sala</button><button id="lo">Jogar com bots</button><button id="lsoc">👥 Amigos & grupo</button></div><div id="lg" class="w"></div>`;
    $("#lb").onclick = () => menu(); $("#lq").onclick = () => { const g = LP.find((q) => !(q.peer === NET.id) && q.presence && q.presence.g && (+q.presence.n || 0) < 8 && !q.presence.st); joinGame(g ? g.presence.g : rc(), g ? g.presence.md : null); };
    $("#lc").onclick = () => joinGame(rc()); $("#lo").onclick = () => localMatch(); $("#lsoc").onclick = () => social();
    const md = $("#lmodes"); Object.keys(MODES).forEach((k) => { const b = document.createElement("button"); b.dataset.k = k; b.textContent = MODES[k].ic + " " + MODES[k].n; b.onclick = () => { MPmode = k; renderLobby(); }; md.appendChild(b); }); }
  $("#lacc").innerHTML = ACC.user ? `Jogando como ${lobbyPlayer()} · Créditos: <b>${P.cr}</b>${MP.party ? "" : ""}` : "Entre numa conta para jogar online. Você ainda pode jogar contra bots.";
  [...$("#lmodes").children].forEach((b) => (b.className = b.dataset.k == MPmode ? "sel" : "")); $("#lmd").textContent = MODES[MPmode].d;
  const l = $("#lg"); l.innerHTML = `<b>Partidas ao vivo (${gs.length})</b>`; if (!gs.length) l.innerHTML += `<p class="mu">Nenhuma partida ao vivo agora. Crie uma sala: bots completam a equipe se ninguém entrar.</p>`;
  gs.forEach((q) => { const r = q.presence, d = document.createElement("div"); d.className = "up"; d.innerHTML = `<div><b>Sala ${esc(r.g)}</b> · ${MODES[r.md] ? MODES[r.md].ic + " " + MODES[r.md].n : "Cooperativo"}<p>Anfitrião ${esc(String(r.u).slice(0, 16))} · ${+r.n || 0} jogador(es) + ${+r.bt || 0} bot(s) · ${r.st ? "em jogo" : "aguardando"}</p></div>`; const b = document.createElement("button"); b.textContent = "Entrar"; b.onclick = () => joinGame(r.g, r.md); d.appendChild(b); l.appendChild(d); });
}
async function lobby() { screen("lob"); $("#lob").dataset.built = ""; renderLobby(); if (!ACC.user) toast("Entre numa conta para ver partidas ao vivo"); }
NET.on("peers", (m) => { if (m.room == "lobby") { LP = m.peers; renderLobby(); } else if (MP.room && m.room == "g-" + MP.code) { MP.peers = m.peers.map((p) => Object.assign({}, p, { isMe: p.peer === NET.id })); peersUpdate(); lobPres(); } });
function localMatch() {
  mpStop(); MP = { peers: [], bots: [], botP: {}, sims: {}, bc: 0, code: "LOCAL", jt: Date.now(), room: null, manual: true, waiting: true, tm: 0 }; MPmode = MPmode || "coop"; screen("wait"); MP.iv = setInterval(renderWait, 500); renderWait(true);
}
async function joinGame(code, md) {
  if (!ACC.user) { toast("Entre numa conta para jogar online"); return; }
  code = String(code).replace(/[^A-Za-z0-9]/g, "").slice(0, 8).toUpperCase(); if (!code || !NET.ready) return; mpStop();
  MP = { peers: [], bots: [], botP: {}, sims: {}, bc: 0, code, jt: Date.now(), room: true, waiting: true, tm: 0 }; if (md && MODES[md]) MPmode = md;
  const r = await NET.ask({ t: "join", room: "g-" + code }); if (!r.ok) { toast("Não foi possível entrar na sala"); MP.room = false; return; }
  MP.tm = pickTeam(); chatSetRoom(true); screen("wait"); MP.iv = setInterval(renderWait, 500); sync(); renderWait(true);
}
function pickTeam() { const hs = (MP.peers || []).filter((p) => p.presence && p.presence.tm != null && !p.isMe), c = [0, 0]; hs.forEach((p) => c[+p.presence.tm ? 1 : 0]++); if (SOC.party) { const mate = hs.find((p) => p.presence.pt && p.presence.pt === SOC.party.id); if (mate) return +mate.presence.tm || 0; } return c[0] <= c[1] ? 0 : 1; }
function renderWait() {
  const el = $("#wait"); if (!el.classList.contains("on")) return; const hs = humans(), host = hs[0], left = Math.max(0, 15 - (Date.now() - (host.presence.jt || MP.jt)) / 1000), md = mpMode(), hostme = isHost();
  if (!el.dataset.built || el.dataset.md != md || el.dataset.h != (hostme ? 1 : 0)) {
    el.dataset.built = 1; el.dataset.md = md; el.dataset.h = hostme ? 1 : 0;
    el.innerHTML = `<div class="top"><button id="wb">← Sair</button><h2 id="wt"></h2></div><div class="pill w" id="wp"></div>
    ${hostme ? `<div class="pill w"><b>Modo</b><div class="row" id="wmodes" style="margin-top:6px"></div><p class="mu" id="wmd" style="margin:6px 0 0"></p></div>` : ""}
    ${md == "team" ? `<div class="pill w"><b>Sua equipe</b><div class="row" id="wteams" style="margin-top:6px"></div></div>` : ""}
    ${hostme ? `<div class="pill w"><b>Bots</b> <span class="mu">(sem limite — cada bot constrói até ${botCap()} peça(s) para manter o jogo fluido)</span><div class="row" style="margin-top:6px"><input id="bn" type="number" min="0" value="${MP.bc}" style="width:90px"><button data-b="-1">−1</button><button data-b="1">+1</button><button data-b="10">+10</button><button data-b="50">+50</button><button data-b="0">Zerar</button></div></div>
    <div class="top w"><button id="ws" class="pri">Iniciar agora</button>${SOC.party && SOC.party.leader == ACC.user && MP.room ? `<button id="wg">👥 Chamar meu grupo</button>` : ""}</div>` : ""}
    <div class="pill w" id="wl"></div>`;
    $("#wb").onclick = () => { mpStop(); lobby(); };
    if (hostme) { const md0 = $("#wmodes"); Object.keys(MODES).forEach((k) => { const b = document.createElement("button"); b.textContent = MODES[k].ic + " " + MODES[k].n; b.className = k == md ? "sel" : ""; b.onclick = () => { MPmode = k; sync(); lobPres(); el.dataset.built = ""; renderWait(); }; md0.appendChild(b); }); $("#wmd").textContent = MODES[md].d;
      const bn = $("#bn"), setBc = (v) => { MP.bc = Math.max(0, Math.floor(+v || 0)); MP.manual = true; bn.value = MP.bc; sync(); lobPres(); }; bn.onchange = () => setBc(bn.value); el.querySelectorAll("[data-b]").forEach((b) => (b.onclick = () => setBc(+b.dataset.b == 0 ? 0 : MP.bc + +b.dataset.b)));
      $("#ws").onclick = () => { MP.manual = true; startMP(); }; if ($("#wg")) $("#wg").onclick = async () => { const r = await NET.ask({ t: "party", op: "go", code: MP.code }); toast(r.ok ? "Convite enviado ao grupo" : esc(r.err || "Erro")); }; }
    if (md == "team") { const tw = $("#wteams"); TEAMS.forEach((t, i) => { const b = document.createElement("button"); b.textContent = t.n; b.style.borderColor = t.css; b.dataset.i = i; b.onclick = () => { MP.tm = i; sync(); renderWait(); }; tw.appendChild(b); }); }
  }
  $("#wt").textContent = "Sala " + MP.code + " · " + MODES[md].ic + " " + MODES[md].n;
  const auto = !MP.manual && MP.code != "LOCAL" && MP.room;
  $("#wp").innerHTML = `<div>${hostme ? "Você é o anfitrião" : "Anfitrião: " + esc(host.presence.u)}</div><div>${auto ? (left > 0 ? "Procurando mais jogadores… " + Math.ceil(left) + " s" : "Iniciando…") + " Se a sala não encher, bots completam até 4 participantes." : "Início manual: ajuste os bots e clique em Iniciar agora."}</div>`;
  if (md == "team") $("#wteams").querySelectorAll("button").forEach((b) => (b.className = +b.dataset.i == MP.tm ? "sel" : ""));
  $("#wl").innerHTML = `<b>Jogadores (${hs.length}) · Bots: ${hostBc()}</b>` + hs.map((p) => `<div class="pl"><span class="nm">${p.presence.cc ? MarsRules.flag(p.presence.cc) + " " : ""}${esc(String(p.presence.u).slice(0, 16))}${p.isMe ? " (você)" : ""}${vfBadge(p.presence.rl, p.presence.vf)}${roleChip(p.presence.rl)}</span>${md == "team" ? `<span style="color:${TEAMS[+p.presence.tm || 0].css}">${TEAMS[+p.presence.tm || 0].n}</span>` : ""}</div>`).join("");
  if (hostme && auto && (left <= 0 || hs.length >= 4)) { if (MP.bc == 0 && hs.length < 4) { MP.bc = 4 - hs.length; } startMP(); }
}
function startMP() {
  if (MP.started && G.mode == "mp") return; MP.started = true; MP.waiting = false; clearInterval(MP.iv);
  if (isHost() && MP.bc == 0 && humans().length < 2 && MP.code == "LOCAL") MP.bc = 4; MP.botP = {}; $("#wait").classList.remove("on"); $("#wait").dataset.built = ""; sync(); start("mp");
}
INP.onEscMP = null;
