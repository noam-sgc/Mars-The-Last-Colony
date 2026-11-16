/* Entrada: teclado (WASD/setas), joystick virtual e atalhos. */
const INP = { l: 0, r: 0, u: 0, d: 0, s: 0, jx: 0, jy: 0, onE: null, onEsc: null };
INP.ax = () => [((INP.r - INP.l) || INP.jx), ((INP.u - INP.d) || -INP.jy)];
const KM = { ArrowLeft: "l", a: "l", A: "l", ArrowRight: "r", d: "r", D: "r", ArrowUp: "u", w: "u", W: "u", ArrowDown: "d", s: "d", S: "d", " ": "s" };
const typing = () => /^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement || {}).tagName || "");
addEventListener("keydown", (e) => {
  if (typing()) return;
  const m = KM[e.key]; if (m) { INP[m] = 1; if (e.key.startsWith("Arrow") || e.key === " ") e.preventDefault(); }
  if ((e.key === "e" || e.key === "E") && !e.repeat && INP.onE) INP.onE();
  if (e.key === "Escape" && INP.onEsc) INP.onEsc();
});
addEventListener("keyup", (e) => { const m = KM[e.key]; if (m) INP[m] = 0; });
addEventListener("blur", () => { INP.l = INP.r = INP.u = INP.d = INP.s = 0; });
["#joy", "#joy2"].forEach((id) => {
  const el = $(id), knob = el.firstElementChild; let act = null;
  const mv = (e) => { const r = el.getBoundingClientRect(), x = clamp((e.clientX - r.left - r.width / 2) / (r.width / 2), -1, 1), y = clamp((e.clientY - r.top - r.height / 2) / (r.height / 2), -1, 1), l = Math.hypot(x, y) || 1, k = Math.min(1, l);
    INP.jx = x / l * k; INP.jy = y / l * k; knob.style.transform = `translate(${INP.jx * 32}px,${INP.jy * 32}px)`; };
  el.addEventListener("pointerdown", (e) => { act = e.pointerId; el.setPointerCapture(act); mv(e); e.preventDefault(); });
  el.addEventListener("pointermove", (e) => { if (act === e.pointerId) mv(e); });
  const up = () => { act = null; INP.jx = INP.jy = 0; knob.style.transform = ""; };
  el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
});
