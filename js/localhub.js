/* Mundo local: roda o MESMO Hub do servidor Node dentro do navegador (dados em localStorage).
   Em modo sem servidor, cada jogador é o "servidor" do próprio mundo e aceita amigos por WebRTC (js/p2p.js). */
const LocalHub = (() => {
  const KEY = "mars-localhub-v1", ITER = 150000;
  const hex = (b) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
  const unhex = (h) => new Uint8Array((h.match(/../g) || []).map((x) => parseInt(x, 16)));
  async function pbkdf2(pw, saltHex, iter) {
    const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveBits"]);
    return hex(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: unhex(saltHex), iterations: iter }, k, 256));
  }
  const hash = async (pw) => { const s = MarsHub.rnd(16).replace(/[^0-9a-f]/g, "a").padEnd(32, "0").slice(0, 32); return `p1:${ITER}:${s}:` + (await pbkdf2(pw, s, ITER)); };
  const verify = async (pw, h) => { const [v, it, s, d] = String(h).split(":"); if (v !== "p1" || !s) return false; return (await pbkdf2(pw, s, +it)) === d; };
  let store = {};
  try { store = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { /* ignore */ }
  // Migração (v5) — RESET DAS CONTAS: versões anteriores deixaram contas duplicadas/perdidas (ex.: ADMKezle criado várias vezes).
  // Apaga contas, sessões e progresso por conta deste navegador, uma única vez. Eventos e catálogo do mundo são mantidos.
  if ((store.ver || 0) < 5) {
    store.users = {}; store.sessions = {}; store.global = []; store.lb = {}; store.ver = 5;
    try { Object.keys(localStorage).forEach((k) => { if (/^(mars-token:|mlc:|mlp:)/.test(k)) localStorage.removeItem(k); }); localStorage.removeItem("mars-last"); localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* ignore */ }
  }
  const persist = (s) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* ignore */ } };
  const hub = new MarsHub.Hub({ store, persist, hash, verify, onGlobal: (it) => BUL.add(it) });   // contas, eventos, itens e avisos vão para o mural global
  const ready = Promise.resolve();
  return {
    ready, hub,
    /** Conexão do próprio jogador (anfitrião) ao seu mundo. */
    connect(onmsg) {
      const c = hub.connect((m) => setTimeout(() => onmsg(m), 0));
      return { send: (m) => hub.handle(c, JSON.parse(JSON.stringify(m))), close: () => hub.disconnect(c) };
    },
    /** Conexão de um convidado remoto (WebRTC): send(m) entrega ao convidado; devolve handlers. */
    attach(send) {
      const c = hub.connect(send);
      return { recv: (m) => hub.handle(c, m), close: () => hub.disconnect(c) };
    },
  };
})();
