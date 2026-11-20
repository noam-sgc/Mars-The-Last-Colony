/* Mundo 3D: renderer, céu, terreno com crateras, peças, astronauta e colonos. */
const cv = $("#c"), R = new THREE.WebGLRenderer({ canvas: cv, antialias: true });
R.setPixelRatio(Math.min(devicePixelRatio, 2));
R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = .9; R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
const sc = new THREE.Scene(); sc.background = new THREE.Color(0x2a1208); sc.fog = new THREE.FogExp2(0x9a4526, .006);
const cam = new THREE.PerspectiveCamera(55, 1, .1, 900);
const hemi = new THREE.HemisphereLight(0xffc9a0, 0x3a1a10, .55); sc.add(hemi);
const sun = new THREE.DirectionalLight(0xfff0d8, 1.15); sun.position.set(50, 80, 30); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -70, right: 70, top: 70, bottom: -70, near: 1, far: 260 }); sun.shadow.bias = -.0006; sc.add(sun); sc.add(sun.target);

// céu: cúpula em degradê + estrelas
const sky = new THREE.Mesh(new THREE.SphereGeometry(700, 24, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { top: { value: new THREE.Color(0x1a0d1e) }, mid: { value: new THREE.Color(0xc8663a) }, bot: { value: new THREE.Color(0xe39a62) } },
  vertexShader: "varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
  fragmentShader: "uniform vec3 top,mid,bot;varying vec3 p;void main(){float h=normalize(p).y;vec3 c=h>0.?mix(mid,top,pow(clamp(h,0.,1.),.55)):mix(mid,bot,clamp(-h*3.,0.,1.));gl_FragColor=vec4(c,1.);}" }));
sc.add(sky);
{ const sg = new THREE.BufferGeometry(), a = new Float32Array(900); for (let i = 0; i < 900; i += 3) { const u = Math.random() * 6.283, v = Math.random() * 1.2 + .25, r = 680; a[i] = r * Math.cos(u) * Math.cos(v); a[i + 1] = r * Math.sin(v); a[i + 2] = r * Math.sin(u) * Math.cos(v); }
  sg.setAttribute("position", new THREE.BufferAttribute(a, 3)); sc.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 2, fog: false, transparent: true, opacity: .55 }))); }

// terreno com crateras
const CR = [[-60, 40, 16, 2.6], [55, -50, 22, 3.2], [-30, -70, 12, 2], [75, 60, 14, 2.4], [-85, -20, 18, 2.8]];
const H = (x, z) => { let h = 1.2 * Math.sin(x * .07) * Math.cos(z * .06) + .6 * Math.sin(x * .19 + z * .13);
  for (const [cx, cz, r, d] of CR) { const q = Math.hypot(x - cx, z - cz) / r; if (q < 1.25) h += q < 1 ? -d * (1 - q * q) : d * .35 * Math.exp(-(((q - 1) * 6) ** 2)); } return h; };
const tg = new THREE.PlaneGeometry(300, 300, 150, 150); tg.rotateX(-Math.PI / 2);
{ const pa = tg.attributes.position, col = new Float32Array(pa.count * 3), c1 = new THREE.Color(0x9a4528), c2 = new THREE.Color(0xc2774a), c3 = new THREE.Color(0x5e2a1a), t = new THREE.Color();
  for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), z = pa.getZ(i), h = H(x, z); pa.setY(i, h); const n = .5 + .5 * Math.sin(x * .31) * Math.sin(z * .27); t.copy(h > .8 ? c2 : c1).lerp(c3, clamp(-h / 3, 0, 1) * .8).lerp(c2, n * .22).multiplyScalar(.85 + Math.random() * .3); col[i * 3] = t.r; col[i * 3 + 1] = t.g; col[i * 3 + 2] = t.b; }
  tg.setAttribute("color", new THREE.BufferAttribute(col, 3)); tg.computeVertexNormals(); }
const ter = new THREE.Mesh(tg, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true })); ter.receiveShadow = true; sc.add(ter);
const ROCKS = [];
for (let i = 0; i < 80; i++) { const x = (Math.random() - .5) * 280, z = (Math.random() - .5) * 280; if (Math.hypot(x, z) < 24) continue;
  const rr = .6 + Math.random() * 2.4, r = new THREE.Mesh(new THREE.DodecahedronGeometry(rr), new THREE.MeshStandardMaterial({ color: 0x7a3a22 + (Math.random() * 0x101010 | 0), roughness: .95, flatShading: true }));
  r.position.set(x, H(x, z) + .3, z); r.userData.rad = rr * .85; r.rotation.set(Math.random() * 3, Math.random() * 3, 0); r.castShadow = r.receiveShadow = true; sc.add(r); ROCKS.push(r); }
// poeira em suspensão
const dust = new THREE.Points((() => { const g = new THREE.BufferGeometry(), a = new Float32Array(600); for (let i = 0; i < 600; i += 3) { a[i] = (Math.random() - .5) * 160; a[i + 1] = Math.random() * 22; a[i + 2] = (Math.random() - .5) * 160; } g.setAttribute("position", new THREE.BufferAttribute(a, 3)); return g; })(), new THREE.PointsMaterial({ color: 0xe8b890, size: .35, transparent: true, opacity: .45 }));
sc.add(dust);
// luzes da OVNI/aliens (apenas na saga alienígena)
const UFOS = new THREE.Group(); sc.add(UFOS); UFOS.visible = false;
function mkUfo() { const g = new THREE.Group(), M = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, metalness: .7, roughness: .3 }, o || {}));
  const b = new THREE.Mesh(new THREE.SphereGeometry(5, 24, 8), M(0xb8c4d0)); b.scale.y = .28; g.add(b);
  const d = new THREE.Mesh(new THREE.SphereGeometry(2.4, 16, 10, 0, 6.283, 0, 1.6), M(0x8affd0, { emissive: 0x2aa070, transparent: true, opacity: .85 })); d.position.y = .6; g.add(d);
  for (let i = 0; i < 8; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(.28, 8, 6), new THREE.MeshBasicMaterial({ color: 0xbfffe8 })); const a = i * .785; l.position.set(Math.cos(a) * 4.4, -.1, Math.sin(a) * 4.4); g.add(l); }
  const beam = new THREE.Mesh(new THREE.ConeGeometry(4.5, 28, 20, 1, true), new THREE.MeshBasicMaterial({ color: 0x9dffd8, transparent: true, opacity: .08, side: THREE.DoubleSide, depthWrite: false })); beam.position.y = -14; g.add(beam); return g; }
for (let i = 0; i < 3; i++) { const u = mkUfo(); u.userData.a = i * 2.1; u.userData.r = 38 + i * 14; UFOS.add(u); }

// ---------- peças ----------
const MAT = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .55, metalness: .25 }, o || {}));
function mk(t, col) {
  const g = new THREE.Group(), M = MAT;
  const add = (geo, m, x, y, z, rx, rz, ry) => { const o = new THREE.Mesh(geo, m); o.position.set(x || 0, y || 0, z || 0); o.rotation.set(rx || 0, ry || 0, rz || 0); o.castShadow = o.receiveShadow = true; g.add(o); return o; };
  const glow = (c, i) => M(c, { emissive: c, emissiveIntensity: i == null ? .8 : i, roughness: .4 });
  const CY = (a, b, h, s) => new THREE.CylinderGeometry(a, b, h, s || 14), BX = (w, h, d) => new THREE.BoxGeometry(w, h, d), SP = (r, a, b) => new THREE.SphereGeometry(r, a || 16, b || 10);
  g.anim = [];
  if (t == "solar") {
    add(CY(.18, .25, 2.4, 8), M(0x8a8f99), 0, 1.2, 0); const arm = new THREE.Group(); arm.position.set(0, 2.5, 0); arm.rotation.x = -.5; g.add(arm);
    for (let i = -1; i <= 1; i++) { const p = new THREE.Mesh(BX(1.6, .1, 2.6), M(0x1d3f8f, { emissive: 0x0a1a50, emissiveIntensity: .7, metalness: .8, roughness: .2 })); p.position.x = i * 1.75; p.castShadow = true; arm.add(p);
      const fr = new THREE.Mesh(BX(1.66, .06, 2.66), M(0xc9ced6)); fr.position.set(i * 1.75, -.04, 0); arm.add(fr); }
    g.anim.push((t) => { arm.rotation.y = Math.sin(t * .15) * .3; });
  } else if (t == "hab") {
    const c = col || "#d8d0c4"; add(CY(1.9, 1.9, 5.2, 20), M(c, { metalness: .35 }), 0, 1.9, 0, 0, Math.PI / 2);
    for (let i = -2; i <= 2; i++) add(new THREE.TorusGeometry(1.92, .09, 6, 20), M(0x777d88), i * 1.1, 1.9, 0, 0, 0, Math.PI / 2);
    add(SP(1.15, 16, 10), M(0xf0f0f0), 0, 3.7, 0); [-1.4, 0, 1.4].forEach((x) => add(BX(.7, .45, .08), glow(0x66ddff, .9), x, 2.3, 1.88));
    add(BX(.9, 1.3, .1), M(0x444a55), 2.62, 1.2, 0, 0, 0, Math.PI / 2); add(CY(.04, .04, 2.2, 6), M(0xcccccc), -1.8, 4.4, 0); add(SP(.12, 8, 6), glow(0xff4444, 1), -1.8, 5.5, 0);
    [-2, 2].forEach((x) => add(CY(.1, .1, 1.1, 6), M(0x555a66), x, .5, 1.5, .3));
  } else if (t == "drill") {
    add(BX(2.8, .7, 2.8), M(0x555a66), 0, .35, 0); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([x, z]) => add(CY(.08, .1, 5.6, 6), M(0xe07a20), x * .8, 3, z * .8, z * -.1, x * .1));
    add(BX(2.2, .2, 2.2), M(0xe07a20), 0, 5.7, 0); const sh = new THREE.Group(); sh.position.y = 3; g.add(sh); const sp = new THREE.Mesh(CY(.28, .12, 5.4, 8), M(0xcfd3da, { metalness: .9 })); sp.castShadow = true; sh.add(sp);
    g.tip = add(SP(.4, 10, 8), glow(0x66ffee, 1), 0, .3, 0); g.tip.position.y = .2; g.anim.push((t) => { sh.rotation.y = t * 6; g.tip.scale.setScalar(1 + .25 * Math.sin(t * 4)); });
  } else if (t == "green") {
    add(new THREE.SphereGeometry(3.1, 24, 14, 0, 6.283, 0, 1.57), M(0x88ffcc, { transparent: true, opacity: .32, roughness: .1, metalness: .1, depthWrite: false }), 0, 0, 0);
    for (let i = 0; i < 6; i++) add(new THREE.TorusGeometry(3.1, .05, 6, 20, 3.14), M(0xd0d6de), 0, 0, 0, 0, 0, i * 1.0472).rotation.set(0, i * 1.0472, 0);
    add(CY(3.1, 3.2, .3, 20), M(0x6a6f78), 0, .1, 0); for (let i = 0; i < 9; i++) { const a = i * .7, r = 1 + (i % 3) * .7; add(new THREE.ConeGeometry(.35, .9 + (i % 2) * .5, 6), M([0x3fc060, 0xff5aa8, 0xffd34a][i % 3], { emissive: 0x112211 }), Math.cos(a) * r, .7, Math.sin(a) * r); }
  } else if (t == "rover") {
    add(BX(2.6, .8, 1.5), M(0xd5d8de), 0, 1, 0); add(BX(1, .7, 1.2), M(0x2a3a4a, { metalness: .9, roughness: .1 }), .5, 1.65, 0); add(CY(.04, .04, 1.5, 6), M(0xcccccc), -.9, 2.1, 0); add(new THREE.CircleGeometry(.4, 12), M(0xcfd3da), -.9, 2.9, 0, 0, 0, 0);
    add(BX(.9, .06, .9), M(0x1d3f8f, { emissive: 0x0a1a50 }), -.6, 1.45, 0);
    for (const x of [-1, 0, 1]) for (const z of [-.9, .9]) add(CY(.42, .42, .3, 12), M(0x222226, { roughness: .9 }), x, .45, z, Math.PI / 2);
  } else if (t == "oxy") {
    add(CY(1.2, 1.2, 3.2, 16), M(0xdfe9f2, { metalness: .5 }), 0, 1.6, 0); add(SP(1.2, 16, 10), M(0x88ccff, { emissive: 0x113355, metalness: .3 }), 0, 3.2, 0);
    add(new THREE.TorusGeometry(1.25, .08, 6, 20), glow(0x66ddff, 1), 0, 1.2, 0, Math.PI / 2); add(new THREE.TorusGeometry(1.25, .08, 6, 20), glow(0x66ddff, 1), 0, 2.2, 0, Math.PI / 2);
    add(CY(.14, .14, 2.5, 6), M(0x777d88), 1.4, 1.1, 0, 0, 1.2);
  } else if (t == "fuel") {
    [-1.3, 1.3].forEach((x) => { add(CY(1, 1, 3.6, 16), M(0xd9602a, { metalness: .5 }), x, 1.8, 0); add(SP(1, 14, 8), M(0xd9602a, { metalness: .5 }), x, 3.6, 0); });
    add(BX(3.8, .3, 1), M(0x444a55), 0, 4.3, 0); add(CY(.1, .1, 2.4, 6), M(0x777d88), 0, 3.2, 0, 0, 1.57); add(CY(.08, .08, 2.6, 6), M(0xcccccc), 2.6, 1.3, 0); const f = add(SP(.28, 8, 6), glow(0xffb347, 1.5), 2.6, 2.7, 0);
    g.anim.push((t) => { f.scale.setScalar(1 + .3 * Math.sin(t * 9)); });
  } else if (t == "hydro") {
    add(BX(3.2, 3.2, 1.8), M(0x333a44), 0, 1.6, 0); [.7, 1.5, 2.3].forEach((y) => add(BX(2.8, .2, 1.65), glow(0xb040e0, .9), 0, y, .03)); add(BX(3.3, .12, 1.9), M(0x5a606c), 0, 3.25, 0);
    add(CY(.12, .12, 1.4, 6), M(0x77aacc), -1.7, 1.2, 0);
  } else if (t == "rec") {
    add(new THREE.SphereGeometry(2.5, 22, 12, 0, 6.283, 0, 1.57), M(0xc08cff, { transparent: true, opacity: .4, roughness: .1, depthWrite: false }), 0, 0, 0); add(CY(2.55, 2.6, .25, 20), M(0x5a606c), 0, .1, 0);
    add(CY(.3, .3, 2.2, 8), glow(0xffdd88, .8), 0, 1.1, 0); const b = add(SP(.5, 12, 8), glow(0xff88dd, 1), 0, 2.4, 0); g.anim.push((t) => { b.position.y = 2.4 + .2 * Math.sin(t * 2); b.material.emissiveIntensity = .7 + .4 * Math.sin(t * 3); });
    for (let i = 0; i < 5; i++) { const a = i * 1.256; add(SP(.14, 6, 4), glow([0xff4466, 0x44ddff, 0xffee55][i % 3], 1), Math.cos(a) * 1.6, .3, Math.sin(a) * 1.6); }
  } else if (t == "ctrl") {
    add(BX(3.2, 1.8, 2.6), M(0x8899aa, { metalness: .5 }), 0, .9, 0); add(BX(3.3, .2, 2.7), M(0x555e6c), 0, 1.9, 0); add(CY(.08, .08, 3.6, 6), M(0xcccccc), .9, 3.7, 0);
    add(BX(1.8, .7, .08), glow(0x44ffcc, .9), 0, 1.2, 1.32); add(BX(.5, .5, .08), glow(0xffcc44, .9), -1.2, 1.2, 1.32);
    const d = new THREE.Group(); d.position.set(-.8, 2.6, 0); const dish = new THREE.Mesh(new THREE.SphereGeometry(.9, 14, 8, 0, 6.283, 0, 1.2), M(0xdde3ea, { side: THREE.DoubleSide })); dish.rotation.x = -.8; d.add(dish); g.add(d); g.anim.push((t) => { d.rotation.y = t * .6; });
  } else if (t == "purif") {
    add(CY(1.5, 1.5, 1.9, 16), M(0x2aa8a8, { metalness: .5 }), 0, .95, 0); add(CY(.45, .45, 2.8, 10), M(0xdddddd), 0, 3, 0); add(new THREE.TorusGeometry(1.5, .1, 6, 20), glow(0x44ffee, .8), 0, 1.9, 0, Math.PI / 2); add(CY(.15, .15, 2, 6), M(0x777d88), 1.6, .8, 0, 0, 1.4);
  } else if (t == "ant") {
    add(CY(.2, .45, 4, 8), M(0xbfc6d0), 0, 2, 0); const d = new THREE.Group(); d.position.y = 4.4; g.add(d);
    [[-1.4, 0], [1.4, 0]].forEach(([x]) => { const dish = new THREE.Mesh(new THREE.SphereGeometry(1.5, 16, 8, 0, 6.283, 0, 1.2), M(0xeef2f6, { side: THREE.DoubleSide, metalness: .6 })); dish.position.x = x; dish.rotation.z = x < 0 ? .9 : -.9; d.add(dish); });
    const orb = add(SP(.4, 10, 8), glow(0x6dffc8, 1.4), 0, 5.6, 0); g.anim.push((t) => { d.rotation.y = t * .5; orb.scale.setScalar(1 + .3 * Math.sin(t * 5)); });
  } else if (t == "emb") {
    add(CY(2.6, 2.8, 1, 20), M(0xd8e0e8), 0, .5, 0); add(new THREE.SphereGeometry(2.3, 22, 12, 0, 6.283, 0, 1.57), M(0x9affd8, { transparent: true, opacity: .45, emissive: 0x114433, depthWrite: false }), 0, 1, 0);
    const ring = add(new THREE.TorusGeometry(1.8, .12, 8, 28), glow(0x6dffc8, 1.2), 0, 2.2, 0, Math.PI / 2); g.anim.push((t) => { ring.rotation.z = t * .8; ring.position.y = 2.2 + .15 * Math.sin(t * 2); });
    add(CY(.05, .05, 3, 6), M(0xcccccc), 3, 1.5, 0); add(BX(1.1, .7, .04), glow(0x4fe3b0, .8), 3.55, 2.6, 0); add(BX(1.1, .7, .04), glow(0xff6a2b, .8), 3.55, 1.85, 0);
  } else if (t == "xeno") {
    add(CY(2.4, 2.6, .5, 18), M(0x2a2f3a), 0, .25, 0);
    for (let i = 0; i < 7; i++) { const a = i * .9, r = .6 + (i % 3) * .75, h = 1.4 + (i % 4) * .6; const s = add(CY(.06, .14, h, 6), M(0x2a8, { emissive: 0x1ad8a0, emissiveIntensity: .6 }), Math.cos(a) * r, h / 2 + .4, Math.sin(a) * r); const b = add(SP(.28 + (i % 2) * .12, 8, 6), glow([0x6dffc8, 0xd78bff, 0x7ad4ff][i % 3], 1.1), Math.cos(a) * r, h + .5, Math.sin(a) * r); b.userData.o = i; }
    g.anim.push((t) => { g.children.forEach((c) => { if (c.userData.o != null) c.scale.setScalar(1 + .15 * Math.sin(t * 2 + c.userData.o)); }); });
  } else if (TY[t] && TY[t].custom) {
    const c = TY[t].custom, w = c.w || 3, h = c.h || 3, cl = c.col || "#9aa7b8", gl = c.glow || "#44ffcc";
    if (c.shape == "cyl") { add(CY(w / 2, w / 2, h, 18), M(cl, { metalness: .5 }), 0, h / 2, 0); add(new THREE.TorusGeometry(w / 2 + .02, .08, 6, 22), glow(gl, 1), 0, h * .7, 0, Math.PI / 2); }
    else if (c.shape == "dome") { add(new THREE.SphereGeometry(w, 22, 12, 0, 6.283, 0, 1.57), M(cl, { transparent: true, opacity: .55, roughness: .1, depthWrite: false })); add(CY(w, w + .1, .3, 20), M(0x5a606c), 0, .1, 0); add(SP(.6, 10, 8), glow(gl, 1), 0, h / 3, 0); }
    else if (c.shape == "tower") { add(CY(w * .22, w * .5, h * 1.6, 8), M(cl, { metalness: .6 }), 0, h * .8, 0); add(SP(w * .3, 12, 8), glow(gl, 1.2), 0, h * 1.7, 0); }
    else if (c.shape == "ring") { add(CY(w * .6, w * .6, .5, 16), M(0x444a55), 0, .25, 0); const r = add(new THREE.TorusGeometry(w * .55, .22, 8, 24), glow(gl, 1), 0, h * .6, 0, Math.PI / 2); g.anim.push((t) => { r.rotation.z = t; }); add(SP(w * .22, 10, 8), M(cl, { metalness: .8 }), 0, h * .6, 0); }
    else { add(BX(w, h, w), M(cl, { metalness: .5 }), 0, h / 2, 0); add(BX(w * .6, .3, .08), glow(gl, 1), 0, h * .65, w / 2 + .02); add(BX(w + .1, .2, w + .1), M(0x555e6c), 0, h, 0); }
  } else add(BX(2, 2, 2), M(0x888888), 0, 1, 0);
  g.userData.anim = g.anim; return g;
}

// ---------- astronauta ----------
/* av(e): avatar 3D — ver js/avatar.js */
function walkAnim(g, t, speed) { const u = g.userData; if (!u.legs) return; const s = Math.sin(t * 9) * Math.min(1, speed) * .7; u.legs[0].rotation.x = s; u.legs[1].rotation.x = -s; if (u.arms[0]) { u.arms[0].rotation.x = -s * .8; u.arms[1].rotation.x = s * .8; } if (u.ring) u.ring.rotation.z = t; }

const SKINS = { verde: { c: "#8affd8", g: "#22cc99", n: "Verde-lunar" }, violeta: { c: "#c9a4ff", g: "#8a55ff", n: "Violeta" }, azul: { c: "#8ec9ff", g: "#3a8dff", n: "Azul-gelo" }, laranja: { c: "#ffc08a", g: "#ff8a2a", n: "Âmbar" }, cinza: { c: "#cfd8dc", g: "#8aa0a8", n: "Cinza-prata" } };
/** Aparência do jogador local (cosméticos + espécie). */
const myEq = () => Object.assign({}, P.eq, { sp: P.sp === "alien" ? "alien" : "human", sk: P.skin || "verde", lk: lookNorm(P.look), chr: P.chr || "", nm: (typeof ACC !== "undefined" && ACC.user) || P.name || "" });
/** Achado colecionável: coin (bolsa de moedas), tank (cilindro com a cor do tanque) ou phase (estrela dourada do bônus da fase). tall = com coluna de luz (visível de longe). */
function mkLoot(kind, k, tall) {
  const g = new THREE.Group(), glowM = (c, i) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: i == null ? .9 : i, roughness: .35, metalness: .4 });
  if (kind === "coin") { const d = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, .16, 18), glowM(0xffcf3d, .8)); d.rotation.x = Math.PI / 2; d.position.y = 1.1; g.add(d); const r = new THREE.Mesh(new THREE.TorusGeometry(.6, .05, 6, 20), glowM(0xfff1a8, 1.2)); r.position.y = 1.1; g.add(r); }
  else if (kind === "tank") { const c = new THREE.Color(TC[k] || "#66ddff"), m = glowM(c, .7), b = new THREE.Mesh(new THREE.CylinderGeometry(.38, .38, .9, 14), m); b.position.y = 1.1; g.add(b); const cap = new THREE.Mesh(new THREE.SphereGeometry(.38, 12, 8, 0, 6.283, 0, 1.57), m); cap.position.y = 1.55; g.add(cap); const rg = new THREE.Mesh(new THREE.TorusGeometry(.45, .04, 6, 18), glowM(0xffffff, .8)); rg.rotation.x = Math.PI / 2; rg.position.y = 1.1; g.add(rg); }
  else { const s = new THREE.Mesh(new THREE.OctahedronGeometry(.7, 0), glowM(0xffe14a, 1.1)); s.position.y = 1.4; s.scale.y = 1.35; g.add(s); const rg = new THREE.Mesh(new THREE.TorusGeometry(.95, .06, 6, 24), glowM(0xfff1a8, 1.2)); rg.rotation.x = Math.PI / 2; rg.position.y = 1.4; g.add(rg); }
  if (tall) { const col = kind === "phase" ? 0xffe14a : kind === "tank" ? new THREE.Color(TC[k] || "#66ddff").getHex() : 0xffcf3d; const p = new THREE.Mesh(new THREE.CylinderGeometry(.25, .8, 16, 12, 1, true), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .22, side: THREE.DoubleSide, depthWrite: false })); p.position.y = 8; g.add(p); }
  const pl = new THREE.PointLight(kind === "phase" ? 0xffe14a : kind === "tank" ? new THREE.Color(TC[k] || "#66ddff").getHex() : 0xffcf3d, .7, 7); pl.position.y = 1.4; g.add(pl);
  g.userData.kind = kind; return g;
}
const animLoot = (m, t, i) => { const c = m.children[0]; m.position.y = (m.userData.y0 || 0) + Math.sin(t * 2.2 + i) * .18; m.rotation.y = t * 1.6 + i; };
// colonos (NPCs) e emissários alienígenas
const CNAMES = "Marta,Ivo,Lena,Tavi,Joaquim,Nadia,Omar,Bia,Hiro,Clara,Dante,Yara,Otto,Luz,Ravi,Mei,Tomás,Zélia,Ícaro,Noor".split(",");
const CJOBS = ["engenheira", "geólogo", "agricultora", "médico", "técnica de O₂", "piloto", "cientista", "cozinheiro", "mecânica", "professora"];
function mkColonist(seed, alien) {
  if (!alien) { const r0 = (n) => { seed = (seed * 9301 + 49297) % 233280; return Math.floor(seed / 233280 * n); }; const sk = ["s11", "s12", "s13", "s14", "s15", "s16", "s17", "s18", "s0"], pk = ["b10", "b11", "b12", "b13", "b14", "b15", "b16", "b17"], pa = ["p10", "p11", "p12", "p13", "p14", "p0"];
    const g = av({ s: sk[r0(9)], p: pa[r0(6)], b: pk[r0(8)], h: "h" + (10 + r0(6)), lk: Object.assign(lookRandom(seed + 13), { nc: MarsRules.COUNTRIES[r0(MarsRules.COUNTRIES.length)].c }), lq: 1 }); g.scale.multiplyScalar(.85);
    g.userData.info = { name: CNAMES[r0(CNAMES.length)], job: CJOBS[r0(CJOBS.length)], alien: false }; return g; }
  const r = (n) => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280 * n; };
  const g = new THREE.Group(), M = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .6 }, o || {}));
  const cols = ["#ff8a1f", "#3d7bff", "#46b86a", "#c43fd0", "#e8e8ee", "#e8b923", "#2b9aa8"];
  const body = alien ? "#6dffc8" : cols[Math.floor(r(cols.length))];
  const legs = [-.2, .2].map((x) => { const l = new THREE.Group(); l.position.set(x, .9, 0); const m = new THREE.Mesh(new THREE.CylinderGeometry(.16, .14, .9, 6), M(alien ? "#4fd3a6" : "#555a66")); m.position.y = -.45; l.add(m); g.add(l); return l; });
  const t = new THREE.Mesh(alien ? new THREE.SphereGeometry(.5, 10, 8) : new THREE.CylinderGeometry(.4, .38, 1, 8), M(body, alien ? { emissive: "#1ad8a0", emissiveIntensity: .35 } : {})); t.position.y = 1.4; if (alien) t.scale.y = 1.3; t.castShadow = true; g.add(t);
  const hd = new THREE.Mesh(new THREE.SphereGeometry(alien ? .5 : .36, 12, 10), M(alien ? "#8affd8" : "#f2c9a4", alien ? { emissive: "#22cc99", emissiveIntensity: .4 } : {})); hd.position.y = alien ? 2.35 : 2.15; if (alien) hd.scale.set(1, 1.15, .95); hd.castShadow = true; g.add(hd);
  if (alien) { [-.2, .2].forEach((x) => { const e = new THREE.Mesh(new THREE.SphereGeometry(.17, 8, 6), new THREE.MeshBasicMaterial({ color: "#10162a" })); e.position.set(x, 2.4, .38); e.scale.set(1, 1.4, .5); g.add(e); const a = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .55, 5), M("#8affd8")); a.position.set(x * 1.4, 2.95, 0); a.rotation.z = -x * 2; g.add(a); const b = new THREE.Mesh(new THREE.SphereGeometry(.08, 6, 5), new THREE.MeshBasicMaterial({ color: "#ffffff" })); b.position.set(x * 2, 3.2, 0); g.add(b); }); }
  else { hd.visible = false; const hh = humanHead(lookRandom(seed + 13), null, null, null, M); hh.position.y = 2.2; hh.scale.setScalar(.85); g.add(hh); }
  g.userData.legs = legs; g.userData.arms = []; g.scale.setScalar(1.15);
  g.userData.info = alien ? { name: ["Zyl", "Orx", "Quel", "Nemi", "Tavo", "Ilu"][Math.floor(r(6))] + "-" + (10 + Math.floor(r(80))), job: "emissário alienígena", alien: true } : { name: CNAMES[Math.floor(r(CNAMES.length))], job: CJOBS[Math.floor(r(CJOBS.length))], alien: false };
  return g;
}
function lab(text, o) {
  o = o || {}; const c = document.createElement("canvas"); c.width = 384; c.height = 72; const x = c.getContext("2d");
  x.font = "bold 28px system-ui,sans-serif"; const full = (o.flag ? o.flag + " " : "") + text, w = Math.min(372, x.measureText(full).width + 24 + (o.badge ? 34 : 0));
  x.fillStyle = "#000b"; const L = (384 - w) / 2; x.beginPath(); x.roundRect ? x.roundRect(L, 10, w, 52, 14) : x.rect(L, 10, w, 52); x.fill();
  x.fillStyle = o.col || "#fff"; x.textAlign = "left"; x.fillText(full, L + 12, 46);
  if (o.badge) { const bx = L + 12 + x.measureText(full).width + 18; x.fillStyle = o.badge === "adm" ? "#ffb81f" : "#3aa0ff"; x.beginPath(); x.arc(bx, 36, 14, 0, 6.283); x.fill(); x.fillStyle = "#fff"; x.font = "bold 20px sans-serif"; x.textAlign = "center"; x.fillText("✔", bx, 44); }
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false, transparent: true })); s.scale.set(6, 1.125, 1); s.renderOrder = 10; return s;
}
function rs() { R.setSize(innerWidth, innerHeight, false); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); }
addEventListener("resize", rs); rs();
