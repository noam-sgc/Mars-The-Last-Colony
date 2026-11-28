/* Conversão 2D → 3D dos sprites da animação: cada peça (corpo, cabeça, cabelo, capacete, mochila, luvas, bandeira, equipamento)
   vira uma MALHA 3D "inflada" a partir do contorno da própria sprite: a frente usa a arte original como textura (idêntica de frente),
   o contorno ganha profundidade (perfil de almofada / elipsoide na cabeça) e o verso repete a arte, mais escura.
   O boneco é montado em 3D, camada por camada, e gira 360° como os outros avatares. */
const A3 = (() => {
  const K = .02, geo = {}, tex = {}, mat = {}, fieldC = {};
  const W = () => ART.W, X0 = 110, Y0 = 90, FEET = Y0 + 160;
  /** Textura compartilhada do atlas (a mesma imagem do 2D). */
  const atlasTex = (cat) => tex[cat] || (tex[cat] = (() => { const t = new THREE.Texture(ART.st.img[cat]); t.needsUpdate = true; t.minFilter = THREE.LinearFilter; t.magFilter = THREE.LinearFilter; t.generateMipmaps = false; return t; })());
  const bm = {}, backMat = (c) => { const k = c.map((v) => Math.round(v * 40)).join(","); return bm[k] || (bm[k] = new THREE.MeshBasicMaterial({ color: new THREE.Color(c[0], c[1], c[2]), vertexColors: true })); };
  const material = (cat) => mat[cat] || (mat[cat] = new THREE.MeshBasicMaterial({ map: atlasTex(cat), alphaTest: .42, vertexColors: true, side: THREE.FrontSide }));
  /** Alfa da célula (0..255) + campo de distância à borda (chanfro 3-4) + máximo. */
  function field(cat, i) {
    const k = cat + i; if (fieldC[k]) return fieldC[k]; const p = ART.cell(cat, i), cv = document.createElement("canvas"); cv.width = p.w; cv.height = p.h; const cx = cv.getContext("2d", { willReadFrequently: true }); cx.drawImage(p.im, p.x, p.y, p.w, p.h, 0, 0, p.w, p.h);
    const d = cx.getImageData(0, 0, p.w, p.h).data, w = p.w, h = p.h, a = new Uint8Array(w * h), dist = new Float32Array(w * h);
    for (let n = 0; n < w * h; n++) { a[n] = d[n * 4 + 3]; dist[n] = a[n] >= 110 ? 1e4 : 0; }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const n = y * w + x; if (!dist[n]) continue; let v = dist[n]; if (x === 0 || y === 0 || x === w - 1 || y === h - 1) v = 3; if (x > 0) v = Math.min(v, dist[n - 1] + 3); if (y > 0) { v = Math.min(v, dist[n - w] + 3); if (x > 0) v = Math.min(v, dist[n - w - 1] + 4); if (x < w - 1) v = Math.min(v, dist[n - w + 1] + 4); } dist[n] = v; }
    let mx = 0; for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) { const n = y * w + x; if (!dist[n]) continue; let v = dist[n]; if (x < w - 1) v = Math.min(v, dist[n + 1] + 3); if (y < h - 1) { v = Math.min(v, dist[n + w] + 3); if (x < w - 1) v = Math.min(v, dist[n + w + 1] + 4); if (x > 0) v = Math.min(v, dist[n + w - 1] + 4); } dist[n] = v; if (v > mx) mx = v; }
    for (let n = 0; n < w * h; n++) dist[n] /= 3;   // em pixels
    // cor média da região que representa o VERSO da peça (traje: pernas; capacete/mochila/cabeça pronta: parte de cima)
    let y0 = 0, y1 = h, x0 = 0, x1 = w; if (cat === "bodies") { y0 = Math.round(h * .58); x1 = Math.round(w * .5); } else if (cat === "helmets" || cat === "packs" || cat === "hh") { y1 = Math.round(h * .3); }
    let r = 0, g = 0, b = 0, c = 0; for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const n = y * w + x; if (a[n] >= 230) { r += d[n * 4]; g += d[n * 4 + 1]; b += d[n * 4 + 2]; c++; } }
    if (!c) for (let n = 0; n < w * h; n++) if (a[n] >= 230) { r += d[n * 4]; g += d[n * 4 + 1]; b += d[n * 4 + 2]; c++; }
    // relevo: contraste local da luminância (sombras = fundo: boca, vãos, dobras; realces = saliências), só escalas de 2 a 9 px
    const gr = new Float32Array(w * h); for (let n = 0; n < w * h; n++) gr[n] = a[n] >= 90 ? (d[n * 4] * .299 + d[n * 4 + 1] * .587 + d[n * 4 + 2] * .114) / 255 : -1;
    const blur = (src, r) => { const out = new Float32Array(w * h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let sum = 0, c = 0; for (let yy = Math.max(0, y - r); yy <= Math.min(h - 1, y + r); yy++) for (let xx = Math.max(0, x - r); xx <= Math.min(w - 1, x + r); xx++) { const v = src[yy * w + xx]; if (v >= 0) { sum += v; c++; } } out[y * w + x] = c ? sum / c : 0; } return out; };
    const g1 = blur(gr, 1), g2 = blur(gr, 7), rel = new Float32Array(w * h); for (let n = 0; n < w * h; n++) rel[n] = a[n] >= 90 ? Math.max(-1, Math.min(1, (g1[n] - g2[n]) / .22)) : 0;
    return (fieldC[k] = { w, h, a, dist, rel, max: mx / 3, avg: c ? [r / c / 255, g / c / 255, b / c / 255] : [.4, .4, .4] });
  }
  const RELIEF = { bodies: 5, hairs: 6, helmets: 6, packs: 6, gloves: 4, devices: 5, flags: 1, heads: 1.6, hh: 4.5 };
  const bump = (x, y, cx, cy, sx, sy, amp) => { const u = (x - cx) / sx, v = (y - cy) / sy; return amp * Math.exp(-(u * u + v * v)); };
  /** Relevo do rosto (coordenadas normalizadas da cabeça): cada elemento com a sua profundidade: nariz sai, boca e vãos dos olhos afundam, sobrancelhas, bochechas e queixo avançam. */
  function faceRelief(nx, ny) {
    let z = 0; const cx = .55;
    z += bump(nx, ny, cx, .70, .060, .060, 7.5) + bump(nx, ny, cx, .60, .035, .090, 3.2);            // ponta e dorso do nariz
    z += bump(nx, ny, cx - .085, .715, .035, .035, 2.4) + bump(nx, ny, cx + .085, .715, .035, .035, 2.4);   // asas do nariz
    z -= bump(nx, ny, cx - .005, .79, .150, .028, 2.6); z += bump(nx, ny, cx - .005, .765, .120, .018, 1.6) + bump(nx, ny, cx - .005, .815, .100, .020, 1.4);   // boca: abertura afunda, lábios avançam
    for (const sx of [-1, 1]) { const ex = cx + sx * .185, ey = .55;
      z -= bump(nx, ny, ex, ey, .150, .120, 2.8);        // órbita
      z += bump(nx, ny, ex, ey, .085, .075, 3.4);         // globo ocular
      z += bump(nx, ny, ex, ey - .13, .150, .028, 2.8);   // sobrancelha
      z += bump(nx, ny, ex + sx * .02, .70, .120, .090, 3.2); }   // bochecha
    z += bump(nx, ny, cx, .93, .140, .060, 3.0) + bump(nx, ny, cx, .36, .300, .150, 1.2);   // queixo e testa
    return z;
  }
  /** Perfil de almofada: z cresce como um quarto de círculo até o raio R. */
  const pillow = (d, R, zmax) => { if (d <= 0) return 0; const t = Math.min(1, d / R); return zmax * Math.sqrt(1 - (1 - t) * (1 - t)); };
  // ---- elipsoide da cabeça (usado pela cabeça, cabelo e capacete para ficarem coerentes) ----
  const HEAD = { cx: X0, cy: Y0 - 28, rx: 31, ry: 35, rz: 28 };
  const headZ = (dx, dy) => { const u = (dx - HEAD.cx) / HEAD.rx, v = (dy - HEAD.cy) / HEAD.ry, q = u * u + v * v, s = 1 - q * q; return s > 0 ? HEAD.rz * Math.sqrt(s) : 0; };   // superelipsoide: rosto quase plano (não distorce), borda arredondada
  let bodyF = null;   // campo do corpo (mesmo contorno nas 8 cores)
  const bodyZ = (dx, dy) => { if (!bodyF) bodyF = field("bodies", 0); const x = Math.round(dx - (X0 - bodyF.w / 2)), y = Math.round(dy - Y0); if (x < 0 || y < 0 || x >= bodyF.w || y >= bodyF.h) return 0; return pillow(bodyF.dist[y * bodyF.w + x], 22, 24); };
  /** Constrói a malha (frente + verso) de uma peça já em coordenadas do boneco (pés na origem, +y para cima, +z para a frente). */
  function build(cat, i, o) {
    const key = [cat, i, o.cx, o.y, o.sc, o.flip ? 1 : 0, o.mode, o.zmax, o.zoff].join("|"); if (geo[key]) return geo[key];
    const f = field(cat, i), p = ART.cell(cat, i), iw = p.im.width, ih = p.im.height, sc = o.sc || 1, STEP = o.step || ((cat === "heads" || cat === "hh" || cat === "gloves") ? 1 : 2), gw = Math.ceil(f.w / STEP) + 1, gh = Math.ceil(f.h / STEP) + 1;
    const zBack = [], pos = [], uvs = [], col = [], idx = [], vid = new Int32Array(gw * gh).fill(-1), inside = (x, y) => { x = Math.min(f.w - 1, Math.max(0, x)); y = Math.min(f.h - 1, Math.max(0, y)); return f.a[y * f.w + x] >= 90; };
    const zAt = (ax, ay) => {
      const px = Math.min(f.w - 1, Math.max(0, Math.round(ax))), py = Math.min(f.h - 1, Math.max(0, Math.round(ay))), d = f.dist[py * f.w + px], own = pillow(d, Math.min(o.zmax * 1.1, Math.max(4, f.max)), o.zmax);
      const dx = o.cx + (o.flip ? -1 : 1) * (ax - f.w / 2) * sc, dy = o.y + ay * sc;
      if (o.mode === "head") return Math.max(own * .25, headZ(dx, dy));
      if (o.mode === "over") { const hz = headZ(dx, dy); return hz > 0 ? Math.max(own, hz + (o.zoff || 5)) : own; }
      if (o.mode === "onbody") return d > 0 ? Math.max(6, bodyZ(dx, dy) + (o.zoff || 3)) : 0;
      return own;
    }, zRel = (ax, ay) => { const px = Math.min(f.w - 1, Math.max(0, Math.round(ax))), py = Math.min(f.h - 1, Math.max(0, Math.round(ay))), n = py * f.w + px, d = f.dist[n]; if (d <= 0) return 0; const fade = Math.min(1, d / 7); let r = f.rel[n] * (RELIEF[cat] || 3); if (cat === "heads") r += faceRelief(ax / f.w, ay / f.h); return r * fade; };
    // vértices fora do contorno "encolhem" até o pixel opaco mais próximo, com z = 0: a malha acompanha o contorno e frente/verso se fecham (sem fresta no meio)
    const nearOpaque = (ax, ay) => { for (let r = 1; r <= 5; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue; const x = Math.min(f.w - 1, Math.max(0, ax + dx)), y = Math.min(f.h - 1, Math.max(0, ay + dy)); if (f.a[y * f.w + x] >= 200) return [x, y]; } return null; };
    const inner = (ax, ay) => { for (let r = 0; r <= 7; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue; const x = Math.min(f.w - 1, Math.max(0, ax + dx)), y = Math.min(f.h - 1, Math.max(0, ay + dy)); if (f.dist[y * f.w + x] >= 3.5 && f.a[y * f.w + x] >= 230) return [x, y]; } return null; };
    for (let gy = 0; gy < gh; gy++) for (let gx = 0; gx < gw; gx++) {
      let ax = Math.min(f.w, gx * STEP), ay = Math.min(f.h, gy * STEP), out = false;
      let near = false; for (let dy = -STEP; dy <= STEP && !near; dy += STEP) for (let dx = -STEP; dx <= STEP; dx += STEP) if (inside(ax + dx, ay + dy)) { near = true; break; }
      if (!near) continue;
      if (!inside(ax, ay)) { const nn = nearOpaque(Math.min(f.w - 1, Math.round(ax)), Math.min(f.h - 1, Math.round(ay))); if (!nn) continue; ax = nn[0]; ay = nn[1]; out = true; }
      vid[gy * gw + gx] = pos.length / 3;
      const zb = out ? 0 : Math.max(0, zAt(ax, ay)) * K; zBack.push(zb);   // verso: só o volume (sem relevo do rosto/dobras)
      const z = out ? 0 : Math.max(0, zAt(ax, ay) + zRel(ax, ay)) * K, dxp = o.cx + (o.flip ? -1 : 1) * (ax - f.w / 2) * sc, dyp = o.y + ay * sc, wx = (dxp - X0) * K, wy = (FEET - dyp) * K;
      let ux = ax, uy = ay; if (f.dist[Math.min(f.h - 1, Math.round(ay)) * f.w + Math.min(f.w - 1, Math.round(ax))] < 2.5) { const iq = inner(Math.round(ax), Math.round(ay)); if (iq) { ux = iq[0]; uy = iq[1]; } }   // borda: usa a cor de um pixel mais para dentro (some o halo branco que esticaria na lateral)
      pos.push(wx, wy, z); uvs.push((p.x + ux + .5) / iw, 1 - (p.y + uy + .5) / ih);
      const dd = f.dist[Math.min(f.h - 1, Math.round(ay)) * f.w + Math.min(f.w - 1, Math.round(ax))], t = Math.min(1, dd / 7), sh = 1 - .3 * Math.pow(1 - t, 1.5); col.push(sh, sh, sh);
    }
    const nf = pos.length / 3;
    const idxB = [];
    for (let gy = 0; gy < gh - 1; gy++) for (let gx = 0; gx < gw - 1; gx++) {
      const a = vid[gy * gw + gx], b = vid[gy * gw + gx + 1], c = vid[(gy + 1) * gw + gx], d = vid[(gy + 1) * gw + gx + 1]; if (a < 0 || b < 0 || c < 0 || d < 0) continue;
      const cxp = Math.min(f.w - 1, gx * STEP + (STEP >> 1)), cyp = Math.min(f.h - 1, gy * STEP + (STEP >> 1)); if (!inside(cxp, cyp) && !inside(gx * STEP, gy * STEP) && !inside((gx + 1) * STEP, (gy + 1) * STEP)) continue;
      if (o.flip) { idx.push(a, b, c, b, d, c); idxB.push(a, c, b, b, c, d); } else { idx.push(a, c, b, b, c, d); idxB.push(a, b, c, b, d, c); }
    }
    const mk = (index, back) => { const g = new THREE.BufferGeometry(), P = [], C = []; for (let n = 0; n < nf; n++) { P.push(pos[n * 3], pos[n * 3 + 1], back ? -zBack[n] : pos[n * 3 + 2]); C.push(...(back ? [col[n * 3] * .8, col[n * 3 + 1] * .8, col[n * 3 + 2] * .8] : [col[n * 3], col[n * 3 + 1], col[n * 3 + 2]])); }
      g.setAttribute("position", new THREE.Float32BufferAttribute(P, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(C, 3)); if (!back) g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs.slice(0, nf * 2), 2)); g.setIndex(index); g.computeBoundingSphere(); return g; };
    const front = mk(idx, false); front.computeVertexNormals(); { const N = front.attributes.normal, C = front.attributes.color; for (let n = 0; n < N.count; n++) { const l = Math.max(0, N.getX(n) * -.35 + N.getY(n) * .45 + N.getZ(n) * .82), k = .82 + .24 * Math.min(1, l); C.setXYZ(n, C.getX(n) * k, C.getY(n) * k, C.getZ(n) * k); } }
    const g = { front, back: mk(idxB, true), avg: f.avg };
    return (geo[key] = g);
  }
  /** Monta o avatar 3D com as peças escolhidas (pd = [corpo, cabeça, cabelo, capacete, mochila, luvas, bandeira, equipamento, cabeça pronta]). */
  function avatar(pd, nc) {
    pd = ART.norm(pd); const [b, hd, hr, hm, pk, gl, fg, dv, hh] = pd, g = new THREE.Group(), add = (cat, i, o) => { if (i < 0 || !ART.cell(cat, i)) return null; const b = build(cat, i, o), m = new THREE.Group(); m.add(new THREE.Mesh(b.front, material(cat)), new THREE.Mesh(b.back, backMat(b.avg))); g.add(m); return m; };
    const place = (cat, i, sc, cxx, yy) => { const p = ART.cell(cat, i); return { cx: cxx, y: yy, sc, h: p.h * sc }; };
    if (pk >= 0) { const p = ART.cell("packs", pk), sc = 1.5; add("packs", pk, { cx: X0, y: Y0 - 12, sc, mode: "own", zmax: 24, zoff: 0 }); const m = g.children[g.children.length - 1]; if (m) { m.rotation.y = Math.PI; m.position.z = -30 * K; } }
    add("bodies", Math.max(0, b), { cx: X0, y: Y0, sc: 1, mode: "own", zmax: 24 });
    const fi = fg === -2 ? ART.NAMES.FLAGCC.indexOf(nc) : fg; if (fi >= 0) add("flags", fi, { cx: X0 - 31, y: Y0 + 25, sc: .34, mode: "onbody", zoff: 3, zmax: 3 });
    if (gl >= 0) { add("gloves", gl, { cx: X0 - 35, y: Y0 + 70, sc: .46, mode: "own", zmax: 7 }); add("gloves", gl, { cx: X0 + 36, y: Y0 + 70, sc: .46, flip: true, mode: "own", zmax: 7 }); }
    if (dv >= 0) add("devices", dv, { cx: X0 + 52, y: Y0 + 54, sc: .52, mode: "own", zmax: 9 });
    if (hh >= 0) { const p = ART.cell("hh", hh); add("hh", hh, { cx: X0, y: Y0 + 10 - p.h, sc: 1, mode: "head", zmax: 30 }); }
    else { const hi = Math.max(0, hd), p = ART.cell("heads", hi); if (p) add("heads", hi, { cx: X0, y: Y0 + 10 - p.h, sc: 1, mode: "head", zmax: 30 }); if (hr >= 0) add("hairs", hr, { cx: X0, y: Y0 - 66, sc: 1, mode: "over", zmax: 28, zoff: 4 }); }
    if (hm >= 0) add("helmets", hm, { cx: X0, y: Y0 - 66, sc: 1.12, mode: "over", zmax: 34, zoff: 9 });
    return g;
  }
  return { avatar, build, field, K };
})();

const _avArt2d = av;
/** Visual "Arte": o boneco 3D montado com as sprites convertidas (humanos). */
av = function (e) {
  e = e || {}; const lk = lookNorm(e.lk); if (!lk.v2 || e.sp === "alien" || !ART.ready) return _avArt2d(e);
  const g = new THREE.Group(), body = A3.avatar(lk.pd, lk.nc); g.add(body);
  const sh = new THREE.Mesh(new THREE.CircleGeometry(1.1, 24), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .28, depthWrite: false })); sh.rotation.x = -Math.PI / 2; sh.position.y = .04; sh.scale.set(1, .7, 1); g.add(sh);
  g.scale.setScalar(1.1 * [.93, 1, 1.07][lk.ht]); g.userData.art3d = body; g.userData.legs = []; g.userData.arms = []; g.userData.glb = 1; return g;
};
const _artAnim2d = artAnim;
/** Anda: quica e balança; parado: respira. */
artAnim = function (g, t, speed) {
  const b = g.userData.art3d; if (!b) return _artAnim2d(g, t, speed); const v = Math.min(1, speed || 0);
  b.position.y = Math.abs(Math.sin(t * 9)) * .1 * v; b.rotation.z = Math.sin(t * 9) * .06 * v; b.scale.y = 1 + Math.sin(t * 2.2) * .01 + (v ? Math.abs(Math.sin(t * 9)) * .02 : 0);
};
