/* Laço principal, entrada de ponteiro, HUD e inicialização. */
function buildHud() {
  $("#topbar").innerHTML = `<div class="pill">🪙 <b id="hc">0</b></div><div class="pill" id="evp" style="display:none"></div><div class="pill" id="ht">⏱</div><div class="pill" id="tk" style="min-width:210px"></div><div class="pill" id="gl"></div>
  <div class="pill" id="hr">🔬 <b id="hrv">0</b> RP <button id="hrt">Usar: não</button></div><button id="hs">Loja</button><button id="hz1">＋</button><button id="hz2">－</button><button id="hx">☰ Menu</button>`;
  $("#hz1").onclick = () => (dist = clamp(dist * .85, 8, 90)); $("#hz2").onclick = () => (dist = clamp(dist * 1.15, 8, 90)); $("#hs").onclick = () => shop(true);
  $("#hx").onclick = () => { G.run = false; menu(); }; $("#hrt").onclick = () => { G.useRP = !G.useRP; $("#hrt").textContent = "Usar: " + (G.useRP ? "sim" : "não"); };
  const ep = $("#evp"); if (EV.mult > 1) { const e = EV.top(); ep.style.display = ""; ep.innerHTML = `${e.icon || "🎉"} <b>${esc(e.name)}</b> · moedas <b>x${EV.mult}</b>`; ep.style.borderColor = e.col; }
}
// ponteiro: arrastar gira a câmera; toque curto interage/constrói
let dr = null;
cv.addEventListener("pointerdown", (e) => { dr = { x: e.clientX, y: e.clientY, m: 0 }; cv.setPointerCapture(e.pointerId); });
cv.addEventListener("pointermove", (e) => {
  if (!dr) return; const dx = e.clientX - dr.x, dy = e.clientY - dr.y; dr.m += Math.abs(dx) + Math.abs(dy); dr.x = e.clientX; dr.y = e.clientY;
  if (N) { if (e.buttons > 0 || e.pointerType == "touch") { N.nx = clamp((e.clientX / innerWidth - .5) * 2.4, -1, 1); N.ny = clamp(-(e.clientY / innerHeight - .5) * 2.4, -1, 1); } return; }
  if (IN) { IN.yaw -= dx * .006; IN.pit = clamp(IN.pit + dy * .005, .15, 1.2); } else { yaw -= dx * .005; pit = clamp(pit + dy * .005, .15, 1.4); }
});
cv.addEventListener("pointerup", (e) => { if (N) { N.nx = 0; N.ny = 0; } if (dr && dr.m < 6 && G.run && G.mode != "nav" && !DLG) { if (IN) interiorClick(e); else click(e); } dr = null; });
cv.addEventListener("wheel", (e) => { if (IN) IN.dist = clamp(IN.dist * (1 + Math.sign(e.deltaY) * .1), 7, 24); else dist = clamp(dist * (1 + Math.sign(e.deltaY) * .1), 8, 90); }, { passive: true });
INP.onEsc = () => { if (DLG) closeDlg(); else if (IN) exitInterior(); else if ($("#adm").classList.contains("on")) closeModal(); };
$("#dlg").addEventListener("pointerdown", (e) => { if (e.target.id == "dlg" && DLG) closeDlg(); });

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
  G.placed.forEach((p) => { const u = p.m.userData; if (p.t == "rover") { p.m.position.x = p.x + Math.cos(t * .5 + p.a) * 4; p.m.position.z = p.z + Math.sin(t * .5 + p.a) * 4; p.m.rotation.y = -(t * .5 + p.a); } if (u.anim) u.anim.forEach((f) => f(t)); });
  Object.keys(peerG).forEach((k) => { if (peerG[k].m) peerG[k].m.forEach((o) => o.userData.anim && o.userData.anim.forEach((f) => f(t))); });
  dust.position.x = (PL.x || 0) + Math.sin(t * .1) * 4; dust.position.z = PL.z || 0; dust.rotation.y = t * .01;
  if (G.mode == "nav") navCam(); else camU(); R.render(sc, cam); requestAnimationFrame(loop);
}

// ---------- inicialização ----------
(async function boot() {
  const mode = await NET.connect(); EV.refresh(); setInterval(() => { EV.refresh(); }, 60000);
  loadLocal(); let tok = null; try { tok = localStorage.getItem("mars-token"); } catch (e) { /* ignore */ }
  requestAnimationFrame(loop);
  if (tok) { const r = await NET.ask({ t: "resume", token: tok }); if (r.ok) { r.token = tok; return applyAuth(r); } }
  authScreen();
})();
