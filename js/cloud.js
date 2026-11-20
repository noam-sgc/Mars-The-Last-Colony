/* Nuvem (opcional): cofre persistente /api/bul (Vercel + Redis). Guarda contas, progresso, eventos e itens do Estúdio
   para que qualquer aparelho encontre as contas mesmo sem ninguém online. Chat, amigos e partidas seguem 100% WebRTC.
   Sem a API configurada, o jogo continua com o mural entre navegadores (js/global.js). */
const CLOUD = (() => {
  let on = false, why = "wait", since = 0, tried = false, pend = [], t = 0, pollT = 0; const waiters = [];
  const done = () => { tried = true; waiters.splice(0).forEach((f) => f(on)); };
  const J = async (url, opt) => { const c = new AbortController(), to = setTimeout(() => c.abort(), 6000); try { const r = await fetch(url, Object.assign({ signal: c.signal, cache: "no-store" }, opt)); if (!r.ok) return null; return await r.json(); } catch (e) { return null; } finally { clearTimeout(to); } };
  async function pull() {
    let r = null; try { const x = await fetch("/api/bul?since=" + since, { cache: "no-store" }); why = x.status === 404 ? "missing" : x.status === 503 ? "off" : x.ok ? "ok" : "err"; r = x.ok ? await x.json() : null; } catch (e) { why = "net"; }
    if (!r || !r.cloud) { if (!on) done(); return false; }
    since = Math.max(since, r.now - 5000); const first = !on; on = true; const ch = BUL.receive(r.items || []); if (ch.length && typeof GS !== "undefined") GS.pushBul(ch);
    if (first) { await seed(); } BUL.markSynced(); done(); return true;
  }
  /** Primeira conexão: envia para a nuvem tudo que este navegador já conhece (contas antigas passam a existir para todos). */
  async function seed() { const all = BUL.snapshot().filter((x) => !x.del || x.k !== "sav"); for (const items of MarsBul.batches(all, 800000)) await J("/api/bul", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: items.slice(0, 200) }) }); }
  async function flush() { if (!on || !pend.length) return; const bs = MarsBul.batches(pend.splice(0, 100), 800000), items = bs.shift() || []; pend = bs.flat().concat(pend); if (!items.length) return; const r = await J("/api/bul", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items }) }); if (!r) pend = items.concat(pend); if (pend.length) t = setTimeout(flush, 3000); }
  return {
    get on() { return on; },
    /** Diagnóstico para o jogador/dono do site. */
    get why() { return why; },
    explain() { return { ok: "☁ Online: contas e progresso na nuvem, acessíveis de qualquer aparelho.", wait: "☁ Conectando à nuvem…", off: "☁ Nuvem DESLIGADA: a API existe, mas falta conectar o Redis (Vercel → Storage → Upstash Redis) e fazer Redeploy. Veja docs/DEPLOY.md.", missing: "☁ Nuvem DESLIGADA: /api/bul não foi encontrada neste site (a pasta api/ não foi publicada ou o site não é a Vercel).", err: "☁ Nuvem com erro temporário.", net: "☁ Sem acesso à nuvem agora (sem internet?)." }[why] || ""; },
    push(items) { pend.push(...items); clearTimeout(t); t = setTimeout(flush, 600); },
    start() { pull(); clearInterval(pollT); pollT = setInterval(() => { if (!document.hidden) pull(); }, 15000); setTimeout(() => { if (!tried) done(); }, 7000); },
    /** Espera (até ms) a primeira tentativa de ler a nuvem. */
    settle(ms) { return tried ? Promise.resolve(on) : new Promise((r) => { waiters.push(r); setTimeout(() => r(on), ms || 4000); }); },
    refresh: pull,
  };
})();
