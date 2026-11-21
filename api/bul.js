/* Armazenamento persistente do mural global (contas, progresso, eventos, itens do Estúdio, avisos).
   É só um "cofre": a comunicação em tempo real (chat, amigos, partidas) continua 100% WebRTC.
   Guarda os itens num Redis REST (Upstash / Vercel Storage). Sem Redis configurado responde 503 e o jogo
   volta ao mural entre navegadores (gossip). Mesmas regras de validação do cliente (shared/bulletin.js). */
const Bul = require("../shared/bulletin.js");

const { store } = require("./_store.js");
const send = (res, code, obj) => { res.statusCode = code; res.setHeader("Content-Type", "application/json"); res.setHeader("Cache-Control", "no-store"); res.end(JSON.stringify(obj)); };
module.exports = async (req, res) => {
  const d = store(); if (!d) return send(res, 503, { ok: false, cloud: false, err: "Armazenamento não configurado" });
  try {
    if (req.method === "GET") {
      const since = +(new URL(req.url, "http://x").searchParams.get("since")) || 0, rows = (await d.all(since)).filter((r) => r && r.it && Bul.KINDS.includes(r.it.k));   // nunca expõe os registros de redefinição (rst:)
      return send(res, 200, { ok: true, cloud: true, now: Date.now(), items: rows.map((r) => r.it) });
    }
    if (req.method !== "POST") return send(res, 405, { ok: false });
    let body = req.body; if (typeof body === "string") body = JSON.parse(body);
    const items = (body && Array.isArray(body.items) ? body.items : []).slice(0, 200).filter((it) => Bul.valid(it) && !(it.k === "acct" && it.d && it.d.pwts));   // só a redefinição de senha (servidor) escreve pwts
    const f = items.map((it) => it.k + ":" + it.id), cur = await d.get(f), rows = [], now = Date.now(); let n = 0;
    items.forEach((it, i) => {
      const st = Bul.newStore(); if (cur[i] && cur[i].it) st[it.k][it.id] = cur[i].it;
      if (Bul.merge(st, it)) { rows.push({ f: f[i], at: now + n, it: st[it.k][it.id] }); n++; }
    });
    await d.set(rows); return send(res, 200, { ok: true, cloud: true, saved: rows.length });
  } catch (e) { return send(res, 500, { ok: false, err: "Erro no armazenamento" }); }
};
