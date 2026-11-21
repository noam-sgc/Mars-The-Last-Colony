/* Modelos 3D (.glb) feitos a partir da arte das fichas. Manifesto: assets/models/models.json
   { "chars": [ { "id": "tm1", "n": "Mei Tanaka", "file": "mei.glb", "h": 3.9 } ], "body": { "file": "base.glb" } }
   - chars: personagens prontos (Equipe) com a arte original; o avatar usa o modelo quando o jogador veste esse personagem.
   - body (opcional): corpo base recolorível. Materiais com nome Traje / Acento / Pele / Cabelo / Luvas / Botas / Mochila recebem as cores escolhidas.
   Animações: clipes com "walk"/"andar" e "idle"/"parado" são usados automaticamente. Sem manifesto, vale o avatar desenhado em código. */
const MODELS = (() => {
  const st = { list: {}, body: null, ver: 0, ready: false }, waiters = [];
  const fit = (root, h) => { root.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(root), sz = b.getSize(new THREE.Vector3()), k = (h || 3.9) / Math.max(sz.y, .001); root.scale.multiplyScalar(k); root.updateMatrixWorld(true); const b2 = new THREE.Box3().setFromObject(root); root.position.y -= b2.min.y; root.position.x -= (b2.min.x + b2.max.x) / 2; root.position.z -= (b2.min.z + b2.max.z) / 2; };
  function load(url) { return new Promise((res) => { try { new THREE.GLTFLoader().load(url, (g) => res(g), undefined, () => res(null)); } catch (e) { res(null); } }); }
  async function start() {
    let man = null; try { const r = await fetch("assets/models/models.json", { cache: "no-cache" }); if (r.ok) man = await r.json(); } catch (e) { /* sem modelos */ }
    if (man && typeof THREE.GLTFLoader === "function") {
      await Promise.all((man.chars || []).map(async (c) => { const g = await load("assets/models/" + c.file); if (g) st.list[c.id] = { def: c, g }; }));
      if (man.body && man.body.file) { const g = await load("assets/models/" + man.body.file); if (g) st.body = { def: man.body, g }; }
    }
    st.ready = true; st.ver++; waiters.splice(0).forEach((f) => f());
    if (Object.keys(st.list).length || st.body) { if (typeof THUMB !== "undefined") THUMB.reset(); if ($("#ward") && $("#ward").classList.contains("on") && typeof ward === "function") ward(); if (typeof G !== "undefined" && G.run && PL.g && typeof myEq === "function") { const p = PL.g.position.clone(), ry = PL.g.rotation.y; sc.remove(PL.g); PL.g = av(myEq()); PL.g.position.copy(p); PL.g.rotation.y = ry; sc.add(PL.g); } }
  }
  /** Instância de um modelo (clonado com esqueleto) já ajustada à altura do jogo. */
  function inst(m, h) {
    const root = (THREE.SkeletonUtils ? THREE.SkeletonUtils.clone(m.g.scene) : m.g.scene.clone(true)), w = new THREE.Group(); root.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.material = o.material.clone(); } }); w.add(root); fit(root, h || m.def.h);
    const clips = m.g.animations || []; if (clips.length) { const mix = new THREE.AnimationMixer(root), pick = (re) => clips.find((c) => re.test(c.name)); const wk = pick(/walk|andar|run|correr/i) || clips[0], id = pick(/idle|parado|stand/i);
      w.userData.mix = { mix, walk: mix.clipAction(wk), idle: id && id !== wk ? mix.clipAction(id) : null, lt: 0 }; w.userData.mix.walk.play(); if (w.userData.mix.idle) w.userData.mix.idle.play(); }
    return w;
  }
  /** Recolore materiais por nome (corpo base). */
  function paint(w, cols) { w.traverse((o) => { if (!o.isMesh) return; (Array.isArray(o.material) ? o.material : [o.material]).forEach((mt) => { const n = (mt.name || o.name || "").toLowerCase(); Object.keys(cols).forEach((k) => { if (cols[k] && n.includes(k)) mt.color && mt.color.set(cols[k]); }); }); }); }
  return { st, start, inst, paint, has: (id) => !!st.list[id], whenReady: () => (st.ready ? Promise.resolve() : new Promise((r) => waiters.push(r))) };
})();

/** Usa o modelo .glb quando existir: personagem pronto (e.chr) ou corpo base recolorível. Senão, o avatar desenhado em código. */
const avCode = av;
av = function (e) {
  e = e || {}; const m = e.chr && MODELS.st.list[e.chr];
  if (m) { const w = MODELS.inst(m); w.userData.legs = w.userData.legs || []; w.userData.arms = []; w.userData.glb = 1; return w; }
  if (MODELS.st.body && e.sp !== "alien") { const lk = lookNorm(e.lk), suit = cxById(e.s || "s0"), pant = cxById(e.p || "p0"), pack = cxById(e.b || "b0"), w = MODELS.inst(MODELS.st.body);
    MODELS.paint(w, { traje: suit.col, suit: suit.col, acento: suit.ac || suit.c2, accent: suit.ac || suit.c2, pele: LOOK.TONES[lk.t], skin: LOOK.TONES[lk.t], cabelo: lk.hc, hair: lk.hc, botas: pant.ac, boots: pant.ac, mochila: pack.col, backpack: pack.col });
    w.userData.arms = []; w.userData.glb = 1; return w; }
  return avCode(e);
};
/** Animação: modelos .glb usam o mixer (andar/parado); o avatar em código usa o balanço das pernas. */
const walkAnimCode = walkAnim;
walkAnim = function (g, t, speed) {
  if (g.userData.art || g.userData.art3d) return artAnim(g, t, speed);
  const mx = g.userData.mix; if (!mx) return g.userData.glb ? undefined : walkAnimCode(g, t, speed);
  const dt = mx.lt ? Math.min(.1, Math.max(0, t - mx.lt)) : 0; mx.lt = t; const wv = Math.min(1, speed * 1.5);
  mx.walk.setEffectiveWeight(mx.idle ? wv : 1); if (mx.idle) mx.idle.setEffectiveWeight(1 - wv); mx.walk.timeScale = mx.idle ? 1 : wv; mx.mix.update(dt);
};
