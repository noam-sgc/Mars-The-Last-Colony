/* Avatar do "Mars Colony — Avatar Studio 3D" (criado pelo usuário), portado para o Three.js r128 do jogo.
   Corpo chibi com traje branco e acento colorido, cabelos, capacete (vestido ou na mão), mochila, crachá com nome,
   bandeira, olhos com brilho e piscada, acessórios. Os cosméticos do jogo (camadas s,p,h,b,r,a,t,w), a aparência (P.look)
   e o que os desenhistas publicam no Estúdio são convertidos para este modelo. */
const AS = {
  HAIRS: ["Afro", "Liso", "Cacheado", "Curto", "Tranças", "Loiro", "Rabo de cavalo", "Careca", "Hijab"],
  HAIR_OF: [7, 3, 0, 2, 1, 6, 6, 4, 3, 4, 8, 1, 5],   // estilo do jogo (0..12) → estilo do Studio (0..8)
  S2N: [7, 9, 6, 1, 18, 4, 15, 0, 21],   // estilo do Studio antigo (0..8) → lista nova              // estilo do Studio → estilo do jogo
  TOOL: { 1: "pulso", 2: "tablet", 3: "garrafa", 4: "cinto", 5: "kit", 6: "chave", 7: "lanterna" },
};
const asM = (c, o) => { o = o || {}; return new THREE.MeshStandardMaterial({ color: c, roughness: o.r != null ? o.r : .55, metalness: o.m != null ? o.m : .08, emissive: o.e != null ? o.e : 0x000000, emissiveIntensity: o.ei != null ? o.ei : 1, transparent: !!o.t, opacity: o.o != null ? o.o : 1, side: o.ds ? THREE.DoubleSide : THREE.FrontSide, depthWrite: o.dw != null ? o.dw : true, map: o.map || null }); };
/** Material no formato do Three (para as peças antigas reaproveitadas: acessórios, cabelo desenhado, cabeça alienígena). */
const asM3 = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c || "#888888", roughness: .55, metalness: .08 }, o || {}));
const asRB = (w, h, d, r) => (THREE.RoundedBoxGeometry ? new THREE.RoundedBoxGeometry(w, h, d, 3, r) : new THREE.BoxGeometry(w, h, d));
const asSP = (r, w, h, a, b, c, d) => new THREE.SphereGeometry(r, w || 24, h || 16, a, b, c, d);
const asCY = (rt, rb, h, s, open) => new THREE.CylinderGeometry(rt, rb, h, s || 20, 1, !!open);
const asTO = (r, t, arc, rs, ts) => new THREE.TorusGeometry(r, t, rs || 12, ts || 36, arc == null ? Math.PI * 2 : arc);
const _capC = {};
/** Cápsula (o r128 não tem CapsuleGeometry): torno de dois semicírculos ligados por uma reta. */
function asCA(r, l) {
  const k = r + "_" + l; if (_capC[k]) return _capC[k]; const pts = [];
  for (let i = 0; i <= 6; i++) { const a = -Math.PI / 2 + i / 6 * Math.PI / 2; pts.push(new THREE.Vector2(Math.max(.0001, Math.cos(a) * r), -l / 2 + Math.sin(a) * r)); }
  for (let i = 0; i <= 6; i++) { const a = i / 6 * Math.PI / 2; pts.push(new THREE.Vector2(Math.max(.0001, Math.cos(a) * r), l / 2 + Math.sin(a) * r)); }
  return (_capC[k] = new THREE.LatheGeometry(pts, 14));
}
const asBX = (w, h, d) => new THREE.BoxGeometry(w, h, d), asPL = (w, h) => new THREE.PlaneGeometry(w, h);
function asP(parent, geo, mat, x, y, z, o) {
  o = o || {}; const ms = new THREE.Mesh(geo, mat); ms.position.set(x || 0, y || 0, z || 0);
  if (o.rx) ms.rotation.x = o.rx; if (o.ry) ms.rotation.y = o.ry; if (o.rz) ms.rotation.z = o.rz; if (o.s) ms.scale.set(o.s[0], o.s[1], o.s[2]);
  ms.castShadow = o.cast !== false; ms.receiveShadow = !!o.recv; if (o.ro) ms.renderOrder = o.ro; parent.add(ms); return ms;
}
// ---------- texturas de tela (crachá, pulso, tablet) ----------
const _nameTex = {};
function asNameTex(nome) {
  nome = String(nome || "TRIPULANTE").toUpperCase().slice(0, 14); if (_nameTex[nome]) return _nameTex[nome];
  const cv = document.createElement("canvas"); cv.width = 512; cv.height = 144; const c = cv.getContext("2d");
  c.fillStyle = "#0d1630"; c.fillRect(0, 0, 512, 144); c.strokeStyle = "#39c5ff"; c.lineWidth = 6; c.strokeRect(4, 4, 504, 136);
  c.fillStyle = "#ffffff"; c.font = "700 62px Rajdhani, Arial"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(nome, 256, 58);
  c.fillStyle = "#7fd8ff"; c.font = "600 26px Rajdhani, Arial"; c.fillText("MARS COLONY · TRIPULANTE", 256, 112);
  return (_nameTex[nome] = new THREE.CanvasTexture(cv));
}
let _wristT = null, _tabT = null;
function asWristTex() {
  if (_wristT) return _wristT; const cv = document.createElement("canvas"); cv.width = 128; cv.height = 96; const c = cv.getContext("2d");
  c.fillStyle = "#06121e"; c.fillRect(0, 0, 128, 96); c.strokeStyle = "#39c5ff"; c.lineWidth = 3; c.beginPath(); c.moveTo(6, 52); c.lineTo(30, 52); c.lineTo(40, 30); c.lineTo(52, 70); c.lineTo(62, 44); c.lineTo(74, 52); c.lineTo(122, 52); c.stroke();
  c.fillStyle = "#7ff3ff"; c.font = "700 20px Arial"; c.fillText("O₂ 98%", 10, 24); c.fillStyle = "#2fa8dd"; c.fillRect(10, 76, 34, 8); c.fillRect(50, 76, 22, 8); c.fillRect(78, 76, 40, 8);
  return (_wristT = new THREE.CanvasTexture(cv));
}
function asTabletTex() {
  if (_tabT) return _tabT; const cv = document.createElement("canvas"); cv.width = 256; cv.height = 176; const c = cv.getContext("2d");
  c.fillStyle = "#0a1526"; c.fillRect(0, 0, 256, 176); c.strokeStyle = "#14304d"; c.lineWidth = 1;
  for (let x = 0; x <= 256; x += 24) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 176); c.stroke(); } for (let y = 0; y <= 176; y += 24) { c.beginPath(); c.moveTo(0, y); c.lineTo(256, y); c.stroke(); }
  c.fillStyle = "#c65a2e"; c.beginPath(); c.arc(128, 100, 52, 0, Math.PI * 2); c.fill(); c.fillStyle = "#9a3f1c"; [[110, 88, 12], [148, 116, 9], [138, 78, 6]].forEach(([x, y, r]) => { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); });
  c.strokeStyle = "#7ff3ff"; c.lineWidth = 3; c.setLineDash([6, 5]); c.beginPath(); c.moveTo(30, 150); c.quadraticCurveTo(80, 120, 128, 100); c.stroke(); c.setLineDash([]);
  c.fillStyle = "#7ff3ff"; c.beginPath(); c.arc(30, 150, 5, 0, Math.PI * 2); c.fill(); c.beginPath(); c.arc(128, 100, 5, 0, Math.PI * 2); c.fill(); c.fillStyle = "#7fd8ff"; c.font = "700 18px Arial"; c.fillText("MAPA DA MISSÃO", 12, 22);
  return (_tabT = new THREE.CanvasTexture(cv));
}

// ---------- cabelos (23 estilos: curtos, médios, longos, cacheados, tranças, dreads, coques, rabos, hijab) ----------
function asHair(idx, hairMat, accentMat) {
  const g = new THREE.Group(), hm = hairMat;
  const cap = (tilt, theta, r) => asP(g, asSP(r || .52, 32, 20, 0, Math.PI * 2, 0, Math.PI * (theta || .52)), hm, 0, .02, -.02, { rx: tilt == null ? -.25 : tilt });
  const ball = (r, x, y, z, sc) => asP(g, asSP(r, 12, 9), hm, x, y, z, sc ? { s: sc } : {});
  const back = (len, w) => asP(g, asRB(w || .92, len, .2, .08), hm, 0, .12 - len / 2, -.4);
  const curtain = (len) => [-1, 1].forEach((q) => asP(g, asRB(.14, len, .36, .06), hm, .5 * q, .1 - len / 2, -.04));
  const fringe = (w) => asP(g, asRB(w || .64, .15, .12, .05), hm, 0, .34, .43, { rx: .35 });
  const bowl = (h, y) => asP(g, new THREE.CylinderGeometry(.54, .5, h, 28, 1, true, .55, Math.PI * 2 - 1.1), asM(hm.color, { ds: true, r: .75 }), 0, y, -.02);
  const waves = (xs, y0, n, step, amp, r) => xs.forEach((x, k) => { for (let i = 0; i < n; i++) ball(r || .09, x + Math.sin(i * 1.3 + k) * amp, y0 - i * step, -.38 + (Math.abs(x) < .3 ? 0 : .22 + .12 * Math.abs(x)) * (Math.abs(x) < .3 ? 0 : 1) * 0); });
  const curls = (n, rad, sz, seed) => { for (let i = 0; i < n; i++) { const phi = i * 2.39996 + seed, th = .12 + (i / n) * 1.25, x = Math.sin(th) * Math.cos(phi) * rad, y = Math.cos(th) * rad + .04, z = Math.sin(th) * Math.sin(phi) * rad; if (z > .3 && y < .15) continue; ball(sz + (i % 4) * .012, x, y, z); } };
  const hang = (xs, y0, n, step, r, zb) => xs.forEach((x) => { for (let i = 0; i < n; i++) ball(r - i * .004, x + Math.sin(i * 1.7 + x * 9) * .035, y0 - i * step, zb(x)); });
  const sideZ = (x) => (Math.abs(x) > .42 ? -.04 : -.42 + Math.abs(x) * .3);
  switch (idx) {
    case 0: break;
    case 1: cap(-.15, .5); fringe(.5); asP(g, asRB(.5, .1, .1, .04), hm, .14, .38, .4, { rz: .28, rx: .3 }); ball(.07, -.47, -.04, .08); ball(.07, .47, -.04, .08); break;
    case 2: cap(-.12, .5); bowl(.3, .02); break;
    case 3: cap(-.2, .5); ball(.3, 0, .52, .2, [1.35, .75, 1]); ball(.18, .28, .5, .22, [1.2, .8, 1]); ball(.18, -.28, .5, .22, [1.2, .8, 1]); break;
    case 4: cap(-.2, .5); fringe(.5); asP(g, asRB(.46, .13, .12, .05), hm, .06, .3, .42, { rz: .18, rx: .3 }); ball(.07, -.47, -.06, .08); ball(.07, .47, -.06, .08); break;
    case 5: cap(-.2, .5); for (let i = 0; i < 11; i++) { const a = i / 11 * Math.PI * 2; if (Math.sin(a) > .6) continue; ball(.13, Math.cos(a) * .46, .24 + Math.sin(i * 2) * .03, Math.sin(a) * .46 - .05); } for (let i = 0; i < 6; i++) ball(.14, Math.cos(i * 1.1) * .26, .5, Math.sin(i * 1.1) * .22 - .08); break;
    case 6: curls(22, .5, .12, 0); ball(.11, -.15, .42, .32); ball(.11, .15, .42, .32); ball(.11, 0, .46, .3); break;
    case 7: asP(g, asSP(.55, 28, 20), hm, 0, .22, -.06, { s: [1.05, .95, 1.02] }); for (let i = 0; i < 12; i++) { const phi = i / 12 * Math.PI * 2, th = .5 + (i % 3) * .25, x = Math.sin(th) * Math.cos(phi) * .52, y = Math.cos(th) * .52 + .05, z = Math.sin(th) * Math.sin(phi) * .52; if (z > .3 && y < .15) continue; ball(.14 + (i * 7) % 3 * .02, x, y, z); } break;
    case 8: asP(g, asSP(.62, 28, 20), hm, 0, .24, -.08, { s: [1.1, 1, 1.05] }); curls(30, .66, .16, 1); break;
    case 9: cap(-.22); asP(g, asRB(.6, .55, .18, .07), hm, 0, -.08, -.44); asP(g, asRB(.12, .42, .3, .05), hm, -.47, -.08, .02); asP(g, asRB(.12, .42, .3, .05), hm, .47, -.08, .02); fringe(.5); break;
    case 10: cap(-.2); back(.6, .9); curtain(.55); for (let i = 0; i < 7; i++) ball(.1, -.4 + i * .135, -.5, -.4); [-1, 1].forEach((q) => { for (let i = 0; i < 3; i++) ball(.09, .5 * q + q * (i % 2) * .03, -.38 - i * .08, -.04); }); fringe(.5); break;
    case 11: cap(-.2); back(1.15, .94); curtain(1.0); break;
    case 12: cap(-.2); [-.34, -.17, 0, .17, .34].forEach((x, k) => { for (let i = 0; i < 9; i++) ball(.13, x + Math.sin(i * 1.2 + k) * .05, -.1 - i * .12, -.42); }); [-1, 1].forEach((q) => { for (let i = 0; i < 8; i++) ball(.1, .5 * q + Math.sin(i * 1.3) * .03 * q, -.05 - i * .12, -.04); }); break;
    case 13: cap(-.2); back(1.15, .94); curtain(1.0); fringe(.7); break;
    case 14: curls(18, .5, .13, 2); [-.34, -.17, 0, .17, .34].forEach((x, k) => { for (let i = 0; i < 7; i++) ball(.12, x + Math.sin(i * 2 + k) * .04, -.08 - i * .13, -.42); }); [-1, 1].forEach((q) => { for (let i = 0; i < 6; i++) ball(.11, .5 * q, -.05 - i * .13, -.05); }); break;
    case 15: cap(-.2); ball(.09, 0, .3, -.45); asP(g, asTO(.1, .03, Math.PI * 2, 8, 18), accentMat, 0, .3, -.46, { rx: Math.PI / 2 }); [[.11, .42, -.52], [.13, .56, -.56], [.12, .62, -.5], [.1, .58, -.4], [.085, .5, -.36]].forEach(([r, y, z]) => ball(r, 0, y, z)); break;
    case 16: cap(-.2); ball(.08, 0, -.05, -.5); asP(g, asTO(.09, .025, Math.PI * 2, 8, 18), accentMat, 0, -.05, -.51, { rx: Math.PI / 2 }); asP(g, new THREE.CylinderGeometry(.1, .05, .95, 12), hm, 0, -.55, -.52, {}); break;
    case 17: cap(-.2); ball(.25, 0, .58, -.1); asP(g, asTO(.14, .035, Math.PI * 2, 8, 20), accentMat, 0, .44, -.1, { rx: Math.PI / 2 }); break;
    case 18: cap(-.2); for (let i = 0; i < 11; i++) { const phi = Math.PI + (i / 10) * Math.PI, ax = Math.sin(1.7) * Math.cos(phi) * .5, az = Math.sin(1.7) * Math.sin(phi) * .5; asP(g, asCY(.04, .03, .95, 8), hm, ax, -.42, az); asP(g, asSP(.055, 10, 8), accentMat, ax, -.9, az); } break;
    case 19: cap(-.2, .55); for (let i = 0; i < 18; i++) { const phi = Math.PI * .85 + (i / 17) * Math.PI * 1.3, ax = Math.sin(1.7) * Math.cos(phi) * .5, az = Math.sin(1.7) * Math.sin(phi) * .5; if (az > .25) continue; asP(g, asCY(.05, .035, .65 + (i % 4) * .14, 6), hm, ax, -.3 - (i % 4) * .05, az); } break;
    case 20: cap(-.2); ball(.07, .47, -.02, .12); for (let i = 0; i < 6; i++) ball(.12 - i * .008, .48 + (i % 2) * .02, -.1 - i * .13, .1); asP(g, asSP(.05, 8, 6), accentMat, .49, -.88, .1); break;
    case 21: asP(g, asSP(.56, 32, 24, Math.PI / 2 + .85, Math.PI * 2 - 1.7), hm); asP(g, asTO(.44, .04, Math.PI * 2, 12, 40), hm, 0, 0, .36); asP(g, asCY(.34, .52, .4, 24, true), asM(hm.color, { ds: true }), 0, -.6, 0); asP(g, asTO(.3, .06, Math.PI * 2, 10, 28), hm, 0, -.42, .05, { rx: Math.PI / 2 }); break;
    case 22: cap(-.2); fringe(.5); [-1, 1].forEach((q) => { asP(g, asTO(.07, .02, Math.PI * 2, 8, 16), accentMat, .52 * q, .1, -.04, { ry: Math.PI / 2 }); for (let i = 0; i < 5; i++) ball(.13 - i * .012, .56 * q + q * i * .02, .02 - i * .13, -.04); }); break;
    default: break;
  }
  return g;
}
// ---------- capacete (bolha + aro colorido + pods) ----------
function asHelmet(helmMat, accentMat) {
  const g = new THREE.Group(), glass = new THREE.MeshPhysicalMaterial({ color: 0xbfe3ff, roughness: .05, metalness: 0, transparent: true, opacity: .22, depthWrite: false });
  asP(g, asSP(.68, 40, 28), glass, 0, 0, 0, { cast: false, ro: 5 });
  asP(g, asSP(1, 12, 8), asM(0xffffff, { t: true, o: .35, e: 0xffffff, ei: .3 }), -.25, .3, .48, { s: [.16, .05, .02], rz: .6, cast: false, ro: 6 });
  asP(g, asTO(.46, .055, Math.PI * 2, 16, 44), helmMat, 0, .02, .42); asP(g, asTO(.46, .02, Math.PI * 2, 10, 44), asM(0xeef1f6), 0, .02, .47);
  [-1, 1].forEach((s) => { asP(g, asCY(.12, .12, .08, 20), helmMat, .66 * s, 0, 0, { rz: Math.PI / 2 }); asP(g, asCY(.06, .06, .02, 14), asM(0xeef1f6, { e: 0x9fd8ff, ei: .4 }), .71 * s, 0, 0, { rz: Math.PI / 2 }); });
  asP(g, asRB(.06, .1, .3, .025), helmMat, 0, .66, -.05); asP(g, asSP(.035, 10, 8), asM(0x0a2233, { e: 0x7ff3ff, ei: 2 }), 0, .7, .12, { cast: false });
  asP(g, asCY(.3, .34, .12, 24), asM(0xcfd6df, { m: .4, r: .35 }), 0, -.58, 0); asP(g, asTO(.3, .035, Math.PI * 2, 10, 28), accentMat, 0, -.52, 0, { rx: Math.PI / 2 });
  return g;
}

/** Constrói o avatar do Studio a partir do estado s (mesmos campos do HTML do usuário + extras do jogo). */
function asBuild(s) {
  const root = new THREE.Group(), rig = { root, eyes: [], antennaTip: null };
  const skin = asM(s.skin, s.alienGlow ? { r: .65, e: s.alienGlow, ei: .3 } : { r: .65 }), skinDark = asM(new THREE.Color(s.skin).multiplyScalar(.82), { r: .65 });
  const hairMat = asM(s.hairCol, { r: .75 }), accent = asM(s.accent, { r: .5, e: s.glow || 0x000000, ei: s.glow ? .25 : 1 }), accentDk = asM(new THREE.Color(s.accent).multiplyScalar(.65), { r: .55 });
  const white = s.suitTx ? asM(0xffffff, { r: .5, map: s.suitTx }) : asM(s.base || 0xeef1f6, { r: .5 }), dark = asM(0x2b303a, { r: .6 }), gray = asM(0x39404c, { r: .55 });
  const pantsMat = s.pantTx ? asM(0xffffff, { r: .6, map: s.pantTx }) : asM(s.pants, { r: .6 }), helmMat = asM(s.helm, { r: .4, e: s.helmGlow || 0x000000, ei: s.helmGlow ? .5 : 1 });
  const packMat = s.packTx ? asM(0xffffff, { r: .55, map: s.packTx }) : asM(s.pack, { r: .55 }), packDk = asM(new THREE.Color(s.pack).multiplyScalar(.65), { r: .6 }), eyeMat = asM(s.eyes, { r: .3 });
  // pernas
  for (const side of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(.19 * side, 1.06, 0); root.add(hip);
    if (s.pantSh == 2) { hip.scale.x = hip.scale.z = .85; }
    asP(hip, asCA(.13, .28), pantsMat, 0, -.22, 0); asP(hip, asSP(.145, 16, 12), s.pantPt == 2 ? asM(s.pantC2) : dark, 0, -.44, .02, { s: [1, .8, 1] });
    if (s.pantSh == 1) asP(hip, asCY(.115, .18, .44, 18), pantsMat, 0, -.66, 0); else asP(hip, asCA(.115, .26), s.pantSh == 3 ? asM(s.pantC2) : pantsMat, 0, -.64, 0);
    if (s.pantPt == 1) asP(hip, asBX(.035, .78, .06), asM(s.pantC2), .125 * side, -.43, 0); const bc = s.bootC ? asM(s.bootC, { r: .5 }) : accent, bw = asM(0xf4f4f8, { r: .5 });
    asP(hip, asBX(.04, .3, .16), accent, .17 * side, -.22, 0); asP(hip, asSP(.13, 14, 10), asM(0x2b303a, { r: .55 }), 0, -.5, .13, { s: [1, 1, .55] });   // painel lateral da coxa e joelheira escura
    switch (s.boot) {
      case 1: asP(hip, asRB(.27, .17, .44, .08), bw, 0, -.96, .07); asP(hip, asRB(.22, .1, .2, .05), bc, 0, -.94, .2); asP(hip, asBX(.29, .05, .46), bc, 0, -1.03, .07); break;   // tênis espacial
      case 2: asP(hip, asCY(.15, .17, .34, 16), bc, 0, -.84, 0); asP(hip, asRB(.27, .16, .44, .07), bc, 0, -.97, .07); asP(hip, asBX(.29, .06, .46), dark, 0, -1.03, .07); asP(hip, asTO(.16, .025, Math.PI * 2, 8, 20), bw, 0, -.7, 0, { rx: Math.PI / 2 }); break;   // bota alta
      case 3: asP(hip, asRB(.3, .24, .46, .09), bc, 0, -.93, .06); asP(hip, asBX(.32, .08, .5), dark, 0, -1.02, .06); [0, 1, 2].forEach((i) => asP(hip, asBX(.33, .018, .05), asM(0x1b1f27), 0, -1.045, -.12 + i * .13)); asP(hip, asRB(.22, .09, .2, .04), bw, 0, -.86, .17); break;   // bota robusta
      case 4: asP(hip, asRB(.27, .2, .42, .07), bc, 0, -.95, .06); asP(hip, asBX(.29, .06, .44), dark, 0, -1.03, .06); asP(hip, asSP(.14, 14, 10), asM(0x2b303a, { r: .55 }), 0, -.76, .13, { s: [1, .8, .6] }); asP(hip, asTO(.15, .03, Math.PI * 2, 8, 18), bw, 0, -.82, 0, { rx: Math.PI / 2 }); break;   // com joelheira baixa
      default: asP(hip, asRB(.26, .2, .38, .06), bc, 0, -.95, .05); asP(hip, asBX(.28, .06, .4), dark, 0, -1.03, .05); asP(hip, asRB(.2, .08, .16, .03), bw, 0, -.9, .18);
    }
    if (side === -1) rig.legL = hip; else rig.legR = hip;
  }
  // tronco
  const torso = new THREE.Group(); torso.position.y = 1.5; root.add(torso); rig.torso = torso;
  if (s.pf) asP(torso, torsoGeo(s.pf, .72 * s.bk, -.41, .41), white, 0, 0, 0, { recv: true, s: [1, 1, .66] });   // silhueta desenhada no Estúdio
  else asP(torso, asRB(.72 * s.bk, .82, .46, .14), white, 0, 0, 0, { recv: true });
  const P2 = asM(s.c2 || "#ffffff", { r: .5, e: s.glow || 0x000000, ei: s.glow ? .3 : 1 });
  if (s.suitSh == 3) { asP(torso, asRB(.78 * s.bk, .5, .52, .08), asM(new THREE.Color(s.accent).multiplyScalar(.55), { r: .7 }), 0, .02, 0); [-1, 1].forEach((q) => asP(torso, asRB(.17, .15, .08, .03), P2, .18 * q, -.12, .27)); }   // colete tático
  switch (s.suitPt) {
    case 1: asP(torso, asBX(.74 * s.bk, .11, .48), P2, 0, .22, 0); break;
    case 6: asP(torso, new THREE.CircleGeometry(.07, 20), asM(s.glow || s.c2, { e: s.glow || s.c2, ei: 1.2 }), -.2, -.05, .25, { cast: false }); break;
    case 7: [-.09, .09].forEach((x) => asP(torso, asBX(.04, .72, .02), P2, x, 0, .245, { cast: false })); break;
  }
  if (!s.suitTx) { asP(torso, asRB(.5, .42, .1, .05), accent, 0, .1, .21); asP(torso, asBX(.05, .6, .02), gray, 0, -.02, .245);
    asP(torso, asBX(.09, .5, .03), accentDk, -.29, .12, .24, { rz: .06 }); asP(torso, asBX(.09, .5, .03), accentDk, .29, .12, .24, { rz: -.06 }); }
  asP(torso, asTO(.19, .05, Math.PI * 2, 12, 28), s.suitPt == 4 ? P2 : accent, 0, .44, 0, { rx: Math.PI / 2 }); asP(torso, asBX(.74 * s.bk, .09, .48), s.suitPt == 3 ? P2 : gray, 0, -.36, 0);
  [-1, 1].forEach((q) => asP(torso, asSP(.17, 18, 12), s.suitPt == 2 ? P2 : accent, .42 * s.bk * q, .32, 0, { s: s.suitPt == 2 ? [1.45, 1, 1.4] : [1.15, .8, 1.1] }));
  if (s.flag) asP(torso, asPL(.2, .13), new THREE.MeshStandardMaterial({ map: flagTex(s.flag), roughness: .6 }), -.14, .18, .268, { rx: -.04, cast: false });
  if (s.nome != null) asP(torso, asPL(.24, .068), new THREE.MeshStandardMaterial({ map: asNameTex(s.nome), roughness: .6 }), .12, .18, .268, { rx: -.04, cast: false });
  asP(torso, new THREE.CircleGeometry(.045, 20), asM(0x0a2233, { e: 0x39c5ff, ei: 1.4 }), .12, .04, .268, { cast: false });
  // braços
  const arm = (side) => { const sh = new THREE.Group(); sh.position.set(.45 * side * s.bk, .3, 0); sh.rotation.z = .08 * side; torso.add(sh);
    asP(sh, asCA(.105, .24), white, 0, -.2, 0); asP(sh, asTO(.115, .025, Math.PI * 2, 10, 22), accent, 0, -.14, 0, { rx: Math.PI / 2 });
    const el = new THREE.Group(); el.position.y = -.38; sh.add(el); if (s.suitPt == 5) [-.32, .02].forEach((yy) => asP(sh, asTO(.112, .025, Math.PI * 2, 8, 20), P2, 0, yy, 0, { rx: Math.PI / 2 })); asP(el, asCA(.095, .2), white, 0, -.16, 0); asP(el, asCY(.11, .11, .07, 16), accent, 0, -.3, 0);
    const glove = asP(el, asSP(.115, 16, 12), s.alien ? skin : dark, 0, -.4, 0, { s: [1, 1.15, 1] }); return { sh, el, glove }; };
  rig.armL = arm(-1); rig.armR = arm(1);
  // pescoço e cabeça
  asP(root, asCY(.12, .14, .14, 16), skin, 0, 1.98, 0);
  const head = new THREE.Group(); head.position.y = 2.45; root.add(head); rig.head = head;
  if (s.alien) { const ah = alienHead(s.alien, asM3, s.alienHelm); ah.scale.setScalar(.8); ah.position.y = -.05; head.add(ah); }
  else {
    const HSH = [[.96, 1, .94], [.88, 1.12, .9], [1.06, .93, 1], [.96, 1, .94], [.94, 1.03, .92]][s.headSh || 0], hx = .5 * HSH[0];
    asP(head, asSP(.5, 48, 32), skin, 0, 0, 0, { s: HSH, recv: true });
    if (s.headSh == 3) asP(head, asRB(.7, .3, .5, .12), skin, 0, -.27, .0);   // queixo quadrado
    if (s.headSh == 4) asP(head, asSP(.22, 18, 12), skin, 0, -.4, .1, { s: [1, 1, .9] });   // queixo fino
    asP(head, asSP(.07, 12, 8), skin, -hx, -.02, 0); asP(head, asSP(.07, 12, 8), skin, hx, -.02, 0);
    for (const side of [-1, 1]) {
      const eye = new THREE.Group(); eye.position.set(.175 * side, .03, .44); head.add(eye);
      const ES = [[1, 1, 0], [1.18, .8, .16], [1.32, 1.3, 0], [1.08, .72, 0], [1.2, .78, -.3]][s.eyeSh || 0]; eye.scale.set(ES[0], ES[1], 1); eye.userData.sy = ES[1]; eye.rotation.z = ES[2] * side * -1;
      asP(eye, asSP(.085, 16, 12), asM(0xffffff, { r: .25 }), 0, 0, 0, { s: [1, 1.15, .5], cast: false });
      if (s.eyeSh == 3) asP(eye, asSP(.092, 14, 8, 0, Math.PI * 2, 0, Math.PI * .48), skin, 0, .004, .006, { s: [1, 1.15, .62], cast: false });   // pálpebra caída asP(eye, asSP(.064, 14, 12), eyeMat, 0, -.004, .04, { cast: false, s: [1, 1.1, .7] });
      asP(eye, asSP(.033, 10, 8), asM(0x0a0a0a), 0, -.004, .06, { cast: false }); asP(eye, asSP(.012, 8, 6), asM(0xffffff, { e: 0xffffff, ei: .6 }), .015, .02, .078, { cast: false });
      rig.eyes.push(eye); asP(head, asBX(.14, .028, .03), hairMat, .175 * side, .17, .44, { rz: -.08 * side, cast: false });
    }
    asP(head, asSP(.035, 10, 8), skinDark, 0, -.06, .49, { cast: false });
    asP(head, asTO(.075, .016, Math.PI * .75, 8, 20), asM(0x7a3b33), 0, -.17, .455, { rz: Math.PI * 1.125, rx: -.1, cast: false });
    const blushM = asM(0xe8927c, { t: true, o: .35 }); asP(head, new THREE.CircleGeometry(.05, 16), blushM, -.3, -.1, .38, { ry: -.55, cast: false }); asP(head, new THREE.CircleGeometry(.05, 16), blushM, .3, -.1, .38, { ry: .55, cast: false });
    if (s.barba) { asP(head, asTO(.34, .1, Math.PI * .85, 12, 26), hairMat, 0, -.22, .16, { rx: Math.PI / 2, ry: -.13, s: [1, 1, .75] }); asP(head, asBX(.09, .03, .03), hairMat, -.05, -.115, .47, { rz: .15, cast: false }); asP(head, asBX(.09, .03, .03), hairMat, .05, -.115, .47, { rz: -.15, cast: false }); asP(head, asSP(.09, 12, 9), hairMat, 0, -.34, .36, { s: [1, .8, .7] }); }
    if (s.glasses) { const gm = asM(s.glasses == 3 ? 0x0a0a10 : 0x25262e, { m: .6, r: .3 }); [-1, 1].forEach((sd) => { if (s.glasses == 2) asP(head, asRB(.2, .14, .03, .02), gm, .175 * sd, .03, .5, { cast: false }); else asP(head, asTO(.095, .016, Math.PI * 2, 6, 18), gm, .175 * sd, .03, .5, { cast: false }); }); asP(head, asBX(.08, .02, .02), gm, 0, .04, .5, { cast: false }); }
    // cabelo: estilo do Studio, ou cabelo DESENHADO no Estúdio do jogo
    let hairG;
    if (s.drawnHair) { hairG = new THREE.Group(); hairG.scale.setScalar(1.13); drawnHair(hairG, s.drawnHair, (c) => asM3(c || s.hairCol, { roughness: .75 })); }
    else hairG = asHair(s.hair, hairMat, accent);
    head.add(hairG); if (s.helmMode === "vestido") hairG.scale.multiplyScalar(.86);
    // acessórios e chapéus vindos do Estúdio (formas extras)
    if (s.extraAcc || s.extraHelm) { const ex = new THREE.Group(); ex.scale.setScalar(1.13); const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; ex.add(m); return m; }; headExtras(ex, add, asM3, s.extraAcc, s.extraHelm, s.hair === 7 || s.hair === 8 || s.hair === 6 || s.hair === 14 ? .68 : .5); head.add(ex); }
  }
  if (s.acc.oculos) { const gg = new THREE.Group(); gg.position.set(0, .16, .44); head.add(gg); asP(gg, asRB(.42, .14, .06, .03), asM(0x1c2230)); asP(gg, asBX(.36, .1, .02), asM(0x59d7ff, { t: true, o: .85, e: 0x2fa8dd, ei: .6 }), 0, 0, .035, { cast: false }); asP(head, asTO(.5, .022, Math.PI * 2, 8, 32), asM(0x1c2230), 0, .14, 0, { rx: Math.PI / 2, cast: false }); }
  if (s.acc.fones) { const hr = s.helmMode === "vestido" ? .74 : .56, fm = asM(0x222831); asP(head, asTO(hr, .035, Math.PI, 12, 32), fm, 0, .02, 0); [-1, 1].forEach((sd) => { asP(head, asCY(.11, .11, .07, 16), fm, hr * sd, .02, 0, { rz: Math.PI / 2 }); asP(head, asTO(.11, .02, Math.PI * 2, 8, 20), accent, (hr + .04) * sd, .02, 0, { ry: Math.PI / 2 }); }); }
  if (s.helmMode !== "sem") { const helm = asHelmet(helmMat, accent); if (s.helmMode === "vestido") head.add(helm); else { helm.position.set(-.68, 1.02, .18); helm.rotation.z = .22; helm.scale.setScalar(.78); root.add(helm); } }
  // mochila
  if (s.pack != null) {
    const pack = new THREE.Group(); pack.position.set(0, .05, -.38); pack.scale.setScalar(s.packSz || 1); torso.add(pack);
    if (s.packSh == 4) pack.scale.multiplyScalar(1.25);
    if (s.packSh == 1) asP(pack, asSP(.36, 20, 14), packMat, 0, 0, -.02, { s: [1, 1.05, .6] });
    else if (s.packSh == 2) [-.13, .13].forEach((x) => { asP(pack, asCY(.12, .12, .6, 16), packMat, x, 0, 0); asP(pack, asSP(.12, 14, 10), packDk, x, .3, 0); });
    else asP(pack, asRB(.52, .66, .26, .08), packMat, 0, 0, 0, { recv: true });
    asP(pack, asRB(.4, .14, .2, .05), packDk, 0, .36, .02);
    if (s.packSh == 3) [-1, 1].forEach((q) => { const w = asP(pack, asBX(.04, .8, .5), asM(s.packC2, { e: s.packGlow || s.packC2, ei: .6, t: true, o: .85 }), .42 * q, .25, -.1); w.rotation.set(.2, 0, q * .5); });
    if (s.packPt == 2) asP(pack, asSP(.05, 10, 8), asM(0xff3030, { e: 0xff2020, ei: 1.5 }), 0, -.26, -.14, { cast: false });
    asP(pack, asCY(.07, .07, .4, 14), white, -.3, -.02, 0); asP(pack, asCY(.07, .07, .4, 14), white, .3, -.02, 0); asP(pack, asSP(.07, 12, 8), gray, -.3, .19, 0); asP(pack, asSP(.07, 12, 8), gray, .3, .19, 0);
    asP(pack, asSP(.03, 8, 6), asM(0x0a2233, { e: s.packGlow || 0x66ffee, ei: 1.8 }), .15, .25, -.14, { cast: false }); asP(pack, asCY(.012, .012, .3, 6), gray, -.2, .45, 0);
    rig.antennaTip = asP(pack, asSP(.025, 8, 6), asM(0x330000, { e: 0xff3344, ei: 2 }), -.2, .61, 0, { cast: false });
    if (s.acc.kit) { const kit = new THREE.Group(); kit.position.set(.36, -.05, 0); pack.add(kit); asP(kit, asRB(.16, .2, .14, .03), asM(0xf2f4f7)); asP(kit, asBX(.02, .035, .1), asM(0xd63031), .085, 0, 0, { cast: false }); asP(kit, asBX(.02, .1, .035), asM(0xd63031), .085, 0, 0, { cast: false }); }
  }
  // cinto e itens pendurados
  if (s.acc.cinto) { const belt = new THREE.Group(); belt.position.set(0, -.36, 0); torso.add(belt); const brown = asM(0x4a3b2a, { r: .7 }); asP(belt, asTO(.4, .045, Math.PI * 2, 10, 36), brown, 0, 0, 0, { rx: Math.PI / 2, s: [1, 1, .62] }); asP(belt, asBX(.1, .08, .03), asM(0xc9a24b, { m: .7, r: .3 }), 0, 0, .26); asP(belt, asRB(.12, .12, .07, .02), brown, -.3, -.02, .18, { ry: .5 }); asP(belt, asRB(.12, .12, .07, .02), brown, .3, -.02, .18, { ry: -.5 }); }
  if (s.acc.garrafa) { const bt = new THREE.Group(); bt.position.set(.37, -.46, .1); torso.add(bt); asP(bt, asCY(.055, .055, .22, 14), asM(0x1c3f6e)); asP(bt, asTO(.056, .012, Math.PI * 2, 8, 18), asM(0x0a2233, { e: 0x39c5ff, ei: 1.2 }), 0, .02, 0, { rx: Math.PI / 2, cast: false }); asP(bt, asCY(.03, .03, .04, 10), gray, 0, .13, 0); }
  if (s.acc.chave) { const wr = new THREE.Group(); wr.position.set(-.37, -.5, .1); wr.rotation.z = .3; torso.add(wr); const metal = asM(0xb9c2cc, { m: .8, r: .3 }); asP(wr, asBX(.035, .22, .02), metal); asP(wr, asTO(.045, .018, Math.PI * 1.4, 8, 16), metal, 0, .13, 0, { rz: -.7 }); asP(wr, asTO(.03, .014, Math.PI * 2, 8, 16), metal, 0, -.12, 0); }
  if (s.acc.lanterna) { const fl = new THREE.Group(); fl.position.set(-.2, -.54, .26); torso.add(fl); asP(fl, asCY(.035, .04, .18, 12), dark); asP(fl, asCY(.05, .045, .05, 12), gray, 0, -.1, 0); asP(fl, asSP(.04, 10, 8), asM(0xfff7cc, { e: 0xfff2a8, ei: 2.2 }), 0, -.13, 0, { cast: false }); }
  if (s.acc.pulso) { const wd = new THREE.Group(); wd.position.set(0, -.22, .11); wd.rotation.x = -.35; rig.armL.el.add(wd); asP(wd, asRB(.14, .1, .05, .02), dark); asP(wd, asPL(.11, .075), new THREE.MeshStandardMaterial({ map: asWristTex(), emissive: 0x39c5ff, emissiveIntensity: .35, emissiveMap: asWristTex(), roughness: .4 }), 0, 0, .028, { cast: false }); }
  if (s.acc.tablet) { const tb = new THREE.Group(); tb.position.set(0, -.4, .16); tb.rotation.x = -.9; rig.armR.el.add(tb); asP(tb, asRB(.34, .24, .03, .015), dark); asP(tb, asPL(.3, .2), new THREE.MeshStandardMaterial({ map: asTabletTex(), emissive: 0x224466, emissiveIntensity: .4, emissiveMap: asTabletTex(), roughness: .4 }), 0, 0, .017, { cast: false }); }
  if (s.watch) { const k = asP(rig.armR.el, asRB(.12, .08, .12, .02), asM(s.watch.col, { e: s.watch.glow || 0x000000, ei: s.watch.glow ? .9 : 1, m: .6 }), 0, -.24, .1); k.rotation.x = -.3; }
  return rig;
}

/** Converte o equipamento do jogo (cosméticos + aparência) no estado do Studio. */
function asState(e) {
  const lk = lookNorm(e.lk), alien = e.sp === "alien", suit = cxById(e.s || "s0"), pant = cxById(e.p || "p0"), helm = cxById(e.h || "h0"), pack = cxById(e.b || "b0");
  const hairIt = cxById(e.r), accIt = cxById(e.a), tool = cxById(e.t), watch = cxById(e.w), hasHair = hairIt.id && hairIt.id !== "r0";
  const white = (c) => !c || /^#(e[0-9a-f]|f[0-9a-f])(e[0-9a-f]|f[0-9a-f])(e[0-9a-f]|f[0-9a-f])$/i.test(c);
  const sp = cxp(suit), pp = cxp(pant), bp = cxp(pack);
  // cor principal = corpo do traje; acento = painéis (ou um tom mais escuro da cor principal)
  const base = suit.col || "#eef1f6", accent = suit.ac || (white(base) ? "#8b9bb4" : shade(base, .7));
  const ap = cxp(accIt), hp = cxp(helm), acc = {}; LOOK.AX.forEach(([k], i) => { if (lk.ax & (1 << i)) acc[k] = true; }); if (tool.id && tool.id !== "t0") acc[AS.TOOL[cxp(tool).sh]] = true;
  if (accIt.id && accIt.id !== "a0") { if (ap.sh == 8) acc.oculos = true; else if (ap.sh == 9) acc.fones = true; }
  if (helm.id && hp.sh == 5) acc.fones = true;
  const shaped = helm.id && helm.id !== "h0" && hp.sh >= 1 && hp.sh <= 6 && hp.sh != 5;
  const sk = SKINS[e.sk] || SKINS.verde;
  return {
    skin: alien ? sk.c : LOOK.TONES[lk.t], alienGlow: alien ? sk.g : null, alien: alien ? e : null, alienHelm: helm,
    hairCol: hasHair && hairIt.col ? hairIt.col : lk.hc, hair: hasHair ? (AS.S2N[AS.HAIR_OF[cxp(hairIt).sh]] != null ? AS.S2N[AS.HAIR_OF[cxp(hairIt).sh]] : 1) : (lk.h2 >= 0 ? lk.h2 : LOOK.OLD2NEW[lk.hr]), headSh: lk.hd, eyeSh: lk.es, boot: lk.ft, bootC: lk.bc || null, drawnHair: hasHair && hairIt.hv ? hairIt : null,
    eyes: (LOOK.EYEC[lk.ec] || LOOK.EYEC[0]), barba: lk.br > 0, glasses: lk.gl, accent, base, glow: suit.glow || null,
    pants: pant.col || "#e8ecf2", helm: helm.col || "#eef1f6", helmGlow: helm.glow || null, pack: alien && (!e.b || e.b === "b0") ? null : pack.col || "#9aa3ad", packGlow: pack.glow || null, packSz: bp.sz,
    helmMode: shaped || lk.hg === 2 ? "sem" : lk.hg === 1 ? "vestido" : "mao", flag: alien ? "" : lk.nc, nome: e.nm != null ? e.nm : null, bk: (alien ? 1 : [.9, 1, 1.12][lk.bd]) * ([1, .88, 1.15, 1][sp.sh] || 1), suitSh: sp.sh, suitPt: sp.pt, c2: sp.c2, pf: Array.isArray(suit.pf) && suit.pf.length === 6 ? suit.pf : null,
    pantSh: pp.sh, pantPt: pp.pt, pantC2: pp.c2, packSh: bp.sh, packPt: bp.pt, packC2: bp.c2,
    acc, watch: watch.id && watch.id !== "w0" && watch.col ? watch : null, extraAcc: accIt.id && accIt.id !== "a0" && ap.sh < 8 ? accIt : null, extraHelm: shaped ? helm : null,
    suitTx: txOf(suit, "torso"), pantTx: txOf(pant, "leg"), packTx: txOf(pack, "pack"),
  };
}

const avChibi = av;
/** Avatar do jogo = modelo do Avatar Studio. Mantém a interface antiga (userData.legs/arms para o andar). */
av = function (e) {
  e = e || {}; const s = asState(e), rig = asBuild(s), g = new THREE.Group(); g.add(rig.root);
  if (s.glow) { const ring = new THREE.Mesh(new THREE.TorusGeometry(.78, .03, 6, 28), new THREE.MeshBasicMaterial({ color: s.glow, transparent: true, opacity: .6 })); ring.rotation.x = Math.PI / 2; ring.position.y = .05; g.add(ring); g.userData.ring = ring; }
  const lk = lookNorm(e.lk); g.scale.setScalar(1.25 * (e.sp === "alien" ? 1 : [.93, 1, 1.07][lk.ht]));
  g.userData.legs = [rig.legL, rig.legR]; g.userData.arms = [rig.armL.sh, rig.armR.sh]; g.userData.rig = rig;
  // piscada e luz da antena (rodam nas prévias do Guarda-roupa/Estúdio)
  let nb = 2 + Math.random() * 2; g.userData.anim = [(t) => { const ph = t % 4.2, bl = ph > nb && ph < nb + .13; rig.eyes.forEach((q) => (q.scale.y = (q.userData.sy || 1) * (bl ? .12 : 1))); if (rig.antennaTip) rig.antennaTip.material.emissiveIntensity = 1 + (Math.sin(t * 5) > 0 ? 1.6 : 0); }];
  return g;
};
