/* Diretório global e amigos por WebRTC, SEM precisar do código do mundo.
   Todos os jogadores logados se encontram em um ponto comum do sinalizador PeerJS (id fixo): o primeiro a chegar vira o
   "registro" (lista quem está online e repassa mensagens); se ele sair, outro assume sozinho. Pedidos de amizade, aceite e
   mensagens diretas passam por esse canal WebRTC e ficam salvos no perfil de cada jogador. */
const GS = {
  ID: "marsdirv1x", started: false, ready: false, isReg: false, users: [], tab: new Map(), cl: null, peer: null, pingT: 0, pruneT: 0, rt: 0, sent: new Set(),
  mine() { return { u: ACC.user, cc: ACC.cc, vf: !!ACC.vf, world: NET.mode === "local" ? (P2P.ready ? P2P.code : "") : NET.mode === "p2p" ? NET.world : "" }; },
  start() { if (this.started || !ACC.user || typeof Peer === "undefined") return; this.started = true; this.elect(); },
  stop() {
    this.started = false; this.ready = false; clearInterval(this.pingT); clearInterval(this.pruneT); clearTimeout(this.rt);
    try { if (this.cl && this.cl.open) this.cl.send({ t: "bye" }); } catch (e) { /* ignore */ } try { this.peer && this.peer.destroy(); } catch (e) { /* ignore */ }
    this.peer = this.cl = null; this.isReg = false; this.tab.clear(); this.users = []; this.sent.clear();
  },
  retry(ms) { clearTimeout(this.rt); clearInterval(this.pingT); clearInterval(this.pruneT); this.rt = setTimeout(() => { this.started = false; this.start(); }, ms + Math.random() * 2500); },
  elect() {
    const peer = new Peer(this.ID, Object.assign({ debug: 0 }, P2P.opts())); this.peer = peer;
    peer.on("open", () => { this.isReg = true; this.ready = true; this.regSetup(peer); this.selfHello(); this.pingT = setInterval(() => this.selfHello(), 20000); this.pruneT = setInterval(() => this.prune(), 20000); });
    peer.on("error", (e) => { if (e.type === "unavailable-id") { try { peer.destroy(); } catch (x) { /* ignore */ } this.peer = null; this.joinClient(); } else if (!this.ready) this.retry(5000); });
    peer.on("disconnected", () => { if (this.isReg) { try { peer.reconnect(); } catch (e) { /* ignore */ } } });
  },
  // ----- registro (quem chegou primeiro) -----
  regSetup(peer) {
    peer.on("connection", (conn) => {
      let key = null;
      conn.on("data", (m) => {
        if (!m || typeof m !== "object") return;
        if (m.t === "hello") { const k = this.upsert(m, conn); if (k === false) conn.send({ t: "err", e: "nome em uso" }); else key = k; }
        else if (m.t === "msg" && key) this.route(this.tab.get(key), m);
        else if (m.t === "bye" && key) { this.tab.delete(key); key = null; this.pushRoster(); }
      });
      const gone = () => { if (key) { const e = this.tab.get(key); if (e && e.conn === conn) { this.tab.delete(key); this.pushRoster(); } key = null; } };
      conn.on("close", gone); conn.on("error", gone);
    });
  },
  upsert(m, conn) {
    const u = String(m.u || ""); if (!MarsRules.validName(u)) return false; const k = MarsRules.key(u), cur = this.tab.get(k);
    if (cur && cur.conn && cur.conn !== conn && cur.conn.open && Date.now() - cur.ts < 45000) return false;
    const e = { u, cc: MarsRules.validCountry(m.cc) ? m.cc : "BR", world: /^[A-Z0-9]{0,12}$/.test(m.world || "") ? m.world : "", vf: !!m.vf, conn, ts: Date.now() };
    const same = cur && cur.conn === conn && cur.cc === e.cc && cur.world === e.world && cur.vf === e.vf; this.tab.set(k, e);
    if (same) { try { conn.send({ t: "ack" }); } catch (x) { /* ignore */ } } else this.pushRoster(); return k;
  },
  selfHello() { if (!ACC.user) return; const m = this.mine(); this.tab.set(MarsRules.key(m.u), { u: m.u, cc: m.cc, world: m.world, vf: m.vf, conn: null, ts: Date.now() }); this.pushRoster(); },
  prune() { const now = Date.now(); let ch = false; this.tab.forEach((e, k) => { if (e.conn && now - e.ts > 60000) { this.tab.delete(k); ch = true; } }); if (ch) this.pushRoster(); },
  pushRoster() {
    const list = [...this.tab.values()].map((e) => ({ u: e.u, cc: e.cc, world: e.world, role: MarsRules.roleOf(e.u), vf: e.vf || MarsRules.isAdmin(e.u) }));
    this.tab.forEach((e) => { try { if (e.conn && e.conn.open) e.conn.send({ t: "roster", users: list }); } catch (x) { /* ignore */ } }); this.setUsers(list);
  },
  route(from, m) {
    if (!from || !m.body || JSON.stringify(m.body).length > 2000) return; const t = this.tab.get(MarsRules.key(m.to));
    if (!t) { if (from.conn && from.conn.open) from.conn.send({ t: "nodeliver", to: m.to }); return; }
    if (t.conn && t.conn.open) t.conn.send({ t: "msg", from: from.u, body: m.body }); else if (!t.conn) this.onMsg(from.u, m.body);
  },
  // ----- cliente -----
  joinClient() {
    const peer = new Peer(Object.assign({ debug: 0 }, P2P.opts())); this.peer = peer; peer.on("error", () => { if (!this.ready) this.retry(4000); });
    peer.on("open", () => {
      const c = peer.connect(this.ID, { serialization: "json", reliable: true }); this.cl = c;
      c.on("open", () => { this.ready = true; this.seen = Date.now(); this.hello(); this.pingT = setInterval(() => { if (Date.now() - this.seen > 50000) return lost(); this.hello(); }, 20000); });
      c.on("data", (m) => { if (!m) return; this.seen = Date.now(); if (m.t === "roster") this.setUsers(m.users); else if (m.t === "msg") this.onMsg(m.from, m.body); });
      const lost = () => { if (this.cl !== c) return; this.ready = false; this.cl = null; try { peer.destroy(); } catch (e) { /* ignore */ } this.retry(1500); }; c.on("close", lost); c.on("error", lost);
    });
  },
  hello() { if (this.cl && this.cl.open) this.cl.send(Object.assign({ t: "hello" }, this.mine())); else if (this.isReg) this.selfHello(); },
  setUsers(list) {
    this.users = (list || []).filter((u) => u && u.u !== ACC.user);
    const fr = P.fr; let ch = false; this.users.forEach((u) => { if (fr.cc[u.u] !== u.cc && [...fr.f, ...fr.in, ...fr.out].includes(u.u)) { fr.cc[u.u] = u.cc; ch = true; } }); if (ch) saveP();
    fr.out.forEach((n) => { if (!this.sent.has(n) && this.users.some((u) => u.u === n)) { this.sent.add(n); this.send(n, { k: "fr.req" }); } });   // reenvia pedidos pendentes quando o alvo fica online
    if (typeof socRefresh === "function") socRefresh();
  },
  send(to, body) { if (this.isReg) this.route({ u: ACC.user, conn: null }, { to, body }); else if (this.cl && this.cl.open) this.cl.send({ t: "msg", to, body }); },
  onMsg(from, b) {
    if (!b || typeof b !== "object" || !MarsRules.validName(from)) return; const fr = P.fr, has = (a) => a.includes(from), drop = (a) => { const i = a.indexOf(from); if (i >= 0) a.splice(i, 1); };
    if (b.k === "fr.req") { if (has(fr.f)) return this.send(from, { k: "fr.acc" }); if (has(fr.out)) { drop(fr.out); fr.f.push(from); this.send(from, { k: "fr.acc" }); toast(`🤝 Agora você e <b>${esc(from)}</b> são amigos!`); } else if (!has(fr.in)) { fr.in.push(from); toast(`👥 Pedido de amizade de <b>${esc(from)}</b>`); } }
    else if (b.k === "fr.acc") { if (has(fr.out)) { drop(fr.out); if (!has(fr.f)) fr.f.push(from); toast(`🤝 <b>${esc(from)}</b> aceitou sua amizade!`); } }
    else if (b.k === "fr.rm") { drop(fr.f); drop(fr.in); drop(fr.out); }
    else if (b.k === "dm" && typeof b.m === "string") { const u = this.users.find((x) => x.u === from) || {}; chatPush({ t: "chat", ch: "dm:" + from, from: { u: from, role: u.role || MarsRules.roleOf(from), vf: !!u.vf, cc: u.cc || fr.cc[from] || "BR" }, m: b.m.slice(0, 200), ts: Date.now() }); }
    saveP(); if (typeof socRefresh === "function") socRefresh();
  },
  // ----- operações de amizade (salvas no perfil) -----
  add(u) { const fr = P.fr; if (fr.f.includes(u) || fr.out.includes(u)) return; if (fr.in.includes(u)) return this.accept(u); fr.out.push(u); this.sent.add(u); this.send(u, { k: "fr.req" }); saveP(); },
  accept(u) { const fr = P.fr; fr.in = fr.in.filter((x) => x !== u); if (!fr.f.includes(u)) fr.f.push(u); this.send(u, { k: "fr.acc" }); saveP(); },
  reject(u) { P.fr.in = P.fr.in.filter((x) => x !== u); saveP(); },
  cancel(u) { P.fr.out = P.fr.out.filter((x) => x !== u); this.sent.delete(u); saveP(); },
  remove(u) { P.fr.f = P.fr.f.filter((x) => x !== u); this.send(u, { k: "fr.rm" }); saveP(); },
};
