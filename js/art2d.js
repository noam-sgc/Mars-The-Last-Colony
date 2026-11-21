/* Avatar "Arte 2D": boneco montado em camadas com os sprites separados da animação enviada (assets/sprites/*.png + manifest.json):
   corpo/traje (8 cores), cabeça (5) ou cabeça pronta (6, incl. hijab), cabelo (26), capacete (15), mochila (13), luvas (16),
   bandeira (10) e equipamento (21). Vira um sprite voltado para a câmera, com respiração e balanço ao andar.
   pd = [corpo, cabeça, cabelo, capacete, mochila, luvas, bandeira, equipamento, cabeça pronta] (-1 = nenhum). */
const ART = (() => {
  const st = { man: null, img: {}, ready: false, cv: {}, url: {} }, CATS = ["bodies", "heads", "hh", "hairs", "helmets", "packs", "gloves", "devices", "flags"], waiters = [];
  const W = 220, HH = 320, X0 = 110, Y0 = 90, FEET = Y0 + 160;
  const NAMES = {
    bodies: ["Azul", "Verde", "Laranja", "Roxo", "Amarelo", "Branco", "Vermelho", "Turquesa"],
    flags: ["Brasil", "EUA", "Canadá", "Alemanha", "França", "Japão", "Reino Unido", "Itália", "China", "Índia"],
    FLAGCC: ["BR", "US", "CA", "DE", "FR", "JP", "GB", "IT", "CN", "IN"],
  };
  const DEF = [0, 0, 0, -1, -1, 0, 0, -1, -1], GLOVE_OF = [1, 2, 3, 4, 5, 8, 6, 7];
  /** Os 10 personagens da folha (corpo, cabeça, cabelo, capacete, mochila, luvas, bandeira, equipamento, cabeça pronta). */
  const PRESETS = [
    { n: "Leo", pd: [0, 0, 0, -1, -1, 1, 0, -1, -1] }, { n: "Ruby", pd: [1, 1, 7, -1, -1, 2, 6, -1, -1] }, { n: "Kai", pd: [2, 2, 8, -1, -1, 3, 0, -1, -1] }, { n: "Mei", pd: [3, 3, 15, -1, -1, 4, 5, -1, -1] }, { n: "Theo", pd: [4, 4, 2, -1, -1, 5, 1, -1, -1] },
    { n: "Zuri", pd: [5, 0, -1, -1, -1, 8, 0, -1, 3] }, { n: "Haru", pd: [6, 1, 1, -1, -1, 6, 5, -1, -1] }, { n: "Amira", pd: [7, 0, -1, -1, -1, 7, 4, -1, 5] }, { n: "Sam", pd: [5, 0, -1, -1, -1, 8, 7, -1, 1] }, { n: "Nia", pd: [3, 4, 5, -1, -1, 4, 0, -1, -1] },
  ];
  function load() {
    return fetch("assets/sprites/manifest.json").then((r) => (r.ok ? r.json() : null)).then((m) => {
      if (!m) return; st.man = m; return Promise.all(CATS.map((c) => new Promise((res) => { const im = new Image(); im.onload = () => { st.img[c] = im; res(); }; im.onerror = () => res(); im.src = "assets/sprites/" + c + ".png"; })));
    }).catch(() => {}).then(() => { st.ready = !!(st.man && CATS.every((c) => st.img[c])); waiters.splice(0).forEach((f) => f()); if (st.ready && typeof THUMB !== "undefined") THUMB.reset(); });
  }
  const count = (c) => (st.man && st.man[c] ? st.man[c].n : 0);
  const cell = (c, i) => { const r = st.man && st.man[c] && st.man[c].r[i]; return r ? { im: st.img[c], x: r[0], y: r[1], w: r[2], h: r[3] } : null; };
  function put(ctx, c, i, cx, y, sc, flip) {
    const p = cell(c, i); if (!p) return; const w = p.w * (sc || 1), h = p.h * (sc || 1); ctx.save(); ctx.translate(cx, y);
    if (flip) ctx.scale(-1, 1); ctx.drawImage(p.im, p.x, p.y, p.w, p.h, -w / 2, 0, w, h); ctx.restore();
  }
  const norm = (pd) => { const o = (Array.isArray(pd) && pd.length === 9 ? pd : DEF).map((v, i) => (Number.isInteger(v) ? v : DEF[i])); return o; };
  /** Compõe o boneco em um canvas (cache por configuração). */
  function compose(pd, nc) {
    pd = norm(pd); const key = pd.join(",") + "|" + (pd[6] === -2 ? nc : ""); if (st.cv[key]) return st.cv[key];
    const cv = document.createElement("canvas"); cv.width = W; cv.height = HH; const x = cv.getContext("2d"), [b, hd, hr, hm, pk, gl, fg, dv, hh] = pd;
    if (pk >= 0) put(x, "packs", pk, X0, Y0 - 12, 1.5);
    put(x, "bodies", Math.max(0, b), X0, Y0);
    const fi = fg === -2 ? NAMES.FLAGCC.indexOf(nc) : fg; if (fi >= 0) put(x, "flags", fi, X0 - 31, Y0 + 25, .34);
    if (gl >= 0) { put(x, "gloves", gl, X0 - 35, Y0 + 70, .46); put(x, "gloves", gl, X0 + 36, Y0 + 70, .46, true); }
    if (dv >= 0) put(x, "devices", dv, X0 + 52, Y0 + 54, .52);
    if (hh >= 0) { const p = cell("hh", hh); if (p) put(x, "hh", hh, X0, Y0 + 10 - p.h); }
    else { const p = cell("heads", Math.max(0, hd)); if (p) put(x, "heads", Math.max(0, hd), X0, Y0 + 10 - p.h); if (hr >= 0) put(x, "hairs", hr, X0, Y0 - 66); }
    if (hm >= 0) put(x, "helmets", hm, X0, Y0 - 66, 1.12);
    return (st.cv[key] = cv);
  }
  /** Miniatura (data URL) de uma peça do atlas. */
  function thumb(c, i, h) { const k = c + i + "@" + (h || 0); if (st.url[k]) return st.url[k]; const p = cell(c, i); if (!p) return ""; const sc = Math.min(1, (h || 64) / p.h), cv = document.createElement("canvas"); cv.width = Math.round(p.w * sc); cv.height = Math.round(p.h * sc); cv.getContext("2d").drawImage(p.im, p.x, p.y, p.w, p.h, 0, 0, cv.width, cv.height); return (st.url[k] = cv.toDataURL()); }
  function dollThumb(pd, nc) { const k = "doll" + norm(pd).join(",") + nc; if (st.url[k]) return st.url[k]; const c = compose(pd, nc), o = document.createElement("canvas"); o.width = 110; o.height = 120; o.getContext("2d").drawImage(c, 0, 40, W, 240, 0, 0, 110, 120); return (st.url[k] = o.toDataURL()); }
  return { load, st, DEF, PRESETS, NAMES, GLOVE_OF, W, HH, FEET, count, cell, compose, thumb, dollThumb, norm, get ready() { return st.ready; }, whenReady: () => (st.ready ? Promise.resolve() : new Promise((r) => waiters.push(r))) };
})();

const _av3d = av;
/** Avatar do jogo: no visual "Arte 2D" (humanos) usa o boneco de sprites; senão o 3D. */
av = function (e) {
  e = e || {}; const lk = lookNorm(e.lk);
  if (!lk.v2 || e.sp === "alien" || !ART.ready) return _av3d(e);
  const g = new THREE.Group(), tex = new THREE.CanvasTexture(ART.compose(lk.pd, lk.nc)); tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, alphaTest: .04, depthWrite: true })), K = .02;
  sp.scale.set(ART.W * K, ART.HH * K, 1); sp.center.set(.5, (ART.HH - ART.FEET) / ART.HH); sp.userData.base = ART.HH * K; g.add(sp);
  const sh = new THREE.Mesh(new THREE.CircleGeometry(1.15, 24), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .3, depthWrite: false })); sh.rotation.x = -Math.PI / 2; sh.position.y = .04; sh.scale.set(1, .55, 1); g.add(sh);
  g.scale.setScalar(1.1 * [.93, 1, 1.07][lk.ht]); g.userData.art = sp; g.userData.legs = []; g.userData.arms = []; g.userData.glb = 1; return g;
};
/** Animação do sprite: respira parado; ao andar quica e balança. */
function artAnim(g, t, speed) {
  const sp = g.userData.art; if (!sp) return; const v = Math.min(1, speed || 0);
  sp.position.y = Math.abs(Math.sin(t * 9)) * .14 * v; sp.scale.y = sp.userData.base * (1 + Math.sin(t * 2.2) * .012 + (v ? Math.abs(Math.sin(t * 9)) * .02 : 0)); sp.material.rotation = Math.sin(t * 9) * .05 * v;
}

/** Aba "Arte 2D" do guarda-roupa: escolhe o visual e monta o boneco peça por peça com os sprites. */
function artPanel(pv) {
  const wi = $("#wi"), L = () => P.look || (P.look = lookNorm()), pd = () => { const l = L(); l.pd = ART.norm(l.pd); return l.pd; };
  const prev = () => pv.setObj(av(Object.assign({}, myEq(), WTRY || {})), 0);
  const IDX = { b: 0, hd: 1, hr: 2, hm: 3, pk: 4, gl: 5, fg: 6, dv: 7, hh: 8 };
  const set = (k, v) => { const l = L(); l.v2 = 1; const p = pd(); p[IDX[k]] = v; if (k === "hh" && v >= 0) { /* cabeça pronta: ignora cabelo/careca */ } if ((k === "hd" || k === "hr") && p[8] >= 0) p[8] = -1; saveP(); prev(); draw(); };
  const grid = (cat, k, names, none) => `<div class="thg">${cells(cat, k, names, none)}</div>`;
  const cells = (cat, k, names, none) => { const p = pd(), cur = p[IDX[k]], n = ART.count(cat);
    return `${none ? `<button class="thb ${cur < 0 ? "sel" : ""}" data-a="${k}" data-v="-1"><small style="font-size:22px">∅</small><small>${none}</small></button>` : ""}${Array.from({ length: n }, (_, i) => `<button class="thb ${cur === i ? "sel" : ""}" data-a="${k}" data-v="${i}" title="${esc((names && names[i]) || cat + " " + (i + 1))}"><img src="${ART.thumb(cat, i, 70)}" alt="" style="height:70px;max-width:64px;object-fit:contain"><small>${esc((names && names[i]) || (i + 1))}</small></button>`).join("")}`; };
  const draw = () => {
    const l = L(), on = !!l.v2, p = pd();
    if (!ART.ready) { wi.innerHTML = `<div class="sec" style="grid-column:1/-1"><h4>ARTE 3D</h4><p class="mu">Carregando os sprites…</p></div>`; ART.whenReady().then(() => { if ($("#ward").classList.contains("on") && WTAB == "art") draw(); }); return; }
    wi.innerHTML = `<div style="grid-column:1/-1;display:grid;gap:10px">
    <div class="sec"><h4>VISUAL DO BONECO</h4><div class="row"><button id="av3" class="${on ? "" : "sel"}">🧊 3D (modelo de código)</button><button id="av2" class="${on ? "sel" : ""}">🎨 Arte 3D (sprites convertidos)</button></div><small class="mu">No visual <b>Arte 3D</b> cada sprite da animação foi convertido em uma malha 3D (a arte original é a textura) e o boneco é montado peça por peça; ele gira 360°. Vale para humanos; alienígenas continuam em 3D. Grátis e dá para trocar quando quiser.</small></div>
    <div class="sec"><h4>PERSONAGENS DA ARTE</h4><div class="thg">${ART.PRESETS.map((q, i) => `<button class="thb" data-pr="${i}" title="${esc(q.n)}"><img src="${ART.dollThumb(q.pd, "")}" alt="" style="height:110px;max-width:80px;object-fit:contain"><small>${esc(q.n)}</small></button>`).join("")}</div><div class="row" style="margin-top:6px"><button id="arnd">🎲 Aleatório</button></div></div>
    <div class="sec"><h4>TRAJE (COR)</h4>${grid("bodies", "b", ART.NAMES.bodies)}</div>
    <div class="sec"><h4>CABEÇA E TOM DE PELE</h4>${grid("heads", "hd", null)}<b style="display:block;margin:8px 0 4px">Cabeças prontas (já com cabelo)</b>${grid("hh", "hh", ["Cabelo preto", "Preto + óculos", "Loiro + óculos", "Castanho + óculos", "Cacheado + óculos", "Hijab"], "Nenhuma")}</div>
    <div class="sec"><h4>CABELOS (${ART.count("hairs")})</h4>${grid("hairs", "hr", null, "Sem cabelo")}</div>
    <div class="sec"><h4>CAPACETES (${ART.count("helmets")})</h4>${grid("helmets", "hm", null, "Sem capacete")}</div>
    <div class="sec"><h4>MOCHILAS (${ART.count("packs")})</h4>${grid("packs", "pk", null, "Sem mochila")}</div>
    <div class="sec"><h4>LUVAS (${ART.count("gloves")})</h4>${grid("gloves", "gl", null, "Sem luvas")}</div>
    <div class="sec"><h4>BANDEIRA NO BRAÇO</h4><div class="thg"><button class="thb ${p[6] === -2 ? "sel" : ""}" data-a="fg" data-v="-2"><small style="font-size:22px">🪪</small><small>Da conta</small></button>${cells("flags", "fg", ART.NAMES.flags, "Nenhuma")}</div></div>
    <div class="sec"><h4>EQUIPAMENTOS (${ART.count("devices")})</h4>${grid("devices", "dv", null, "Nenhum")}</div>
    <small class="mu">Sprites separados da animação enviada. Os itens do visual 3D (Trajes, Capacetes…) continuam nas outras abas.</small></div>`;
    $("#av3").onclick = () => { L().v2 = 0; saveP(); prev(); draw(); }; $("#av2").onclick = () => { L().v2 = 1; saveP(); prev(); draw(); };
    wi.querySelectorAll("[data-a]").forEach((b) => (b.onclick = () => set(b.dataset.a, +b.dataset.v)));
    wi.querySelectorAll("[data-pr]").forEach((b) => (b.onclick = () => { const l = L(); l.v2 = 1; l.pd = ART.PRESETS[+b.dataset.pr].pd.slice(); saveP(); prev(); draw(); }));
    $("#arnd").onclick = () => { const r = (n) => Math.floor(Math.random() * n), l = L(), bd = r(ART.count("bodies")), hh = r(3) === 0 ? r(ART.count("hh")) : -1; l.v2 = 1; l.pd = [bd, r(ART.count("heads")), r(ART.count("hairs")), r(5) === 0 ? r(ART.count("helmets")) : -1, r(2) ? r(ART.count("packs")) : -1, ART.GLOVE_OF[bd], r(ART.count("flags")), r(3) === 0 ? r(ART.count("devices")) : -1, hh]; saveP(); prev(); draw(); };
  };
  draw();
}
