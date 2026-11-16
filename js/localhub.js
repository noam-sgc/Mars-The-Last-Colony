/* Servidor local de demonstração: roda o MESMO Hub do servidor Node dentro do navegador,
   com dados em localStorage. Usado quando não há servidor web (ex.: abrir index.html direto
   ou publicar a página estática). Não é seguro: serve apenas para jogar/testar offline. */
const LocalHub = (() => {
  const KEY = "mars-localhub-v1", DEMO_ADMIN_PW = "demo-admin";
  const hex = (b) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
  async function sha(s) {
    try { return hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s))); }
    catch (e) { let h = 5381; for (const ch of s) h = ((h << 5) + h + ch.charCodeAt(0)) | 0; return "x" + (h >>> 0).toString(16); }
  }
  const hash = async (pw) => { const s = MarsHub.rnd(8); return s + ":" + (await sha(s + pw)); };
  const verify = async (pw, h) => { const [s, d] = String(h).split(":"); return !!s && (await sha(s + pw)) === d; };
  let store = {};
  try { store = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { /* ignore */ }
  const persist = (s) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* ignore */ } };
  const hub = new MarsHub.Hub({ store, persist, hash, verify });
  const NPCS = [["Ana_BR", "BR"], ["Kenji_JP", "JP"], ["Maria_MX", "MX"], ["Lucas_PT", "PT"], ["Sofia_AR", "AR"], ["Noah_US", "US"]];
  const ready = (async () => {
    await hub.ensureAdmins({ ADMVinnil: DEMO_ADMIN_PW, ADMKezle: DEMO_ADMIN_PW, ADMLefaar: DEMO_ADMIN_PW }, { ADMVinnil: "BR", ADMKezle: "BR", ADMLefaar: "BR" });
    NPCS.forEach(([n, c]) => { const k = MarsRules.key(n); if (!hub.store.users[k]) { const u = hub.newUser(n, c, ""); u.npc = true; hub.store.users[k] = u; } });
    const a = hub.store.users[MarsRules.key("Ana_BR")], v = hub.store.users[MarsRules.key("ADMVinnil")];
    if (a && v && !a.friends.includes(MarsRules.key("ADMVinnil"))) { a.friends.push(MarsRules.key("ADMVinnil")); v.friends.push(MarsRules.key("Ana_BR")); }
    hub.save();
  })();
  return {
    DEMO_ADMIN_PW, ready, hub,
    connect(onmsg) {
      const c = hub.connect((m) => setTimeout(() => onmsg(m), 0));
      return { send: (m) => { ready.then(() => hub.handle(c, JSON.parse(JSON.stringify(m)))); }, close: () => hub.disconnect(c) };
    },
  };
})();
