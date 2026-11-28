/* Ambientes do mundo: Marte (padrão), Fobos (lua cinzenta, Marte gigante no céu, gravidade quase nula) e tubo de lava (caverna escura).
   Troca relevo, cores, céu, luz e névoa sem recriar a cena; as peças ficam como estão. */
const ENV = { name: "mars", lowg: false, tube: false, bound: 125 };
const STARS = sc.children.find((o) => o.isPoints && o.material && o.material.opacity === .55);
const ENV0 = { top: sky.material.uniforms.top.value.clone(), mid: sky.material.uniforms.mid.value.clone(), bot: sky.material.uniforms.bot.value.clone(), fog: sc.fog.color.clone(), fd: sc.fog.density, bg: sc.background.clone(), hemi: hemi.color.clone(), hemiG: hemi.groundColor.clone(), hi: hemi.intensity, si: sun.intensity, sc: sun.color.clone() };

// ---------- relevo ----------
const PCR = (() => { let s = 4242; const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280), l = [[-58, -46, 46, 13]]; for (let i = 0; i < 26; i++) { const x = (r() - .5) * 270, z = (r() - .5) * 270, rad = 4 + r() * 14; if (Math.hypot(x, z) < rad + 26 || Math.hypot(x + 58, z + 46) < 50) continue; l.push([x, z, rad, .8 + r() * 2.4]); } return l; })();
const HPHOBOS = (x, z) => {
  let h = .55 * Math.sin(x * .045 + 1) * Math.cos(z * .04) + .22 * Math.sin(x * .23 + z * .19) + .12 * Math.sin(x * .6);
  for (const [cx, cz, r, d] of PCR) { const q = Math.hypot(x - cx, z - cz) / r; if (q < 1.3) h += q < 1 ? -d * (1 - q * q) : d * .4 * Math.exp(-(((q - 1) * 5) ** 2)); }
  const g = Math.sin((x * .6 + z) * .09); h -= .5 * Math.max(0, 1 - Math.abs(g) * 9);   // sulcos paralelos de Fobos
  return h;
};
const HTUBE = (x, z) => { const ax = Math.abs(x); let h = .22 * Math.sin(z * .08) * Math.cos(x * .3) + .1 * Math.sin(x * .9 + z * .2); if (ax > 8) h += Math.pow(ax - 8, 1.6) * 1.6; const az = Math.abs(z); if (az > 128) h += (az - 128) * 3; return Math.min(h, 58); };
function terrainPaint(fn) {
  const pa = tg.attributes.position, col = tg.attributes.color.array, t = new THREE.Color();
  for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), z = pa.getZ(i), h = H(x, z); pa.setY(i, h); fn(t, x, z, h); col[i * 3] = t.r; col[i * 3 + 1] = t.g; col[i * 3 + 2] = t.b; }
  pa.needsUpdate = true; tg.attributes.color.needsUpdate = true; tg.computeVertexNormals(); tg.computeBoundingSphere();
}
const CM = { c1: new THREE.Color(0x9a4528), c2: new THREE.Color(0xc2774a), c3: new THREE.Color(0x5e2a1a) };
const PAINT = {
  mars: (t, x, z, h) => { const n = .5 + .5 * Math.sin(x * .31) * Math.sin(z * .27); t.copy(h > .8 ? CM.c2 : CM.c1).lerp(CM.c3, clamp(-h / 3, 0, 1) * .8).lerp(CM.c2, n * .22).multiplyScalar(.85 + Math.random() * .3); },
  phobos: (t, x, z, h) => { const n = .5 + .5 * Math.sin(x * .37) * Math.sin(z * .31); t.setRGB(.34, .33, .34).lerp(new THREE.Color(.52, .5, .5), clamp(h / 2, 0, 1) * .6).lerp(new THREE.Color(.16, .16, .18), clamp(-h / 6, 0, 1) * .8).lerp(new THREE.Color(.42, .38, .34), n * .25).multiplyScalar(.85 + Math.random() * .3); },
  tube: (t, x, z, h) => { const ax = Math.abs(x), n = .5 + .5 * Math.sin(x * .5) * Math.sin(z * .4); t.setRGB(.2, .15, .13).lerp(new THREE.Color(.34, .24, .19), clamp(h / 12, 0, 1)).lerp(new THREE.Color(.1, .08, .08), n * .4).multiplyScalar(.8 + Math.random() * .35); if (ax < 6 && Math.sin(z * .21 + x) > .93) t.lerp(new THREE.Color(.3, .55, .8), .5); },
};
// ---------- Marte gigante no céu de Fobos ----------
const MARSSKY = (() => {
  const c = document.createElement("canvas"); c.width = 512; c.height = 256; const x = c.getContext("2d"), g = x.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, "#d9a37c"); g.addColorStop(.5, "#c1673a"); g.addColorStop(1, "#8a3f22"); x.fillStyle = g; x.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 90; i++) { x.fillStyle = `rgba(${60 + Math.random() * 60},${30 + Math.random() * 30},${20},${.12 + Math.random() * .2})`; x.beginPath(); x.ellipse(Math.random() * 512, 40 + Math.random() * 180, 10 + Math.random() * 40, 4 + Math.random() * 14, Math.random(), 0, 6.28); x.fill(); }
  x.fillStyle = "rgba(255,255,255,.55)"; x.fillRect(0, 0, 512, 10); x.fillRect(0, 246, 512, 10);   // calotas polares
  const m = new THREE.Mesh(new THREE.SphereGeometry(120, 40, 24), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), fog: false })); m.position.set(-250, 170, -360); m.visible = false; sc.add(m);
  const ha = new THREE.Mesh(new THREE.SphereGeometry(126, 32, 20), new THREE.MeshBasicMaterial({ color: 0xff9a6a, transparent: true, opacity: .1, side: THREE.BackSide, fog: false })); m.add(ha); return m;
})();
// ---------- tubo de lava: teto, clarabóias e luz que acompanha você ----------
const TUBE = (() => {
  const g = new THREE.Group(), ceil = new THREE.Mesh(new THREE.CylinderGeometry(17, 17, 300, 28, 1, true), new THREE.MeshStandardMaterial({ color: 0x2c2321, roughness: 1, side: THREE.BackSide, flatShading: true })); ceil.rotation.x = Math.PI / 2; ceil.position.y = 2; g.add(ceil);
  for (let i = 0; i < 6; i++) { const z = -105 + i * 42, sk = new THREE.Mesh(new THREE.CircleGeometry(2.6, 14), new THREE.MeshBasicMaterial({ color: 0xffd9b0 })); sk.rotation.x = Math.PI / 2; sk.position.set((i % 2 ? 3 : -3), 18.6, z); g.add(sk);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(5, 18, 14, 1, true), new THREE.MeshBasicMaterial({ color: 0xffd9b0, transparent: true, opacity: .08, side: THREE.DoubleSide, depthWrite: false })); cone.position.set(sk.position.x, 9.5, z); cone.rotation.x = Math.PI; g.add(cone); }
  const lamp = new THREE.PointLight(0xffd7a0, 1.1, 38); lamp.position.set(0, 4, 0); g.add(lamp); g.userData.lamp = lamp; g.visible = false; sc.add(g); return g;
})();
const TUBEROCKS = (() => { const l = [], mat = new THREE.MeshStandardMaterial({ color: 0x3a2d28, roughness: 1, flatShading: true }); let s = 99; const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < 46; i++) { const x = (r() - .5) * 16, z = (r() - .5) * 250; if (Math.hypot(x, z) < 12) continue; const rr = .5 + r() * 1.6, m = new THREE.Mesh(new THREE.DodecahedronGeometry(rr), mat); m.position.set(x, 0, z); m.userData.rad = rr * .85; m.visible = false; m.castShadow = m.receiveShadow = true; sc.add(m); l.push(m); } return l; })();

/** Troca o ambiente do mundo. */
function setEnv(name) {
  if (ENV.name === name) return; ENV.name = name; ENV.lowg = name === "phobos"; ENV.tube = name === "tube"; ENV.bound = name === "tube" ? 9 : 125;
  HFN = name === "phobos" ? HPHOBOS : name === "tube" ? HTUBE : H0; terrainPaint(PAINT[name] || PAINT.mars);
  const u = sky.material.uniforms, ph = name === "phobos", tb = name === "tube";
  if (ph) { u.top.value.set(0x000004); u.mid.value.set(0x04050a); u.bot.value.set(0x0a0b10); sc.fog.color.set(0x07080c); sc.fog.density = .0009; hemi.color.set(0x5a6a88); hemi.groundColor.set(0x1a1a20); hemi.intensity = .42; sun.color.set(0xffffff); sun.intensity = 1.5; }
  else if (tb) { u.top.value.set(0x05030a); u.mid.value.set(0x0a0605); u.bot.value.set(0x0a0605); sc.fog.color.set(0x0c0807); sc.fog.density = .019; hemi.color.set(0x6a4a3a); hemi.groundColor.set(0x120a08); hemi.intensity = .34; sun.intensity = .08; }
  else { u.top.value.copy(ENV0.top); u.mid.value.copy(ENV0.mid); u.bot.value.copy(ENV0.bot); sc.fog.color.copy(ENV0.fog); sc.fog.density = ENV0.fd; hemi.color.copy(ENV0.hemi); hemi.groundColor.copy(ENV0.hemiG); hemi.intensity = ENV0.hi; sun.color.copy(ENV0.sc); sun.intensity = ENV0.si; }
  if (STARS) { STARS.material.opacity = ph ? 1 : tb ? 0 : .55; STARS.material.size = ph ? 2.8 : 2; STARS.visible = !tb; }
  MARSSKY.visible = ph; TUBE.visible = tb; dust.visible = !ph && !tb; sky.visible = !tb;
  ROCKS.forEach((r, i) => { r.visible = !tb; r.position.y = H(r.position.x, r.position.z) + .3; r.material.color.set(ph ? 0x55555a : 0x7a3a22 + ((i * 2654435) & 0x101010)); });
  TUBEROCKS.forEach((m) => { m.visible = tb; m.position.y = H(m.position.x, m.position.z) + .2; });
  if (typeof sc.background.set === "function") sc.background.set(tb ? 0x050302 : ph ? 0x000004 : 0x2a1208);
}
/** Pulo de baixa gravidade em Fobos (Espaço): salta alto e cai devagar. */
const _movePlayerEnv = movePlayer;
movePlayer = function (dt, t) {
  _movePlayerEnv(dt, t); if (!PL.g) return;
  if (ENV.tube) { PL.x = clamp(PL.x, -8, 8); PL.z = clamp(PL.z, -128, 128); if (!DR) PL.g.position.set(PL.x, H(PL.x, PL.z), PL.z); TUBE.userData.lamp.position.set(PL.x, H(PL.x, PL.z) + 5, PL.z); }
  if (ENV.lowg && !DR && !(typeof FL !== "undefined" && FL) && !IN && !DLG && !(G.paused && G.mode != "mp")) {
    PL.jy = PL.jy || 0; PL.vy = PL.vy || 0; if (INP.s && PL.jy < .02) PL.vy = 5; PL.vy -= 2.4 * dt; PL.jy = Math.max(0, PL.jy + PL.vy * dt); if (PL.jy === 0 && PL.vy < 0) PL.vy = 0; PL.g.position.y = H(PL.x, PL.z) + PL.jy;
  } else if (PL.jy) { PL.jy = 0; PL.vy = 0; }
};
// o ambiente sempre começa em Marte, salvo a fase pedir outro
const _startEnv = start;
start = function (mode, ph) { const e = mode === "nav" ? "mars" : (PH[ph] && PH[ph].env) || "mars"; setEnv(e); _startEnv(mode, ph); };
const _menuEnv = menu;
menu = function () { setEnv("mars"); return _menuEnv.apply(this, arguments); };
