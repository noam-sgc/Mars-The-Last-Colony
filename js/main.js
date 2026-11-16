/* Laço principal, entrada de ponteiro, HUD e inicialização. */
function buildHud() {
  $("#topbar").innerHTML = `<div class="pill">🪙 <b id="hc">0</b></div><div class="pill" id="evp" style="display:none"></div><div class="pill" id="ht">⏱</div><div class="pill" id="tk" style="min-width:210px" data-min="📊 Tanques"></div><div class="pill" id="gl" data-min="📋 Objetivos"></div>
  <div class="pill" id="hr">🔬 <b id="hrv">0</b> RP <button id="hrt">Usar: não</button></div><button id="hs">Loja</button><button id="hz1">＋</button><button id="hz2">－</button><button id="hx">☰ Menu</button>`;
  $("#hz1").onclick = () => (dist = clamp(dist * .85, 8, 90)); $("#hz2").onclick = () => (dist = clamp(dist * 1.15, 8, 90)); $("#hz1").setAttribute("aria-label", "Aproximar a câmera"); $("#hz2").setAttribute("aria-label", "Afastar a câmera"); $("#hx").setAttribute("aria-label", "Voltar ao menu"); ariaInit(); $("#hs").onclick = () => shop(true);
  $("#hx").onclick = () => { G.run = false; menu(); }; $("#hrt").onclick = () => { G.useRP = !G.useRP; $("#hrt").textContent = "Usar: " + (G.useRP ? "sim" : "não"); };
  const ep = $("#evp"); if (EV.mult > 1) { const e = EV.top(); ep.style.display = ""; ep.innerHTML = `${e.icon || "🎉"} <b>${esc(e.name)}</b> · moedas <b>x${EV.mult}</b>`; ep.style.borderColor = e.col; }
}
// ponteiro: arrastar gira a câmera; toque curto interage/constrói
let dr = null; const PT = new Map(); let pinch = 0;
const zoomBy = (f) => { if (IN) IN.dist = clamp(IN.dist * f, 7, 24); else dist = clamp(dist * f, 8, 90); };
cv.addEventListener("pointerdown", (e) => { PT.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (PT.size === 2) { const [a, b] = [...PT.values()]; pinch = Math.hypot(a.x - b.x, a.y - b.y); dr = null; } else dr = { x: e.clientX, y: e.clientY, m: 0 }; try { cv.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ } });
cv.addEventListener("pointermove", (e) => {
  if (PT.has(e.pointerId)) PT.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (PT.size === 2 && !N) { const [a, b] = [...PT.values()], d = Math.hypot(a.x - b.x, a.y - b.y); if (pinch > 0 && d > 0) zoomBy(pinch / d); pinch = d; return; }   // pinça = zoom
  if (!dr) return; const dx = e.clientX - dr.x, dy = e.clientY - dr.y; dr.m += Math.abs(dx) + Math.abs(dy); dr.x = e.clientX; dr.y = e.clientY;
  if (N) { if (e.buttons > 0 || e.pointerType == "touch") { N.nx = clamp((e.clientX / innerWidth - .5) * 2.4, -1, 1); N.ny = clamp(-(e.clientY / innerHeight - .5) * 2.4, -1, 1); } return; }
  if (IN) { IN.yaw -= dx * .006; IN.pit = clamp(IN.pit + dy * .005, .15, 1.2); } else { yaw -= dx * .005; pit = clamp(pit + dy * .005, .15, 1.4); }
});
const pend = (e) => { PT.delete(e.pointerId); if (PT.size < 2) pinch = 0; };
cv.addEventListener("pointercancel", pend);
cv.addEventListener("pointerup", (e) => { pend(e); if (N) { N.nx = 0; N.ny = 0; } if (dr && dr.m < 6 && G.run && G.mode != "nav" && !DLG) { if (IN) interiorClick(e); else click(e); } dr = null; });
cv.addEventListener("wheel", (e) => { zoomBy(1 + Math.sign(e.deltaY) * .1); }, { passive: true });
INP.onEsc = () => { if ($("#setm").classList.contains("on")) closeSettings(); else if (DLG) closeDlg(); else if (DR) exitRover(); else if (IN) exitInterior(); else if ($("#adm").classList.contains("on")) closeModal(); };
$("#dlg").addEventListener("pointerdown", (e) => { if (e.target.id == "dlg" && DLG) closeDlg(); });

function musicMood() {
  if (IN) return "interior"; if (!G.run) return "menu"; if (G.mode == "nav") return "nav";
  const ph = G.mode == "solo" ? PH[G.ph] : null; return ph && ph.alien ? "alien" : ph && ph.storm ? "storm" : "colony";
}
setInterval(() => Music.setMood(musicMood()), 500);
let last = performance.now(), fogT = 0;
function loop(n) {
  const dt = Math.min(.1, (n - last) / 1000), t = n / 1000; last = n; if (G.run && !G.paused) { tick(dt); hud(); }
  if (IN) { interiorUpdate(dt, t); R.render(IN.sc, IN.cam); requestAnimationFrame(loop); return; }
  const colony = G.mode != "nav";
  if (G.run && colony) {
    const st = G.mode == "solo" && PH[G.ph] && PH[G.ph].storm; sc.fog.density = st ? .014 + .008 * Math.sin(t * .8) : .006; sun.intensity = st ? .65 + .2 * Math.sin(t * 3) : 1.15;
    movePlayer(dt, t); moveColonists(dt, t);
    sun.position.set(PL.x + 50, 80, PL.z + 30); sun.target.position.set(PL.x, 0, PL.z); sun.target.updateMatrixWorld();
    UFOS.children.forEach((u) => { const a = t * .15 + u.userData.a, r = u.userData.r; u.position.set(Math.cos(a) * r, 34 + Math.sin(t + u.userData.a) * 2, Math.sin(a) * r); u.rotation.y = t; });
  }
  G.placed.forEach((p) => { const u = p.m.userData; if (p.t == "rover" && !p.park) { p.m.position.x = p.x + Math.cos(t * .5 + p.a) * 4; p.m.position.z = p.z + Math.sin(t * .5 + p.a) * 4; p.m.rotation.y = -(t * .5 + p.a); } if (u.anim) u.anim.forEach((f) => f(t)); });
  Object.keys(peerG).forEach((k) => { if (peerG[k].m) peerG[k].m.forEach((o) => o.userData.anim && o.userData.anim.forEach((f) => f(t))); });
  dust.position.x = (PL.x || 0) + Math.sin(t * .1) * 4; dust.position.z = PL.z || 0; dust.rotation.y = t * .01;
  if (G.mode == "nav") navCam(); else camU(); R.render(sc, cam); requestAnimationFrame(loop);
}

// ---------- inicialização ----------
(async function boot() {
  loadLocal(); EV.refresh(); setInterval(() => { EV.refresh(); }, 60000); requestAnimationFrame(loop);
  let lastW = null; try { lastW = localStorage.getItem("mars-last"); } catch (e) { /* ignore */ }
  if (lastW && /^[A-Z0-9]{4,12}$/.test(lastW) && lastW !== "SELF") { try { await NET.joinWorld(lastW); return resumeOrAuth(); } catch (e) { toast("Não foi possível reconectar ao mundo " + esc(lastW) + ". Abrindo o seu mundo.", 5000); } }
  enterSelf();   // padrão: o seu mundo, com todo o jogo (solo, sandbox, bots, loja, guarda-roupa); amigos entram pelo código
})();
