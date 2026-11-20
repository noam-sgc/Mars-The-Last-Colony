/* Aparência 3D (não pixelada): tons de pele, cabelos, rosto, óculos, barba, corpo e as customizações de LAYOUT dos cosméticos
   (formas, padrões, tamanho, cor secundária) usadas pelo guarda-roupa e pelo Estúdio. */
const LOOK = {
  TONES: ["#ffdcc0", "#f3c9a4", "#e0a878", "#c68642", "#a86a3c", "#8a5530", "#6b3f24", "#4a2a18"],
  HAIRS: ["Careca", "Curto", "Crespo", "Cacheado volumoso", "Longo liso", "Coque", "Rabo de cavalo", "Tranças", "Moicano", "Dreads"],
  HCOLS: ["#1a1210", "#3b2a20", "#6a4630", "#a8742f", "#d9a441", "#e8d8a0", "#b3402a", "#6b5cff", "#2fd4c0", "#e84fa8"],
  FACES: ["Sorriso", "Neutro", "Sorrisão", "Surpreso"], GLASS: ["Sem óculos", "Redondos", "Quadrados", "Escuros"], BEARDS: ["Sem barba", "Bigode", "Barba", "Cavanhaque"], BUILDS: ["Esguio", "Médio", "Forte"], HEIGHTS: ["Baixo", "Médio", "Alto"],
  EYES: ["Redondos", "Amendoados", "Grandes"],
  DEF: { t: 3, hr: 3, hc: "#1a1210", ey: 0, fc: 0, gl: 1, br: 0, bd: 1, ht: 1, hg: 0 },
};
const _in = (v, a, b, d) => (Number.isInteger(v) && v >= a && v <= b ? v : d);
/** Valida/normaliza um objeto de aparência (vindo da rede ou do disco). */
function lookNorm(l) {
  l = l && typeof l === "object" ? l : {}; const D = LOOK.DEF;
  return { t: _in(l.t, 0, 7, D.t), hr: _in(l.hr, 0, 9, D.hr), hc: /^#[0-9a-fA-F]{6}$/.test(l.hc) ? l.hc : D.hc, ey: _in(l.ey, 0, 2, D.ey), fc: _in(l.fc, 0, 3, D.fc), gl: _in(l.gl, 0, 3, D.gl), br: _in(l.br, 0, 3, D.br), bd: _in(l.bd, 0, 2, D.bd), ht: _in(l.ht, 0, 2, D.ht), hg: l.hg ? 1 : 0 };
}
/** Aparência aleatória determinística (colonos e bots variados). */
function lookRandom(seed) {
  const r = (n) => { seed = (seed * 9301 + 49297) % 233280; return Math.floor(seed / 233280 * n); };
  return lookNorm({ t: r(8), hr: r(10), hc: LOOK.HCOLS[r(7)], ey: r(3), fc: r(3), gl: r(4) == 0 ? 1 + r(3) : 0, br: r(5) == 0 ? 1 + r(3) : 0, bd: r(3), ht: r(3) });
}
const _ft = (v, a, b, d) => (Number.isFinite(+v) ? Math.min(b, Math.max(a, +v)) : d);
/** Parâmetros de layout de um cosmético (forma, padrão, cor secundária, tamanho). */
const cxp = (it) => ({ sh: _in(it && it.sh, 0, 9, 0), pt: _in(it && it.pt, 0, 9, 0), c2: it && /^#[0-9a-fA-F]{6}$/.test(it.c2) ? it.c2 : "#ffffff", sz: _ft(it && it.sz, .7, 1.5, 1) });

/** Cabeça humana: pele, rosto, cabelo, óculos, barba e acessório. Origem no centro da cabeça. */
function humanHead(lk, hairIt, accIt, helIt, M) {
  const H = new THREE.Group(), add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; H.add(m); return m; };
  const skin = LOOK.TONES[lk.t], SK = () => M(skin, { roughness: .7, metalness: 0 }), R = .44;
  const hp = cxp(hairIt), hairStyle = hairIt && hairIt.id && hairIt.id !== "r0" ? hp.sh : lk.hr, hairCol = hairIt && hairIt.id && hairIt.id !== "r0" && hairIt.col ? hairIt.col : lk.hc, HM = (c) => M(c || hairCol, { roughness: .85, metalness: 0 });
  const head = add(new THREE.SphereGeometry(R, 20, 16), SK(), 0, 0, 0); head.scale.set(1, 1.08, 1.02);
  [-1, 1].forEach((s) => add(new THREE.SphereGeometry(.09, 8, 6), SK(), s * .43, -.02, 0));   // orelhas
  // olhos
  const ew = [.065, .06, .085][lk.ey], eh = [.075, .045, .1][lk.ey];
  [-1, 1].forEach((s) => { const w = add(new THREE.SphereGeometry(ew + .02, 10, 8), M("#ffffff", { roughness: .3 }), s * .16, .05, .36); w.scale.set(1, eh / ew * .9 + .1, .45);
    const p = add(new THREE.SphereGeometry(ew * .8, 10, 8), M("#1c1410", { roughness: .2 }), s * .16, .05, .385); p.scale.set(1, 1.1, .5);
    const b = add(new THREE.BoxGeometry(.16, .028, .03), HM(), s * .16, .18, .38); b.rotation.z = s * (lk.fc == 3 ? -.1 : .12); if (lk.fc == 3) b.position.y = .21; });
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
  let hairR = .5; const cap = (r, phi, y) => { const m = add(new THREE.SphereGeometry(r, 18, 12, 0, 6.283, 0, Math.PI * phi), HM(), 0, y == null ? .04 : y, -.02); return m; };
  const sd = (() => { let s = 77; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; })();
  const curls = (n, rad, sz, front) => { for (let i = 0; i < n; i++) { const u = sd() * 2 - 1, a = sd() * 6.283, q = Math.sqrt(1 - u * u), d = new THREE.Vector3(q * Math.cos(a), Math.abs(u) * .9 + .1, q * Math.sin(a)); if (d.z > .3 && d.y < (front || .62)) continue; if (d.y < .18 && d.z > -.2 && Math.abs(d.x) < .75) continue;
      const mech = hp.pt == 1 && i % 4 == 0, m = add(new THREE.SphereGeometry(sz * (.8 + sd() * .5), 8, 6), HM(mech ? hp.c2 : null), d.x * rad, d.y * rad * 1.02, d.z * rad); m.scale.y = .95; } hairR = rad + sz + .06; };
  switch (hairStyle) {
    case 1: cap(.47, .58); break;
    case 2: cap(.48, .55); curls(34, .5, .2, .55); break;
    case 3: cap(.5, .6); curls(52, .62, .24, .5); break;
    case 4: cap(.48, .62); add(new THREE.BoxGeometry(.9, 1.25, .26), HM(), 0, -.5, -.3); [-1, 1].forEach((s) => add(new THREE.BoxGeometry(.13, .9, .3), HM(), s * .45, -.3, -.05)); break;
    case 5: cap(.47, .58); add(new THREE.SphereGeometry(.2, 10, 8), HM(), 0, .5, -.1); break;
    case 6: cap(.47, .6); { const t = add(new THREE.CylinderGeometry(.08, .04, .85, 8), HM(), 0, -.3, -.5); t.rotation.x = -.25; } add(new THREE.SphereGeometry(.09, 8, 6), HM(hp.c2), 0, .12, -.46); break;
    case 7: cap(.48, .55); for (let i = 0; i < 8; i++) { const a = -2.6 + i * .75, x = Math.sin(a) * .45, z = Math.cos(a) * .4 - .1; if (z > .2) continue; const b = add(new THREE.CylinderGeometry(.045, .03, .9, 6), HM(), x, -.4, z); b.rotation.z = Math.sin(a) * .08; add(new THREE.SphereGeometry(.06, 6, 5), HM(hp.c2), x * 1.02, -.86, z); } break;
    case 8: cap(.45, .5); { const m = add(new THREE.BoxGeometry(.13, .38, .95), HM(), 0, .45, -.05); } break;
    case 9: cap(.48, .55); for (let i = 0; i < 16; i++) { const a = -2.7 + i * .35, x = Math.sin(a) * .47, z = Math.cos(a) * .42 - .08; if (z > .22) continue; const b = add(new THREE.CylinderGeometry(.05, .035, .8 + (i % 3) * .2, 5), HM(), x, -.4, z); b.rotation.z = Math.sin(a) * .1; } break;
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
  if (lk.hg || (has && hp2.sh == 0)) { const r = Math.max(.62, hairR + .1); const g = add(new THREE.SphereGeometry(r, 20, 14), M(has ? hc : "#aee4ff", { transparent: true, opacity: has ? .28 : .16, roughness: .05, metalness: .3, depthWrite: false, emissive: hglow || "#000", emissiveIntensity: hglow ? .4 : 0 }), 0, .04, 0); g.castShadow = false; add(new THREE.TorusGeometry(r * .78, .06, 8, 22), HLM(), 0, -.5, 0).rotation.x = Math.PI / 2; }
  return H;
}

/** Customização de layout do traje: corte e padrões. */
function decoSuit(g, torso, arms, suit, M) {
  const p = cxp(suit), c2 = p.c2; const k = [1, .88, 1.14, 1][p.sh] || 1; torso.scale.x *= k; torso.scale.z *= k; arms.forEach((a) => { a.position.x *= k; a.scale.x = k; });
  const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; }, AM = M(c2, { emissive: suit.glow || "#000", emissiveIntensity: suit.glow ? .3 : 0 });
  if (p.sh == 3) [-1, 1].forEach((s) => add(new THREE.BoxGeometry(.28, .3, .12), AM, s * .24, 1.55, .56));
  switch (p.pt) {
    case 1: add(new THREE.BoxGeometry(1.02, .22, .06), AM, 0, 2.05, .5).scale.set(1, 1, 1); break;
    case 2: [-1, 1].forEach((s) => add(new THREE.SphereGeometry(.26, 10, 8), AM, s * .62 * k, 2.3, 0).scale.set(1, .7, 1)); break;
    case 3: { const t = add(new THREE.TorusGeometry(.53 * k, .06, 6, 20), AM, 0, 1.3, 0); t.rotation.x = Math.PI / 2; break; }
    case 4: { const t = add(new THREE.TorusGeometry(.38, .09, 8, 18), AM, 0, 2.37, 0); t.rotation.x = Math.PI / 2; break; }
    case 5: arms.forEach((a) => { [-.45, -.7].forEach((y) => { const t = new THREE.Mesh(new THREE.TorusGeometry(.18, .03, 6, 14), AM); t.rotation.x = Math.PI / 2; t.position.y = y; a.add(t); }); }); break;
    case 6: add(new THREE.CircleGeometry(.17, 18), M(suit.glow || c2, { emissive: suit.glow || c2, emissiveIntensity: .8 }), -.25, 2.05, .56); break;
    case 7: [-.12, .12].forEach((x) => add(new THREE.BoxGeometry(.07, 1.1, .05), AM, x, 1.75, .56)); break;
    default: break;
  }
}
function decoPants(legs, item, M) {
  const p = cxp(item); legs.forEach((l, i) => { const m = l.children[0], s = i ? 1 : -1;
    if (p.sh == 1) { m.geometry = new THREE.CylinderGeometry(.22, .36, 1, 10); } else if (p.sh == 2) m.scale.x = m.scale.z = .82; else if (p.sh == 3) { m.geometry = new THREE.CylinderGeometry(.23, .22, .55, 8); m.position.y = -.28; const sock = new THREE.Mesh(new THREE.CylinderGeometry(.17, .17, .45, 8), M(p.c2)); sock.position.y = -.77; l.add(sock); }
    if (p.pt == 1) { const st = new THREE.Mesh(new THREE.BoxGeometry(.05, .9, .08), M(p.c2)); st.position.set(s * .22, -.5, 0); l.add(st); } else if (p.pt == 2) { const kn = new THREE.Mesh(new THREE.SphereGeometry(.15, 8, 6), M(p.c2)); kn.position.set(0, -.55, .16); l.add(kn); } });
}
/** Mochila: formas variadas (caixa, redonda, tanques, asas, grande) e tamanho. */
function decoPack(g, pack, item, M, col, glow) {
  const p = cxp(item); if (!item || !item.id || item.id === "b0") { pack.scale.setScalar(p.sz); return; }
  const mat = M(col || "#b9bcc4", { emissive: glow || "#000", emissiveIntensity: glow ? .5 : 0 }), add = (geo, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; };
  if (p.sh == 1) { pack.geometry = new THREE.SphereGeometry(.55, 14, 10); } else if (p.sh == 2) { pack.visible = false; [-.25, .25].forEach((x) => add(new THREE.CylinderGeometry(.2, .2, 1.1, 10), x, 1.8, -.6)); } else if (p.sh == 3) { [-1, 1].forEach((s) => { const w = add(new THREE.BoxGeometry(.05, 1.2, .8), s * .55, 2.1, -.7); w.rotation.set(.2, 0, s * .5); w.material = M(p.c2, { emissive: glow || p.c2, emissiveIntensity: .6, transparent: true, opacity: .8 }); }); } else if (p.sh == 4) pack.scale.set(1.25, 1.15, 1.3);
  if (p.pt == 1) add(new THREE.CylinderGeometry(.02, .02, .8, 5), .3, 2.6, -.7); else if (p.pt == 2) add(new THREE.SphereGeometry(.1, 8, 6), 0, 1.3, -.95).material = M("#ff3030", { emissive: "#ff2020", emissiveIntensity: 1.4 });
  pack.scale.multiplyScalar(p.sz);
}
function decoWatch(k, item) { const p = cxp(item); if (p.sh == 1) { k.geometry = new THREE.CylinderGeometry(.16, .16, .1, 14); k.rotation.z = Math.PI / 2; } else if (p.sh == 2) k.scale.set(1.2, .7, 1.25); k.scale.multiplyScalar(p.sz); }

/** Painel "Aparência" do guarda-roupa: tipo de pessoa, cabelo, rosto, corpo. Atualiza o boneco na hora. */
function lookPanel(pv) {
  const wi = $("#wi"), L = () => P.look || (P.look = lookNorm());
  const set = (o) => { Object.assign(L(), o); P.look = lookNorm(P.look); saveP(); pv.setObj(av(Object.assign({}, myEq(), WTRY || {})), 0); draw(); };
  const opts = (key, names) => `<div class="row" style="flex-wrap:wrap">${names.map((n, i) => `<button class="${L()[key] == i ? "sel" : ""}" data-k="${key}" data-v="${i}">${n}</button>`).join("")}</div>`;
  const draw = () => {
    const l = L();
    wi.innerHTML = `<div style="grid-column:1/-1">${P.sp == "alien" ? `<p class="mu">👽 Aparência humana só vale para a espécie humana (alienígenas escolhem a cor da pele ao lado).</p>` : ""}
    <b>Tom de pele</b><div class="row" style="flex-wrap:wrap;margin:6px 0">${LOOK.TONES.map((c, i) => `<button data-k="t" data-v="${i}" class="${l.t == i ? "sel" : ""}" style="width:38px;height:38px;padding:0;border-radius:50%;background:${c}"></button>`).join("")}</div>
    <b>Cabelo</b>${opts("hr", LOOK.HAIRS)}<b style="display:block;margin-top:8px">Cor do cabelo</b><div class="row" style="flex-wrap:wrap;margin:6px 0">${LOOK.HCOLS.map((c) => `<button data-k="hc" data-s="${c}" class="${l.hc == c ? "sel" : ""}" style="width:34px;height:34px;padding:0;border-radius:50%;background:${c}"></button>`).join("")}<input type="color" id="lkc" value="${l.hc}" title="Cor personalizada" style="width:44px;height:34px"></div>
    <b>Rosto</b>${opts("fc", LOOK.FACES)}<b style="display:block;margin-top:8px">Olhos</b>${opts("ey", LOOK.EYES)}<b style="display:block;margin-top:8px">Óculos</b>${opts("gl", LOOK.GLASS)}<b style="display:block;margin-top:8px">Barba</b>${opts("br", LOOK.BEARDS)}
    <b style="display:block;margin-top:8px">Corpo</b>${opts("bd", LOOK.BUILDS)}<b style="display:block;margin-top:8px">Altura</b>${opts("ht", LOOK.HEIGHTS)}
    <b style="display:block;margin-top:8px">Capacete de vidro</b>${opts("hg", ["Sem (rosto livre)", "Com bolha de vidro"])}
    <div class="row" style="margin-top:12px"><button id="lkr">🎲 Aleatório</button><button id="lkd">Padrão</button></div><small class="mu">Grátis e pode mudar a qualquer momento. Cabelos e acessórios especiais ficam nas outras abas.</small></div>`;
    wi.querySelectorAll("[data-k]").forEach((b) => (b.onclick = () => set({ [b.dataset.k]: b.dataset.s ? b.dataset.s : +b.dataset.v })));
    $("#lkc").oninput = (e) => { Object.assign(L(), { hc: e.target.value }); P.look = lookNorm(P.look); saveP(); pv.setObj(av(Object.assign({}, myEq(), WTRY || {})), 0); };
    $("#lkr").onclick = () => set(lookRandom(Math.floor(Math.random() * 1e6))); $("#lkd").onclick = () => set(LOOK.DEF);
  };
  draw();
}
