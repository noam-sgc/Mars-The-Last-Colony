/* Mural global no cliente: guarda a cópia local do mural replicado (contas, eventos, itens de admin, avisos),
   aplica os itens no mundo local (Hub) e no estado do jogo, e sincroniza pelo canal WebRTC global (js/global.js). */
const BUL = (() => {
  const KEY = "mars-bul-v2", SEEN = "mars-bulseen";
  let store = MarsBul.newStore(); try { const v = JSON.parse(localStorage.getItem(KEY) || "null"); if (v) MarsBul.KINDS.forEach((k) => { Object.values(v[k] || {}).forEach((it) => MarsBul.merge(store, it)); }); } catch (e) { /* ignore */ }
  let seen = new Set(); try { seen = new Set(JSON.parse(localStorage.getItem(SEEN) || "[]")); } catch (e) { /* ignore */ }
  let saveT = 0, syncedAt = 0; const waiters = [];
  const save = () => { clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(store)); localStorage.setItem(SEEN, JSON.stringify([...seen].slice(-300))); } catch (e) { /* ignore */ } }, 400); };
  const hubItem = (it) => (it.del ? { k: it.k, id: it.id, by: it.by, ts: it.ts, del: true } : { k: it.k, id: it.id, by: it.by, ts: it.ts, d: it.d });
  /** Aplica itens ao Hub local e ao estado do jogo. */
  function apply(items) {
    let ev = false, cat = false; items = items.slice().sort((a, b) => MarsBul.KINDS.indexOf(a.k) - MarsBul.KINDS.indexOf(b.k));
    items.forEach((it) => {
      if (it.k === "msg") { if (!it.del && !seen.has(it.id) && Date.now() - it.ts < 864e5) { seen.add(it.id); if (it.by !== ACC.user && typeof showGmsg === "function") showGmsg({ from: it.by, text: it.d.text }); } return; }
      try { LocalHub.hub.ingest(hubItem(it)); } catch (e) { /* ignore */ }
      if (it.k === "ev") ev = true; else if (it.k !== "acct" && it.k !== "sav") cat = true;
    });
    if (ev && typeof EV !== "undefined") { EV.glob = MarsBul.live(store, "ev").map((x) => Object.assign({ id: x.id, by: x.by }, x.d)); EV.refresh(); if (typeof menu === "function" && $("#menu") && $("#menu").classList.contains("on")) menu(); }
    if (cat && typeof refreshCatalog === "function") refreshCatalog();
    save();
  }
  const api = {
    store, get synced() { return syncedAt > 0; },
    /** Itens vivos de um tipo, já no formato final (d). */
    liveData: (k) => MarsBul.live(store, k).map((x) => x.d),
    snapshot: () => MarsBul.all(store),
    hasAcct: (name) => !!store.acct[MarsRules.key(name)],
    /** Novo item criado aqui (conta, evento, publicação, aviso): guarda, aplica e espalha. */
    add(it) { if (!MarsBul.merge(store, it)) return false; apply([store[it.k][it.id]]); if (typeof GS !== "undefined") GS.pushBul([store[it.k][it.id]]); if (typeof CLOUD !== "undefined") CLOUD.push([store[it.k][it.id]]); return true; },
    /** Itens vindos da rede: devolve os que realmente mudaram (para o registro repassar). */
    receive(items) { const ch = []; (items || []).forEach((it) => { if (MarsBul.merge(store, it)) ch.push(store[it.k][it.id]); }); if (ch.length) apply(ch); return ch; },
    applyAll() { apply(MarsBul.all(store)); },
    markSynced() { if (!syncedAt) { syncedAt = Date.now(); waiters.splice(0).forEach((f) => f(true)); } },
    resetSync() { syncedAt = 0; },
    /** Espera (até ms) a primeira sincronização com o mural global; resolve false se não conectou a tempo. */
    whenSynced(ms) { return syncedAt ? Promise.resolve(true) : new Promise((r) => { waiters.push(r); setTimeout(() => r(false), ms || 3000); }); },
  };
  return api;
})();
