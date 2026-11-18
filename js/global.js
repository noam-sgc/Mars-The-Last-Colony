/* Diretório global, mural e amigos por WebRTC, SEM precisar do código do mundo e sem servidor.
   Todos os jogadores se encontram num ponto comum do sinalizador PeerJS (id fixo): o primeiro a chegar vira o "registro"
   (lista quem está online, repassa mensagens e o mural global, e guarda correspondência de quem está offline);
   se ele sair, outro assume sozinho com a sua cópia do mural. Visitantes (sem login) também recebem o mural,
   para que contas criadas em outros aparelhos já existam na hora de entrar. */
const GS = {
  ID: "marsdirv1x", started: false, ready: false, isReg: false, users: [], tab: new Map(), vis: new Set(), mbox: new Map(), infl: new Map(), cl: null, peer: null, pingT: 0, pruneT: 0, rt: 0, sent: new Set(), selfKey: null,
  mine() { return { u: ACC.user || null, cc: ACC.cc, vf: !!ACC.vf, world: ACC.user ? (NET.mode === "local" ? (P2P.ready ? P2P.code : "") : NET.mode === "p2p" ? NET.world : "") : "" }; },
  start() { if (this.started || typeof Peer === "undefined") return; this.started = true; this.elect(); },
  stop() {
    this.started = false; this.ready = false; clearInterval(this.pingT); clearInterval(this.pruneT); clearTimeout(this.rt);
    try { if (this.cl && this.cl.open) this.cl.send({ t: "bye" }); } catch (e) { /* ignore */ } try { this.peer && this.peer.destroy(); } catch (e) { /* ignore */ }
    this.peer = this.cl = null; this.isReg = false; this.tab.clear(); this.vis.clear(); this.users = []; this.sent.clear();
  },
  retry(ms) { clearTimeout(this.rt); clearInterval(this.pingT); clearInterval(this.pruneT); this.rt = setTimeout(() => { this.started = false; this.start(); }, ms + Math.random() * 2500); },
  /** Avisa o registro que a identidade mudou (entrou/saiu da conta). */
  /** Despedida educada ao fechar a aba: o registro já marca como offline. */
  bye() { try { if (this.cl && this.cl.open) this.cl.send({ t: "bye" }); } catch (e) { /* ignore */ } },
  hello() { if (this.isReg) this.selfHello(); else if (this.cl && this.cl.open) this.cl.send(Object.assign({ t: "hello" }, this.mine())); },
  elect() {
    const peer = new Peer(this.ID, Object.assign({ debug: 0 }, P2P.opts())); this.peer = peer;
    peer.on("open", () => { this.isReg = true; this.ready = true; BUL.markSynced(); this.regSetup(peer); this.selfHello(); this.pingT = setInterval(() => this.selfHello(), 20000); this.pruneT = setInterval(() => this.prune(), 20000); this.flushOut(); });
    peer.on("error", (e) => { if (e.type === "unavailable-id") { try { peer.destroy(); } catch (x) { /* ignore */ } this.peer = null; this.joinClient(); } else if (!this.ready) this.retry(5000); });
    peer.on("disconnected", () => { if (this.isReg) { try { peer.reconnect(); } catch (e) { /* ignore */ } } });
  },
  // ----- registro (quem chegou primeiro) -----
  conns() { return [...this.tab.values()].map((e) => e.conn).concat([...this.vis]).filter((c) => c && c.open); },
  broadcast(m, except) { this.conns().forEach((c) => { if (c !== except) try { c.send(m); } catch (e) { /* ignore */ } }); },
  sendBul(conn) { MarsBul.batches(BUL.snapshot(), 28000).forEach((items) => conn.send({ t: "bul", items })); conn.send({ t: "bul", items: [], end: true }); },
  regSetup(peer) {
    peer.on("connection", (conn) => {
      let key = null, first = true;
      conn.on("data", (m) => {
        if (!m || typeof m !== "object") return;
        if (m.t === "hello") {
          const k = this.upsert(m, conn);
          if (k === false) { conn.send({ t: "err", e: "nome em uso" }); } else { if (key && key !== k) this.tab.delete(key); key = k === true ? null : k; if (first) { first = false; this.sendBul(conn); } if (key) this.flush(key, conn); }
        }
        else if (m.t === "ackmsg") this.infl.delete(m.id);
        else if (m.t === "bulpush") { const ch = BUL.receive(m.items); if (ch.length) this.broadcast({ t: "bul", items: ch }, conn); }
        else if (m.t === "msg" && key) this.route(this.tab.get(key), m);
        else if (m.t === "bye") { if (key) { this.tab.delete(key); key = null; this.pushRoster(); } this.vis.delete(conn); }
      });
      const gone = () => { this.vis.delete(conn); if (key) { this.infl.forEach((x, id) => { if (MarsRules.key(x.to) === key) { this.queue(x.to, x.from, x.body); this.infl.delete(id); } }); }
        if (key) { const e = this.tab.get(key); if (e && e.conn === conn) { this.tab.delete(key); this.pushRoster(); } key = null; } };
      conn.on("close", gone); conn.on("error", gone);
    });
  },
  /** Registra/atualiza um nome. Retorna a chave, true (visitante sem login) ou false (nome em uso agora). */
  upsert(m, conn) {
    const u = m.u == null ? "" : String(m.u);
    if (!u) { this.vis.add(conn); let ch = false; this.tab.forEach((e, k) => { if (e.conn === conn) { this.tab.delete(k); ch = true; } }); if (ch) this.pushRoster(); return true; }
    if (!MarsRules.validName(u)) return false; const k = MarsRules.key(u), cur = this.tab.get(k);
    if (cur && cur.conn && cur.conn !== conn && cur.conn.open && Date.now() - cur.ts < 25000) return false;   // nome em uso por outra conexão ativa
    if (cur && cur.conn && cur.conn !== conn) this.requeue(k);   // reconexão (ex.: recarregou a página): o que não foi confirmado volta para a caixa de correio
    this.vis.delete(conn);
    const e = { u, cc: MarsRules.validCountry(m.cc) ? m.cc : "BR", world: /^[A-Z0-9]{0,12}$/.test(m.world || "") ? m.world : "", vf: !!m.vf, conn, ts: Date.now() };
    const same = cur && cur.conn === conn && cur.cc === e.cc && cur.world === e.world && cur.vf === e.vf; this.tab.set(k, e);
    if (same) { try { conn.send({ t: "ack" }); } catch (x) { /* ignore */ } } else this.pushRoster(); return k;
  },
  selfHello() {
    if (this.selfKey) { const e = this.tab.get(this.selfKey); if (e && !e.conn && (!ACC.user || MarsRules.key(ACC.user) !== this.selfKey)) { this.tab.delete(this.selfKey); this.selfKey = null; } }
    if (!ACC.user) { this.pushRoster(); return; } const m = this.mine(), k = MarsRules.key(m.u); this.selfKey = k;
    this.tab.set(k, { u: m.u, cc: m.cc, world: m.world, vf: m.vf, conn: null, ts: Date.now() }); this.pushRoster(); this.flush(k, null);
  },
  prune() { const now = Date.now(); let ch = false; this.infl.forEach((x, id) => { if (now - x.ts > 25000) { this.queue(x.to, x.from, x.body); this.infl.delete(id); } }); this.tab.forEach((e, k) => { if (e.conn && now - e.ts > 60000) { this.tab.delete(k); ch = true; } }); this.mbox.forEach((a, k) => { const keep = a.filter((x) => now - x.ts < 14 * 864e5); if (keep.length) this.mbox.set(k, keep); else this.mbox.delete(k); }); if (ch) this.pushRoster(); },
  pushRoster() {
    const list = [...this.tab.values()].map((e) => ({ u: e.u, cc: e.cc, world: e.world, role: MarsRules.roleOf(e.u), vf: e.vf || MarsRules.isAdmin(e.u) }));
    this.broadcast({ t: "roster", users: list }); this.setUsers(list);
  },
  // correspondência de quem está offline: pedidos de amizade e mensagens diretas ficam guardadas até a pessoa ligar o jogo
  requeue(k) { this.infl.forEach((x, id) => { if (MarsRules.key(x.to) === k) { this.queue(x.to, x.from, x.body); this.infl.delete(id); } }); },
  queue(to, from, body) { const k = MarsRules.key(to), a = this.mbox.get(k) || []; a.push({ from, body, ts: Date.now() }); this.mbox.set(k, a.slice(-60)); },
  flush(k, conn) { const a = this.mbox.get(k); if (!a || !a.length) return; this.mbox.delete(k); a.forEach((x) => { if (conn) { if (conn.open) conn.send({ t: "msg", from: x.from, body: x.body, late: true }); } else this.onMsg(x.from, x.body); }); },
  route(from, m) {
    if (!from || !m.body || JSON.stringify(m.body).length > 2000 || !MarsRules.validName(String(m.to || ""))) return; const t = this.tab.get(MarsRules.key(m.to));
    if (!t) { if (/^(fr\.|dm$)/.test(String(m.body.k))) { this.queue(m.to, from.u, m.body); if (from.conn && from.conn.open) from.conn.send({ t: "queued", to: m.to }); } return; }
    if (t.conn && t.conn.open) { const durable = /^(fr\.|dm$)/.test(String(m.body.k)), id = durable ? Math.random().toString(36).slice(2, 10) : null; if (id) this.infl.set(id, { to: m.to, from: from.u, body: m.body, ts: Date.now() }); t.conn.send({ t: "msg", from: from.u, body: m.body, id }); } else if (!t.conn) this.onMsg(from.u, m.body);
  },
  // ----- cliente -----
  joinClient() {
    const peer = new Peer(Object.assign({ debug: 0 }, P2P.opts())); this.peer = peer; peer.on("error", () => { if (!this.ready) this.retry(4000); });
    peer.on("open", () => {
      const c = peer.connect(this.ID, { serialization: "json", reliable: true }); this.cl = c;
      c.on("open", () => { this.ready = true; this.seen = Date.now(); this.sent.clear(); this.hello(); this.pushBul(BUL.snapshot()); this.flushOut(); this.pingT = setInterval(() => { if (Date.now() - this.seen > 50000) return lost(); this.hello(); }, 20000); });
      c.on("data", (m) => { if (!m) return; this.seen = Date.now(); if (m.t === "roster") this.setUsers(m.users); else if (m.t === "msg") { if (m.id && c.open) c.send({ t: "ackmsg", id: m.id }); this.onMsg(m.from, m.body); } else if (m.t === "bul") { BUL.receive(m.items); if (m.end) BUL.markSynced(); } else if (m.t === "queued") this.queuedNote(m.to); });
      const lost = () => { if (this.cl !== c) return; this.ready = false; this.cl = null; try { peer.destroy(); } catch (e) { /* ignore */ } this.retry(1500); }; c.on("close", lost); c.on("error", lost);
    });
  },
  /** Envia itens do mural ao registro (ou aos demais, se este navegador for o registro). */
  pushBul(items) {
    if (!items || !items.length) return;
    if (this.isReg) this.broadcast({ t: "bul", items });
    else if (this.cl && this.cl.open) MarsBul.batches(items, 28000).forEach((b) => this.cl.send({ t: "bulpush", items: b }));
  },
  setUsers(list) {
    this.users = (list || []).filter((u) => u && u.u !== ACC.user);
    const fr = P.fr; let ch = false; this.users.forEach((u) => { if (fr.cc[u.u] !== u.cc && [...fr.f, ...fr.in, ...fr.out].includes(u.u)) { fr.cc[u.u] = u.cc; ch = true; } }); if (ch) saveP();
    [...this.sent].forEach((n) => { if (!this.users.some((u) => u.u === n)) this.sent.delete(n); });
    fr.out.forEach((n) => { if (!this.sent.has(n) && this.users.some((u) => u.u === n)) { if (this.send(n, { k: "fr.req" })) this.sent.add(n); } });   // reenvia quando o alvo fica online
    if (typeof socRefresh === "function") socRefresh();
  },
  /** Reenvia pedidos pendentes (o registro os guarda se a pessoa estiver offline). */
  flushOut() { if (!ACC.user) return; P.fr.out.forEach((n) => { if (this.send(n, { k: "fr.req" })) this.sent.add(n); }); },
  send(to, body) { if (!ACC.user) return false; if (this.isReg) { this.route({ u: ACC.user, conn: null }, { to, body }); return true; } if (this.cl && this.cl.open) { this.cl.send({ t: "msg", to, body }); return true; } return false; },
  queuedNote(to) { if (this.noted !== to) { this.noted = to; toast(`📬 ${esc(to)} está offline: sua mensagem/pedido fica guardado e chega quando ele ligar o jogo.`, 4500); setTimeout(() => (this.noted = null), 5000); } },
  onMsg(from, b) {
    if (!b || typeof b !== "object" || !MarsRules.validName(from)) return; const fr = P.fr, has = (a) => a.includes(from), drop = (a) => { const i = a.indexOf(from); if (i >= 0) a.splice(i, 1); };
    if (b.k === "fr.req") { if (has(fr.f)) return this.send(from, { k: "fr.acc" }); if (has(fr.out)) { drop(fr.out); fr.f.push(from); this.send(from, { k: "fr.acc" }); toast(`🤝 Agora você e <b>${esc(from)}</b> são amigos!`); } else if (!has(fr.in)) { fr.in.push(from); toast(`👥 Pedido de amizade de <b>${esc(from)}</b>`); } }
    else if (b.k === "fr.acc") { if (has(fr.out)) { drop(fr.out); this.sent.delete(from); if (!has(fr.f)) fr.f.push(from); toast(`🤝 <b>${esc(from)}</b> aceitou sua amizade!`); } }
    else if (b.k === "fr.rm") { drop(fr.f); drop(fr.in); drop(fr.out); }
    else if (b.k === "dm" && typeof b.m === "string") { const u = this.users.find((x) => x.u === from) || {}; chatPush({ t: "chat", ch: "dm:" + from, from: { u: from, role: u.role || MarsRules.roleOf(from), vf: !!u.vf, cc: u.cc || fr.cc[from] || "BR" }, m: b.m.slice(0, 200), ts: Date.now() }); }
    saveP(); if (typeof socRefresh === "function") socRefresh();
  },
  // ----- operações de amizade (salvas no perfil). Funcionam mesmo com a outra pessoa offline: ela responde quando ligar o jogo. -----
  add(u) { const fr = P.fr; if (fr.f.includes(u) || fr.out.includes(u)) return; if (fr.in.includes(u)) return this.accept(u); fr.out.push(u); if (this.send(u, { k: "fr.req" })) this.sent.add(u); saveP(); },
  accept(u) { const fr = P.fr; fr.in = fr.in.filter((x) => x !== u); if (!fr.f.includes(u)) fr.f.push(u); this.send(u, { k: "fr.acc" }); saveP(); },
  reject(u) { P.fr.in = P.fr.in.filter((x) => x !== u); saveP(); },
  cancel(u) { P.fr.out = P.fr.out.filter((x) => x !== u); this.sent.delete(u); saveP(); },
  remove(u) { P.fr.f = P.fr.f.filter((x) => x !== u); this.send(u, { k: "fr.rm" }); saveP(); },
};
addEventListener("pagehide", () => GS.bye()); addEventListener("beforeunload", () => GS.bye());
