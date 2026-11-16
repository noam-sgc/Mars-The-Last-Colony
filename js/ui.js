/* Interface: conta, menu, catálogo, loja, guarda-roupa, social (amigos/grupo) e chat. */
const SOC = { friends: [], reqIn: [], reqOut: [], users: [], party: null, dm: {} };
const vfBadge = (role, vf) => (role == "admin" || role == "artist" ? '<span class="vf adm" title="Administrador verificado">✔</span>' : vf ? '<span class="vf" title="Verificado (amigo de administrador)">✔</span>' : "");
const roleChip = (role) => (role == "artist" ? '<span class="chip artist">ADM · ARTE</span>' : role == "admin" ? '<span class="chip">ADM</span>' : "");
const userHTML = (u) => `${MarsRules.flag(u.cc)} ${esc(u.u)}${vfBadge(u.role, u.vf)}${roleChip(u.role)}`;
const openModal = (html) => { $("#admb").innerHTML = html; $("#adm").classList.add("on"); };
const closeModal = () => { $("#adm").classList.remove("on"); if (window.studioStop) studioStop(); };
$("#adm").addEventListener("pointerdown", (e) => { if (e.target.id == "adm") closeModal(); });

// ---------- conta ----------
function ctry(sel) { return MarsRules.COUNTRIES.map((c) => `<option value="${c.c}" ${c.c == sel ? "selected" : ""}>${MarsRules.flag(c.c)} ${c.n}</option>`).join(""); }
function authScreen(tab) {
  tab = tab || "login"; screen("auth"); $("#auth").style.backgroundImage = `url(${IMG.b})`;
  $("#auth").innerHTML = `<h1>MARS<small>THE LAST COLONY</small></h1><div class="ab">
    <div class="tabs"><button data-t="login" class="${tab == "login" ? "sel" : ""}">Entrar</button><button data-t="reg" class="${tab == "reg" ? "sel" : ""}">Criar conta</button></div>
    <label class="f">Usuário<input id="au" maxlength="16" autocomplete="username" placeholder="3 a 16 letras/números"></label>
    <label class="f">Senha<input id="ap" type="password" autocomplete="${tab == "reg" ? "new-password" : "current-password"}" placeholder="mínimo 6 caracteres"></label>
    ${tab == "reg" ? `<label class="f">País<select id="ac">${ctry("BR")}</select></label>` : ""}
    <div class="err" id="ae"></div><button class="pri" id="ago">${tab == "reg" ? "Criar conta e jogar" : "Entrar"}</button>
    <button class="gh" id="agu">Jogar agora como convidado (solo, sandbox e bots; sem chat e amigos)</button>
    <small class="mu">${worldLine()}</small><button class="gh" id="asw">← Trocar de mundo / entrar com código</button></div>`;
  $("#auth").querySelectorAll("[data-t]").forEach((b) => (b.onclick = () => authScreen(b.dataset.t)));
  const go = async () => {
    const u = $("#au").value.trim(), p = $("#ap").value; $("#ae").textContent = ""; $("#ago").disabled = true;
    const go1 = $("#ago"), r = await NET.ask(tab == "reg" ? { t: "reg", u, p, c: $("#ac").value } : { t: "login", u, p }); go1.disabled = false;
    if (!r.ok) { $("#ae").textContent = r.err || "Falha"; return; } applyAuth(r);
  };
  $("#ago").onclick = go; $("#ap").onkeydown = (e) => { if (e.key == "Enter") go(); }; $("#asw").onclick = () => switchWorld(); $("#agu").onclick = () => { ACC.user = null; ACC.role = "guest"; loadLocal(); dailyBonus(); menu(); };
}
function applyAuth(r) {
  ACC.user = r.me.u; ACC.role = r.me.role; ACC.cc = r.me.cc; ACC.vf = r.me.vf; ACC.token = r.token; try { localStorage.setItem(NET.tokKey(), r.token); } catch (e) { /* ignore */ }
  loadLocal(); if (r.prof && r.prof.p) { Object.assign(P, r.prof.p); Object.assign(S, r.prof.s || {}); normalize(); } else { pushProf(); }
  P.name = ACC.user; applyCatalog(r.catalog); EV.custom = r.events || []; EV.refresh(); setSocial(r.social); SOC.party = r.party || null; (r.hist || []).forEach((m) => chatPush(m, true));
  dailyBonus(); saveP(); GS.stop(); GS.start(); deriveSocial(); menu(); toast(`Bem-vindo, ${esc(ACC.user)}! ${r.me.vf ? "✔" : ""}`);
}
function dailyBonus() { const d = new Date().toISOString().slice(0, 10); if (P.day != d) { P.day = d; P.cr += 20; toast("🎁 Bônus diário: +20 créditos"); } saveP(); }
function logout() { GS.stop(); NET.send({ t: "logout", token: ACC.token }); try { localStorage.removeItem(NET.tokKey()); } catch (e) { /* ignore */ } ACC.user = null; ACC.role = "guest"; ACC.vf = false; SOC.friends = []; SOC.party = null; chatReset(); S = { coins: 500, own: [], done: {}, color: "#d8d0c4", v: 3 }; P = { name: "", cr: 0, pp: 0, rp: 0, w: 0, day: "", own: DEF_OWN.slice(), eq: Object.assign({}, DEF_EQ), evs: {}, v: 3 }; authScreen(); }
NET.on("closed", () => { if (NET.mode === "p2p") { toast("⚠ O anfitrião saiu do mundo. Volte a entrar com o código.", 6000); setTimeout(() => switchWorld(), 1500); } else toast("⚠ Conexão perdida. Tentando reconectar…", 4000); });

// ---------- mundos (sem servidor: o navegador do anfitrião é o servidor; amigos entram por WebRTC) ----------
function copyText(t, label) {
  const ok = () => toast("📋 " + (label || "Copiado") + ": <b>" + esc(t) + "</b>");
  try { navigator.clipboard.writeText(t).then(ok, () => fb()); } catch (e) { fb(); }
  function fb() { const i = document.createElement("input"); i.value = t; document.body.appendChild(i); i.select(); try { document.execCommand("copy"); ok(); } catch (e) { toast("Selecione e copie: " + esc(t)); } i.remove(); }
}
function worldLine() {
  if (NET.mode == "p2p") return `🌐 Conectado ao mundo <b>${esc(NET.world)}</b> (WebRTC). Sua conta fica neste mundo.`;
  return `🌍 Seu mundo${P2P.ready ? ` · código <b>${esc(P2P.code)}</b>` : ""}. Contas ficam salvas neste navegador.`;
}
function switchWorld() { GS.stop(); NET.disconnect(); ACC.user = null; ACC.role = "guest"; ACC.vf = false; SOC.friends = []; SOC.reqIn = []; SOC.reqOut = []; SOC.party = null; chatReset(); mpStop(); try { localStorage.removeItem("mars-last"); } catch (e) { /* ignore */ } worldScreen(); }
async function enterSelf() { NET.startLocal(); try { localStorage.setItem("mars-last", "self"); } catch (e) { /* ignore */ } await resumeOrAuth(); }
async function resumeOrAuth() {
  let tok = null; try { tok = localStorage.getItem(NET.tokKey()); } catch (e) { /* ignore */ }
  if (tok) { const r = await NET.ask({ t: "resume", token: tok }); if (r.ok) { r.token = tok; return applyAuth(r); } }
  authScreen();
}
function worldScreen(msg) {
  screen("auth"); $("#auth").style.backgroundImage = `url(${IMG.b})`; let last = ""; try { last = localStorage.getItem("mars-join") || ""; } catch (e) { /* ignore */ }
  $("#auth").innerHTML = `<h1>MARS<small>THE LAST COLONY</small></h1><div class="ab">
    <b>Jogar com amigos por código (WebRTC)</b><small class="mu">Cada jogador pode criar o próprio mundo e compartilhar o código. Não precisa de servidor.</small>
    <button class="pri" id="wself">Entrar no meu mundo</button><div class="pill" id="wcode" style="text-align:center"></div>
    <hr style="border:0;border-top:1px solid var(--bd);width:100%"><label class="f">Entrar no mundo de um amigo<input id="wjc" maxlength="12" placeholder="Código, ex.: K7M2QX" value="${esc(last)}" style="text-transform:uppercase;letter-spacing:.15em;text-align:center"></label>
    <div class="err" id="wer">${msg ? esc(msg) : ""}</div><button id="wjoin">Conectar</button></div>`;
  $("#wself").onclick = enterSelf;
  $("#wjoin").onclick = async () => {
    const c = $("#wjc").value.trim(), jb = $("#wjoin"), er = $("#wer"); er.textContent = ""; jb.disabled = true; jb.textContent = "Conectando…";
    try { await NET.joinWorld(c); try { localStorage.setItem("mars-join", c.toUpperCase()); localStorage.setItem("mars-last", c.toUpperCase()); } catch (e) { /* ignore */ } await resumeOrAuth(); }
    catch (e) { er.textContent = e.message || "Falha ao conectar"; } jb.disabled = false; jb.textContent = "Conectar";
  };
  $("#wjc").onkeydown = (e) => { if (e.key == "Enter") $("#wjoin").click(); };
  if (!P2P.host) P2P.startHost(); worldUI();
}
function worldUI() {
  const el = $("#wcode"); if (!el) return;
  el.innerHTML = P2P.ready ? `Seu código: <b style="letter-spacing:.2em;font-size:18px">${esc(P2P.code)}</b> <button id="wcp" style="padding:3px 8px">Copiar</button><br><small class="mu">${P2P.guests} amigo(s) conectado(s)</small>` : `<small class="mu">${P2P.err ? "⚠ " + esc(P2P.err) : "Abrindo seu mundo para amigos…"}</small>`;
  const b = $("#wcp"); if (b) b.onclick = () => copyText(P2P.code, "Código do mundo");
}

// ---------- menu ----------
function menu() {
  setAct("");
  mpStop(); navOff(); G.run = false; closeInterior(true); closeDlg(); clear(); setWeatherReset(); $("#hud").classList.remove("on"); $("#inhud").classList.remove("on");
  const top = EV.top(), up = MarsRules.upcoming(new Date(), 400, EV.custom).filter((x) => x.in > 0)[0];
  const ev = top ? `<div class="evb ${top.kind == "special" ? "sp" : ""}" style="border-color:${top.col}"><span style="font-size:26px">${top.icon || "🎉"}</span><div><b>${esc(top.name)}</b><div class="mu">Evento ativo · moedas <span class="x">x${top.mult}</span> em tudo!</div></div></div>` : up ? `<div class="evb"><span style="font-size:22px">${up.e.icon || "📅"}</span><div class="mu">Próximo evento em ${up.in} dia(s): <b>${esc(up.e.name)}</b> · moedas x${up.e.mult}</div></div>` : "";
  const m = $("#menu"); m.style.backgroundImage = `url(${IMG.b})`;
  m.innerHTML = `<h1>MARS<small>THE LAST COLONY</small></h1>
  <div class="ubar"><div class="pill">${ACC.user ? `${MarsRules.flag(ACC.cc)} <b>${esc(ACC.user)}</b>${vfBadge(ACC.role, ACC.vf)}${roleChip(ACC.role)} <button class="gh" id="mlo" style="padding:2px 8px">Sair</button>` : `👤 Convidado <button class="gh" id="mlo" style="padding:2px 8px">Entrar</button>`}</div>
  <div class="pill" style="text-align:center">🪙 <b>${Math.floor(S.coins)}</b> · ✨ <b>${P.cr}</b> · 🏆 <b>${P.pp}</b> PP · 🔬 <b>${P.rp}</b> RP</div></div>${ev}
  <div class="pill" id="mworld" style="text-align:center">${worldLine()} ${NET.mode == "local" && P2P.ready ? `<button id="mwc" style="padding:2px 8px">📋 Copiar código</button>` : ""} <button class="gh" id="msw" style="padding:2px 8px">Trocar de mundo</button></div>
  <div class="mb"><button class="big pri" data-m="solo">Modo Solo · Campanha<small>30 fases + nova campanha alienígena (15 fases)</small></button>
  <button data-m="sand">Sandbox<small>Construção livre</small></button><button data-m="mp">Multiplayer<small>Coop · Equipes · Todos contra todos</small></button>
  <button data-m="ward">Guarda-roupa<small>Trajes, eventos e mais</small></button><button data-m="shop">Loja de upgrades</button>
  <button data-m="soc">👥 Amigos & grupo<small>${SOC.reqIn.length ? SOC.reqIn.length + " pedido(s)" : "Online agora, sem precisar de código"}</small></button><button data-m="lbd">Leaderboard</button>
  <button data-m="quiz" class="big" style="border-color:#6a9cff">🛰 Quiz Espacial<small>${QUIZ.length} perguntas · ${QZ.PER_Q} 🪙 por acerto inédito + bônus diário</small></button>
  <button data-m="facts">📡 Fatos Espaciais<small>Leia e ganhe PP e moedas</small></button><button data-m="evt">📅 Eventos & moedas em dobro</button>
  ${isAdminAcc() ? `<button data-m="adm" class="big" style="border-color:#6a4cff">🛡 Ferramentas ADM${isArtistAcc() ? " · Estúdio de criação" : ""}</button>` : ""}</div><div id="msg"></div>`;
  screen("menu"); sc.fog.density = .006;
  m.querySelectorAll("[data-m]").forEach((b) => (b.onclick = () => { const k = b.dataset.m; if (k == "solo") cat(); else if (k == "sand") start("sand"); else if (k == "mp") lobby(); else if (k == "ward") ward(); else if (k == "shop") shop(true); else if (k == "soc") social(); else if (k == "lbd") board(); else if (k == "evt") eventsPanel(); else if (k == "quiz") quizHome(); else if (k == "facts") factsHome(); else if (k == "adm") adminTools(); }));
  askSpecies(); $("#mlo").onclick = () => (ACC.user ? logout() : authScreen()); $("#msw").onclick = () => switchWorld(); if ($("#mwc")) $("#mwc").onclick = () => copyText(P2P.code, "Código do mundo");
}

// ---------- catálogo e loja ----------
function cat() {
  screen("cat"); const g = $("#grid"); g.innerHTML = ""; g.style.display = "block"; $("#catinfo").textContent = `${Object.keys(S.done).length}/${PH.length} concluídas`;
  let w = null; const sep = (t) => { const d = document.createElement("div"); d.className = "sep"; d.textContent = t; g.appendChild(d); w = document.createElement("div"); w.style.cssText = "display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px;margin-top:10px"; g.appendChild(w); };
  const qc = document.createElement("div"); qc.className = "card"; qc.style.cssText = "max-width:420px;margin:0 0 12px;border-color:#6a9cff"; qc.innerHTML = `<div style="padding:12px"><b>🛰 Quiz Espacial · muitas moedas</b><p>${QUIZ.length} perguntas sobre Marte e o espaço: ${QZ.PER_Q} 🪙 por acerto inédito e bônus de até ${QZ.BONUS80 + QZ.BONUS100} 🪙 por rodada.</p></div>`; qc.onclick = quizHome; g.appendChild(qc);
  PH.forEach((p, i) => {
    if (i == 0) sep("Campanha da colônia · fases 1–30"); if (i == ALIEN_START) sep("👽 Nova campanha · Invasão alienígena pacífica · Ultimate · fases 31–45 (começa liberada, independente da campanha principal)");
    const lk = i > 0 && i !== ALIEN_START && !S.done[i - 1], c = document.createElement("div"); c.className = "card" + (lk ? " lk" : "") + (p.alien ? " al" : "");
    c.innerHTML = `<img src="${p.img}" alt=""><div><b>Fase ${String(i + 1).padStart(2, "0")} · ${esc(p.n)}</b><p>${esc(p.d)}</p><p>${S.done[i] ? "✔ Concluída · " : lk ? "🔒 Bloqueada · " : ""}Recompensa: ${p.r} 🪙${p.nav ? "" : " · ⏱ " + Math.round(p.t / 6) / 10 + " min"}${p.ms.length ? " · 🎯 " + p.ms.length + " missões" : ""}</p></div>`;
    if (!lk) c.onclick = () => factBeforePhase(() => start(p.nav ? "nav" : "solo", i)); w.appendChild(c);
  });
}
function fin(s) { $("#fi").src = s; $("#fin").classList.add("on"); }
$("#fb").onclick = () => { $("#fin").classList.remove("on"); clear(); cat(); };
function shop(on) {
  $("#shop").classList.toggle("on", on); if (G.run && G.mode != "mp" && !IN) G.paused = on; if (!on) return; $("#sc").textContent = Math.floor(S.coins); $("#sr").textContent = P.rp; const l = $("#sl"); l.innerHTML = "";
  allUP().forEach((u) => { const o = S.own.includes(u.id), d = document.createElement("div"); d.className = "up"; d.innerHTML = `<div><span class="tag">${u.k}${u.by ? " · ✨ " + esc(u.by) : ""}</span><br><b>${esc(u.n)}</b><p>${esc(u.d)}</p></div>`;
    const b = document.createElement("button"); b.textContent = o ? "Instalado" : u.c + " 🪙"; b.disabled = o || S.coins < u.c; b.onclick = () => { S.coins -= u.c; S.own.push(u.id); save(); shop(true); if (G.run && G.mode != "nav") pal(); }; d.appendChild(b);
    if (!o) { const r = Math.min(P.rp, u.c), b2 = document.createElement("button"); b2.textContent = r ? (r >= u.c ? "100% com RP" : u.c - r + " 🪙 + " + r + " RP") : "Sem RP"; b2.disabled = !r || S.coins < u.c - r; b2.onclick = () => { S.coins -= u.c - r; P.rp -= r; S.own.push(u.id); save(); saveP(); shop(true); }; d.appendChild(b2); } l.appendChild(d); });
}
$("#sx").onclick = () => shop(false);

// ---------- eventos ----------
function eventsPanel() {
  const act = EV.active, up = MarsRules.upcoming(new Date(), 90, EV.custom).filter((x) => x.in > 0).slice(0, 8);
  const fmt = (d) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  openModal(`<div class="up"><b style="font-size:18px">📅 Eventos</b><button id="cls">Fechar</button></div>
  <p class="mu">Há eventos <b>toda semana</b> (sexta a domingo) e em <b>datas comemorativas</b>: moedas <b>x2</b>. Nos dias <b>1º de fevereiro, 11 de abril e 12 de junho</b>: moedas <b>x5</b>. Cada evento libera um <b>traje exclusivo</b>.</p>
  <h3>Ativos agora (moedas x${EV.mult})</h3>${act.length ? act.map((e) => `<div class="up"><div><b>${e.icon || ""} ${esc(e.name)}</b> <span class="chip">x${e.mult}</span><p>${e.kind == "weekly" ? "Evento semanal" : e.kind == "special" ? "Data comemorativa especial" : e.kind == "holiday" ? "Data comemorativa" : "Evento dos administradores"} · traje: ${esc(e.suit.n)}</p></div><button data-c="${e.id}" ${P.own.includes(e.suit.id) ? "disabled" : ""}>${P.own.includes(e.suit.id) ? "Resgatado" : "Resgatar traje"}</button></div>`).join("") : `<p class="mu">Nenhum evento agora. Veja os próximos abaixo.</p>`}
  <h3 style="margin-top:12px">Próximos</h3>${up.map((x) => `<div class="up"><div>${x.e.icon || ""} <b>${esc(x.e.name)}</b><p>${fmt(x.date)} · moedas x${x.e.mult}</p></div></div>`).join("") || `<p class="mu">—</p>`}
  <h3 style="margin-top:12px">Calendário fixo</h3><p class="mu">${MarsRules.SPECIAL.map((s) => `${s.icon} ${String(s.d).padStart(2, "0")}/${String(s.m).padStart(2, "0")} ${esc(s.name)} (x5)`).join(" · ")}</p>`);
  $("#cls").onclick = closeModal; $("#admb").querySelectorAll("[data-c]").forEach((b) => (b.onclick = () => { const e = EV.active.find((x) => x.id == b.dataset.c); if (e && EV.claim(e)) { toast(`🎽 Traje resgatado: ${esc(e.suit.n)}`); eventsPanel(); } }));
}

// ---------- espécie: humano ou alienígena ----------
function setSpecies(sp) { P.sp = sp === "alien" ? "alien" : "human"; P.spChosen = true; saveP(); if ($("#ward").classList.contains("on")) ward(); }
function askSpecies() {
  if (P.spChosen) return;
  openDlgHTML(`<div class="dlgh"><div class="av">🪐</div><div><b>Quem é você em Marte?</b><div class="mu">Escolha sua espécie. Você pode mudar depois no Guarda-roupa.</div></div></div>
  <div class="row" style="margin-top:12px;gap:12px"><button id="pH" style="flex:1;padding:16px"><div style="font-size:40px">🧑‍🚀</div><b>Humano</b><br><small class="mu">Astronauta colonizador</small></button><button id="pA" style="flex:1;padding:16px"><div style="font-size:40px">👽</div><b>Alienígena</b><br><small class="mu">Visitante pacífico das estrelas</small></button></div>
  <div class="row" style="margin-top:10px;justify-content:center"><button class="gh" id="pL">Decidir depois</button></div>`);
  const done = (sp) => { if (sp) P.sp = sp; P.spChosen = true; saveP(); $("#dlg").classList.remove("on"); };
  $("#pH").onclick = () => done("human"); $("#pA").onclick = () => done("alien"); $("#pL").onclick = () => done(null);
}
// ---------- guarda-roupa ----------
let WTAB = "s", WTRY = null;
function ward() {
  screen("ward"); $("#ward").className = "scr pg on"; const el = $("#ward"); const role = ACC.role;
  const tabs = ["s", "p", "w", "h", "b", "e"].concat(isAdminAcc() ? ["a"] : []); if (!tabs.includes(WTAB)) WTAB = "s";
  el.innerHTML = `<div class="left"><div class="top" style="width:100%"><button id="rb2">← Voltar</button><h2>Guarda-roupa</h2></div><div class="pv" id="pv"></div><div class="pill w" style="width:100%;text-align:center"><b>Espécie</b><div class="row" style="justify-content:center;margin-top:6px"><button id="spH" class="${P.sp != "alien" ? "sel" : ""}">🧑‍🚀 Humano</button><button id="spA" class="${P.sp == "alien" ? "sel" : ""}">👽 Alienígena</button></div>${P.sp == "alien" ? `<div class="row" style="justify-content:center;margin-top:8px">${Object.keys(SKINS).map((k) => `<button class="sw-btn ${P.skin == k ? "sel" : ""}" data-sk="${k}" title="${SKINS[k].n}" style="width:34px;height:34px;padding:0;border-radius:50%;background:${SKINS[k].c};box-shadow:0 0 8px ${SKINS[k].g}"></button>`).join("")}</div><small class="mu">Cor da pele</small>` : ""}</div><div class="pill" style="text-align:center">Créditos: <b id="wc">${P.cr}</b> · PP: <b>${P.pp}</b></div><div class="row"><button id="wsp">⏸ Girar</button><button id="wrs">Padrão</button></div><small class="mu" style="text-align:center">Toque num item para experimentar. Arraste o boneco para girar.</small></div>
  <div class="right"><div class="tabs">${tabs.map((t) => `<button data-t="${t}" class="${t == WTAB ? "sel" : ""}">${SL[t]}</button>`).join("")}</div><div class="items" id="wi"></div></div>`;
  $("#rb2").onclick = () => { if (window.studioStop) studioStop(); menu(); }; el.querySelectorAll("[data-t]").forEach((b) => (b.onclick = () => { WTAB = b.dataset.t; ward(); }));
  const eq = () => Object.assign({}, myEq(), WTRY || {});
  const pv = new MiniView($("#pv"), 300, 360);
  const refresh = () => { if (pv) pv.setObj(av(eq()), 0); }; refresh();
  $("#spH").onclick = () => setSpecies("human"); $("#spA").onclick = () => setSpecies("alien"); el.querySelectorAll("[data-sk]").forEach((b) => (b.onclick = () => { P.skin = b.dataset.sk; saveP(); ward(); }));
  $("#wrs").onclick = () => { WTRY = null; P.eq = Object.assign({}, DEF_EQ); saveP(); ward(); };
  $("#wsp").onclick = () => { if (pv) { pv.spin = !pv.spin; $("#wsp").textContent = pv.spin ? "⏸ Girar" : "▶ Girar"; } };
  let items = []; if (WTAB == "e") items = allCX().filter((x) => x.ev || String(x.id).startsWith("ev_")); else if (WTAB == "a") items = allCX().filter((x) => x.adm && canUseItem(x)); else items = allCX().filter((x) => x.l == WTAB && !x.ev && !String(x.id).startsWith("ev_") && !(x.adm));
  if (WTAB == "e") { EV.active.forEach((e) => { if (!items.some((i) => i.id == e.suit.id)) items.push(e.suit); }); }
  const wi = $("#wi"); if (!items.length) wi.innerHTML = `<p class="mu">Nada aqui ainda. ${WTAB == "e" ? "Resgate trajes durante os eventos!" : ""}</p>`;
  items.forEach((x) => {
    const o = P.own.includes(x.id), equipped = P.eq[x.l] == x.id, usable = canUseItem(x), d = document.createElement("div"); d.className = "it" + (equipped ? " eq" : "");
    const rar = x.c >= 400 ? "Épico" : x.c >= 200 ? "Raro" : x.c > 0 ? "Comum" : x.adm ? "Admin" : x.ev || String(x.id).startsWith("ev_") ? "Evento" : "Básico";
    d.innerHTML = `<span class="tg">${rar}</span><div class="sw" style="background:${x.col || "#333"};${x.glow ? "box-shadow:0 0 14px " + x.glow : ""}"></div><b style="font-size:12px">${esc(x.n)}</b><small>${x.by ? "✨ por " + esc(x.by) : SL[x.l]}</small>`;
    d.onclick = () => { WTRY = { [x.l]: x.id }; refresh(); };
    const act = document.createElement("button"); act.style.fontSize = "12px";
    const claimable = !o && (x.ev || String(x.id).startsWith("ev_")) && EV.active.some((e) => e.suit.id == x.id);
    if (!usable) { act.textContent = "Restrito"; act.disabled = true; }
    else if (o) { act.textContent = equipped ? "Equipado" : "Equipar"; act.disabled = equipped; act.onclick = (ev) => { ev.stopPropagation(); P.eq[x.l] = x.id; WTRY = null; saveP(); ward(); }; }
    else if (claimable) { act.textContent = "Resgatar grátis"; act.onclick = (ev) => { ev.stopPropagation(); const e = EV.active.find((q) => q.suit.id == x.id); EV.claim(e); P.eq[x.l] = x.id; saveP(); ward(); }; }
    else if (String(x.id).startsWith("ev_")) { act.textContent = "Evento encerrado"; act.disabled = true; }
    else { act.textContent = x.c + " créditos"; act.disabled = P.cr < x.c; act.onclick = (ev) => { ev.stopPropagation(); P.cr -= x.c; P.own.push(x.id); P.eq[x.l] = x.id; WTRY = null; saveP(); ward(); }; }
    d.appendChild(act);
    if (!o && usable && !claimable && x.c > 0) { const r = Math.min(P.pp, x.c), b2 = document.createElement("button"); b2.style.fontSize = "11px"; b2.textContent = r ? (r >= x.c ? "100% com PP" : x.c - r + " cr + " + r + " PP") : "Sem PP"; b2.disabled = !r || P.cr < x.c - r; b2.onclick = (ev) => { ev.stopPropagation(); P.cr -= x.c - r; P.pp -= r; P.own.push(x.id); P.eq[x.l] = x.id; saveP(); ward(); }; d.appendChild(b2); }
    wi.appendChild(d);
  });
}

// ---------- social: amigos, diretório e grupos ----------
function setSocial() { /* amigos agora são globais (js/global.js); o mundo só cuida de salas, grupos e chat */ }
NET.on("roster", () => { if ($("#soc").classList.contains("on")) refreshUsers(); });
NET.on("party", (m) => { SOC.party = m.party; if ($("#soc").classList.contains("on")) renderSocial(); if ($("#lob").classList.contains("on")) renderLobby(); chatTabs(); });
NET.on("party.inv", (m) => { openDlgHTML(`<div class="dlgh"><div class="av">👥</div><div><b>Convite de grupo</b><div class="mu">${esc(m.from)} convidou você para um grupo</div></div></div><div class="opts"><button id="pia" class="pri">Aceitar</button><button id="pir" class="gh">Recusar</button></div>`); $("#pia").onclick = async () => { $("#dlg").classList.remove("on"); const r = await NET.ask({ t: "party", op: "acc", id: m.id }); toast(r.ok ? "Você entrou no grupo!" : esc(r.err || "Erro")); }; $("#pir").onclick = () => $("#dlg").classList.remove("on"); });
NET.on("party.go", (m) => { toast(`🎮 O líder do grupo entrou na sala ${esc(m.code)}…`); joinGame(m.code); });
NET.on("gmsg", (m) => { const d = document.createElement("div"); d.className = "mq"; d.innerHTML = `📢 <b>${esc(m.from)}</b> ${vfBadge("admin")}: ${esc(m.text)}`; document.body.appendChild(d); d.onclick = () => d.remove(); setTimeout(() => d.remove(), 12000); });
NET.on("events", (m) => { EV.custom = m.events || []; EV.refresh(); });
NET.on("cat", (m) => { applyCatalog(m.catalog); if (G.run && G.mode != "nav") pal(); });
function openDlgHTML(h) { $("#dlgb").innerHTML = h; $("#dlg").classList.add("on"); }
let socTab = "users", socT = 0;
async function social(tab) {
  if (!ACC.user) { toast("Entre numa conta para ver amigos e usuários"); return; } if (tab) socTab = tab; screen("soc"); $("#soc").dataset.q = $("#soc").dataset.q || ""; await refreshUsers(); clearInterval(socT); socT = setInterval(() => { if ($("#soc").classList.contains("on")) refreshUsers(); else clearInterval(socT); }, 4000);
}
SOC.hub = [];
const inSet = (arr, n) => arr.some((x) => MarsRules.key(x) === MarsRules.key(n));
/** Junta quem está no mundo (Hub) com quem está online no diretório global e aplica as relações de amizade. */
function deriveSocial() {
  const fr = P.fr, map = new Map(), K = MarsRules.key, here = NET.mode === "p2p" ? NET.world : (P2P.ready ? P2P.code : "");
  SOC.hub.forEach((x) => map.set(K(x.u), { u: x.u, cc: x.cc, role: x.role, vf: x.vf, on: x.on, world: here, hub: true }));
  GS.users.forEach((x) => { const o = map.get(K(x.u)) || {}; map.set(K(x.u), Object.assign(o, { u: x.u, cc: x.cc, role: x.role, vf: x.vf || o.vf, on: true, world: x.world || o.world })); });
  const all = [...map.values()].filter((x) => K(x.u) !== K(ACC.user || ""));
  const rel = (n) => (inSet(fr.f, n) ? 2 : inSet(fr.out, n) ? 1 : inSet(fr.in, n) ? 3 : 0);
  SOC.users = all.map((x) => Object.assign(x, { fr: rel(x.u) })).sort((a, b) => (b.on - a.on) || a.u.localeCompare(b.u));
  const get = (n) => SOC.users.find((x) => K(x.u) === K(n)) || { u: n, cc: fr.cc[n] || "BR", role: MarsRules.roleOf(n), vf: false, on: false, fr: rel(n) };
  SOC.friends = fr.f.map(get); SOC.reqIn = fr.in.map(get); SOC.reqOut = fr.out.map(get);
  ACC.vf = ACC.vf || fr.f.some((n) => MarsRules.isAdmin(n));
}
function socRefresh() { deriveSocial(); if ($("#soc").classList.contains("on")) renderSocial(); }
async function refreshUsers() { const r = await NET.ask({ t: "users" }); if (r.ok) { SOC.hub = r.users; SOC.anon = r.anon || 0; } deriveSocial(); renderSocial(); }
const frAsk = async (op, u) => { ({ add: () => GS.add(u), acc: () => GS.accept(u), rej: () => GS.reject(u), cancel: () => GS.cancel(u), rm: () => GS.remove(u) })[op](); socRefresh(); if (!GS.ready) toast("⚠ Diretório global ainda conectando; o pedido será enviado quando o amigo ficar online."); };
function joinOtherWorld(code) { toast("Entrando no mundo " + esc(code) + "…"); GS.stop(); NET.disconnect(); ACC.user = null; ACC.role = "guest"; ACC.vf = false; SOC.party = null; chatReset(); mpStop(); NET.joinWorld(code).then(() => { try { localStorage.setItem("mars-last", code); } catch (e) { /* ignore */ } resumeOrAuth(); }).catch((e) => { toast("Não foi possível entrar: " + esc(e.message)); enterSelf(); }); }
function renderSocial() {
  const el = $("#soc"), q = (el.dataset.q || "").toLowerCase(), me = ACC.user, hit = (u) => !q || u.u.toLowerCase().includes(q) || (MarsRules.COUNTRIES.find((c) => c.c == u.cc) || { n: "" }).n.toLowerCase().includes(q);
  const tabs = [["friends", `Amigos (${SOC.friends.length})`], ["users", `Todos os usuários (${SOC.users.length})`], ["req", `Pedidos${SOC.reqIn.length ? " (" + SOC.reqIn.length + ")" : ""}`], ["party", `Grupo${SOC.party ? " (" + SOC.party.members.length + ")" : ""}`]];
  const here = NET.mode === "p2p" ? NET.world : (P2P.ready ? P2P.code : "");
  const acts = (u) => `<button data-dm="${esc(u.u)}">💬</button>` + (u.hub && u.on ? `<button data-inv="${esc(u.u)}">Convidar</button>` : u.on && u.world && u.world !== here ? `<button data-jw="${esc(u.world)}" title="Entrar no mundo dele">Entrar no mundo</button>` : "");
  const row = (u, btns) => `<div class="pl"><span class="nm"><i class="on-dot ${u.on ? "on" : ""}"></i>${userHTML(u)}</span><span class="row">${btns}</span></div>`;
  const rel = (u) => { const x = SOC.users.find((y) => y.u == u.u); return x ? x.fr : SOC.friends.some((f) => f.u == u.u) ? 2 : 0; };
  let body = "";
  const sbox = `<input id="sq" placeholder="🔎 Filtrar por nome ou país…" value="${esc(el.dataset.q || "")}" style="width:100%;margin-bottom:6px">`;
  if (socTab == "friends") body = sbox + SOC.friends.filter(hit).map((u) => row(Object.assign({}, u, (SOC.users.find((x) => x.u == u.u) || {})), `${acts(u)}<button class="gh" data-rm="${esc(u.u)}">✕</button>`)).join("") || `<p class="mu">${q ? "Nenhum amigo encontrado." : "Você ainda não tem amigos. Abra “Todos os usuários” para adicionar. ✔ Amigos de administradores ganham o selo de verificado."}</p>`;
  if (socTab == "friends") {
    const near = SOC.users.filter((u) => u.u != me && u.on && u.fr != 2 && hit(u));
    body += `<div class="tag" style="margin:10px 0 2px">🟢 Online agora (ainda não são amigos)${SOC.anon ? " · " + SOC.anon + " visitante(s) sem login neste mundo" : ""}</div>` + (near.map((u) => row(u, u.fr == 1 ? `<button disabled>Pendente</button>` : u.fr == 3 ? `<button class="pri" data-acc="${esc(u.u)}">Aceitar</button>` : `<button data-add="${esc(u.u)}">＋ Adicionar</button><button data-dm="${esc(u.u)}">💬</button>`)).join("") || `<p class="mu">Ninguém mais conectado.</p>`);
  }
  else if (socTab == "users") body = sbox + SOC.users.filter((u) => u.u != me && hit(u)).map((u) => row(u, u.fr == 2 ? `${acts(u)}` : u.fr == 1 ? `<button disabled>Pendente</button>` : u.fr == 3 ? `<button class="pri" data-acc="${esc(u.u)}">Aceitar</button>` : `<button data-add="${esc(u.u)}">＋ Adicionar</button><button data-dm="${esc(u.u)}">💬</button>`)).join("") || `<p class="mu">Nenhum usuário encontrado.</p>`;
  else if (socTab == "req") body = `<b>Recebidos</b>` + (SOC.reqIn.map((u) => row(u, `<button class="pri" data-acc="${esc(u.u)}">Aceitar</button><button class="gh" data-rej="${esc(u.u)}">Recusar</button>`)).join("") || `<p class="mu">Nenhum pedido.</p>`) + `<b>Enviados</b>` + (SOC.reqOut.map((u) => row(u, `<button class="gh" data-can="${esc(u.u)}">Cancelar</button>`)).join("") || `<p class="mu">Nenhum.</p>`);
  else { const p = SOC.party; body = p ? `<p>Grupo <b>${esc(p.id)}</b> · líder: <b>${esc(p.leader)}</b></p>` + p.members.map((u) => row(u, p.leader == me && u.u != me ? `<button class="gh" data-kick="${esc(u.u)}">Expulsar</button>` : u.u == p.leader ? "👑" : "")).join("") + `<div class="row" style="margin-top:8px"><button data-pchat>💬 Chat do grupo</button><button class="gh" data-pleave>Sair do grupo</button></div><p class="mu">O líder pode chamar o grupo para sua sala em Multiplayer → sala de espera. Membros do mesmo grupo jogam na mesma equipe.</p>` : `<p class="mu">Você não está em um grupo. Convide amigos para criar um.</p><button data-pmake class="pri">Criar grupo</button>`; }
  el.innerHTML = `<div class="top"><button id="sb">← Voltar</button><h2>👥 Amigos & grupo</h2></div><div class="tabs w">${tabs.map(([k, t]) => `<button data-st="${k}" class="${k == socTab ? "sel" : ""}">${t}</button>`).join("")}</div><div class="w pill">${body}</div>`;
  $("#sb").onclick = () => { clearInterval(socT); menu(); }; el.querySelectorAll("[data-st]").forEach((b) => (b.onclick = () => { socTab = b.dataset.st; renderSocial(); }));
  const on = (a, f) => el.querySelectorAll(`[data-${a}]`).forEach((b) => (b.onclick = () => f(b.dataset[a]))); const sq = $("#sq"); if (sq) { sq.oninput = () => { el.dataset.q = sq.value; const p = sq.selectionStart; renderSocial(); const n = $("#sq"); n.focus(); n.setSelectionRange(p, p); }; }
  on("add", (u) => frAsk("add", u)); on("acc", (u) => frAsk("acc", u)); on("rej", (u) => frAsk("rej", u)); on("can", (u) => frAsk("cancel", u)); on("rm", (u) => frAsk("rm", u));
  on("jw", (c) => joinOtherWorld(c)); on("dm", (u) => openDM(u)); on("inv", async (u) => { const r = await NET.ask({ t: "party", op: "inv", u }); toast(r.ok ? "Convite enviado" : esc(r.err || "Erro")); });
  on("kick", async (u) => { await NET.ask({ t: "party", op: "kick", u }); }); on("pleave", async () => { await NET.ask({ t: "party", op: "leave" }); }); on("pmake", async () => { await NET.ask({ t: "party", op: "make" }); }); const pc = el.querySelector("[data-pchat]"); if (pc) pc.onclick = () => { openChat("party"); };
}

// ---------- chat ----------
const CH = { msgs: { global: [], room: [], party: [] }, cur: "global", unread: 0, open: false, dms: [] };
function chatReset() { CH.msgs = { global: [], room: [], party: [] }; CH.dms = []; CH.cur = "global"; }
function chatSetRoom(on) { if (!on) CH.msgs.room = []; if (CH.cur == "room" && !on) CH.cur = "global"; chatTabs(); }
function chatPush(m, quiet) {
  const ch = m.ch; (CH.msgs[ch] = CH.msgs[ch] || []).push(m); if (CH.msgs[ch].length > 80) CH.msgs[ch].shift(); if (ch.startsWith("dm:") && !CH.dms.includes(ch)) CH.dms.push(ch);
  if (!quiet && (!CH.open || CH.cur != ch)) { CH.unread++; $("#chn").textContent = CH.unread; $("#chn").style.display = "block"; }
  if (CH.open) chatRender();
}
NET.on("chat", (m) => chatPush(m));
function openDM(u) { const ch = "dm:" + u; if (!CH.dms.includes(ch)) CH.dms.push(ch); CH.msgs[ch] = CH.msgs[ch] || []; openChat(ch); }
function openChat(ch) { CH.open = true; if (ch) CH.cur = ch; CH.unread = 0; $("#chn").style.display = "none"; $("#chat").classList.add("on"); chatRender(); }
$("#chb").onclick = () => { if ($("#chat").classList.contains("on")) { CH.open = false; $("#chat").classList.remove("on"); } else openChat(); };
const chName = (c) => (c == "global" ? "🌐 Global" : c == "room" ? "🎮 Sala" : c == "party" ? "👥 Grupo" : "✉ " + c.slice(3));
function chatTabs() { if ($("#chat").classList.contains("on")) chatRender(); }
function chatRender() {
  const chs = ["global"].concat(MP.room ? ["room"] : [], SOC.party ? ["party"] : [], CH.dms); if (!chs.includes(CH.cur)) CH.cur = "global";
  const el = $("#chat"); const keep = el.querySelector("input") && document.activeElement === el.querySelector("input"), val = keep ? el.querySelector("input").value : "";
  el.innerHTML = `<div class="ct">${chs.map((c) => `<button data-c="${esc(c)}" class="${c == CH.cur ? "sel" : ""}">${esc(chName(c))}</button>`).join("")}<button class="gh" id="chx" style="margin-left:auto">✕</button></div><div class="cm" id="cm"></div><div class="ci"><input maxlength="200" placeholder="Mensagem…" id="cin"><button id="csd" class="pri">➤</button></div>`;
  const cm = $("#cm"); (CH.msgs[CH.cur] || []).forEach((m) => { const d = document.createElement("div"); d.className = m.sys ? "sy" : ""; d.innerHTML = `${m.from ? `<b>${MarsRules.flag(m.from.cc)} ${esc(m.from.u)}</b>${vfBadge(m.from.role, m.from.vf)}${roleChip(m.from.role)}: ` : ""}${esc(m.m)}`; cm.appendChild(d); }); cm.scrollTop = cm.scrollHeight;
  el.querySelectorAll("[data-c]").forEach((b) => (b.onclick = () => { CH.cur = b.dataset.c; chatRender(); })); $("#chx").onclick = () => { CH.open = false; el.classList.remove("on"); };
  const inp = $("#cin"); if (keep) { inp.value = val; inp.focus(); }
  const send = async () => { const m = inp.value.trim(); if (!m) return; inp.value = "";
    if (CH.cur.startsWith("dm:")) { const to = CH.cur.slice(3), inHub = SOC.hub.some((x) => MarsRules.key(x.u) == MarsRules.key(to) && x.on);
      if (!inHub) { if (!GS.users.some((x) => MarsRules.key(x.u) == MarsRules.key(to))) { toast("Esse amigo está offline."); return; } GS.send(to, { k: "dm", m }); chatPush({ t: "chat", ch: CH.cur, from: { u: ACC.user, role: ACC.role, vf: ACC.vf, cc: ACC.cc }, m, ts: Date.now() }, true); return; } } const r = await NET.ask({ t: "chat", ch: CH.cur, m }); if (!r.ok) toast(esc(r.err || "Erro")); }; $("#csd").onclick = send; inp.onkeydown = (e) => { if (e.key == "Enter") send(); };
}
