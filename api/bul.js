/* Armazenamento persistente do mural global (contas, progresso, eventos, itens do Estúdio, avisos).
   É só um "cofre": a comunicação em tempo real (chat, amigos, partidas) continua 100% WebRTC.
   Guarda os itens num Redis REST (Upstash / Vercel Storage). Sem Redis configurado responde 503 e o jogo
   volta ao mural entre navegadores (gossip). Mesmas regras de validação do cliente (shared/bulletin.js). */
const Bul = require("../shared/bulletin.js");
const HASH = "mars:bul:v1";

function redis() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL, token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  const run = async (cmds) => { const r = await fetch(url.replace(/\/$/, "") + "/pipeline", { method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }, body: JSON.stringify(cmds) }); if (!r.ok) throw new Error("redis " + r.status); return (await r.json()).map((x) => { if (x.error) throw new Error(x.error); return x.result; }); };
  return {
    async all() { const [a] = await run([["HGETALL", HASH]]); const o = []; for (let i = 0; i < (a || []).length; i += 2) o.push(a[i + 1]); return o; },
    async get(fields) { if (!fields.length) return []; const [a] = await run([["HMGET", HASH].concat(fields)]); return a; },
    async set(pairs) { if (!pairs.length) return; await run([["HSET", HASH].concat(pairs.flat())]); },
  };
}
const MEM = new Map();
const mem = { async all() { return [...MEM.values()]; }, async get(f) { return f.map((x) => MEM.get(x) || null); }, async set(p) { p.forEach(([k, v]) => MEM.set(k, v)); } };
let db; const store = () => db || (db = redis() || (process.env.VERCEL ? null : mem));

const send = (res, code, obj) => { res.statusCode = code; res.setHeader("Content-Type", "application/json"); res.setHeader("Cache-Control", "no-store"); res.end(JSON.stringify(obj)); };
module.exports = async (req, res) => {
  const d = store(); if (!d) return send(res, 503, { ok: false, cloud: false, err: "Armazenamento não configurado" });
  try {
    if (req.method === "GET") {
      const since = +(new URL(req.url, "http://x").searchParams.get("since")) || 0, rows = (await d.all()).map((x) => { try { return JSON.parse(x); } catch (e) { return null; } }).filter(Boolean);
      return send(res, 200, { ok: true, cloud: true, now: Date.now(), items: rows.filter((r) => r.at > since).map((r) => r.it) });
    }
    if (req.method !== "POST") return send(res, 405, { ok: false });
    let body = req.body; if (typeof body === "string") body = JSON.parse(body);
    const items = (body && Array.isArray(body.items) ? body.items : []).slice(0, 200).filter((it) => Bul.valid(it));
    const f = items.map((it) => it.k + ":" + it.id), cur = await d.get(f), pairs = [], now = Date.now(); let n = 0;
    items.forEach((it, i) => {
      const st = Bul.newStore(); if (cur[i]) { try { st[it.k][it.id] = JSON.parse(cur[i]).it; } catch (e) { /* ignore */ } }
      if (Bul.merge(st, it)) { pairs.push([f[i], JSON.stringify({ at: now + n, it: st[it.k][it.id] })]); n++; }
    });
    await d.set(pairs); return send(res, 200, { ok: true, cloud: true, saved: pairs.length });
  } catch (e) { return send(res, 500, { ok: false, err: "Erro no armazenamento" }); }
};
