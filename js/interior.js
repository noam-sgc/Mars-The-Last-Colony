/* Interior dos edifícios: o tempo é pausado (Solo/Sandbox), abre-se outra simulação 3D
   e o jogador (WASD + arrastar para girar a câmera) organiza a bagunça e conversa com colonos. */
let IN = null;
const CLS_COL = { eff: 0xffd84a, water: 0x4aa3ff, food: 0x6fd45a, oxy: 0x7fe3ff, fuel: 0xff9a3c, morale: 0xd78bff, crew: 0xdfe9f2 };
const RW = 13, RD = 11;
function checkTex(c1, c2) { const c = document.createElement("canvas"); c.width = c.height = 128; const x = c.getContext("2d"); x.fillStyle = c1; x.fillRect(0, 0, 128, 128); x.fillStyle = c2; x.fillRect(0, 0, 64, 64); x.fillRect(64, 64, 64, 64); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(7, 6); return t; }
function openInterior(p) {
  if (IN || !G.run) return; closeDlg();
  const ty = TY[p.t], cls = ty.k, tint = CLS_COL[cls] || 0xffffff, isc = new THREE.Scene(); isc.background = new THREE.Color(0x0b0d14); isc.fog = new THREE.Fog(0x0b0d14, 22, 60);
  const icam = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, .1, 200), M = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .6, metalness: .3 }, o || {}));
  const box = (w, h, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); isc.add(o); return o; };
  isc.add(new THREE.HemisphereLight(0xcfd8ff, 0x22243a, .75));
  const pl = new THREE.PointLight(tint, 1.1, 40); pl.position.set(0, 8, 0); isc.add(pl); const pl2 = new THREE.PointLight(0xffffff, .6, 30); pl2.position.set(0, 6, 8); isc.add(pl2);
  const floor = box(RW * 2 + 2, .4, RD * 2 + 7, new THREE.MeshStandardMaterial({ map: checkTex("#3a3f4c", "#454b5a"), roughness: .7, metalness: .2 }), 0, -.2, 1.5);
  const wallM = M(0x2a3040, { roughness: .8 }); box(RW * 2 + 2, 9, .5, wallM, 0, 4.5, -RD - 1); box(.5, 9, RD * 2 + 7, wallM, -RW - 1, 4.5, 1.5); box(.5, 9, RD * 2 + 7, wallM, RW + 1, 4.5, 1.5);
  box(RW * 2 + 2, 9, .5, wallM, 0, 4.5, RD + 4.2);
  box(RW * 2 + 2, .3, RD * 2 + 7, M(0x222836), 0, 9, 1.5);
  for (let i = -2; i <= 2; i++) { box(.5, .3, RD * 2, new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: tint, emissiveIntensity: .9 }), i * 5, 8.8, 0); box(RW * 2, .08, .3, new THREE.MeshStandardMaterial({ color: tint, emissive: tint, emissiveIntensity: .6 }), 0, .05, -RD + .2).position.x = 0; }
  const door = box(5, 6, .3, new THREE.MeshStandardMaterial({ color: 0x1a2a20, emissive: 0x4fd08a, emissiveIntensity: .45 }), 0, 3, RD + 3.9); const dframe = box(5.4, 6.4, .2, M(0x888e9a), 0, 3.1, RD + 3.8); isc.add(dframe);
  // peça central (versão ampliada da máquina)
  const core = mk(p.t, S.color); core.scale.setScalar(1.8); core.position.set(0, 0, -2); isc.add(core);
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(5, 5.2, .2, 28), M(0x1a1f2a)); pad.position.set(0, .1, -2); isc.add(pad);
  // decoração por tipo
  const solidBoxes = [], solid = (w, h, d, m, x, y, z) => { solidBoxes.push({ x, z, w, d }); return box(w, h, d, m, x, y, z); };
  const bunk = (x, z) => { solid(2.2, .5, 4, M(0x5b6578), x, .5, z); box(2, .3, 1.2, M(0xe6e6ee), x, .85, z - 1.2); };
  if (p.t == "hab") { [-9, -5, 5, 9].forEach((x) => bunk(x, -7)); solid(5, .3, 2.2, M(0x8a7a5a), 0, 1.4, 6).rotation.y = 0; }
  else if (cls == "food") { for (let i = -2; i <= 2; i++) { solid(2.6, .9, 8, M(0x4a3a2a), i * 5, .45, 5.5 - 6.5); for (let j = 0; j < 4; j++) { const pn = new THREE.Mesh(new THREE.ConeGeometry(.45, 1.1, 6), M(0x3fc060, { emissive: 0x0a3a14 })); pn.position.set(i * 5, 1.4, -5 + j * 1.9 - 1.5); isc.add(pn); } } }
  else if (cls == "eff") { for (let i = -2; i <= 2; i += 2) { solid(3, 1.2, 1.4, M(0x39404f), i * 4, .6, 7); box(2.6, .8, .08, new THREE.MeshStandardMaterial({ color: 0x113322, emissive: 0x44ffcc, emissiveIntensity: .9 }), i * 4, 1.5, 6.25); } }
  else if (cls == "morale") { for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(.4, 10, 8), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: [0xff4466, 0x44ddff, 0xffee55][i % 3], emissiveIntensity: 1.2 })); b.position.set(-8 + i * 3.2, 6.8, 3); isc.add(b); } solid(8, .6, 2.4, M(0x6a4a8a), 0, .3, 7); }
  else { for (let i = -2; i <= 2; i++) { const t = new THREE.Mesh(new THREE.CylinderGeometry(.35, .35, 8, 8), M(0x6a7280)); t.position.set(i * 5, 4, -RD + .5); isc.add(t); } }
  // prateleiras (destino dos itens)
  const slots = []; const sMat = M(0x4a5266);
  for (let i = 0; i < 5; i++) { const x = -10 + i * 5; box(.2, 5, 1.6, sMat, x - 2, 2.5, -RD + 1); box(.2, 5, 1.6, sMat, x + 2, 2.5, -RD + 1); [0.7, 2.5, 4.3].forEach((y, l) => { box(4.2, .15, 1.6, sMat, x, y, -RD + 1); if (l < 2) { slots.push({ x: x - 1, y: y + .55, z: -RD + 1 }); slots.push({ x: x + 1, y: y + .55, z: -RD + 1 }); } }); }
  const items = [], total = 10, messy = Math.round((1 - clamp(p.ord, 0, 1)) * total), icol = [0xd9602a, 0x4a86e8, 0xe8b923, 0x46b86a, 0xc43fd0];
  const mkItem = (i) => { const k = i % 3, c = icol[i % 5], m = k == 0 ? new THREE.BoxGeometry(.9, .7, .7) : k == 1 ? new THREE.CylinderGeometry(.34, .34, .9, 10) : new THREE.BoxGeometry(1.1, .45, .6); const o = new THREE.Mesh(m, M(c, { emissive: c, emissiveIntensity: .08 })); isc.add(o);
    const ring = new THREE.Mesh(new THREE.RingGeometry(.7, .95, 18), new THREE.MeshBasicMaterial({ color: 0xff5a3a, transparent: true, opacity: .8, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.y = .03; o.userData.ring = ring; isc.add(ring); return o; };
  for (let i = 0; i < total; i++) { const o = mkItem(i), s = slots[i % slots.length], it = { o, slot: s, tidy: i >= messy, fly: 0 };
    if (it.tidy) { o.position.set(s.x, s.y + .1, s.z); o.userData.ring.visible = false; } else { let x, z; do { x = (Math.random() * 2 - 1) * (RW - 3); z = (Math.random() * 2 - 1) * (RD - 3) + 1; } while (Math.hypot(x, z + 2) < 6.5 || solidBoxes.some((b) => Math.abs(x - b.x) < b.w / 2 + 1.2 && Math.abs(z - b.z) < b.d / 2 + 1.2)); o.position.set(x, .4, z); o.rotation.set(Math.random() * .4, Math.random() * 6, Math.random() * .4); o.userData.ring.position.set(x, .03, z); }
    items.push(it); }
  const pg = av(P.eq); pg.position.set(0, 0, RD - 1); isc.add(pg);
  const cols = []; const nc = 1 + (G.placed.length > 4 ? 1 : 0) + (p.t == "emb" || (G.mode == "solo" && PH[G.ph].alien) ? 1 : 0);
  for (let i = 0; i < nc; i++) { const al = i == nc - 1 && (p.t == "emb" || (G.mode == "solo" && PH[G.ph].alien)), g = mkColonist(77 + i * 31 + p.x, al); g.position.set(-6 + i * 6, 0, 4); isc.add(g); cols.push({ g, x: g.position.x, z: g.position.z, tx: g.position.x, tz: 4, wait: 1, alien: al, info: g.userData.info, mood: 70 }); }
  IN = { solidBoxes, p, sc: isc, cam: icam, pg, x: 0, z: RD - 1, ry: Math.PI, yaw: 0, pit: .5, dist: 10, items, cols, door, v: 0, done: !messy, ring: [] };
  if (G.mode != "mp") G.paused = true; G.st.enter.add(p.t + ":" + p.x + "," + p.z);
  $("#hud").classList.remove("on"); $("#inhud").classList.add("on"); $("#hint").style.display = "none"; sync();
  toast(`🏭 ${esc(ty.n)}: arrume os itens marcados em vermelho nas prateleiras${G.mode == "mp" ? " (o tempo do multiplayer segue)" : " (tempo pausado)"}`, 4200);
}
function closeInterior(force) {
  if (!IN) return; IN.sc.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); IN = null;
  if (force) return; $("#inhud").classList.remove("on"); if (G.run) { $("#hud").classList.add("on"); if (G.mode != "mp" && !DLG) G.paused = shopOpen(); }
}
function interiorNearItem(r) { let b = null, d = r || 4.2; IN.items.forEach((it) => { if (it.tidy || it.fly) return; const q = Math.hypot(it.o.position.x - IN.x, it.o.position.z - IN.z); if (q < d) { d = q; b = it; } }); return b; }
function tidyItem(it) {
  it.fly = .01; it.tidy = true; it.o.userData.ring.visible = false; const p = IN.p; p.ord = clamp(p.ord + .1, 0, 1); G.st.tidy++; const v = earn(2); G.tk.eff = clamp(G.tk.eff + .6, 0, 100);
  toast(`✨ Item arrumado · ordem ${Math.round(p.ord * 100)}% · +${Math.round(v)} 🪙`, 1500);
  if (!IN.items.some((i) => !i.tidy) && !IN.done) { IN.done = true; const b = earn(10); save(); toast(`🏅 Edifício 100% organizado! Produção +25% · bônus +${Math.round(b)} 🪙`, 3500); }
}
function interiorUse() {
  if (!IN) return; if (DLG) return;
  const c = IN.cols.find((c) => Math.hypot(c.g.position.x - IN.x, c.g.position.z - IN.z) < 4.2); const it = interiorNearItem();
  if (it) return tidyItem(it); if (c) return talk(c); if (IN.z > RD + .8 && Math.abs(IN.x) < 3.5) return exitInterior(); toast("Chegue perto de um item vermelho (E) ou da porta verde");
}
function exitInterior() { closeInterior(); }
INP.onEsc = () => { if (IN && !DLG) exitInterior(); };
function interiorClick(e) {
  const r = cv.getBoundingClientRect(); ray.setFromCamera(new THREE.Vector2((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height * 2 - 1)), IN.cam);
  const hc = ray.intersectObjects(IN.cols.map((c) => c.g), true)[0];
  if (hc) { const c = IN.cols.find((q) => { for (let o = hc.object; o; o = o.parent) if (o === q.g) return true; return false; }); if (c) { if (Math.hypot(c.g.position.x - IN.x, c.g.position.z - IN.z) < 5) return talk(c); toast("Aproxime-se do colono (WASD)"); } return; }
  const hi = ray.intersectObjects(IN.items.filter((i) => !i.tidy && !i.fly).map((i) => i.o), false)[0];
  if (hi) { const it = IN.items.find((i) => i.o === hi.object); if (Math.hypot(it.o.position.x - IN.x, it.o.position.z - IN.z) < 5) return tidyItem(it); return toast("Aproxime-se do item (WASD) e toque de novo"); }
  if (ray.intersectObject(IN.door)[0] && IN.z > RD - 1) exitInterior();
}
function interiorUpdate(dt, t) {
  const I = IN; if (!I) return;
  if (!DLG) { const [ax, ay] = INP.ax(), len = Math.hypot(ax, ay), s = Math.sin(I.yaw), c = Math.cos(I.yaw); let mx = 0, mz = 0; if (len > .05) { const k = Math.min(1, len); mx = (-s * ay + c * ax) / len * k; mz = (-c * ay - s * ax) / len * k; }
    I.x = clamp(I.x + mx * 8 * dt, -RW + 1, RW - 1); I.z = clamp(I.z + mz * 8 * dt, -RD + 2.5, RD + 3.2); if (Math.hypot(I.x, I.z + 2) < 3.4) { const a = Math.atan2(I.z + 2, I.x); I.x = Math.cos(a) * 3.4; I.z = -2 + Math.sin(a) * 3.4; }
    I.v = Math.hypot(mx, mz); if (I.v > .05) { const a = Math.atan2(mx, mz); let d = a - I.ry; d = Math.atan2(Math.sin(d), Math.cos(d)); I.ry += d * Math.min(1, dt * 12); } }
  const pb = (o, rad) => { for (let it = 0; it < 3; it++) { let mv = false; for (const b of I.solidBoxes) { const hx = b.w / 2 + rad, hz = b.d / 2 + rad, dx = o.x - b.x, dz = o.z - b.z; if (Math.abs(dx) < hx && Math.abs(dz) < hz) { if (hx - Math.abs(dx) < hz - Math.abs(dz)) o.x = b.x + Math.sign(dx || 1) * hx; else o.z = b.z + Math.sign(dz || 1) * hz; mv = true; } } if (!mv) break; } };
  pb(I, .6); I.x = clamp(I.x, -RW + 1, RW - 1); I.z = clamp(I.z, -RD + 2.5, RD + 3.2);
  I.pg.position.set(I.x, 0, I.z); I.pg.rotation.y = I.ry; walkAnim(I.pg, t, I.v);
  const co = I.p; const core = I.sc.children.find((o) => o.userData && o.userData.anim); if (core) core.userData.anim.forEach((f) => f(t));
  I.items.forEach((it) => { if (it.fly) { it.fly = Math.min(1, it.fly + dt * 1.8); const q = it.fly, e = q * q * (3 - 2 * q); const tx = it.slot.x, tz = it.slot.z; it.o.position.x += (tx - it.o.position.x) * e * .35; it.o.position.z += (tz - it.o.position.z) * e * .35; it.o.position.y += (it.slot.y + .1 + Math.sin(q * Math.PI) * 1.5 - it.o.position.y) * .25; it.o.rotation.y *= .85; if (q >= 1) { it.fly = 0; it.o.position.set(tx, it.slot.y + .1, tz); it.o.rotation.set(0, 0, 0); } }
    else if (!it.tidy) { it.o.userData.ring.material.opacity = .5 + .4 * Math.sin(t * 4); } });
  I.cols.forEach((c) => { const p = c.g.position; c.wait -= dt; let mv = 0; if (c.wait <= 0 && DLG !== c) { const dx = c.tx - p.x, dz = c.tz - p.z, d = Math.hypot(dx, dz); if (d < .5) { c.wait = 2 + Math.random() * 4; c.tx = (Math.random() * 2 - 1) * (RW - 3); c.tz = Math.random() * (RD - 2) - 1; if (Math.hypot(c.tx, c.tz + 2) < 5) c.tz = 6; } else { p.x += dx / d * 2 * dt; p.z += dz / d * 2 * dt; c.g.rotation.y = Math.atan2(dx, dz); mv = 1; } } { const o = { x: p.x, z: p.z }; pb(o, .5); p.x = o.x; p.z = o.z; if (Math.hypot(p.x, p.z + 2) < 3.4) { const a = Math.atan2(p.z + 2, p.x); p.x = Math.cos(a) * 3.4; p.z = -2 + Math.sin(a) * 3.4; } } p.y = c.alien ? .35 + .15 * Math.sin(t * 3) : 0; walkAnim(c.g, t, mv); });
  const left = I.items.filter((i) => !i.tidy).length, near = interiorNearItem(), nc = I.cols.find((c) => Math.hypot(c.g.position.x - I.x, c.g.position.z - I.z) < 4.2);
  $("#ini").innerHTML = `${TY[co.t].n} · Ordem <b>${Math.round(co.ord * 100)}%</b> · itens bagunçados: <b>${left}</b> · produção x${(.75 + .5 * co.ord).toFixed(2)}`;
  const hn = $("#inh"); const msg = near ? "E / toque · arrumar item" : nc ? `E / toque · falar com ${nc.info.name}` : I.z > RD + .8 && Math.abs(I.x) < 3.5 ? "E · sair pela porta" : ""; setHint(hn, msg);
  const ty = 2.2, cx = I.x, cz = I.z; I.cam.position.set(cx + I.dist * Math.cos(I.pit) * Math.sin(I.yaw), ty + I.dist * Math.sin(I.pit), cz + I.dist * Math.cos(I.pit) * Math.cos(I.yaw)); I.cam.position.x = clamp(I.cam.position.x, -RW - .5, RW + .5); I.cam.position.z = clamp(I.cam.position.z, -RD - .5, RD + 3.8); I.cam.position.y = clamp(I.cam.position.y, .8, 8.6); I.cam.lookAt(cx, ty, cz);
}
$("#inx").onclick = exitInterior;
