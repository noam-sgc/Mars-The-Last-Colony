/* Rede: tudo trafega por WebRTC (PeerJS). O anfitrião roda o Hub no próprio navegador (modo "local");
   os convidados falam com ele por um canal de dados WebRTC (modo "p2p"). O protocolo é o mesmo em ambos. */
const NET = {
  mode: "", ready: false, lc: null, pc: null, rid: 0, pend: {}, h: {},
  on(t, fn) { (this.h[t] = this.h[t] || []).push(fn); },
  emit(m) { (this.h[m.t] || []).forEach((f) => { try { f(m); } catch (e) { console.error(e); } }); },
  incoming(m) {
    if (m.t === "res") { const p = this.pend[m.rid]; if (p) { clearTimeout(p.to); delete this.pend[m.rid]; p.r(m); } return; }
    if (m.t === "hi") { this.id = m.id; EV.custom = m.events || []; applyCatalog(m.catalog); EV.refresh(); }
    this.emit(m);
  },
  send(m) {
    if (this.mode === "local" && this.lc) this.lc.send(m);
    else if (this.mode === "p2p" && this.pc) this.pc.send(m);
  },
  ask(m, ms) {
    return new Promise((r) => {
      if (!this.ready) return r({ ok: false, err: "Sem conexão" });
      m.rid = ++this.rid; const to = setTimeout(() => { delete this.pend[m.rid]; r({ ok: false, err: "Tempo esgotado" }); }, ms || 8000);
      this.pend[m.rid] = { r, to }; this.send(m);
    });
  },
  /** Meu próprio mundo: o Hub roda neste navegador e aceita amigos por WebRTC. */
  startLocal() { this.disconnect(); this.mode = "local"; this.world = "self"; this.ready = true; this.lc = LocalHub.connect((m) => this.incoming(m)); P2P.startHost(); },
  /** Entra no mundo de outro jogador pelo código (WebRTC). */
  async joinWorld(code) {
    const r = await P2P.join(code); this.disconnect(); this.mode = "p2p"; this.world = r.code; this.pc = r; this.ready = true;
    r.conn.on("data", (m) => this.incoming(m)); r.conn.on("close", () => { if (this.pc === r) { this.ready = false; this.emit({ t: "closed" }); } });
  },
  disconnect() {
    if (this.lc) { try { this.lc.close(); } catch (e) { /* ignore */ } } if (this.pc) { try { this.pc.close(); } catch (e) { /* ignore */ } }
    this.lc = this.pc = null; this.ready = false; this.mode = ""; this.world = ""; Object.values(this.pend).forEach((p) => { clearTimeout(p.to); p.r({ ok: false, err: "Desconectado" }); }); this.pend = {};
  },
  tokKey() { return "mars-token:" + (this.world || "x"); },
};
