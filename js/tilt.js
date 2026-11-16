/* Controle por giro do celular (giroscópio/acelerômetro) para o rover e para a nave.
   Inclinar para a direita/esquerda vira; inclinar o topo da tela para longe (para a frente) acelera/sobe.
   Funciona em retrato e paisagem; no iOS pede permissão ao ligar. */
const TILT = (() => {
  const st = { on: false, has: false, perm: "idle", sens: 30, invY: false, b: 0, g: 0, b0: null, g0: null, a0: null, tx: 0, ty: 0 };
  try { const v = JSON.parse(localStorage.getItem("mars-tilt") || "{}"); st.on = !!v.on; st.sens = clamp(+v.sens || 30, 15, 50); st.invY = !!v.invY; } catch (e) { /* ignore */ }
  const save = () => { try { localStorage.setItem("mars-tilt", JSON.stringify({ on: st.on, sens: st.sens, invY: st.invY })); } catch (e) { /* ignore */ } };
  const angle = () => { const a = (screen.orientation && typeof screen.orientation.angle === "number") ? screen.orientation.angle : (typeof window.orientation === "number" ? window.orientation : 0); return ((a % 360) + 360) % 360; };
  const wrap = (d) => ((d + 540) % 360) - 180;
  function onOri(e) {
    if (e.beta == null || e.gamma == null) return; st.has = true; st.b = e.beta; st.g = e.gamma;
    const a = angle(); if (st.b0 == null || st.a0 !== a) { st.b0 = st.b; st.g0 = st.g; st.a0 = a; }   // calibra ao começar e ao girar a tela
    const db = wrap(st.b - st.b0), dg = st.g - st.g0;
    // steer: + = direita; fwd: + = topo da tela para longe (frente)
    let steer, fwd; if (a === 90) { steer = db; fwd = dg; } else if (a === 270) { steer = -db; fwd = -dg; } else if (a === 180) { steer = -dg; fwd = db; } else { steer = dg; fwd = -db; }
    const dz = 3, k = (v) => { v = Math.abs(v) < dz ? 0 : v - Math.sign(v) * dz; return clamp(v / (st.sens - dz), -1, 1); };
    st.tx = k(steer); st.ty = k(fwd) * (st.invY ? -1 : 1);
    if (typeof settingsRefresh === "function" && window.__tiltLive) window.__tiltLive();
  }
  const api = {
    st,
    get supported() { return "DeviceOrientationEvent" in window; },
    get has() { return st.has; }, get on() { return st.on; },
    /** Ativo só dirigindo o rover ou pilotando a nave. */
    active() { return st.on && st.has && ((typeof DR !== "undefined" && DR) || (typeof G !== "undefined" && G.run && G.mode === "nav")); },
    axes() { return api.active() ? [st.tx, st.ty] : null; },
    calibrate() { st.b0 = st.b; st.g0 = st.g; st.a0 = angle(); },
    async enable() {
      if (!api.supported) { st.perm = "unsupported"; return false; }
      try { if (typeof DeviceOrientationEvent.requestPermission === "function") { const r = await DeviceOrientationEvent.requestPermission(); st.perm = r; if (r !== "granted") return false; } else st.perm = "granted"; } catch (e) { st.perm = "denied"; return false; }
      st.on = true; api.calibrate(); save(); return true;
    },
    disable() { st.on = false; st.tx = st.ty = 0; save(); },
    set(k, v) { st[k] = v; save(); },
    onOri,   // exposto para testes
  };
  // Sempre escuta (no iOS os eventos só chegam depois da permissão; se estava ligado e não chegam, o botão pede de novo).
  if (api.supported) addEventListener("deviceorientation", onOri, true);
  return api;
})();
INP.tiltFn = () => TILT.axes();

/** Botão rápido no jogo (celular): liga/desliga o giro enquanto dirige o rover ou pilota a nave. */
function tiltUI() {
  const b = document.getElementById("tiltb"); if (!b) return; const show = TOUCH && TILT.supported && ((typeof DR !== "undefined" && DR) || (typeof G !== "undefined" && G.mode === "nav" && G.run));
  b.style.display = show ? "block" : "none"; if (show) b.textContent = TILT.on && TILT.has ? "📱 Giro ligado · toque p/ desligar" : "📱 Ligar controle por giro";
}
document.getElementById("tiltb").addEventListener("click", async () => {
  if (TILT.on && TILT.has) { TILT.disable(); toast("Controle por giro desligado"); return; }
  const ok = await TILT.enable(); toast(ok ? "📱 Giro ligado: incline para a esquerda/direita para virar e para a frente/trás para acelerar" : "Não foi possível acessar o sensor de movimento", 4000);
});
