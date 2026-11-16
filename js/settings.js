/* Configurações: volume da música, trilha sonora (escolha da faixa) e som de clique. */
function openSettings() { $("#setm").classList.add("on"); settingsRefresh(); }
function closeSettings() { $("#setm").classList.remove("on"); }
window.settingsRefresh = function () {
  if (!$("#setm").classList.contains("on")) return; const M = Music, A = A11Y.get(), b = $("#setb"), scroll = (b.querySelector(".tl") || {}).scrollTop || 0;
  const cur = M.cur, row = (t) => `<button class="trk ${M.sel === t.id ? "sel" : ""}" data-t="${t.id}"><span style="font-size:22px">${t.kind === "file" ? "🎵" : "🎼"}</span><span><b>${esc(t.name)}</b><small>${esc(t.desc)}</small></span>${cur === t.id && M.on ? `<span class="np">▶ tocando</span>` : ""}</button>`;
  b.innerHTML = `<div class="up"><b style="font-size:20px">⚙ Configurações</b><button id="setx" class="pri">Fechar</button></div>
  <h3 style="margin:10px 0 2px">🎧 Música</h3>
  <div class="srow"><span>Música ligada <small class="mu">(tecla M)</small></span><button id="mon" class="tgl ${M.on ? "sel" : ""}">${M.on ? "Sim" : "Não"}</button></div>
  <div class="srow"><span>Intensidade (volume)</span><input id="mvol" type="range" min="0" max="100" value="${Math.round(M.vol * 100)}"><span class="v">${Math.round(M.vol * 100)}%</span></div>
  <h3 style="margin:14px 0 2px">🎶 Trilha sonora</h3><p class="mu" style="margin:2px 0 4px">Tocando agora: <b>${esc(M.trackName() || "—")}</b>${M.sel === "auto" ? " (automática)" : ""}</p>
  <div class="tl" style="max-height:26vh;overflow:auto"><button class="trk ${M.sel === "auto" ? "sel" : ""}" data-t="auto"><span style="font-size:22px">🔀</span><span><b>Automática</b><small>A música muda conforme o momento do jogo (menu, colônia, edifício, nave, tempestade, visitantes)</small></span></button>${M.TRACKS.map(row).join("")}</div>
  <h3 style="margin:14px 0 2px">🔘 Som de clique</h3>
  <div class="srow"><span>Som ao clicar nos botões</span><button id="son" class="tgl ${M.sfxOn ? "sel" : ""}">${M.sfxOn ? "Sim" : "Não"}</button></div>
  <div class="srow"><span>Volume dos cliques</span><input id="svol" type="range" min="0" max="100" value="${Math.round(M.sfxVol * 100)}"><span class="v">${Math.round(M.sfxVol * 100)}%</span></div>
  <div class="srow"><span>Estilo do clique</span><span class="row"><select id="sst">${Object.keys(M.CLICKS).map((k) => `<option value="${k}" ${M.sfxStyle == k ? "selected" : ""}>${esc(M.CLICKS[k])}</option>`).join("")}</select><button id="stest">Testar</button></span></div>
  <h3 style="margin:14px 0 2px">♿ Acessibilidade e celular</h3>
  <div class="srow"><span>Tamanho do texto</span><select id="ats">${[[1, "Normal"], [1.15, "Grande"], [1.3, "Muito grande"]].map(([v, n]) => `<option value="${v}" ${A.ts == v ? "selected" : ""}>${n}</option>`).join("")}</select></div>
  <div class="srow"><span>Alto contraste</span><button id="ahc" class="tgl ${A.hc ? "sel" : ""}">${A.hc ? "Sim" : "Não"}</button></div>
  <div class="srow"><span>Reduzir animações</span><button id="arm" class="tgl ${A.rm ? "sel" : ""}">${A.rm ? "Sim" : "Não"}</button></div>
  <div class="srow"><span>Vibrar ao tocar <small class="mu">(celular)</small></span><button id="avb" class="tgl ${A.vib ? "sel" : ""}">${A.vib ? "Sim" : "Não"}</button></div>
  <div class="srow"><span>Textos escondidos <small class="mu">(toque num texto para escondê-lo)</small></span><button id="ashow">Mostrar todos</button></div>
  <p class="mu" style="margin:8px 0 0">Dicas no celular: arraste para girar a câmera, use dois dedos (pinça) para aproximar e afastar, e o joystick à esquerda para andar.</p>`;
  const tl = b.querySelector(".tl"); if (tl) tl.scrollTop = scroll;
  $("#setx").onclick = closeSettings; $("#mon").onclick = () => M.toggle(); $("#son").onclick = () => M.setSfx(!M.sfxOn);
  const drag = (id, f) => { const el = $(id); el.oninput = () => { f(+el.value / 100); el.nextElementSibling.textContent = el.value + "%"; }; el.onchange = () => settingsRefresh(); };
  drag("#mvol", (v) => M.setVol(v)); drag("#svol", (v) => M.setSfxVol(v));
  $("#sst").onchange = (e) => { M.setSfxStyle(e.target.value); M.click(e.target.value); }; $("#stest").onclick = () => M.click();
  $("#ats").onchange = (e) => { A11Y.set("ts", +e.target.value); settingsRefresh(); }; $("#ahc").onclick = () => { A11Y.set("hc", !A.hc); settingsRefresh(); }; $("#arm").onclick = () => { A11Y.set("rm", !A.rm); settingsRefresh(); }; $("#avb").onclick = () => { A11Y.set("vib", !A.vib); if (!A.vib && navigator.vibrate) navigator.vibrate(30); settingsRefresh(); };
  $("#ashow").onclick = () => { document.querySelectorAll("[data-min]").forEach((x) => x.classList.remove("min")); ["#hint", "#inh"].forEach((s) => delete $(s).dataset.gone); toast("Textos restaurados"); };
  b.querySelectorAll("[data-t]").forEach((x) => (x.onclick = () => { M.select(x.dataset.t); }));
};
$("#setbtn").onclick = () => ($("#setm").classList.contains("on") ? closeSettings() : openSettings());
$("#setm").addEventListener("pointerdown", (e) => { if (e.target.id == "setm") closeSettings(); });
