/* Veículos: nomes reais dos rovers de Marte, sondas construíveis e pilotáveis (voam, escaneiam pontos de interesse) e rover parado até você entrar. */
const CRAFT = {
  rover: ["Sojourner", "Spirit", "Opportunity", "Curiosity", "Perseverance"],
  probe: ["Mariner 4", "Viking 1", "Pathfinder", "Phoenix", "Odyssey", "InSight", "MAVEN", "Ingenuity"],
};
/** Nomes reais primeiro; quando acabam, repete com o número da vez na frente (2º Sojourner, 3º Spirit…). */
function craftName(kind, n) { const L = CRAFT[kind], r = Math.floor(n / L.length) + 1; return r === 1 ? L[n % L.length] : `${r}º ${L[n % L.length]}`; }
const POI_NAMES = ["Jezero", "Gale", "Utopia Planitia", "Olympus Mons", "Valles Marineris", "Hellas Planitia", "Tharsis", "Elysium", "Meridiani", "Gusev", "Isidis", "Arcadia Planitia"];

const _placeC = place;
place = function (x, z) {
  const n0 = G.placed.length; _placeC(x, z); if (G.placed.length <= n0) return; const p = G.placed[G.placed.length - 1];
  if (p.t === "rover" || p.t === "probe") {
    G.craft = G.craft || { rover: 0, probe: 0 }; p.name = craftName(p.t, G.craft[p.t]++); const l = lab(p.name, { col: p.t === "probe" ? "#9fe8ff" : "#ffe9a0" }); l.scale.set(5, .95, 1); l.position.set(0, p.t === "probe" ? 5.3 : 3.6, 0); p.m.add(l);
    toast(`${p.t === "probe" ? "🛰" : "🚙"} <b>${esc(p.name)}</b> está pronto${p.t === "probe" ? " para voar (E)" : ", parado até você entrar (E)"}.`, 3500);
  }
};
const dTo2 = (o) => Math.hypot(o.position.x - PL.x, o.position.z - PL.z);
const nearestProbe = (r) => { let b = null, d = r || 6.5; G.placed.forEach((p) => { if (p.t !== "probe") return; const q = dTo2(p.m); if (q < d) { d = q; b = p; } }); return b; };

// ---------- pontos de interesse (só aparecem quando você voa) ----------
const poiG = new THREE.Group(); sc.add(poiG); poiG.visible = false;
function ensurePOIs() {
  if (G.poi) return; G.poi = []; const sol = solids(false), names = POI_NAMES.slice().sort(() => Math.random() - .5);
  for (let i = 0; i < 7; i++) { let x = 0, z = 0; for (let k = 0; k < 40; k++) { const a = Math.random() * 6.283, r = 25 + Math.random() * 85; x = Math.cos(a) * r; z = Math.sin(a) * r; if (!sol.some((c) => Math.hypot(c.x - x, c.z - z) < c.r + 4)) break; }
    const m = new THREE.Group(), d = new THREE.Mesh(new THREE.OctahedronGeometry(1.1), new THREE.MeshBasicMaterial({ color: 0x4fe8ff, transparent: true, opacity: .9 })); d.position.y = 2.2; m.add(d);
    const bm = new THREE.Mesh(new THREE.CylinderGeometry(.18, .18, 30, 8, 1, true), new THREE.MeshBasicMaterial({ color: 0x4fe8ff, transparent: true, opacity: .25, depthWrite: false })); bm.position.y = 15; m.add(bm);
    const rg = new THREE.Mesh(new THREE.RingGeometry(6.5, 7.2, 36), new THREE.MeshBasicMaterial({ color: 0x4fe8ff, transparent: true, opacity: .45, side: THREE.DoubleSide, depthWrite: false })); rg.rotation.x = -Math.PI / 2; rg.position.y = .3; m.add(rg);
    m.position.set(x, H(x, z), z); poiG.add(m); G.poi.push({ x, z, m, d, rg, done: false, prog: 0, name: names[i] || "Ponto " + (i + 1) }); }
}

// ---------- voo da sonda ----------
let FL = null;
function flyProbe(p) {
  if (FL || DR || IN || DLG || !G.run || G.mode === "nav" || (G.paused && G.mode !== "mp")) return; ensurePOIs();
  FL = { p, x: p.m.position.x, z: p.m.position.z, y: H(p.m.position.x, p.m.position.z) + 1.2, vx: 0, vz: 0, vy: 0, bat: 100, auto: false }; p.park = true; PL.g.visible = false; PL.x = FL.x; PL.z = FL.z; yaw = Math.atan2(0, 1) + .4; pit = .45; dist = 17; poiG.visible = true;
  toast(`🛰 <b>${esc(p.name || "Sonda")}</b>: WASD move · <b>Espaço</b> sobe · <b>Shift/C</b> desce · <b>E</b> pousa. Voe sobre os pontos azuis para escanear.`, 6500);
}
function landProbe() {
  if (!FL) return; const p = FL.p, gy = H(FL.x, FL.z); if (FL.y - gy > 3.2) { toast("Desça mais um pouco (Shift/C) para pousar", 2200); return; }
  p.x = FL.x; p.z = FL.z; p.m.position.set(FL.x, gy, FL.z); p.m.rotation.set(0, p.m.rotation.y, 0); FL = null; poiG.visible = false; PL.x = p.x + 4; PL.z = p.z; pushOut(PL, .6, solids(true)); PL.g.visible = true; sync(); toast("🛰 Sonda pousada e recarregando", 2200);
}
function flightUpdate(dt) {
  const f = FL, p = f.p, [ax, ay] = INP.ax(), s = Math.sin(yaw), c = Math.cos(yaw); let mx = 0, mz = 0; const len = Math.hypot(ax, ay);
  if (len > .05) { mx = (-s * ay + c * ax) / len * Math.min(1, len); mz = (-c * ay - s * ax) / len * Math.min(1, len); }
  const k = Math.min(1, dt * 2.6), low = f.bat <= 0; f.vx += (mx * 26 - f.vx) * k; f.vz += (mz * 26 - f.vz) * k;
  const gy = H(f.x, f.z), want = low ? -9 : (INP.s ? 10 : 0) - (INP.dn ? 10 : 0) + (TOUCH && !INP.s && !INP.dn ? (14 + gy - f.y) * .8 : 0); f.vy += (want - f.vy) * Math.min(1, dt * 3);
  f.x = clamp(f.x + f.vx * dt, -125, 125); f.z = clamp(f.z + f.vz * dt, -125, 125); f.y = clamp(f.y + f.vy * dt, H(f.x, f.z) + 1.2, H(f.x, f.z) + 70); f.bat = Math.max(0, f.bat - (.9 + Math.max(0, f.vy) * .05) * dt);
  if (low && f.y <= H(f.x, f.z) + 1.3) { toast("🔋 Bateria acabou: pouso de emergência", 2500); landProbe(); return; }
  p.m.position.set(f.x, f.y, f.z); p.m.rotation.z = -f.vx * .012; p.m.rotation.x = f.vz * .012; PL.x = f.x; PL.z = f.z; PL.v = Math.hypot(f.vx, f.vz) / 26;
  G.poi.forEach((q) => { if (q.done) return; const hd = Math.hypot(q.x - f.x, q.z - f.z), alt = f.y - H(f.x, f.z); q.d.rotation.y += dt * 2; q.d.position.y = 2.2 + Math.sin(performance.now() / 400) * .3;
    if (hd < 7.5 && alt > 2.5) { q.prog += dt / 2.2; q.rg.material.opacity = .45 + .4 * Math.sin(performance.now() / 80); if (q.prog >= 1) { q.done = true; poiG.remove(q.m); G.st.scan = (G.st.scan || 0) + 1; const v = Math.round(earn(26 + (G.ph || 0) * 2)); if (G.tk) G.tk.eff = clamp(G.tk.eff + 6, 0, 100); P.rp += 2; saveP(); save(); toast(`📡 <b>${esc(q.name)}</b> escaneado: +${v} 🪙 +2 RP · +6% Eficiência`, 3500); if (typeof Music !== "undefined") Music.pick(); } } else q.prog = Math.max(0, q.prog - dt * .5); });
}
const _mpCraft = movePlayer; movePlayer = function (dt, t) { if (FL) { flightUpdate(dt); return; } _mpCraft(dt, t); };
const _camCraft = camU; camU = function () { if (!FL) return _camCraft(); const tx = FL.x, tz = FL.z, ty = FL.y + 1.2; cam.position.set(tx + dist * Math.cos(pit) * Math.sin(yaw), ty + dist * Math.sin(pit), tz + dist * Math.cos(pit) * Math.cos(yaw)); cam.lookAt(tx, ty, tz); };
const _clearCraft = clear; clear = function () { _clearCraft(); FL = null; while (poiG.children.length) poiG.remove(poiG.children[0]); poiG.visible = false; };
const _onECraft = INP.onE;
INP.onE = function () {
  if (FL) return landProbe();
  if (G.run && G.mode === "solo" && !IN && !DR && !DLG) { const pr = nearestProbe(6.5), rv = nearestRover(), c = nearestColonist(); if (pr && (!rv || dTo2(pr.m) <= dTo(rv.m)) && (!c || dTo2(pr.m) <= dTo(c.g))) return flyProbe(pr); }
  _onECraft();
};
// recarrega parada; dicas com o nome do veículo
const _tickCraft = tick; tick = function (dt) { _tickCraft(dt); if (G.run) G.placed.forEach((p) => { if (p.t === "probe" && p.park && !(FL && FL.p === p)) p.bat = 100; }); };
const _hudCraft = hud;
hud = function () {
  _hudCraft(); const h = $("#hint"); if (!G.run || G.mode === "nav" || IN) return;
  if (FL) { const alt = Math.round(FL.y - H(FL.x, FL.z)), n = G.poi ? G.poi.filter((q) => q.done).length : 0; setHint(h, `🛰 ${FL.p.name || "Sonda"} · alt ${alt} m · 🔋 ${Math.round(FL.bat)}% · pontos ${n}/${G.poi ? G.poi.length : 0} · ${TOUCH ? "botão" : "E"} pousa`); setAct(TOUCH ? "Pousar" : ""); return; }
  if (DR) { const nm = DR.p.name; if (nm) h.textContent = h.textContent.replace("🚙", "🚙 " + nm + " ·"); return; }
  const rv = nearestRover(), pr = nearestProbe(6.5), c = nearestColonist(), roverFirst = rv && !(c && !DLG && dTo(c.g) <= dTo(rv.m));
  if (pr && (!rv || dTo2(pr.m) <= dTo(rv.m)) && (!c || DLG || dTo2(pr.m) <= dTo(c.g))) { setHint(h, `${TOUCH ? "Toque na sonda" : "E"} · voar na ${pr.name || "sonda"}`); setAct(TOUCH ? "Voar na sonda" : ""); }
  else if (roverFirst && rv.name) { setHint(h, `${TOUCH ? "Toque no rover" : "E"} · dirigir o ${rv.name}`); }
};
// toque na sonda (modo "Interagir")
const _clickCraft = click;
click = function (e) {
  if (G.run && G.mode === "solo" && !FL && !DR && G.tool === "use") { const r = cv.getBoundingClientRect(); ray.setFromCamera(new THREE.Vector2((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height * 2 - 1)), cam); const h = ray.intersectObjects(G.placed.filter((p) => p.t === "probe").map((p) => p.m), true)[0];
    if (h) { const i = ownerOf(h.object); if (i >= 0) { const q = G.placed[i]; if (nearestProbe(9) === q) return flyProbe(q); return toast("Aproxime-se da sonda (WASD) e toque de novo"); } } }
  _clickCraft(e);
};
