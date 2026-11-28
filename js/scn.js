/* Cenários jogáveis: ligam o NOME da fase à MISSÃO.
   • Missão a Fobos  — você pilota o foguete de verdade até Fobos e trabalha lá (amostras, módulos, foguete).
   • Tubos de Lava   — há uma entrada real; você entra no tubo, coleta gelo, inspeciona o basalto, pressuriza habitats e chega à câmara.
   • Luzes sobre Tharsis — naves em órbita mandam mensagens, descem em estações de pouso que você constrói e deixam novos habitantes. */
const SCNO = new THREE.Group(); sc.add(SCNO);
let NAVMISSION = null, SCN_FLOWN = false;
const SM = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .6, metalness: .25 }, o || {}));
const sdist = (o) => Math.hypot(o.x - PL.x, o.z - PL.z);
const siteH = (x, z) => H(x, z);

/** Objeto interativo do cenário. */
function sObj(o) { G.scn.objs.push(o); if (o.m) { o.m.position.set(o.x, o.y != null ? o.y : siteH(o.x, o.z), o.z); SCNO.add(o.m); if (o.label) { const l = lab(o.label, { col: o.col || "#ffe9a0" }); l.scale.set(6.4, 1.2, 1); l.position.set(0, o.ly || 4.2, 0); o.m.add(l); } } return o; }
const sNear = () => { if (!G.scn || FL || DR || IN || DLG) return null; let b = null, d = 1e9; G.scn.objs.forEach((o) => { if (o.off || !o.use) return; const q = sdist(o); if (q < (o.r || 6) && q < d) { d = q; b = o; } }); return b; };
function sRemove(o) { o.off = true; if (o.m) SCNO.remove(o.m); }
function sDialog(icon, title, text, opts, after) {   // diálogo de rádio/cenário
  DLG = { scn: 1 }; G.paused = true;
  $("#dlgb").innerHTML = (`<div class="dlgh"><div class="av">${icon}</div><div><b>${esc(title)}</b></div></div><p>${text}</p><div class="opts">${opts.map((o, i) => `<button data-o="${i}" ${o.dis ? "disabled" : ""}>${esc(o.t)}</button>`).join("")}</div>`); $("#dlg").classList.add("on");
  $("#dlgb").querySelectorAll("[data-o]").forEach((b) => (b.onclick = () => { const o = opts[+b.dataset.o]; closeDlg(); if (o.f) o.f(); if (after) after(o); }));
}
const MKSM = (type, x, z) => { const m = mk(type, S.color); return m; };

// =============================================================================================
// FOBOS: voo real com o foguete (reaproveita o voo da fase 1) e depois a base em Fobos
// =============================================================================================
function scnFlight(ph) {
  NAVMISSION = { ph }; PH[ph].nav = 1; navStart(ph);
  if (N && N.earth) { N.earth.material.color.set(0x8a8580); N.earth.material.emissive.set(0x151515); N.earth.scale.set(.5, .38, .44); N.earth.geometry = new THREE.IcosahedronGeometry(40, 1); }
  if (N && N.mars) N.mars.position.y = 10;
  toast("🚀 <b>Missão a Fobos</b>: pilote o foguete de Marte até a lua. Desvie dos asteroides e chegue com casco e combustível.", 6000);
}
const _navEndS = navEnd;
navEnd = function (ok, q, why) {
  if (!NAVMISSION) return _navEndS(ok, q, why);
  const ph = NAVMISSION.ph; G.run = false; delete PH[ph].nav;
  if (!ok) { NAVMISSION = null; G.why = why; end(false); $("#rp").textContent = why + ". Tente de novo."; return; }
  NAVMISSION = null; SCN_FLOWN = true; toast("🌑 Pouso em Fobos concluído! Agora monte a base e cumpra as tarefas da missão.", 5500); start("solo", ph);
};
const _navHudS = navHud;
navHud = function () { _navHudS(); if (NAVMISSION) $("#gl").innerHTML = "<b>Marte → Fobos</b><div>Pilote o foguete (WASD/setas ou arraste). Segure Impulso (Espaço) para acelerar gastando combustível. Colete as esferas verdes (recarregam combustível) e desvie dos asteroides até alcançar Fobos.</div>"; };
const _menuS = menu; menu = function () { if (NAVMISSION) { delete PH[NAVMISSION.ph].nav; NAVMISSION = null; } return _menuS.apply(this, arguments); };

function beginPhobos(ph) {
  const sc0 = G.scn; sc0.s = 0; sc0.mod = 0; sc0.loaded = false;
  const rk = sObj({ kind: "rocket", x: -2, z: -14, r: 8, m: mk("rocket", S.color), label: "Foguete ARES · E", ly: 11.5, use: () => {
    if (!(sc0.s >= 5 && sc0.mod >= 3)) return sDialog("🚀", "Foguete ARES", `Ainda faltam tarefas em Fobos:<br>• Amostras de regolito: <b>${sc0.s}/5</b><br>• Módulos instalados: <b>${sc0.mod}/3</b><br>Cumpra-as e volte aqui para carregar as amostras para a Terra.`, [{ t: "Ok" }]);
    if (sc0.loaded) return toast("As amostras já estão a bordo ✔");
    sDialog("🚀", "Carregar amostras", "Carregar as amostras de regolito no foguete e preparar a decolagem de retorno?", [{ t: "Carregar", f: () => { sc0.loaded = true; const v = Math.round(earn(180 + ph * 6)); P.rp += 12; saveP(); save(); toast(`🧪 Amostras a bordo! +${v} 🪙 +12 RP`, 4500); } }, { t: "Depois" }]); } });
  rk.m.scale.setScalar(1.1);
  for (let i = 0; i < 5; i++) { let x, z, k = 0; do { const a = Math.random() * 6.283, r = 18 + Math.random() * 70; x = Math.cos(a) * r; z = Math.sin(a) * r; k++; } while (k < 30 && Math.hypot(x + 58, z + 46) < 44);
    const m = new THREE.Group(); m.add(new THREE.Mesh(new THREE.OctahedronGeometry(.8), new THREE.MeshBasicMaterial({ color: 0xc8ff5a }))); const lg = new THREE.PointLight(0xc8ff5a, .8, 8); lg.position.y = 1.4; m.add(lg); m.children[0].position.y = 1.4;
    const o = sObj({ kind: "sample", x, z, r: 3, m, label: "Regolito", ly: 3.2, col: "#c8ff5a", auto: true });
    o.use = () => { if (o.off) return; sRemove(o); sc0.s++; const v = Math.round(earn(14 + ph)); toast(`🧪 Amostra ${sc0.s}/5: +${v} 🪙`, 2400); }; }
  [["fuel", "Depósito de combustível", 60, 18, -22], ["ant", "Antena de comunicação", 50, -22, -26], ["solar", "Painéis solares", 40, 8, -34]].forEach(([type, name, cost, x, z]) => {
    const pad = new THREE.Group(); pad.add(new THREE.Mesh(new THREE.TorusGeometry(3.4, .14, 6, 32), new THREE.MeshBasicMaterial({ color: 0x4fe8ff }))); pad.children[0].rotation.x = Math.PI / 2; pad.children[0].position.y = .3;
    const o = sObj({ kind: "module", x, z, r: 6, m: pad, label: `Instalar: ${name} · ${cost} 🪙`, ly: 3.4, col: "#9fe8ff" });
    o.use = () => { if (S.coins < cost) return toast(`Faltam moedas (${cost} 🪙)`); S.coins -= cost; save(); const b = mk(type, S.color); b.position.set(x, siteH(x, z), z); SCNO.add(b); sRemove(o); sc0.mod++; P.rp += 3; saveP(); toast(`🛠 ${name} instalado (${sc0.mod}/3) +3 RP`, 3000); if (type === "fuel" && G.tk) G.tk.fuel = clamp(G.tk.fuel + 15, 0, 100); };
  });
  sc0.goals = () => { const ok = (a, b) => a >= b; return { done: sc0.s >= 5 && sc0.mod >= 3 && sc0.loaded, html: `<div class="tag" style="margin-top:6px">Missão a Fobos</div><div class="${ok(sc0.s, 5) ? "dn" : ""}">${ok(sc0.s, 5) ? "✔" : "○"} Amostras de regolito ${sc0.s}/5</div><div class="${ok(sc0.mod, 3) ? "dn" : ""}">${ok(sc0.mod, 3) ? "✔" : "○"} Módulos instalados ${sc0.mod}/3</div><div class="${sc0.loaded ? "dn" : ""}">${sc0.loaded ? "✔" : "○"} Carregar amostras no foguete (E)</div><small class="mu">Pule com Espaço · gravidade baixa</small>` }; };
  toast("🌑 Você está em <b>Fobos</b>. Marte gigante no céu. <b>Espaço</b> faz saltos de baixa gravidade.", 6500);
}

// =============================================================================================
// TUBOS DE LAVA: entrada real, tubo de caverna, gelo, basalto, habitats pressurizados e câmara selada
// =============================================================================================
function beginTube(ph) {
  const sc0 = G.scn; Object.assign(sc0, { inside: false, ice: 0, geo: 0, hab: 0, chamber: false, tubeObjs: [], mars: [] });
  const arch = new THREE.Group(); arch.add(new THREE.Mesh(new THREE.TorusGeometry(7, 1.6, 8, 24, Math.PI), SM(0x2a1f1b, { roughness: 1 }))); arch.children[0].position.y = 0; const gl = new THREE.Mesh(new THREE.TorusGeometry(5.4, .2, 6, 24, Math.PI), new THREE.MeshBasicMaterial({ color: 0xffb070 })); arch.add(gl);
  [-7, 7].forEach((x) => { const p = new THREE.Mesh(new THREE.BoxGeometry(3, 8, 3), SM(0x2a1f1b, { roughness: 1 })); p.position.set(x, 1, 0); arch.add(p); });
  const dark = new THREE.Mesh(new THREE.CircleGeometry(5.4, 24, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0x000000 })); arch.add(dark);
  sObj({ kind: "enter", x: 0, z: -58, r: 9, m: arch, label: "Entrada do tubo de lava · E", ly: 11, col: "#ffb070", use: () => enterTube() });
  const ex = { kind: "exit", x: 0, z: -122, r: 8, off: true }; sc0.exitObj = ex;
  sc0.goals = () => { const ok = (a, b) => a >= b; return { done: sc0.ice >= 5 && sc0.geo >= 3 && sc0.hab >= 3 && sc0.chamber, html: `<div class="tag" style="margin-top:6px">Tubos de Lava</div><div class="${sc0.inside || sc0.chamber ? "dn" : ""}">${sc0.inside || sc0.chamber ? "✔" : "○"} Entre no tubo (arco ao norte)</div><div class="${ok(sc0.ice, 5) ? "dn" : ""}">${ok(sc0.ice, 5) ? "✔" : "○"} Amostras de gelo ${sc0.ice}/5</div><div class="${ok(sc0.geo, 3) ? "dn" : ""}">${ok(sc0.geo, 3) ? "✔" : "○"} Camadas de basalto inspecionadas ${sc0.geo}/3</div><div class="${ok(sc0.hab, 3) ? "dn" : ""}">${ok(sc0.hab, 3) ? "✔" : "○"} Habitats pressurizados ${sc0.hab}/3</div><div class="${sc0.chamber ? "dn" : ""}">${sc0.chamber ? "✔" : "○"} Alcançar a câmara selada</div>` }; };
  toast("🕳 <b>Tubos de Lava</b>: vá até o arco escuro ao norte e entre no tubo de verdade (E).", 6500);
}
function enterTube() {
  const sc0 = G.scn; if (ENV.tube) return; sc0.inside = true; setEnv("tube"); G.placed.forEach((p) => (p.m.visible = false)); colG.visible = false; UFOS.visible = false; SCNO.children.forEach((c) => (c.userData.surf = c.visible)); sc0.objs.forEach((o) => { if (!o.tube && o.m) o.m.visible = false; });
  PL.x = 0; PL.z = -118; PL.g.position.set(0, H(0, -118), -118); PL.ry = 0; yaw = Math.PI; pit = .42; dist = 11; $("#pal").style.display = "none";
  sc0.tubeObjs.forEach((o) => { o.off = false; if (o.m) o.m.visible = true; }); if (!sc0.built) { sc0.built = true; buildTubeContent(); } else sc0.tubeObjs.forEach((o) => { if (o.m) o.m.visible = !o.done; });
  sc0.exitObj.off = false; toast("🕳 Dentro do <b>tubo de lava</b>: basalto, gelo e silêncio. A luz acompanha você; clarabóias iluminam o caminho.", 6000);
}
function exitTube() {
  const sc0 = G.scn; setEnv("mars"); sc0.inside = false; G.placed.forEach((p) => (p.m.visible = true)); colG.visible = true; sc0.objs.forEach((o) => { if (o.m) o.m.visible = !o.tube && !o.off || (o.tube ? false : o.m.visible); }); sc0.tubeObjs.forEach((o) => { if (o.m) o.m.visible = false; o.off = true; }); sc0.exitObj.off = true;
  PL.x = 0; PL.z = -48; PL.g.position.set(0, H(0, -48), -48); yaw = .8; pit = .75; dist = 40; $("#pal").style.display = ""; toast("☀ De volta à superfície", 2500);
}
function buildTubeContent() {
  const sc0 = G.scn, add = (o) => { o.tube = true; sc0.tubeObjs.push(o); return o; };
  const ex = sc0.exitObj; ex.m = new THREE.Group(); const rg = new THREE.Mesh(new THREE.TorusGeometry(3.4, .15, 6, 28), new THREE.MeshBasicMaterial({ color: 0xffb070 })); ex.m.add(rg); ex.label = "Saída para a superfície · E"; ex.use = () => exitTube(); sObj(ex); ex.m.position.y = H(0, -122) + 3.4; ex.tube = true; ex.m.children[0].rotation.y = 0; sc0.tubeObjs.push(ex);
  for (let i = 0; i < 5; i++) { const x = (Math.random() - .5) * 12, z = -80 + i * 38 + Math.random() * 10, m = new THREE.Group(), c = new THREE.Mesh(new THREE.OctahedronGeometry(1), new THREE.MeshBasicMaterial({ color: 0x7fd8ff })); c.scale.set(.7, 1.7, .7); c.position.y = 1.3; m.add(c); const lg = new THREE.PointLight(0x7fd8ff, .9, 9); lg.position.y = 1.6; m.add(lg);
    const o = add({ kind: "ice", x, z, r: 3, m, label: "Gelo", ly: 3.4, col: "#7fd8ff" }); sObj(o); o.use = () => { o.done = true; sRemove(o); sc0.ice++; const v = Math.round(earn(18 + G.ph)); if (G.tk) G.tk.water = clamp(G.tk.water + 6, 0, 100); toast(`🧊 Gelo coletado ${sc0.ice}/5: +${v} 🪙 · +6% Água`, 2600); }; }
  ["Camada de basalto A", "Camada de basalto B", "Camada de basalto C"].forEach((nm, i) => { const m = new THREE.Group(), post = new THREE.Mesh(new THREE.BoxGeometry(.3, 3, .3), SM(0xe8b923)); post.position.y = 1.5; m.add(post); const o = add({ kind: "geo", x: (i % 2 ? 6 : -6), z: -60 + i * 70, r: 5, m, label: nm + " · E", ly: 4, col: "#ffe08a" }); sObj(o);
    o.use = () => { o.done = true; sRemove(o); sc0.geo++; P.rp += 3; saveP(); toast(`🪨 ${nm} inspecionada (${sc0.geo}/3): basalto com 50 m de cobertura · +3 RP`, 3500); }; });
  [[-70, "Habitat pressurizado 1", 70], [0, "Habitat pressurizado 2", 70], [70, "Habitat pressurizado 3", 70]].forEach(([z, nm, cost]) => { const m = new THREE.Group(), r = new THREE.Mesh(new THREE.TorusGeometry(3.4, .14, 6, 32), new THREE.MeshBasicMaterial({ color: 0x4fe8ff })); r.rotation.x = Math.PI / 2; r.position.y = .3; m.add(r);
    const o = add({ kind: "hab", x: 0, z, r: 6, m, label: `${nm} · ${cost} 🪙`, ly: 3.4, col: "#9fe8ff" }); sObj(o);
    o.use = () => { if (S.coins < cost) return toast(`Faltam moedas (${cost} 🪙)`); S.coins -= cost; save(); const b = mk("hab", S.color); b.position.set(0, H(0, z), z); SCNO.add(b); b.userData.tube = 1; sc0.tubeObjs.push({ m: b, off: false, tube: true, done: true }); sRemove(o); sc0.hab++; if (G.tk) G.tk.morale = clamp(G.tk.morale + 8, 0, 100); P.rp += 4; saveP(); toast(`🏠 ${nm} instalado (${sc0.hab}/3): ar pressurizado, protegido por basalto.`, 3500); }; });
  const ch = new THREE.Group(), door = new THREE.Mesh(new THREE.TorusGeometry(5, .35, 8, 30), new THREE.MeshBasicMaterial({ color: 0x66ffcc })); ch.add(door); const lgc = new THREE.PointLight(0x66ffcc, 1.2, 24); lgc.position.y = 3; ch.add(lgc);
  const o = add({ kind: "chamber", x: 0, z: 112, r: 9, m: ch, label: "Câmara selada · E", ly: 7, col: "#66ffcc" }); sObj(o); ch.position.y = H(0, 112) + 5;
  o.use = () => { if (sc0.chamber) return toast("Câmara já alcançada ✔"); sc0.chamber = true; const v = Math.round(earn(120 + G.ph * 4)); P.rp += 8; saveP(); sDialog("🕳", "Câmara selada", "Você alcançou o fim do tubo: uma câmara intacta, de ar estável e temperatura constante. Um lugar perfeito para uma cidade pressurizada.", [{ t: "Incrível!" }]); toast(`🕳 Câmara alcançada: +${v} 🪙 +8 RP`, 3500); };
}

// =============================================================================================
// LUZES SOBRE THARSIS: naves, mensagens, estações de pouso e novos habitantes
// =============================================================================================
function beginTharsis(ph) {
  const sc0 = G.scn; Object.assign(sc0, { t: 0, msgs: 0, replies: 0, landed: 0, hosted: 0, ships: [], nextMsg: 14 });
  const names = ["Kirel", "Ovanu", "Thessa"]; UFOS.children.forEach((u, i) => { u.userData.ctl = false; sc0.ships.push({ u, st: "orbit", name: names[i] || "Nave " + (i + 1), pad: null, t: 0, host: false, o: null }); });
  const pads = () => G.placed.filter((p) => p.t === "pad");
  const shipObj = (s) => sObj({ kind: "ship", x: 0, z: 0, r: 11, off: true, ship: s, use: () => talkShip(s) });
  sc0.ships.forEach((s) => { s.o = shipObj(s); s.o.m = null; });
  function pos(s, x, y, z) { s.u.position.set(x, y, z); s.o.x = x; s.o.z = z; }
  function talkShip(s) {
    if (s.st !== "landed") return;
    sDialog("🛸", `Nave ${s.name}`, s.host ? "Os visitantes já desceram. A tripulação agradece a acolhida e acena em silêncio." : `A nave <b>${s.name}</b> pousou na estação. A escotilha se abre: visitantes pedem para descer e conhecer a colônia.<br><small class="mu">Habitats: ${cnt("hab")} (recomendado: ${2 + sc0.landed})</small>`,
      s.host ? [{ t: "Ok" }] : [{ t: "👋 Receber os visitantes", f: () => hostShip(s) }, { t: "Pedir um instante" }]);
  }
  function hostShip(s) {
    const need = 2 + sc0.landed; if (cnt("hab") < need) { toast(`🏠 Habitats insuficientes (${cnt("hab")}/${need}). Construa mais habitats antes de receber visitantes.`, 4500); return; }
    s.host = true; sc0.hosted += 3; const x = s.o.x, z = s.o.z;
    for (let i = 0; i < 3; i++) setTimeout(() => { if (!G.run) return; spawnAt(x + (i - 1) * 2.5, z + 6, i !== 2); }, i * 900);
    G.tk.morale = clamp(G.tk.morale + 10, 0, 100); G.st.contact += 2; const v = Math.round(earn(60 + ph * 3)); P.rp += 6; saveP(); save(); toast(`👽 Três novos habitantes descem da nave ${s.name}! +${v} 🪙 +6 RP`, 5000); setTimeout(() => { if (s.st === "landed") s.st = "depart", s.t = 0; }, 18000);
  }
  function spawnAt(x, z, alien) { const g = mkColonist(3000 + Math.floor(Math.random() * 9000) + (alien ? 5000 : 0), alien); g.position.set(x, H(x, z), z); colG.add(g); COL.push({ g, x, z, tx: x + (Math.random() - .5) * 20, tz: z + 8 + Math.random() * 14, wait: 0, alien, info: g.userData.info, mood: 85 }); }
  const msg = (n) => ([
    ["📡", "Mensagem de uma frota desconhecida", "“Saudações, povo de Marte. Estamos em órbita sobre Tharsis. Não viemos em guerra. Pedimos permissão para nos aproximar.”<br><small class='mu'>Como você responde?</small>", [{ t: "🕊 Boas-vindas em paz", f: () => { G.tk.morale = clamp(G.tk.morale + 8, 0, 100); sc0.replies++; toast("Resposta enviada: vocês são bem-vindos.", 3000); } }, { t: "🤔 Pedir mais informações", f: () => { sc0.replies++; G.tk.eff = clamp(G.tk.eff + 4, 0, 100); toast("Resposta enviada: aguardamos detalhes.", 3000); } }, { t: "📵 Silêncio de rádio", f: () => { G.tk.morale = clamp(G.tk.morale - 5, 0, 100); sc0.replies++; toast("A frota aguarda em silêncio…", 3000); } }]],
    ["📡", "Pedido de descida", "“Precisamos de uma <b>estação de pouso</b> segura para descer. Se houver uma plataforma pronta e energia, desceremos devagar.”<br><small class='mu'>Construa ao menos 1 <b>Estação de pouso</b> (peça no painel). Cada nave usa uma estação.</small>", [{ t: "Entendido: vou preparar", f: () => { sc0.replies++; } }]],
    ["📡", "Troca de saberes", "“Podemos ensinar a captar energia do vento solar, se vocês nos ensinarem a cultivar plantas sob cúpulas. Aceitam?”", [{ t: "Aceitar a troca", f: () => { sc0.replies++; G.tk.eff = clamp(G.tk.eff + 10, 0, 100); G.tk.food = clamp(G.tk.food + 10, 0, 100); toast("Troca de saberes: +10% Eficiência e +10% Comida", 3500); } }, { t: "Agradecer e recusar", f: () => { sc0.replies++; } }]],
  ][n]);
  sc0.tick = (dt) => {
    sc0.t += dt; if (sc0.msgs < 3 && sc0.t >= sc0.nextMsg && !DLG && !IN && !DR && !FL) { const m = msg(sc0.msgs); sc0.msgs++; sc0.nextMsg = sc0.t + 40; sDialog(m[0], m[1], m[2], m[3]); }
    const free = pads().filter((p) => !sc0.ships.some((s) => s.pad === p && s.st !== "orbit"));
    sc0.ships.forEach((s, i) => { const u = s.u;
      if (s.st === "orbit") { u.userData.ctl = false; if (sc0.msgs >= 1 && free.length && !sc0.ships.some((q) => q !== s && (q.st === "descend")) && s.t >= 0 && sc0.t > 20 + i * 30) { const p = free.shift(); s.pad = p; s.st = "descend"; s.t = 0; u.userData.ctl = true; s.from = u.position.clone(); toast(`🛸 A nave ${s.name} inicia a descida para a estação de pouso!`, 4000); } else s.t += dt; }
      else if (s.st === "descend") { s.t += dt; const k = clamp(s.t / 10, 0, 1), e = k * k * (3 - 2 * k), px = s.pad.m.position.x, pz = s.pad.m.position.z; pos(s, s.from.x + (px - s.from.x) * e, s.from.y + (H(px, pz) + 3.6 - s.from.y) * e, s.from.z + (pz - s.from.z) * e); u.rotation.y += dt * (1 - k) * 2; if (k >= 1) { s.st = "landed"; s.t = 0; sc0.landed++; s.o.off = false; const v = Math.round(earn(80 + ph * 3)); toast(`🛸 Nave ${s.name} pousou! (${sc0.landed}/3) +${v} 🪙 · fale com ela (E)`, 5000); } }
      else if (s.st === "depart") { s.t += dt; const k = clamp(s.t / 9, 0, 1), px = s.pad.m.position.x, pz = s.pad.m.position.z; pos(s, px + k * 30, H(px, pz) + 3.6 + k * k * 44, pz); u.rotation.y += dt * k * 3; s.o.off = true; if (k >= 1) { s.st = "orbit"; s.t = -60; u.userData.ctl = false; s.pad = null; s.host = false; if (sc0.landed < 3) toast(`🛸 ${s.name} volta à órbita e retornará em breve.`, 3000); } }
    });
  };
  sc0.goals = () => { const np = pads().length, ok = (a, b) => a >= b, l = (c, t) => `<div class="${c ? "dn" : ""}">${c ? "✔" : "○"} ${t}</div>`;
    return { done: sc0.landed >= 3 && sc0.hosted >= 6 && sc0.replies >= 3 && np >= 2, html: `<div class="tag" style="margin-top:6px">Luzes sobre Tharsis</div>${l(ok(sc0.replies, 3), `Responder às mensagens ${Math.min(3, sc0.replies)}/3`)}${l(ok(np, 2), `Estações de pouso ${Math.min(2, np)}/2`)}${l(ok(sc0.landed, 3), `Naves recebidas ${sc0.landed}/3`)}${l(ok(sc0.hosted, 6), `Novos habitantes acolhidos ${Math.min(6, sc0.hosted)}/6`)}` }; };
  toast("🛸 <b>Luzes sobre Tharsis</b>: uma frota entra em órbita. Fique atento às mensagens de rádio e construa <b>Estações de pouso</b>.", 7000);
}

// =============================================================================================
// ligação com o jogo
// =============================================================================================
const _startScn = start;
start = function (mode, ph) {
  const sc0 = PH[ph] && PH[ph].scn;
  if (mode === "solo" && sc0 && sc0.id === "phobos" && !SCN_FLOWN) return scnFlight(ph);
  SCN_FLOWN = false; scnClear(); _startScn(mode, ph);
  if (mode === "solo" && sc0 && G.run) { G.scn = { id: sc0.id, objs: [] }; ({ phobos: beginPhobos, tube: beginTube, tharsis: beginTharsis })[sc0.id](ph); }
};
function scnClear() { while (SCNO.children.length) SCNO.remove(SCNO.children[0]); }
const _clearScn = clear; clear = function () { _clearScn(); scnClear(); };
const _tickScn = tick; tick = function (dt) { _tickScn(dt); if (G.run && G.scn && G.mode === "solo") { if (G.scn.tick) G.scn.tick(dt);
  G.scn.objs.forEach((o) => { if (o.auto && !o.off && !FL && !DR && sdist(o) < (o.r || 3)) o.use(); }); } };
const _goalsScn = goals; goals = function () { const ok = _goalsScn(); if (!G.scn || !G.scn.goals) return ok; const g = G.scn.goals(); $("#gl").innerHTML += g.html; return ok && g.done; };
const _onEScn = INP.onE; INP.onE = function () { if (G.run && G.scn && !FL && !DR && !IN && !DLG) { const o = sNear(); if (o && !o.auto) return o.use(); } _onEScn(); };
const _hudScn = hud; hud = function () { _hudScn(); if (!G.run || !G.scn || G.mode === "nav" || FL || DR || IN || DLG) return; const o = sNear(); if (o && !o.auto) { setHint($("#hint"), `${TOUCH ? "Toque no botão" : "E"} · ${(o.label || "interagir").replace(/ · E$/, "")}`); setAct(TOUCH ? "Interagir" : ""); } };
// dentro do tubo de lava não dá para construir nem falar com colonos da superfície
const _placeScn = place; place = function (x, z) { if (ENV.tube) return toast("Dentro do tubo use os módulos de instalação (anéis azuis)", 3000); _placeScn(x, z); };
const _nbScn = nearestBuilding; nearestBuilding = function (r) { return ENV.tube ? null : _nbScn(r); };
const _ncScn = nearestColonist; nearestColonist = function () { return ENV.tube ? null : _ncScn(); };
const _nrScn = nearestRover; nearestRover = function (r) { return ENV.tube ? null : _nrScn(r); };
