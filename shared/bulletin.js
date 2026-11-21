/* Mural global replicado entre os jogadores (gossip): contas, eventos e itens publicados por admins/desenhistas,
   avisos globais. Sem servidor: cada navegador guarda uma cópia e todos se sincronizam pelo canal WebRTC global.
   Regras de mesclagem determinísticas, para todos convergirem para o mesmo estado. UMD (navegador e Node). */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./rules.js"));
  else root.MarsBul = factory(root.MarsRules);
})(typeof self !== "undefined" ? self : this, function (R) {
  "use strict";
  const KINDS = ["acct", "ev", "cos", "part", "up", "chr", "msg", "sav"], MAXD = 6000, MAXSAV = 24000;
  const newStore = () => ({ acct: {}, ev: {}, cos: {}, part: {}, up: {}, chr: {}, msg: {}, sav: {} });
  const str = (v, n) => typeof v === "string" && v.length <= n;
  /** O item é aceitável? (formato + permissões declaradas: admin para ev/msg, desenhista para cos/part/up) */
  function valid(it) {
    if (!it || typeof it !== "object" || !KINDS.includes(it.k) || !str(it.id, 60) || !Number.isFinite(it.ts)) return false;
    if (it.del) return it.k !== "acct" && it.k !== "sav" && (it.k === "ev" || it.k === "msg" ? R.isAdmin(it.by) : R.isArtist(it.by));
    const d = it.d; if (!d || typeof d !== "object" || JSON.stringify(d).length > (it.k === "sav" ? MAXSAV : it.k === "cos" ? 130000 : MAXD)) return false;
    switch (it.k) {
      case "acct": return R.validName(d.name) && R.key(d.name) === it.id && str(d.pass, 200) && /^p1:\d+:[0-9a-f]+:[0-9a-f]+$/.test(d.pass) && R.validCountry(d.cc) && Number.isFinite(d.created) && (d.pwts == null || Number.isFinite(d.pwts));
      case "sav": return R.validName(it.by) && R.key(it.by) === it.id && d.p && typeof d.p === "object" && d.s && typeof d.s === "object";   // progresso da conta (o mais novo vence)
      case "ev": return R.isAdmin(it.by) && str(d.name, 40) && Number.isFinite(d.start) && Number.isFinite(d.end) && d.end > d.start;
      case "msg": return R.isAdmin(it.by) && str(d.text, 240);
      default: return R.isArtist(it.by) && str(d.n, 40) && str(d.id, 60);   // cos/part/up
    }
  }
  /** Mescla um item no store. Contas: vence a mais antiga (primeiro a registrar o nome). Demais: o mais novo vence. Retorna true se mudou. */
  function merge(store, it, trusted) {
    if (!valid(it)) return false; const m = store[it.k], cur = m[it.id];
    if (it.k === "acct") {
      const pw = it.d.pwts || 0, cp = (cur && cur.d.pwts) || 0;
      // Redefinição de senha: só a nuvem (trusted) troca o hash, na mesma conta (created igual) e com pwts maior.
      if (cur && (pw || cp)) { if (trusted && pw > cp && it.d.created === cur.d.created) { m[it.id] = { k: it.k, id: it.id, ts: it.ts, d: it.d }; return true; } return false; }
      const d = trusted || !pw ? it.d : Object.assign({}, it.d, { pwts: undefined });   // itens de pares (gossip) nunca carregam pwts
      if (d.pwts === undefined) delete d.pwts;
      if (!cur || d.created < cur.d.created || (d.created === cur.d.created && d.pass < cur.d.pass)) { m[it.id] = { k: it.k, id: it.id, ts: it.ts, d }; return true; } return false;
    }
    if (!cur || it.ts > cur.ts) { m[it.id] = { k: it.k, id: it.id, ts: it.ts, by: it.by, d: it.del ? null : it.d, del: !!it.del }; return true; }
    return false;
  }
  const all = (store) => KINDS.flatMap((k) => Object.values(store[k]));
  /** Itens vivos de um tipo (sem tombstones). */
  const live = (store, k) => Object.values(store[k]).filter((x) => !x.del);
  /** Divide em lotes pequenos (limite de mensagem do canal de dados). */
  function batches(items, maxBytes) { const out = []; let cur = [], n = 0; for (const it of items) { const s = JSON.stringify(it).length; if (cur.length && n + s > (maxBytes || 30000)) { out.push(cur); cur = []; n = 0; } cur.push(it); n += s; } if (cur.length) out.push(cur); return out; }
  return { KINDS, newStore, valid, merge, all, live, batches };
});
