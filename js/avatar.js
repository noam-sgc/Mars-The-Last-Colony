/* Avatar 3D no estilo das fichas de equipe (chibi, cel-shading com contorno): traje branco com painéis coloridos,
   arnês escuro com fivela, joelheiras e botas coloridas, luvas pretas com punho colorido, mochila com tela, capacete
   com viseira azul. Tudo personalizável pelos cosméticos (cor, acento, forma, padrão, TEXTURA PINTADA e SILHUETA). */
const TOON = (() => { const d = new Uint8Array([105, 170, 212, 232]); const t = new THREE.DataTexture(d, 4, 1, THREE.LuminanceFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true; return t; })();
const OUTLINE = new THREE.MeshBasicMaterial({ color: "#1b1422", side: THREE.BackSide });
const DARK = "#2b2e36", METAL = "#aab2c0", STRAP = "#3a3f4b";
/** Material cartoon (toon). Opções de PBR são ignoradas. */
function TM(c, o) {
  o = Object.assign({}, o || {}); delete o.metalness; delete o.roughness;
  return new THREE.MeshToonMaterial(Object.assign({ color: c || "#888888", gradientMap: TOON }, o));
}
/** Viseira/vidro brilhante. */
const GLASS = (c, o) => new THREE.MeshPhongMaterial(Object.assign({ color: c || "#13306b", specular: "#bfe0ff", shininess: 90 }, o || {}));
const shade = (hex, k) => { const c = new THREE.Color(hex); c.multiplyScalar(k); return "#" + c.getHexString(); };

// ---------- texturas pintadas no Estúdio (atlas 256×256) ----------
const TX_REG = { torso: [0, 0, 256, 128], sleeve: [0, 128, 128, 64], leg: [0, 192, 128, 64], pack: [128, 128, 128, 64], helm: [128, 192, 128, 64] };
const _txImg = {}; let TX_VER = 0;
function txImage(url) { if (_txImg[url]) return _txImg[url]; const im = new Image(); im.onload = () => { TX_VER++; (im._tex || []).forEach((t) => (t.needsUpdate = true)); }; im.src = url; im._tex = []; return (_txImg[url] = im); }
/** Textura de uma região do atlas pintado. */
function txRegion(url, reg) {
  const im = txImage(url), t = new THREE.Texture(im), [x, y, w, h] = TX_REG[reg]; t.repeat.set(w / 256, h / 256); t.offset.set(x / 256, 1 - (y + h) / 256);
  if (im.complete && im.naturalWidth) t.needsUpdate = true; im._tex.push(t); return t;
}
function cvRegion(cv, reg) { const t = new THREE.CanvasTexture(cv), [x, y, w, h] = TX_REG[reg]; t.repeat.set(w / 256, h / 256); t.offset.set(x / 256, 1 - (y + h) / 256); return t; }
const txOf = (it, reg) => (it && it.txc ? cvRegion(it.txc, reg) : it && it.tx ? txRegion(it.tx, reg) : null);
const matTx = (col, it, reg, o) => { const t = txOf(it, reg); return t ? TM("#ffffff", Object.assign({ map: t }, o || {})) : TM(col, o); };

// ---------- silhueta do traje (desenhada no Estúdio: 6 raios) ----------
const PF_DEF = [.46, .5, .53, .56, .53, .4];
function torsoGeo(pf, k, y0, y1) {
  const r = (Array.isArray(pf) && pf.length === 6 ? pf : PF_DEF).map((v) => Math.min(.85, Math.max(.25, +v || .5)) * k), n = r.length, pts = [new THREE.Vector2(0.001, y0)];
  r.forEach((v, i) => pts.push(new THREE.Vector2(v, y0 + (y1 - y0) * (i / (n - 1)) * .97))); pts.push(new THREE.Vector2(.001, y1));
  const g = new THREE.LatheGeometry(pts, 28, Math.PI, Math.PI * 2); return g;
}

/** Contorno cartoon (casco invertido) nos volumes principais. */
function outlineAll(g) {
  const list = []; g.traverse((m) => { if (m.isMesh && !m.isInstancedMesh && !m.userData.noOutline && m.material && !m.material.transparent && m.material !== OUTLINE) list.push(m); });
  list.forEach((m) => { if (!m.geometry.boundingSphere) m.geometry.computeBoundingSphere(); const rr = m.geometry.boundingSphere.radius; if (rr < .045) return; const o = new THREE.Mesh(m.geometry, OUTLINE); o.scale.setScalar(1 + Math.min(.22, .028 / rr)); o.userData.noOutline = 1; m.add(o); });
}

/** Avatar completo. e = { s,p,w,h,b,r,a,t (ids), sp, sk, lk, lq (baixa qualidade) } */
function av(e) {
  e = e || {}; const g = new THREE.Group(), M = TM, lk = lookNorm(e.lk), alien = e.sp === "alien";
  const suit = cxById(e.s || "s0"), pant = cxById(e.p || "p0"), helm = cxById(e.h || "h0"), pack = cxById(e.b || "b0"), watch = cxById(e.w);
  const sp = cxp(suit), pp = cxp(pant), bp = cxp(pack);
  const base = suit.col || "#eef0f4", acc = suit.ac || (suit.col && !/^#e[0-9a-f]e[0-9a-f]e/i.test(suit.col) ? shade(suit.col, .72) : "#8b9bb4"), glow = suit.glow;
  const pBase = pant.col || "#cfd3dc", pAcc = pant.ac || (pp.pt == 2 ? pp.c2 : acc);
  const skin = alien ? (SKINS[e.sk] || SKINS.verde).c : LOOK.TONES[lk.t];
  const add = (parent, geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); m.castShadow = true; parent.add(m); return m; };
  const SU = (o) => Object.assign({ emissive: glow || "#000000", emissiveIntensity: glow ? .18 : 0 }, o || {});
  // ---- pernas ----
  const legs = [-1, 1].map((s) => {
    const l = new THREE.Group(); l.position.set(s * .23, 1.12, 0); l.scale.y = 1.12; g.add(l);
    const bell = pp.sh == 1, slim = pp.sh == 2 ? .85 : 1, shorts = pp.sh == 3;
    const th = add(l, new THREE.CylinderGeometry(.21 * slim, .19 * slim, shorts ? .32 : .44, 16, 1, false, Math.PI), matTx(pBase, pant, "leg"), 0, shorts ? -.17 : -.23, 0);
    if (!pant.tx && !pant.txc) add(l, new THREE.BoxGeometry(.07, .3, .2), M(pAcc), s * .19 * slim, -.24, 0);   // painel lateral da coxa
    add(l, new THREE.SphereGeometry(.15, 14, 10), M(pAcc), 0, -.5, .13).scale.set(1, 1, .6);   // joelheira
    add(l, new THREE.CylinderGeometry(.19 * slim, bell ? .27 : .2 * slim, .38, 16, 1, false, Math.PI), shorts ? M(pp.c2) : matTx(pBase, pant, "leg"), 0, -.7, 0);
    if (pp.pt == 1) add(l, new THREE.BoxGeometry(.05, .84, .07), M(pp.c2), s * .21, -.47, 0);
    const bt = new THREE.Group(); bt.position.y = -.93; l.add(bt);
    add(bt, new THREE.CylinderGeometry(.22, .23, .22, 16), M(pAcc), 0, .02, 0);
    add(bt, new THREE.TorusGeometry(.225, .03, 6, 18), M("#e8eaf0"), 0, .1, 0).rotation.x = Math.PI / 2;
    add(bt, new THREE.SphereGeometry(.22, 16, 10), M(pAcc), 0, -.1, .08).scale.set(1.08, .55, 1.45);
    add(bt, new THREE.BoxGeometry(.42, .08, .6), M(DARK), 0, -.17, .08);
    return l;
  });
  // ---- quadril, cinto ----
  add(g, new THREE.CylinderGeometry(.45, .44, .24, 20), M(pBase), 0, 1.1, 0);
  add(g, new THREE.TorusGeometry(.48, .055, 8, 26), M(sp.pt == 3 ? sp.c2 : STRAP), 0, 1.23, 0).rotation.x = Math.PI / 2;
  add(g, new THREE.BoxGeometry(.18, .13, .06), M(METAL), 0, 1.23, .5);
  // ---- tronco (silhueta desenhável) ----
  const bk = alien ? .94 : .92 * [.9, 1, 1.12][lk.bd] * ([1, .9, 1.12, 1][sp.sh] || 1);
  const torso = add(g, torsoGeo(suit.pf, bk, 1.18, 2.14), matTx(base, suit, "torso", SU()), 0, 0, 0);
  if (!suit.tx && !suit.txc) {
    [Math.PI / 2, Math.PI * 1.5].forEach((ph) => { const pf2 = (Array.isArray(suit.pf) && suit.pf.length === 6 ? suit.pf : PF_DEF).map((v) => v * 1.025); const pts = [1, 2, 3, 4].map((i) => new THREE.Vector2(Math.min(.87, pf2[i]) * bk, 1.18 + .96 * (i / 5) * .97));
      add(g, new THREE.LatheGeometry(pts, 8, ph - .5, 1), M(acc, SU())); });   // painéis laterais coloridos
    [-1, 1].forEach((s) => add(g, new THREE.BoxGeometry(.09, .62, .04), M(STRAP), s * .2, 1.7, .5 * bk + .03));   // arnês
    add(g, new THREE.BoxGeometry(.66 * bk, .08, .04), M(STRAP), 0, 1.78, .53 * bk + .03);
    add(g, new THREE.BoxGeometry(.13, .13, .06), M(METAL), 0, 1.78, .55 * bk + .04);
    const em = add(g, new THREE.CylinderGeometry(.075, .075, .03, 18), M(acc, { emissive: glow || "#000", emissiveIntensity: glow ? .6 : 0 }), .28, 1.95, .45 * bk + .03); em.rotation.x = Math.PI / 2;
    add(g, new THREE.TorusGeometry(.075, .015, 6, 18), M("#ffffff"), .28, 1.95, .465 * bk + .03);
    const pn = add(g, new THREE.BoxGeometry(.2, .13, .05), M(DARK), -.22, 1.48, .5 * bk + .02);
    ["#ff4a4a", "#46e07a", "#4aa8ff"].forEach((c, i) => add(pn, new THREE.SphereGeometry(.018, 6, 5), new THREE.MeshBasicMaterial({ color: c }), -.06 + i * .06, 0, .03));
  }
  // padrões do traje (Estúdio)
  const P2 = M(sp.c2, SU({ emissiveIntensity: glow ? .35 : 0 }));
  switch (sp.pt) {
    case 1: add(g, new THREE.CylinderGeometry(.565 * bk, .565 * bk, .14, 24, 1, true), P2, 0, 1.98, 0); break;
    case 2: [-1, 1].forEach((s) => add(g, new THREE.SphereGeometry(.27, 12, 8), P2, s * .6 * bk, 2.02, 0).scale.set(1, .65, 1)); break;
    case 4: add(g, new THREE.TorusGeometry(.36, .1, 8, 20), P2, 0, 2.16, 0).rotation.x = Math.PI / 2; break;
    case 6: add(g, new THREE.CylinderGeometry(.11, .11, .03, 18), M(glow || sp.c2, { emissive: glow || sp.c2, emissiveIntensity: .9 }), -.25, 1.95, .47 * bk + .04).rotation.x = Math.PI / 2; break;
    case 7: [-.1, .1].forEach((x) => add(g, new THREE.BoxGeometry(.06, .9, .03), P2, x, 1.62, .54 * bk + .03)); break;
  }
  if (sp.sh == 3) [-1, 1].forEach((s) => add(g, new THREE.BoxGeometry(.22, .22, .1), M(sp.c2), s * .3, 1.45, .48 * bk + .05));
  // gola e pescoço
  add(g, new THREE.TorusGeometry(.33, .085, 10, 24), M(STRAP), 0, 2.13, 0).rotation.x = Math.PI / 2;
  add(g, new THREE.TorusGeometry(.33, .035, 6, 24), M(acc), 0, 2.2, 0).rotation.x = Math.PI / 2;
  add(g, new THREE.CylinderGeometry(.17, .19, .16, 14), M(skin, alien ? { emissive: (SKINS[e.sk] || SKINS.verde).g, emissiveIntensity: .3 } : {}), 0, 2.24, 0);
  // ---- braços ----
  const arms = [-1, 1].map((s) => {
    const a = new THREE.Group(); a.position.set(s * .66 * bk, 2.0, 0); a.rotation.z = s * .12; g.add(a);
    add(a, new THREE.SphereGeometry(.24, 16, 12), M(acc, SU()), s * -.02, .02, 0).scale.set(1, .8, 1);   // ombreira
    add(a, new THREE.CylinderGeometry(.17, .16, .42, 14, 1, false, Math.PI), matTx(base, suit, "sleeve", SU()), 0, -.24, 0);
    add(a, new THREE.SphereGeometry(.16, 12, 10), M(base, SU()), 0, -.45, 0);
    add(a, new THREE.CylinderGeometry(.16, .17, .34, 14, 1, false, Math.PI), matTx(base, suit, "sleeve", SU()), 0, -.63, 0);
    if (sp.pt == 5) [-.2, -.6].forEach((yy) => add(a, new THREE.TorusGeometry(.175, .03, 6, 16), P2, 0, yy, 0).rotation.x = Math.PI / 2);
    add(a, new THREE.CylinderGeometry(.2, .19, .11, 14), M(acc), 0, -.81, 0);   // punho colorido
    add(a, new THREE.SphereGeometry(.17, 14, 10), M(alien ? skin : DARK), 0, -.95, .01).scale.set(1, 1.15, .85);   // luva
    add(a, new THREE.SphereGeometry(.07, 8, 6), M(alien ? skin : DARK), -s * .11, -.9, .09);
    return a;
  });
  if (watch && watch.id && watch.id !== "w0" && watch.col) { const wp = cxp(watch), k = add(arms[1], wp.sh == 1 ? new THREE.CylinderGeometry(.13, .13, .07, 16) : new THREE.BoxGeometry(.2, .12, .2), M(watch.col, { emissive: watch.glow || watch.col, emissiveIntensity: watch.glow ? .9 : .1 }), 0, -.73, .15); if (wp.sh == 1) k.rotation.x = Math.PI / 2; if (wp.sh == 2) k.scale.set(1.3, .8, 1.2); k.scale.multiplyScalar(wp.sz); }
  // ---- mochila ----
  const PK = new THREE.Group(); PK.position.set(0, 1.72, -.56 * bk); PK.scale.setScalar(bp.sz); g.add(PK);
  const pc = pack.col || "#b9bcc4", pg = pack.glow;
  if (!(alien && (!e.b || e.b === "b0"))) {
    if (bp.sh == 1) add(PK, new THREE.SphereGeometry(.5, 16, 12), matTx(pc, pack, "pack"), 0, 0, -.05).scale.set(1, 1.1, .7);
    else if (bp.sh == 2) [-.22, .22].forEach((x) => { add(PK, new THREE.CylinderGeometry(.2, .2, .95, 14), matTx(pc, pack, "pack"), x, 0, -.05); add(PK, new THREE.SphereGeometry(.2, 12, 8), M(pc), x, .48, -.05); });
    else { const bx = add(PK, new THREE.BoxGeometry(.84, .98, .38), matTx(pc, pack, "pack"), 0, 0, 0); if (bp.sh == 4) bx.scale.set(1.2, 1.15, 1.3);
      add(PK, new THREE.CylinderGeometry(.19, .19, .84, 14), M(pc), 0, .49, 0).rotation.z = Math.PI / 2;
      if (!pack.tx && !pack.txc) { [-1, 1].forEach((s) => add(PK, new THREE.BoxGeometry(.1, .9, .4), M(DARK), s * .4, -.02, 0)); add(PK, new THREE.BoxGeometry(.5, .32, .03), M(DARK), 0, .05, -.2);
        add(PK, new THREE.BoxGeometry(.4, .22, .02), new THREE.MeshBasicMaterial({ color: pg || "#66d9ff" }), 0, .07, -.215); [0, 1, 2].forEach((i) => add(PK, new THREE.BoxGeometry(.5, .03, .02), M(STRAP), 0, -.25 - i * .07, -.2)); } }
    if (bp.sh == 3) [-1, 1].forEach((s) => { const wg = add(PK, new THREE.BoxGeometry(.05, 1.1, .7), M(bp.c2, { emissive: pg || bp.c2, emissiveIntensity: .6, transparent: true, opacity: .85 }), s * .6, .3, -.15); wg.rotation.set(.2, 0, s * .5); });
    if (bp.pt == 1) add(PK, new THREE.CylinderGeometry(.02, .02, .7, 5), M(METAL), .3, .8, 0); else if (bp.pt == 2) add(PK, new THREE.SphereGeometry(.08, 8, 6), new THREE.MeshBasicMaterial({ color: "#ff3030" }), 0, -.38, -.22);
    [-1, 1].forEach((s) => { const tb = add(g, new THREE.TorusGeometry(.26, .045, 6, 12, Math.PI), M(STRAP), s * .3, 2.1, -.32 * bk); tb.rotation.y = Math.PI / 2; });
  }
  // ---- cabeça ----
  let head;
  if (alien) head = alienHead(e, M, helm); else { head = humanHead(lk, cxById(e.r), cxById(e.a), helm, M); head.scale.setScalar(1.3); }
  head.position.y = 2.86; g.add(head); g.userData.head = head;
  if (!alien) { if (lk.hg === 0 && !(helm.sh > 0 && helm.sh <= 6)) holdHelmet(arms[0], helm.id ? helm : { col: "#f0f0f0" }, acc); flagPatch(arms[1], lk.nc); }
  decoTool(g, arms, cxById(e.t), M);
  if (glow) { const ring = new THREE.Mesh(new THREE.TorusGeometry(.95, .035, 6, 28), new THREE.MeshBasicMaterial({ color: glow, transparent: true, opacity: .6 })); ring.rotation.x = Math.PI / 2; ring.position.y = .06; g.add(ring); g.userData.ring = ring; }
  g.children.forEach((c) => (c.position.y += .14));   // pernas mais longas (proporção das fichas)
  if (!e.lq) outlineAll(g);
  g.scale.setScalar(1.1 * (alien ? 1 : [.93, 1, 1.07][lk.ht])); g.userData.legs = legs; g.userData.arms = arms; return g;
}

/** Cabeça alienígena (oval, olhos grandes, antenas) no mesmo estilo cartoon. */
function alienHead(e, M, helm) {
  const H = new THREE.Group(), sk = SKINS[e.sk] || SKINS.verde, SM = () => M(sk.c, { emissive: sk.g, emissiveIntensity: .3 });
  const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; H.add(m); return m; };
  add(new THREE.SphereGeometry(.62, 22, 18), SM(), 0, .08, 0).scale.set(1.05, 1.2, .98);
  [-1, 1].forEach((s) => { const ey = add(new THREE.SphereGeometry(.21, 14, 10), GLASS("#0b1022", { specular: "#ffffff", shininess: 120 }), s * .25, .1, .5); ey.scale.set(1, 1.4, .45);
    add(new THREE.SphereGeometry(.04, 8, 6), new THREE.MeshBasicMaterial({ color: "#ffffff" }), s * .25 + .06, .22, .6);
    const st = add(new THREE.CylinderGeometry(.03, .035, .7, 6), SM(), s * .3, .95, 0); st.rotation.z = -s * .5; add(new THREE.SphereGeometry(.11, 10, 8), new THREE.MeshBasicMaterial({ color: sk.g }), s * .48, 1.28, 0); });
  const sm = add(new THREE.TorusGeometry(.1, .02, 6, 12, Math.PI), M("#2a3a3a"), 0, -.2, .56); sm.rotation.z = Math.PI;
  if (helm && helm.id && helm.id !== "h0") { const b = add(new THREE.SphereGeometry(.95, 20, 14), GLASS(helm.col || "#aee4ff", { transparent: true, opacity: .25, depthWrite: false }), 0, .2, 0); b.scale.set(1, 1.15, 1); b.userData.noOutline = 1; }
  return H;
}

/** Capacete na mão: casco, faixa colorida e viseira azul. */
function holdHelmet(arm, item, acc) {
  const p = cxp(item), col = item.col || "#f0f0f0", stripe = item.ac || acc || "#3d7bff", G = new THREE.Group();
  const shell = new THREE.Mesh(new THREE.SphereGeometry(.42, 22, 16), (item.tx || item.txc) ? TM("#ffffff", { map: txOf(item, "helm") }) : TM(col, { emissive: item.glow || "#000", emissiveIntensity: item.glow ? .4 : 0 })); G.add(shell);
  const vis = new THREE.Mesh(new THREE.SphereGeometry(.36, 20, 14, -1.05, 2.1, .55, 1.45), GLASS("#12306e")); vis.position.z = .09; vis.scale.set(1.05, 1, 1); G.add(vis);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(.37, .035, 6, 22, 2.3), TM(stripe)); rim.position.set(0, -.02, .1); rim.rotation.set(-.15, 0, Math.PI / 2 - 1.15); G.add(rim);
  const st = new THREE.Mesh(new THREE.TorusGeometry(.425, .05, 6, 26, Math.PI), TM(stripe)); st.rotation.y = Math.PI / 2; G.add(st);
  const nk = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, .1, 18), TM(STRAP)); nk.position.y = -.38; G.add(nk);
  G.position.set(-.05, -1.02, .42); G.rotation.set(.2, .5, 0); G.scale.setScalar(.95 * p.sz); arm.add(G);
}
/** Bandeira da nacionalidade no braço do traje. */
function flagPatch(arm, cc) {
  if (!cc) return; const m = new THREE.Mesh(new THREE.PlaneGeometry(.27, .18), new THREE.MeshBasicMaterial({ map: flagTex(cc) })); m.position.set(.172, -.24, 0); m.rotation.y = Math.PI / 2; m.userData.noOutline = 1; arm.add(m);
}
/** Equipamentos (camada t). */
function decoTool(g, arms, item, M) {
  if (!item || !item.id || item.id === "t0") return; const p = cxp(item), col = item.col || "#888", gl = item.glow, MM = (c, o) => M(c || col, Object.assign({ emissive: gl || "#000", emissiveIntensity: gl ? .6 : 0 }, o || {}));
  const on = (parent, geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; parent.add(m); return m; };
  const hand = arms[1], wr = arms[0]; let o;
  switch (p.sh) {
    case 1: on(wr, new THREE.BoxGeometry(.26, .2, .3), MM(), 0, -.66, .05); on(wr, new THREE.BoxGeometry(.18, .02, .2), new THREE.MeshBasicMaterial({ color: gl || "#66e0ff" }), 0, -.55, .05); break;
    case 2: o = on(hand, new THREE.BoxGeometry(.5, .05, .7), MM(DARK), .1, -1.05, .38); on(o, new THREE.BoxGeometry(.42, .02, .6), new THREE.MeshBasicMaterial({ color: gl || "#66ccff" }), 0, .035, 0); o.rotation.x = -.5; break;
    case 3: on(g, new THREE.CylinderGeometry(.1, .1, .42, 12), MM(), -.56, 1.1, .1); on(g, new THREE.CylinderGeometry(.06, .07, .08, 10), M(DARK), -.56, 1.35, .1); break;
    case 4: [-.38, -.12, .14, .38].forEach((a, i) => on(g, new THREE.BoxGeometry(.13, .19, .1), MM(i % 2 ? METAL : col), a, 1.13, .47)); break;
    case 5: { const b = on(g, new THREE.BoxGeometry(.36, .26, .2), MM(), .55, 1.1, .2); on(b, new THREE.BoxGeometry(.18, .06, .02), M(p.c2), 0, 0, .11); on(b, new THREE.BoxGeometry(.06, .18, .02), M(p.c2), 0, 0, .11); break; }
    case 6: o = on(hand, new THREE.CylinderGeometry(.04, .04, .75, 8), MM(), .03, -1.2, .3); on(o, new THREE.TorusGeometry(.11, .045, 6, 10, 4.7), MM(), 0, .42, 0); o.rotation.x = -.6; break;
    case 7: o = on(hand, new THREE.CylinderGeometry(.08, .1, .46, 12), MM(DARK), .03, -1.1, .3); on(o, new THREE.CylinderGeometry(.11, .08, .06, 12), new THREE.MeshBasicMaterial({ color: gl || "#fff2a8" }), 0, .26, 0); o.rotation.x = -1.2; break;
  }
}

/** Cabelo DESENHADO no Estúdio: grade 32×14 sobre a cabeça (volume e comprimento por célula). */
const HAIR_COLS = 32, HAIR_ROWS = 14, HAIR_N = HAIR_COLS * HAIR_ROWS;
function hairDir(i, j) { const th = (j + .5) / HAIR_ROWS * 2.05, ph = (i + .5) / HAIR_COLS * Math.PI * 2 - Math.PI; return new THREE.Vector3(Math.sin(th) * Math.sin(ph), Math.cos(th), Math.sin(th) * Math.cos(ph)); }
function drawnHair(H, it, HM) {
  const hv = String(it.hv || ""), hl = String(it.hl || ""), st = Math.max(0, Math.min(3, +it.hs || 0)), R = .45, pts = [], cones = []; let maxR = .5;
  const rs = (() => { let s = 13; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; })();
  for (let j = 0; j < HAIR_ROWS; j++) for (let i = 0; i < HAIR_COLS; i++) {
    const k = j * HAIR_COLS + i, v = +hv[k] || 0, L = +hl[k] || 0; if (!v && !L) continue; const d = hairDir(i, j);
    if (st == 2 && v) { cones.push({ p: d.clone().multiplyScalar(R + .02), d, len: .12 + v * .045, tip: false }); }
    else if (v) { const sz = (st == 1 ? .1 : .085) + v * (st == 1 ? .016 : .011), out = R + v * (st == 1 ? .018 : .01); pts.push({ p: d.clone().multiplyScalar(out), s: sz, tip: false }); maxR = Math.max(maxR, out + sz); }
    for (let q = 1; q <= L; q++) { const base = d.clone().multiplyScalar(R + .03 + v * .01), wav = st == 3 ? Math.sin(q * 1.4) * .04 : st == 1 ? (rs() - .5) * .05 : 0;
      const p = base.add(new THREE.Vector3(d.x * q * .012 + wav, -q * .075, d.z * q * .012 + wav * .5)); pts.push({ p, s: st == 1 ? .085 : .07, tip: q >= L - 1 && L > 2 }); }
  }
  const tipC = new THREE.Color(it.c2 || it.col || "#3b2a20"), mainC = new THREE.Color(it.col || "#3b2a20"), mx = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
  if (pts.length) { const im = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), HM("#ffffff"), pts.length);
    pts.forEach((o, n) => { mx.compose(o.p, q.identity(), new THREE.Vector3(o.s, o.s, o.s)); im.setMatrixAt(n, mx); im.setColorAt(n, o.tip && it.c2 ? tipC : mainC); }); im.castShadow = true; H.add(im); }
  if (cones.length) { const im = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 8), HM("#ffffff"), cones.length);
    cones.forEach((o, n) => { q.setFromUnitVectors(up, o.d); mx.compose(o.p.clone().add(o.d.clone().multiplyScalar(o.len / 2)), q, new THREE.Vector3(.07, o.len, .07)); im.setMatrixAt(n, mx); im.setColorAt(n, mainC); }); im.castShadow = true; H.add(im); maxR = Math.max(maxR, .75); }
  return maxR;
}
