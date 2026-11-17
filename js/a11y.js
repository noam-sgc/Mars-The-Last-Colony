/* Acessibilidade e conforto em smartphones: textos clicáveis que somem, ajuste de texto, alto contraste,
   reduzir animações, vibração ao tocar, ARIA e alvos de toque maiores. */
const TOUCH = matchMedia("(pointer:coarse)").matches;
const A11Y = (() => {
  const d = { ts: 1, hc: false, rm: false, vib: TOUCH, help: false, vz: false };
  let v = Object.assign({}, d); try { Object.assign(v, JSON.parse(localStorage.getItem("mars-a11y") || "{}")); } catch (e) { /* ignore */ }
  const api = {
    get: () => v,
    set(k, x) { v[k] = x; try { localStorage.setItem("mars-a11y", JSON.stringify(v)); } catch (e) { /* ignore */ } api.apply(); },
    apply() { const r = document.documentElement; r.style.setProperty("--ts", v.ts); r.classList.toggle("hc", !!v.hc); r.classList.toggle("rm", !!v.rm || matchMedia("(prefers-reduced-motion:reduce)").matches); },
  };
  api.apply(); return api;
})();

/** Dica curta que o jogador pode dispensar tocando nela (volta só quando o texto mudar). */
function setHint(el, msg) {
  if (!msg) { el.style.display = "none"; return; }
  if (el.dataset.gone && el.dataset.gone !== msg) delete el.dataset.gone;
  if (el.dataset.gone === msg) { el.style.display = "none"; return; }
  el.textContent = msg; el.style.display = "block";
}
// Clicar no texto faz ele desaparecer: dicas e avisos somem; painéis grandes viram um chip pequeno que reabre ao tocar.
document.addEventListener("click", (e) => {
  const t = e.target;
  const toast = t.closest && t.closest(".toast"); if (toast) { toast.remove(); return; }
  const hint = t.closest && t.closest("#hint, #inh"); if (hint) { hint.dataset.gone = hint.textContent; hint.style.display = "none"; return; }
  const pan = t.closest && t.closest("[data-min]"); if (pan && !t.closest("button, input, select, a")) pan.classList.toggle("min");
});
/** Botão de ação para celular (equivale à tecla E): mostra o que dá para fazer perto do jogador. */
function setAct(label) { document.querySelectorAll(".act").forEach((b) => { if (!label) { b.style.display = "none"; return; } b.textContent = label; b.style.display = "block"; }); }
document.querySelectorAll(".act").forEach((b) => b.addEventListener("click", () => { if (INP.onE) INP.onE(); }));
function ariaInit() {
  const set = (s, a) => { const el = document.querySelector(s); if (el) Object.entries(a).forEach(([k, v]) => el.setAttribute(k, v)); };
  set("#toasts", { role: "status", "aria-live": "polite" }); set("#chb", { "aria-label": "Abrir chat" }); set("#setbtn", { "aria-label": "Configurações" });
  set("#joy", { role: "application", "aria-label": "Joystick de movimento" }); set("#joy2", { role: "application", "aria-label": "Joystick de movimento" }); set("#nt", { "aria-label": "Impulso da nave" });
  document.querySelectorAll(".mod").forEach((m) => { m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true"); });
  document.querySelectorAll("[data-min]").forEach((m) => { m.setAttribute("title", "Toque no texto para esconder ou mostrar"); });
}
ariaInit();
// vibração curta ao tocar em controles (útil no celular; pode ser desligada em Configurações)
addEventListener("click", (e) => { if (!A11Y.get().vib || !navigator.vibrate) return; const b = e.target.closest && e.target.closest("button, .card, .it, [data-m]"); if (b && !b.disabled) try { navigator.vibrate(10); } catch (x) { /* ignore */ } }, true);
