/* Fases de pilotagem: travessia Terra → Marte e entrada/pouso. */
let N = null;
function mkShip() {
  const g = new THREE.Group(), M = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, metalness: .6, roughness: .35 }, o || {}));
  const b = new THREE.Mesh(new THREE.CylinderGeometry(.9, 1.1, 5, 14), M(0xcfd3da)); b.rotation.x = Math.PI / 2; g.add(b);
  const n = new THREE.Mesh(new THREE.ConeGeometry(.9, 2, 14), M(0xff6a2b)); n.rotation.x = -Math.PI / 2; n.position.z = -3.5; g.add(n);
  const w = new THREE.Mesh(new THREE.SphereGeometry(.5, 10, 8), M(0x66ddff, { emissive: 0x2288aa, emissiveIntensity: .8 })); w.position.set(0, .7, -1.2); g.add(w);
  [-1, 1].forEach((s) => { const wi = new THREE.Mesh(new THREE.BoxGeometry(3, .15, 1.6), M(0x8a93a3)); wi.position.set(s * 2, 0, 1); g.add(wi); const e = new THREE.Mesh(new THREE.CylinderGeometry(.35, .5, .8, 10), M(0x444444)); e.rotation.x = Math.PI / 2; e.position.set(s * .5, 0, 2.8); g.add(e); });
  const f = new THREE.Mesh(new THREE.ConeGeometry(.5, 3, 8), new THREE.MeshBasicMaterial({ color: 0xffb347 })); f.rotation.x = Math.PI / 2; f.position.z = 4.6; g.add(f); g.flame = f; return g;
}
function navOff() {
  if (N) { N.g.forEach((o) => sc.remove(o)); N = null; }
  ter.visible = true; sky.visible = true; dust.visible = true; ROCKS.forEach((r) => (r.visible = true)); sc.background = new THREE.Color(0x2a1208); sc.fog.density = .006; sc.fog.color.set(0x9a4526); cam.far = 900; cam.updateProjectionMatrix();
  $("#pal").style.display = ""; const nt = $("#nt"); if (nt) nt.style.display = "none"; setWeatherReset();
}
function setWeatherReset() { UFOS.visible = false; sky.material.uniforms.mid.value.set(0xc8663a); sky.material.uniforms.top.value.set(0x1a0d1e); }
function navStart(ph) {
  clear(); closeInterior(true); navOff(); const L = PH[ph].nav == 1 ? "fly" : "land";
  G = { run: true, placed: [], mode: "nav", ph, tool: "", paused: false, tk: {}, rate: {}, hold: 0, time: 0, msd: {}, st: { talk: 0, tidy: 0, enter: new Set(), contact: 0 }, lastTalk: {} };
  buildHud(); screen("hud"); ["#ht", "#hr", "#hs", "#pk"].forEach((s) => ($(s).style.display = "none")); $("#gl").style.display = ""; $("#pal").style.display = "none"; $("#nt").style.display = "block";
  ter.visible = L == "land"; ROCKS.forEach((r) => (r.visible = L == "land")); dust.visible = L == "land"; sky.visible = L == "land";
  N = { L, g: [], nx: 0, ny: 0, btn: 0, fuel: 100, hull: 100, t: 0, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, prog: 0, obs: [], sp: 1, cp: 1.5, shake: 0 };
  const add = (o) => { sc.add(o); N.g.push(o); return o; }; N.ship = add(mkShip());
  if (L == "fly") {
    sc.background = new THREE.Color(0x02030a); sc.fog.density = 0; cam.far = 3000; cam.updateProjectionMatrix();
    const sg = new THREE.BufferGeometry(), sp = new Float32Array(1500); for (let i = 0; i < 1500; i += 3) { const a = Math.random() * 6.283, b = Math.acos(2 * Math.random() - 1); sp[i] = 450 * Math.sin(b) * Math.cos(a); sp[i + 1] = 450 * Math.sin(b) * Math.sin(a); sp[i + 2] = 450 * Math.cos(b); }
    sg.setAttribute("position", new THREE.BufferAttribute(sp, 3)); add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 2.2, fog: false })));
    const dg = new THREE.BufferGeometry(), dp = new Float32Array(900); for (let i = 0; i < 900; i += 3) { dp[i] = (Math.random() - .5) * 90; dp[i + 1] = (Math.random() - .5) * 60; dp[i + 2] = -260 * Math.random(); }
    dg.setAttribute("position", new THREE.BufferAttribute(dp, 3)); N.dust = add(new THREE.Points(dg, new THREE.PointsMaterial({ color: 0xaabbff, size: .5 })));
    N.earth = add(new THREE.Mesh(new THREE.SphereGeometry(40, 28, 18), new THREE.MeshStandardMaterial({ color: 0x2f6fd0, emissive: 0x0a2a55, roughness: .8 })));
    N.mars = add(new THREE.Mesh(new THREE.SphereGeometry(130, 36, 22), new THREE.MeshStandardMaterial({ color: 0xb5532f, emissive: 0x2a0e06, roughness: .95 })));
  } else {
    sc.background = new THREE.Color(0x8a4a30); sc.fog.color.set(0xb5603a); sc.fog.density = .0016;
    N.x = (Math.random() < .5 ? -1 : 1) * (40 + Math.random() * 30); N.z = (Math.random() < .5 ? -1 : 1) * (40 + Math.random() * 30); N.y = 600; N.vy = -40;
    const pad = new THREE.Mesh(new THREE.TorusGeometry(8, .6, 8, 32), new THREE.MeshStandardMaterial({ color: 0x4fd08a, emissive: 0x22aa66 })); pad.rotation.x = Math.PI / 2; pad.position.set(0, H(0, 0) + .5, 0); add(pad);
    const bm = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 200, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0x4fd08a, transparent: true, opacity: .15, side: THREE.DoubleSide })); bm.position.set(0, 100, 0); add(bm);
    N.heat = new THREE.Mesh(new THREE.SphereGeometry(3.5, 14, 10), new THREE.MeshBasicMaterial({ color: 0xff7a2a, transparent: true, opacity: 0 })); N.heat.position.set(0, 0, 2); N.ship.add(N.heat); N.ship.rotation.x = Math.PI / 2;
  }
}
function nSpawn(cell) {
  const n = N, r = cell ? 1.2 : 1.5 + Math.random() * 2.6, m = new THREE.Mesh(cell ? new THREE.SphereGeometry(r, 10, 8) : new THREE.DodecahedronGeometry(r), cell ? new THREE.MeshStandardMaterial({ color: 0x44ff88, emissive: 0x22cc66 }) : new THREE.MeshStandardMaterial({ color: 0x7a6a60, flatShading: true, roughness: .9 })), aim = !cell && Math.random() < .5;
  m.position.set(aim ? n.x + (Math.random() - .5) * 6 : (Math.random() - .5) * 68, aim ? n.y + (Math.random() - .5) * 4 : (Math.random() - .5) * 38, -260); sc.add(m); n.g.push(m); n.obs.push({ m, r: cell ? 2.4 : r, cell });
}
function navEnd(ok, q, why) {
  G.run = false; const ph = PH[G.ph];
  if (ok) { const rw = Math.round(earn(ph.r * (1 + B("rw")) * (.7 + q * .6))), rp = 10 + 3 * G.ph; G.avg = Math.round(q * 100); G.rank = ph.nav == 1 ? "Chegada a Marte!" : "Pouso perfeito!"; S.done[G.ph] = 1; save(); P.cr += 5; P.rp += rp; saveP(); end(true, rw);
    $("#rp").textContent = `${ph.nav == 1 ? "Casco restante" : "Combustível restante"}: ${G.avg}%. Você ganhou ${rw} moedas${EV.mult > 1 ? ` (evento x${EV.mult})` : ""} e ${rp} RP.`; }
  else { G.why = why; end(false); $("#rp").textContent = why + ". Tente de novo."; }
}
function navTick(dt) {
  const n = N, [kx, ky] = INP.ax(), ix = kx || n.nx, iy = ky || n.ny, th = (INP.s || n.btn) && n.fuel > 0; n.t += dt; n.shake *= .9;
  if (n.L == "fly") {
    const tx = ix * 28, ty = iy * 16, f = Math.min(1, 3 * dt); n.x += (tx - n.x) * f; n.y += (ty - n.y) * f; const spd = th ? 40 : 22; n.fuel = Math.max(0, n.fuel - (.8 + (th ? 4 : 0)) * dt); n.prog = Math.min(1, n.prog + spd * dt / 2400);
    n.sp -= dt; if (n.sp <= 0) { n.sp = Math.max(.25, .7 - n.prog * .3); nSpawn(0); } n.cp -= dt; if (n.cp <= 0) { n.cp = 2.2; nSpawn(1); }
    n.obs.forEach((o) => { o.m.position.z += spd * dt; o.m.rotation.x += dt; o.m.rotation.y += dt * .7;
      if (!o.d && o.m.position.z > -3 && o.m.position.z < 3 && Math.hypot(o.m.position.x - n.x, o.m.position.y - n.y) < o.r + 1.6) { o.d = 1; if (o.cell) n.fuel = Math.min(100, n.fuel + 18); else { n.hull -= 10 + o.r * 2; n.shake = .6; } o.m.visible = false; }
      if (o.m.position.z > 20) o.gone = 1; });
    n.obs = n.obs.filter((o) => { if (o.gone) sc.remove(o.m); return !o.gone; });
    const dp = n.dust.geometry.attributes.position; for (let i = 2; i < dp.array.length; i += 3) { dp.array[i] += spd * dt; if (dp.array[i] > 20) dp.array[i] = -260; } dp.needsUpdate = true;
    n.earth.position.set(-70, -35, -40 + n.prog * 900); n.mars.position.set(40, 10, -(1 - n.prog) * 1100 - 140);
    n.ship.position.set(n.x, n.y, 0); n.ship.rotation.z = -(tx - n.x) * .03; n.ship.rotation.x = (ty - n.y) * .02; n.ship.flame.scale.set(1, th ? 1.8 : .6, 1);
    if (n.hull <= 0) navEnd(0, 0, "Nave destruída pelos asteroides"); else if (n.fuel <= 0 && n.prog < 1) navEnd(0, 0, "Sem combustível: a nave ficou à deriva"); else if (n.prog >= 1) navEnd(1, n.hull / 100);
  } else {
    const c = .0004 + .002 * (1 - clamp(n.y / 600, 0, 1)); n.vy += (-5 - c * n.vy * Math.abs(n.vy) + (th ? 14 : 0)) * dt; n.vx += (ix * 7 - n.vx * .4) * dt; n.vz += (-iy * 7 - n.vz * .4) * dt;
    n.x = clamp(n.x + n.vx * dt, -120, 120); n.z = clamp(n.z + n.vz * dt, -120, 120); n.y += n.vy * dt; if (th) n.fuel = Math.max(0, n.fuel - 10 * dt);
    n.ship.position.set(n.x, n.y, n.z); n.ship.rotation.x = Math.PI / 2 + n.vz * .01; n.ship.rotation.z = -n.vx * .01; n.ship.flame.scale.set(1, th ? 1.8 : .4, 1);
    n.heat.material.opacity = clamp((Math.abs(n.vy) - 35) / 40, 0, .6) * clamp(n.y / 150, 0, 1);
    const gy = H(n.x, n.z) + 2; if (n.y <= gy) { n.y = gy; const ok = Math.abs(n.vy) <= 5 && Math.hypot(n.x, n.z) <= 9 && Math.hypot(n.vx, n.vz) <= 4; navEnd(ok, n.fuel / 100, Math.abs(n.vy) > 5 ? "Impacto: velocidade vertical alta demais" : "Pouso fora da plataforma ou com deriva excessiva"); }
  }
}
function navCam() { const n = N; if (!n) return; const s = n.shake * (Math.random() - .5); if (n.L == "fly") { cam.position.set(n.x * .6 + s, n.y * .6 + 5 + s, 16); cam.lookAt(n.x * .6, n.y * .6, -30); } else { cam.position.set(n.x + s, n.y + 14, n.z + 24); cam.lookAt(n.x * .8, Math.max(0, n.y - 60), n.z - 20); } }
function navHud() {
  const n = N; if (!n) return; tiltUI(); $("#hint").style.display = "none"; $("#hc").textContent = Math.floor(S.coins);
  const row = (a, p, c, t) => `<div class="tb"><span>${a}</span><u><i style="width:${clamp(p, 0, 100)}%;background:${c}"></i></u><b style="width:56px;text-align:right">${t}</b></div>`;
  let s = row("Combustível", n.fuel, TC.fuel, Math.floor(n.fuel) + "%");
  if (n.L == "fly") s += row("Casco", n.hull, "#ff6a6a", Math.max(0, Math.floor(n.hull)) + "%") + row("Trajeto", n.prog * 100, TC.water, Math.floor(n.prog * 100) + "%");
  else s += row("Altitude", n.y / 6, TC.water, Math.max(0, Math.floor(n.y)) + " m") + row("Veloc. vert.", Math.abs(n.vy), Math.abs(n.vy) <= 5 ? "#4fd08a" : "#ff6a6a", Math.abs(n.vy).toFixed(1) + " m/s");
  $("#tk").innerHTML = s;
  $("#gl").innerHTML = n.L == "fly" ? "<b>Terra → Marte</b><div>Desvie dos asteroides (WASD/setas ou arraste). Segure Impulso (Espaço) para acelerar, gastando combustível. Colete as esferas verdes: recarregam combustível.</div>" : "<b>Entrada e pouso</b><div>Pouse na plataforma verde com velocidade vertical ≤ 5 m/s. Segure Impulso (Espaço) para frear; WASD ou arraste guiam o deslocamento.</div>";
}
$("#nt").addEventListener("pointerdown", (e) => { if (N) N.btn = 1; e.preventDefault(); });
["pointerup", "pointerleave", "pointercancel"].forEach((ev) => $("#nt").addEventListener(ev, () => { if (N) N.btn = 0; }));
