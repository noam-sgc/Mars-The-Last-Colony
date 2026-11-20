/* Aparência 3D (não pixelada): tons de pele, cabelos, rosto, óculos, barba, corpo e as customizações de LAYOUT dos cosméticos
   (formas, padrões, tamanho, cor secundária) usadas pelo guarda-roupa e pelo Estúdio. */
const LOOK = {
  TONES: ["#ffdcc0", "#f3c9a4", "#e0a878", "#c68642", "#a86a3c", "#8a5530", "#6b3f24", "#4a2a18"],
  HAIRS: ["Careca", "Curto", "Crespo", "Cacheado volumoso", "Longo liso", "Coque", "Rabo de cavalo", "Tranças", "Moicano", "Dreads", "Hijab", "Chanel", "Topete"],
  NATS: ["BR", "US", "JP", "FR", "DE", "IN", "CN", "ZA", "GB", "CA"], HOLD: ["Capacete na mão", "Capacete na cabeça (vidro)", "Sem capacete"],
  HCOLS: ["#1a1210", "#3b2a20", "#6a4630", "#a8742f", "#d9a441", "#e8d8a0", "#b3402a", "#6b5cff", "#2fd4c0", "#e84fa8"],
  FACES: ["Sorriso", "Neutro", "Sorrisão", "Surpreso"], GLASS: ["Sem óculos", "Redondos", "Quadrados", "Escuros"], BEARDS: ["Sem barba", "Bigode", "Barba", "Cavanhaque"], BUILDS: ["Esguio", "Médio", "Forte"], HEIGHTS: ["Baixo", "Médio", "Alto"],
  EYES: ["Redondos", "Amendoados", "Grandes"],
  DEF: { t: 3, hr: 3, hc: "#1a1210", ey: 0, fc: 0, gl: 1, br: 0, bd: 1, ht: 1, hg: 0, nc: "BR" },
};
const _in = (v, a, b, d) => (Number.isInteger(v) && v >= a && v <= b ? v : d);
/** Valida/normaliza um objeto de aparência (vindo da rede ou do disco). */
function lookNorm(l) {
  l = l && typeof l === "object" ? l : {}; const D = LOOK.DEF;
  return { t: _in(l.t, 0, 7, D.t), hr: _in(l.hr, 0, 12, D.hr), hc: /^#[0-9a-fA-F]{6}$/.test(l.hc) ? l.hc : D.hc, ey: _in(l.ey, 0, 2, D.ey), fc: _in(l.fc, 0, 3, D.fc), gl: _in(l.gl, 0, 3, D.gl), br: _in(l.br, 0, 3, D.br), bd: _in(l.bd, 0, 2, D.bd), ht: _in(l.ht, 0, 2, D.ht), hg: _in(l.hg, 0, 2, 0), nc: /^[A-Z]{2}$/.test(l.nc) ? l.nc : "" };
}
/** Aparência aleatória determinística (colonos e bots variados). */
function lookRandom(seed) {
  const r = (n) => { seed = (seed * 9301 + 49297) % 233280; return Math.floor(seed / 233280 * n); };
  return lookNorm({ t: r(8), hr: r(10), hc: LOOK.HCOLS[r(7)], ey: r(3), fc: r(3), gl: r(4) == 0 ? 1 + r(3) : 0, br: r(5) == 0 ? 1 + r(3) : 0, bd: r(3), ht: r(3) });
}
const _ft = (v, a, b, d) => (Number.isFinite(+v) ? Math.min(b, Math.max(a, +v)) : d);
/** Parâmetros de layout de um cosmético (forma, padrão, cor secundária, tamanho). */
const cxp = (it) => ({ sh: _in(it && it.sh, 0, 12, 0), pt: _in(it && it.pt, 0, 9, 0), c2: it && /^#[0-9a-fA-F]{6}$/.test(it.c2) ? it.c2 : "#ffffff", sz: _ft(it && it.sz, .7, 1.5, 1) });

/** Cabeça humana: pele, rosto, cabelo, óculos, barba e acessório. Origem no centro da cabeça. */
function humanHead(lk, hairIt, accIt, helIt, M) {
  const H = new THREE.Group(), add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; H.add(m); return m; };
  const skin = LOOK.TONES[lk.t], SK = () => M(skin, { roughness: .7, metalness: 0 }), R = .44;
  const hp = cxp(hairIt), hairStyle = hairIt && hairIt.id && hairIt.id !== "r0" ? hp.sh : lk.hr, hairCol = hairIt && hairIt.id && hairIt.id !== "r0" && hairIt.col ? hairIt.col : lk.hc, HM = (c) => M(c || hairCol, { roughness: .85, metalness: 0 });
  const head = add(new THREE.SphereGeometry(R, 20, 16), SK(), 0, 0, 0); head.scale.set(1, 1.08, 1.02);
  [-1, 1].forEach((s) => add(new THREE.SphereGeometry(.09, 8, 6), SK(), s * .43, -.02, 0));   // orelhas
  // olhos estilo cartoon: esclera, íris, pupila e dois brilhos
  const es = [1, .78, 1.22][lk.ey], iris = ["#5a3a22", "#3b2414", "#2b5a8a", "#3a6a3a"][lk.t % 2 ? 0 : 1];
  [-1, 1].forEach((s) => { const x = s * .16, y = .02;
    const w = add(new THREE.SphereGeometry(.1, 16, 12), M("#ffffff"), x, y, .355); w.scale.set(.95, 1.12 * es, .5);
    const ir = add(new THREE.SphereGeometry(.072, 14, 10), M(iris), x + s * .004, y - .008, .392); ir.scale.set(1, 1.15 * es, .45);
    add(new THREE.SphereGeometry(.04, 10, 8), M("#0b0806"), x + s * .004, y - .01, .41).scale.set(1, 1.1 * es, .4);
    add(new THREE.SphereGeometry(.022, 8, 6), new THREE.MeshBasicMaterial({ color: "#ffffff" }), x + .025, y + .04 * es, .425);
    add(new THREE.SphereGeometry(.011, 6, 5), new THREE.MeshBasicMaterial({ color: "#ffffff" }), x - .022, y - .035 * es, .424);
    if (lk.ey == 1) { const l = add(new THREE.TorusGeometry(.095, .014, 5, 12, Math.PI), M("#1a1210"), x, y + .02, .39); l.scale.y = .8; }
    const b = add(new THREE.BoxGeometry(.15, .03, .03), HM(), x, .17 + (lk.fc == 3 ? .04 : 0), .385); b.rotation.z = s * (lk.fc == 3 ? -.12 : .1);
    const bl = add(new THREE.CircleGeometry(.06, 14), new THREE.MeshBasicMaterial({ color: "#ff7a8a", transparent: true, opacity: .35, depthWrite: false }), s * .25, -.1, .372); bl.rotation.y = s * .55; bl.castShadow = false; });
  add(new THREE.SphereGeometry(.055, 8, 6), SK(), 0, -.04, .44).scale.set(1, 1.1, .9);   // nariz
  // boca
  if (lk.fc == 1) add(new THREE.BoxGeometry(.15, .022, .03), M("#5a2a2a"), 0, -.2, .41);
  else if (lk.fc == 3) add(new THREE.SphereGeometry(.05, 8, 6), M("#3a1414"), 0, -.21, .41).scale.set(1, 1.2, .5);
  else { const sm = add(new THREE.TorusGeometry(lk.fc == 2 ? .13 : .1, .02, 6, 14, Math.PI), M("#6a2a2a"), 0, -.13, .4); sm.rotation.z = Math.PI; if (lk.fc == 2) add(new THREE.BoxGeometry(.2, .05, .02), M("#ffffff"), 0, -.205, .405); }
  // barba
  if (lk.br == 1) add(new THREE.BoxGeometry(.22, .05, .05), HM(), 0, -.12, .42);
  else if (lk.br == 2) { const b = add(new THREE.SphereGeometry(.4, 14, 10, 0, 6.283, Math.PI * .45, Math.PI * .5), HM(), 0, -.06, .02); b.scale.set(1.02, 1, 1.02); }
  else if (lk.br == 3) add(new THREE.SphereGeometry(.07, 8, 6), HM(), 0, -.3, .36).scale.set(1, 1.4, .8);
  // óculos
  if (lk.gl) { const gm = M(lk.gl == 3 ? "#0a0a10" : "#25262e", { metalness: .6, roughness: .3 });
    [-1, 1].forEach((s) => { if (lk.gl == 1) add(new THREE.TorusGeometry(.115, .016, 6, 18), gm, s * .16, .05, .41); else if (lk.gl == 2) { const f = add(new THREE.BoxGeometry(.25, .17, .03), gm, s * .16, .05, .41); f.material = M("#25262e", { metalness: .6 }); const gl = add(new THREE.BoxGeometry(.2, .12, .035), M("#bfe6ff", { transparent: true, opacity: .3, roughness: .05 }), s * .16, .05, .415); } else add(new THREE.CircleGeometry(.13, 14), M("#050508", { metalness: .8, roughness: .1 }), s * .16, .05, .42); });
    add(new THREE.BoxGeometry(.1, .02, .02), gm, 0, .06, .42); }
  // cabelo
  let hairR = .5; const cap = (r, phi, y) => { const yy = y == null ? .04 : y, m = add(new THREE.SphereGeometry(r, 20, 12, 0, 6.283, 0, Math.PI * Math.min(phi, .4)), HM(), 0, yy, -.02); add(new THREE.SphereGeometry(r * .995, 20, 12, Math.PI * .8, Math.PI * 1.4, 0, Math.PI * phi), HM(), 0, yy, -.02); return m; };
  const sd = (() => { let s = 77; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; })();
  const curls = (n, rad, sz, front) => { for (let i = 0; i < n; i++) { const u = sd() * 2 - 1, a = sd() * 6.283, q = Math.sqrt(1 - u * u), d = new THREE.Vector3(q * Math.cos(a), Math.abs(u) * .9 + .1, q * Math.sin(a)); if (d.z > .05 && d.y < .62 && Math.abs(d.x) < .85) continue; if (d.z > -.2 && d.y < .3) continue; if (d.y < .1) continue;
      const mech = hp.pt == 1 && i % 4 == 0, m = add(new THREE.SphereGeometry(sz * (.8 + sd() * .5), 8, 6), HM(mech ? hp.c2 : null), d.x * rad, d.y * rad * 1.02, d.z * rad); m.scale.y = .95; } hairR = rad + sz + .06; };
  if (hairIt && hairIt.hv) { hairR = drawnHair(H, hairIt, HM); } else switch (hairStyle) {
    case 1: cap(.47, .58); break;
    case 2: cap(.48, .55); curls(34, .5, .2, .55); break;
    case 3: cap(.5, .6); curls(52, .62, .24, .5); break;
    case 4: cap(.48, .62); add(new THREE.BoxGeometry(.9, 1.25, .26), HM(), 0, -.5, -.3); [-1, 1].forEach((s) => add(new THREE.BoxGeometry(.13, .9, .3), HM(), s * .45, -.3, -.05)); break;
    case 5: cap(.47, .58); add(new THREE.SphereGeometry(.2, 10, 8), HM(), 0, .5, -.1); break;
    case 6: cap(.47, .6); { const t = add(new THREE.CylinderGeometry(.08, .04, .85, 8), HM(), 0, -.3, -.5); t.rotation.x = -.25; } add(new THREE.SphereGeometry(.09, 8, 6), HM(hp.c2), 0, .12, -.46); break;
    case 7: cap(.48, .55); for (let i = 0; i < 8; i++) { const a = -2.6 + i * .75, x = Math.sin(a) * .45, z = Math.cos(a) * .4 - .1; if (z > .2) continue; const b = add(new THREE.CylinderGeometry(.045, .03, .9, 6), HM(), x, -.4, z); b.rotation.z = Math.sin(a) * .08; add(new THREE.SphereGeometry(.06, 6, 5), HM(hp.c2), x * 1.02, -.86, z); } break;
    case 8: cap(.45, .5); { const m = add(new THREE.BoxGeometry(.13, .38, .95), HM(), 0, .45, -.05); } break;
    case 9: cap(.48, .55); for (let i = 0; i < 16; i++) { const a = -2.7 + i * .35, x = Math.sin(a) * .47, z = Math.cos(a) * .42 - .08; if (z > .22) continue; const b = add(new THREE.CylinderGeometry(.05, .035, .8 + (i % 3) * .2, 5), HM(), x, -.4, z); b.rotation.z = Math.sin(a) * .1; } break;
    case 10: { add(new THREE.SphereGeometry(.54, 20, 12, 0, 6.283, 0, Math.PI * .36), HM(), 0, -.02, -.04); const w = add(new THREE.SphereGeometry(.54, 20, 14, Math.PI / 2 + .8, Math.PI * 2 - 1.6, 0, Math.PI * .8), HM(), 0, -.02, -.04); w.scale.set(1, 1.02, 1.02); const dr = add(new THREE.CylinderGeometry(.5, .6, .55, 16, 1, true), HM(), 0, -.42, -.06); dr.scale.z = .9; add(new THREE.TorusGeometry(.36, .04, 6, 20), HM(hp.c2), 0, .22, .3).rotation.x = .2; hairR = .58; break; }
    case 11: cap(.49, .6); add(new THREE.CylinderGeometry(.52, .5, .6, 18, 1, true, Math.PI / 3, Math.PI * 4 / 3), HM(), 0, -.12, -.06).scale.z = .95; [-1, 1].forEach((s) => add(new THREE.BoxGeometry(.1, .5, .2), HM(), s * .46, -.18, .1)); hairR = .55; break;
    case 12: cap(.48, .58); { const q = add(new THREE.SphereGeometry(.3, 12, 10), HM(), 0, .42, .18); q.scale.set(1.4, .8, 1); add(new THREE.SphereGeometry(.2, 10, 8), HM(hp.c2), .18, .4, .3); } break;
    default: break;
  }
  // acessório
  const ap = cxp(accIt), ac = accIt && accIt.col ? accIt.col : "#8fd0ff", ag = accIt && accIt.glow;
  if (accIt && accIt.id && accIt.id !== "a0") {
    const AM = (c) => M(c || ac, { emissive: ag || "#000000", emissiveIntensity: ag ? .8 : 0, metalness: .5, roughness: .35 });
    switch (ap.sh) {
      case 1: [-1, 1].forEach((s) => add(new THREE.TorusGeometry(.125, .02, 6, 18), AM(), s * .16, .05, .43)); add(new THREE.BoxGeometry(.1, .02, .02), AM(), 0, .06, .43); break;
      case 2: [-1, 1].forEach((s) => add(new THREE.BoxGeometry(.26, .17, .03), AM(), s * .16, .05, .43)); break;
      case 3: add(new THREE.BoxGeometry(.9, .13, .12), AM(), 0, .05, .36).scale.set(1, 1, 1); break;
      case 4: [-1, 1].forEach((s) => { const e = add(new THREE.ConeGeometry(.14, .3, 4), AM(), s * .28, hairR > .6 ? .72 : .5, 0); e.rotation.z = -s * .35; }); break;
      case 5: [-1, 1].forEach((s) => { const a = add(new THREE.CylinderGeometry(.015, .015, .6, 5), AM(), s * .22, hairR > .6 ? .85 : .7, 0); a.rotation.z = -s * .3; add(new THREE.SphereGeometry(.05, 8, 6), AM("#ffffff"), s * .3, hairR > .6 ? 1.15 : 1, 0); }); break;
      case 6: add(new THREE.SphereGeometry(.4, 12, 8, 0, 6.283, Math.PI * .58, Math.PI * .3), AM(), 0, -.05, .06).scale.set(1.02, 1, 1.05); break;
      case 8: { const s0 = add(new THREE.BoxGeometry(.95, .22, .1), AM("#222833"), 0, .05, .4); [-1, 1].forEach((s) => add(new THREE.BoxGeometry(.3, .18, .06), M(ac, { transparent: true, opacity: .55, emissive: ag || ac, emissiveIntensity: .5 }), s * .17, .05, .46)); break; }
      case 9: { const b = add(new THREE.TorusGeometry(.47, .03, 6, 22, Math.PI), AM(), 0, .08, 0); [-1, 1].forEach((s) => add(new THREE.CylinderGeometry(.12, .12, .1, 12), AM(), s * .47, -.02, 0).rotation.z = Math.PI / 2); const mc = add(new THREE.CylinderGeometry(.012, .012, .35, 5), AM(), .4, -.16, .2); mc.rotation.set(.8, 0, .6); add(new THREE.SphereGeometry(.04, 6, 5), AM("#ff5a5a"), .3, -.3, .35); break; }
      case 7: add(new THREE.CircleGeometry(.1, 12), AM("#111118"), -.16, .05, .44); { const s = add(new THREE.BoxGeometry(.9, .015, .02), AM("#111118"), 0, .15, .3); s.rotation.z = .35; } break;
      default: break;
    }
  }
  // capacete cosmético (cobre o topo; o rosto continua visível) ou bolha de vidro
  const hp2 = cxp(helIt), has = helIt && helIt.id && helIt.id !== "h0", hc = has && helIt.col ? helIt.col : "#e8e8ee", hglow = has && helIt.glow;
  const HLM = (o) => M(hc, Object.assign({ metalness: .35, roughness: .4, emissive: hglow || "#000", emissiveIntensity: hglow ? .5 : 0 }, o || {}));
  const top = hairR > .6 ? .72 : .5;
  if (has && hp2.sh != 0 && hp2.sh <= 6) {
    switch (hp2.sh) {
      case 1: { const c = add(new THREE.SphereGeometry(hairR + .02, 16, 10, 0, 6.283, 0, Math.PI * .5), HLM(), 0, .08, -.02); const b = add(new THREE.BoxGeometry(.7, .04, .35), HLM(), 0, .08, .52); b.rotation.x = .1; break; }
      case 2: add(new THREE.CylinderGeometry(.34, .36, .55, 14), HLM(), 0, top - .05 + .3, 0); add(new THREE.CylinderGeometry(.62, .62, .05, 18), HLM(), 0, top - .05, 0); break;
      case 3: for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283, c = add(new THREE.ConeGeometry(.08, .3, 5), HLM(), Math.cos(a) * .3, top + .1, Math.sin(a) * .3); } add(new THREE.TorusGeometry(.32, .04, 6, 20), HLM(), 0, top - .05, 0).rotation.x = Math.PI / 2; break;
      case 4: add(new THREE.ConeGeometry(hairR + .04, .85, 14), HLM(), 0, top + .2, -.04).rotation.x = -.15; break;
      case 5: { const t = add(new THREE.TorusGeometry(.45, .035, 6, 22, Math.PI), HLM(), 0, .02, 0); t.rotation.set(0, 0, 0); t.position.y = .1; [-1, 1].forEach((s) => add(new THREE.CylinderGeometry(.13, .13, .1, 12), HLM(), s * .47, -.02, 0).rotation.z = Math.PI / 2); break; }
      case 6: add(new THREE.SphereGeometry(hairR + .03, 16, 10, 0, 6.283, 0, Math.PI * .5), HLM(), 0, .1, -.02); [-1, 1].forEach((s) => { const e = add(new THREE.ConeGeometry(.12, .3, 4), HLM(), s * .3, top + .12, 0); e.rotation.z = -s * .3; }); break;
    }
  }
  if (lk.hg == 1) { const r = Math.max(.62, hairR + .1); const g = add(new THREE.SphereGeometry(r, 20, 14), M(has ? hc : "#aee4ff", { transparent: true, opacity: has ? .28 : .16, roughness: .05, metalness: .3, depthWrite: false, emissive: hglow || "#000", emissiveIntensity: hglow ? .4 : 0 }), 0, .04, 0); g.castShadow = false; add(new THREE.TorusGeometry(r * .78, .06, 8, 22), HLM(), 0, -.5, 0).rotation.x = Math.PI / 2; }
  return H;
}

// ---------- equipe pré-montada (fichas de personagens) ----------
const TEAM = [
  { id: "tm1", n: "Mei Tanaka", d: "Engenheira de energia", look: { t: 1, hr: 11, hc: "#1a1210", fc: 0, gl: 0, nc: "JP" }, eq: { s: "s11", p: "p14", h: "h10", b: "b10" } },
  { id: "tm2", n: "Kofi Mensah", d: "Geólogo", look: { t: 7, hr: 2, hc: "#1a1210", fc: 2, gl: 0, nc: "ZA" }, eq: { s: "s12", p: "p11", h: "h11", b: "b11" } },
  { id: "tm3", n: "Finn Murray", d: "Agricultor", look: { t: 0, hr: 3, hc: "#c8461e", fc: 2, gl: 0, nc: "GB" }, eq: { s: "s13", p: "p12", h: "h13", b: "b12" } },
  { id: "tm4", n: "Amira Nasser", d: "Médica", look: { t: 3, hr: 10, hc: "#8a6ad6", fc: 0, gl: 0, nc: "IN" }, eq: { s: "s14", p: "p13", h: "h12", b: "b13" } },
  { id: "tm5", n: "Haru Wei", d: "Piloto de rover", look: { t: 1, hr: 1, hc: "#1a1210", fc: 0, gl: 0, nc: "CN" }, eq: { s: "s17", p: "p10", h: "h15", b: "b16" } },
  { id: "tm6", n: "Zuri Okoye", d: "Comunicações", look: { t: 6, hr: 3, hc: "#1a1210", fc: 0, gl: 0, nc: "BR" }, eq: { s: "s16", p: "p11", h: "h14", b: "b15" } },
  { id: "tm7", n: "Marco Reyes", d: "Comandante", look: { t: 2, hr: 1, hc: "#6a4630", br: 2, fc: 1, gl: 0, bd: 2, nc: "DE" }, eq: { s: "s15", p: "p12", h: "h13", b: "b14" } },
  { id: "tm8", n: "Ingrid Berg", d: "Cientista", look: { t: 0, hr: 5, hc: "#e8d8a0", fc: 0, gl: 0, nc: "CA" }, eq: { s: "s18", p: "p14", h: "h10", b: "b17" } },
];
const teamAll = () => TEAM.concat((typeof CAT !== "undefined" && CAT.chr) || []);
const teamEq = (pr, withLook) => Object.assign({}, DEF_EQ, pr.eq || {}, { sp: pr.sp || "human", sk: "verde", lk: lookNorm(pr.look) });
/** Veste o personagem pré-montado: aparência completa + itens que você já tem (os demais ficam no padrão). */
function applyPreset(pr) {
  P.look = lookNorm(Object.assign({}, pr.look, { hg: 0 })); P.sp = pr.sp === "alien" ? "alien" : "human"; let miss = 0;
  Object.keys(pr.eq || {}).forEach((l) => { const id = pr.eq[l], it = cxById(id); if (P.own.includes(id) && canUseItem(it)) P.eq[l] = id; else if (id) miss++; });
  saveP(); toast(`🧑‍🚀 ${esc(pr.n)} vestido!${miss ? " (" + miss + " item(ns) que você ainda não tem ficaram no padrão)" : ""}`);
}
/** Aba "Equipe": fichas de personagens prontos (base + publicados pelos desenhistas). */
function teamPanel(pv, redraw) {
  const wi = $("#wi"); wi.innerHTML = `<div class="sec" style="grid-column:1/-1"><h4>MONTE SUA EQUIPE PARA A MISSÃO</h4><small class="mu">Escolha um personagem pronto e depois ajuste cada detalhe em Aparência, Trajes, Capacetes, Mochilas… Diversidade fortalece a missão.</small></div>`;
  teamAll().forEach((pr) => { const d = document.createElement("div"); d.className = "it"; d.innerHTML = `<span class="tg">${pr.by ? "✨ " + esc(pr.by) : "Equipe"}</span><img class="th" alt="${esc(pr.n)}"><b style="font-size:12px">${esc(pr.n)}</b><small>${esc(pr.d || "")} ${pr.look && pr.look.nc ? "· " + pr.look.nc : ""}</small>`;
    lazyThumb(d.querySelector("img"), () => thumbAv(teamEq(pr), "full")); d.onclick = () => { pv.setObj(av(teamEq(pr)), 0); };
    const b = document.createElement("button"); b.textContent = "Usar este personagem"; b.style.fontSize = "12px"; b.onclick = (e) => { e.stopPropagation(); applyPreset(pr); redraw(); }; d.appendChild(b); wi.appendChild(d); });
}
const _q = []; let _qt = 0;
/** Preenche miniaturas aos poucos (uma por quadro) para não travar a tela. */
function lazyThumb(img, fn) { _q.push([img, fn]); if (!_qt) _qt = requestAnimationFrame(function run() { const j = _q.shift(); if (j) { try { j[0].src = j[1](); } catch (e) { /* ignore */ } } _qt = _q.length ? requestAnimationFrame(run) : 0; }); }

/** Painel "Aparência": Tipos de cabelo, Tons de pele, Nacionalidades, rosto, corpo e capacete. Atualiza o boneco na hora. */
function lookPanel(pv) {
  const wi = $("#wi"), L = () => P.look || (P.look = lookNorm());
  const prev = () => pv.setObj(av(Object.assign({}, myEq(), WTRY || {})), 0);
  const set = (o) => { Object.assign(L(), o); P.look = lookNorm(P.look); saveP(); prev(); draw(); };
  const opts = (key, names) => `<div class="row" style="flex-wrap:wrap">${names.map((n, i) => `<button class="${L()[key] == i ? "sel" : ""}" data-k="${key}" data-v="${i}">${n}</button>`).join("")}</div>`;
  const draw = () => {
    const l = L(), allC = MarsRules.COUNTRIES;
    wi.innerHTML = `<div style="grid-column:1/-1;display:grid;gap:10px">${P.sp == "alien" ? `<p class="mu">👽 Aparência humana só vale para a espécie humana (alienígenas escolhem a cor da pele ao lado).</p>` : ""}
    <div class="sec"><h4>TIPOS DE CABELO</h4><div class="thg">${LOOK.HAIRS.map((n, i) => `<button class="thb ${l.hr == i ? "sel" : ""}" data-k="hr" data-v="${i}" title="${n}"><img class="th2" alt="${n}"><small>${n}</small></button>`).join("")}</div>
      <b style="display:block;margin-top:8px">Cor do cabelo</b><div class="row" style="flex-wrap:wrap;margin:6px 0">${LOOK.HCOLS.map((c) => `<button data-k="hc" data-s="${c}" class="${l.hc == c ? "sel" : ""}" style="width:34px;height:34px;padding:0;border-radius:50%;background:${c}"></button>`).join("")}<input type="color" id="lkc" value="${l.hc}" title="Cor personalizada" style="width:44px;height:34px"></div></div>
    <div class="sec"><h4>TONS DE PELE</h4><div class="row" style="flex-wrap:wrap">${LOOK.TONES.map((c, i) => `<button data-k="t" data-v="${i}" class="${l.t == i ? "sel" : ""}" style="width:42px;height:42px;padding:0;border-radius:50%;background:${c}"></button>`).join("")}</div></div>
    <div class="sec"><h4>NACIONALIDADES (${allC.length})</h4><div class="row" style="margin-bottom:6px"><input id="lkq" placeholder="🔎 Buscar país…" style="flex:1"><button data-k="nc" data-s="-">Sem bandeira</button></div>
      <div class="thg" id="lkf" style="max-height:250px;overflow:auto;grid-template-columns:repeat(auto-fill,minmax(70px,1fr))">${allC.map((c) => `<button class="thb ${l.nc == c.c ? "sel" : ""}" data-k="nc" data-s="${c.c}" data-n="${esc(c.n.toLowerCase())}" title="${esc(c.n)}"><img src="${flagURL(c.c)}" alt="${c.c}" style="width:54px;height:36px;border-radius:4px"><small>${esc(c.n)}</small></button>`).join("")}</div></div>
    <div class="sec"><h4>ROSTO E CORPO</h4><b>Rosto</b>${opts("fc", LOOK.FACES)}<b style="display:block;margin-top:8px">Olhos</b>${opts("ey", LOOK.EYES)}<b style="display:block;margin-top:8px">Óculos</b>${opts("gl", LOOK.GLASS)}<b style="display:block;margin-top:8px">Barba</b>${opts("br", LOOK.BEARDS)}
      <b style="display:block;margin-top:8px">Corpo</b>${opts("bd", LOOK.BUILDS)}<b style="display:block;margin-top:8px">Altura</b>${opts("ht", LOOK.HEIGHTS)}<b style="display:block;margin-top:8px">Capacete</b>${opts("hg", LOOK.HOLD)}</div>
    <div class="row"><button id="lkr">🎲 Aleatório</button><button id="lkd">Padrão</button></div><small class="mu">Grátis e pode mudar a qualquer momento. Cabelos, acessórios e equipamentos especiais ficam nas outras abas.</small></div>`;
    wi.querySelectorAll("[data-k]").forEach((b) => (b.onclick = () => set({ [b.dataset.k]: b.dataset.s === "-" ? "" : b.dataset.s != null && b.dataset.s !== "" ? b.dataset.s : +b.dataset.v })));
    $("#lkq").oninput = (e) => { const q = e.target.value.toLowerCase(); $("#lkf").querySelectorAll("[data-n]").forEach((b) => (b.style.display = !q || b.dataset.n.includes(q) || b.dataset.s.toLowerCase() == q ? "" : "none")); };
    wi.querySelectorAll("img.th2").forEach((im, i) => lazyThumb(im, () => thumbHair(i, L())));
    $("#lkc").oninput = (e) => { Object.assign(L(), { hc: e.target.value }); P.look = lookNorm(P.look); saveP(); prev(); };
    $("#lkr").onclick = () => set(Object.assign(lookRandom(Math.floor(Math.random() * 1e6)), { nc: allC[Math.floor(Math.random() * allC.length)].c })); $("#lkd").onclick = () => set(LOOK.DEF);
  };
  draw();
}

// ---------- miniaturas 3D (render único reutilizado, cache por chave) ----------
const THUMB = (() => {
  let r = null, sc, cam, cache = {}, ok = true;
  function init() { if (r || !ok) return; try { r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); r.setSize(96, 120); sc = new THREE.Scene(); sc.add(new THREE.HemisphereLight(0xfff0e0, 0x402010, 1)); const d = new THREE.DirectionalLight(0xffffff, 1.1); d.position.set(3, 6, 6); sc.add(d); cam = new THREE.PerspectiveCamera(35, 96 / 120, .1, 60); } catch (e) { ok = false; } }
  /** Renderiza um objeto 3D; modo "head" mostra só a cabeça/busto, "full" o corpo. */
  function shot(obj, mode) { init(); if (!r) return ""; sc.add(obj); const full = mode === "full"; const hd = obj.userData && obj.userData.legs; cam.position.set(0, full ? 2.1 : hd ? 3.25 : 3.0, full ? 8.6 : hd ? 4.6 : 3.6); cam.lookAt(0, full ? 1.95 : hd ? 3.12 : 2.95, 0); obj.rotation.y = full ? .35 : .25; r.render(sc, cam); const u = r.domElement.toDataURL("image/png"); sc.remove(obj); return u; }
  return { shot, get: (key, fn) => cache[key] || (cache[key] = fn()), reset: () => { cache = {}; } };
})();
/** Miniatura do avatar com `eq` (corpo inteiro ou cabeça). */
const thumbAv = (eq, mode) => THUMB.get("a|" + mode + "|" + JSON.stringify(eq) + "|" + allCX().length + "|" + (typeof TX_VER !== "undefined" ? TX_VER : 0), () => THUMB.shot(av(eq), mode));
const thumbHair = (hr, lk) => THUMB.get("h|" + hr + "|" + lk.t + "|" + lk.hc, () => { const o = new THREE.Group(), h = humanHead(Object.assign({}, lk, { hr, gl: 0, hg: 2 }), null, null, null, (c, op) => new THREE.MeshStandardMaterial(Object.assign({ color: c || "#888", roughness: .6 }, op || {}))); h.position.y = 2.95; o.add(h); return THUMB.shot(o, "head"); });
