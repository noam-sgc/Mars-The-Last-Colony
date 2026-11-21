/* Configurações: volume da música, trilha sonora (escolha da faixa) e som de clique. */
function openSettings() { $("#setm").classList.add("on"); settingsRefresh(); }
function closeSettings() { $("#setm").classList.remove("on"); }
window.settingsRefresh = function () {
  if (!$("#setm").classList.contains("on")) return; const M = Music, A = A11Y.get(), T = TILT.st, b = $("#setb"), scroll = (b.querySelector(".tl") || {}).scrollTop || 0;
  const cur = M.cur, row = (t) => `<button class="trk ${M.sel === t.id ? "sel" : ""}" data-t="${t.id}"><span style="font-size:22px">${t.kind === "file" ? "🎵" : "🎼"}</span><span><b>${esc(t.name)}</b><small>${esc(t.desc)}</small></span>${cur === t.id && M.on ? `<span class="np">▶ tocando</span>` : ""}</button>`;
  b.innerHTML = `<div class="up"><b style="font-size:20px">⚙ Configurações</b><button id="setx" class="pri">Fechar</button></div>
  ${ACC.user ? `<h3 style="margin:10px 0 2px">👤 Conta · ${esc(ACC.user)}</h3>
  <p class="mu" style="margin:2px 0 6px">Cadastre um e-mail para poder <b>redefinir a senha</b> se esquecer. Ele fica guardado só no servidor, criptografado.</p>
  <div class="fm"><label class="f">E-mail<input id="sem" type="email" placeholder="voce@exemplo.com"></label><label class="f">Senha atual<input id="sep" type="password" autocomplete="current-password"></label></div>
  <div class="srow"><button id="sems">Salvar e-mail</button><span class="mu" id="semr"></span></div>
  <div class="srow"><span>Esqueceu ou quer trocar a senha?</span><button id="srst" class="pri">🔑 Redefinir senha</button></div>` : ""}
  <h3 style="margin:14px 0 2px">🎧 Música</h3>
  <div class="srow"><span>Música ligada <small class="mu">(tecla M)</small></span><button id="mon" class="tgl ${M.on ? "sel" : ""}">${M.on ? "Sim" : "Não"}</button></div>
  <div class="srow"><span>Intensidade (volume)</span><input id="mvol" type="range" min="0" max="100" value="${Math.round(M.vol * 100)}"><span class="v">${Math.round(M.vol * 100)}%</span></div>
  <h3 style="margin:14px 0 2px">🎶 Trilha sonora</h3><p class="mu" style="margin:2px 0 4px">Tocando agora: <b>${esc(M.trackName() || "—")}</b>${M.sel === "auto" ? " (automática)" : ""}</p>
  <div class="tl" style="max-height:26vh;overflow:auto"><button class="trk ${M.sel === "auto" ? "sel" : ""}" data-t="auto"><span style="font-size:22px">🔀</span><span><b>Automática</b><small>A música muda conforme o momento do jogo (menu, colônia, edifício, nave, tempestade, visitantes)</small></span></button>${M.TRACKS.map(row).join("")}</div>
  <h3 style="margin:14px 0 2px">🔘 Som de clique</h3>
  <div class="srow"><span>Som ao clicar nos botões</span><button id="son" class="tgl ${M.sfxOn ? "sel" : ""}">${M.sfxOn ? "Sim" : "Não"}</button></div>
  <div class="srow"><span>Volume dos cliques</span><input id="svol" type="range" min="0" max="100" value="${Math.round(M.sfxVol * 100)}"><span class="v">${Math.round(M.sfxVol * 100)}%</span></div>
  <div class="srow"><span>Estilo do clique</span><span class="row"><select id="sst">${Object.keys(M.CLICKS).map((k) => `<option value="${k}" ${M.sfxStyle == k ? "selected" : ""}>${esc(M.CLICKS[k])}</option>`).join("")}</select><button id="stest">Testar</button></span></div>
  <h3 style="margin:14px 0 2px">📱 Controle por giro do celular</h3>
  <p class="mu" style="margin:2px 0 4px">Incline o celular para <b>dirigir o rover</b> e <b>pilotar a nave</b>: esquerda/direita vira; o topo da tela para a frente acelera ou sobe. Funciona em retrato e paisagem.</p>
  <div class="srow"><span>Controlar girando o celular</span><button id="tlon" class="tgl ${T.on ? "sel" : ""}">${T.on ? "Sim" : "Não"}</button></div>
  <div class="srow"><span>Sensibilidade</span><input id="tlsens" style="min-width:110px" type="range" min="15" max="50" value="${T.sens}"><span class="v">${T.sens}°</span></div>
  <p class="mu" style="margin:2px 0">Menos graus = mais sensível.</p>
  <div class="srow"><span>Inverter eixo vertical <small class="mu">(estilo avião)</small></span><button id="tlinv" class="tgl ${T.invY ? "sel" : ""}">${T.invY ? "Sim" : "Não"}</button></div>
  <div class="srow"><span>Posição neutra</span><button id="tlcal">Calibrar agora</button></div>
  <p class="mu" id="tlstate" style="margin:4px 0">${!TILT.supported ? "Este aparelho/navegador não tem sensor de movimento." : TILT.has ? "✔ Sensor de movimento detectado." : "Sensor ainda não detectado (use um celular; no iPhone toque em “Sim” para permitir)."}</p>
  <div class="srow"><span class="mu">Direção</span><div class="tb" style="flex:1;max-width:260px"><u><i id="tlx" style="width:50%;margin-left:25%;background:var(--ac)"></i></u></div></div>
  <div class="srow"><span class="mu">Acelerador</span><div class="tb" style="flex:1;max-width:260px"><u><i id="tly" style="width:50%;margin-left:25%;background:var(--ok)"></i></u></div></div>
  <h3 style="margin:14px 0 2px">🖥 Computador de bordo (Ajuda · H)</h3>
  <div class="srow"><span>Escrever o próximo passo na tela <small class="mu">(fixo, sem abrir o painel)</small></span><button id="hlp" class="tgl ${A.help ? "sel" : ""}">${A.help ? "Sim" : "Não"}</button></div>
  <div class="srow"><span>Falar o próximo passo em voz alta</span><button id="hvz" class="tgl ${A.vz ? "sel" : ""}">${A.vz ? "Sim" : "Não"}</button></div>
  <p class="mu" style="margin:2px 0">Sempre dá para abrir o painel completo com a tecla <b>H</b> (ou tocando no texto ou no botão 🖥).</p>
  <h3 style="margin:14px 0 2px">♿ Acessibilidade e celular</h3>
  <div class="srow"><span>Tamanho do texto</span><select id="ats">${[[1, "Normal"], [1.15, "Grande"], [1.3, "Muito grande"]].map(([v, n]) => `<option value="${v}" ${A.ts == v ? "selected" : ""}>${n}</option>`).join("")}</select></div>
  <div class="srow"><span>Alto contraste</span><button id="ahc" class="tgl ${A.hc ? "sel" : ""}">${A.hc ? "Sim" : "Não"}</button></div>
  <div class="srow"><span>Reduzir animações</span><button id="arm" class="tgl ${A.rm ? "sel" : ""}">${A.rm ? "Sim" : "Não"}</button></div>
  <div class="srow"><span>Vibrar ao tocar <small class="mu">(celular)</small></span><button id="avb" class="tgl ${A.vib ? "sel" : ""}">${A.vib ? "Sim" : "Não"}</button></div>
  <div class="srow"><span>Textos escondidos <small class="mu">(toque num texto para escondê-lo)</small></span><button id="ashow">Mostrar todos</button></div>
  <p class="mu" style="margin:8px 0 0">Dicas no celular: arraste para girar a câmera, use dois dedos (pinça) para aproximar e afastar, e o joystick à esquerda para andar.</p>`;
  const tl = b.querySelector(".tl"); if (tl) tl.scrollTop = scroll;
  if ($("#sems")) { $("#sems").onclick = async () => { $("#semr").textContent = "Salvando…"; const x = await RESET.setEmail(ACC.user, $("#sep").value, $("#sem").value); $("#semr").textContent = x.ok ? "✔ Salvo: " + x.hint : x.err || "Falha"; }; $("#srst").onclick = () => { closeSettings(); RESET.ask(ACC.user); }; }
  $("#setx").onclick = closeSettings; $("#mon").onclick = () => M.toggle(); $("#son").onclick = () => M.setSfx(!M.sfxOn);
  const drag = (id, f) => { const el = $(id); el.oninput = () => { f(+el.value / 100); el.nextElementSibling.textContent = el.value + "%"; }; el.onchange = () => settingsRefresh(); };
  drag("#mvol", (v) => M.setVol(v)); drag("#svol", (v) => M.setSfxVol(v));
  $("#sst").onchange = (e) => { M.setSfxStyle(e.target.value); M.click(e.target.value); }; $("#stest").onclick = () => M.click();
  $("#tlon").onclick = async () => { if (T.on && TILT.has) TILT.disable(); else { const ok = await TILT.enable(); if (!ok) toast("Não foi possível acessar o sensor de movimento (permissão negada ou sem sensor)", 4000); } settingsRefresh(); };
  $("#tlinv").onclick = () => { TILT.set("invY", !T.invY); settingsRefresh(); }; $("#tlcal").onclick = () => { TILT.calibrate(); toast("Posição neutra calibrada"); };
  $("#tlsens").oninput = (e) => { TILT.set("sens", +e.target.value); e.target.nextElementSibling.textContent = e.target.value + "°"; };
  window.__tiltLive = () => { const x = $("#tlx"), y = $("#tly"); if (!x || !y) return; const f = (el, v) => { el.style.width = Math.abs(v) * 25 + "%"; el.style.marginLeft = (v < 0 ? 50 - Math.abs(v) * 25 : 50) + "%"; }; f(x, T.tx); f(y, -T.ty); };
  $("#hlp").onclick = () => { A11Y.set("help", !A.help); CPU.line(); settingsRefresh(); }; $("#hvz").onclick = () => { A11Y.set("vz", !A.vz); settingsRefresh(); };
  $("#ats").onchange = (e) => { A11Y.set("ts", +e.target.value); settingsRefresh(); }; $("#ahc").onclick = () => { A11Y.set("hc", !A.hc); settingsRefresh(); }; $("#arm").onclick = () => { A11Y.set("rm", !A.rm); settingsRefresh(); }; $("#avb").onclick = () => { A11Y.set("vib", !A.vib); if (!A.vib && navigator.vibrate) navigator.vibrate(30); settingsRefresh(); };
  $("#ashow").onclick = () => { document.querySelectorAll("[data-min]").forEach((x) => x.classList.remove("min")); ["#hint", "#inh"].forEach((s) => delete $(s).dataset.gone); toast("Textos restaurados"); };
  b.querySelectorAll("[data-t]").forEach((x) => (x.onclick = () => { M.select(x.dataset.t); }));
};
$("#setbtn").onclick = () => ($("#setm").classList.contains("on") ? closeSettings() : openSettings());
$("#setm").addEventListener("pointerdown", (e) => { if (e.target.id == "setm") closeSettings(); });
