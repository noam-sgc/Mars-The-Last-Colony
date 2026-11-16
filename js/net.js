/* Cliente de rede: WebSocket do servidor web quando existir; senão, o servidor local (LocalHub). */
function wsUrl() {
  const q = (location.search.match(/[?&]server=([^&]+)/) || [])[1], u = q ? decodeURIComponent(q) : window.MARS_SERVER;
  return /^wss?:\/\//.test(u || "") ? u : (location.protocol === "https:" ? "wss://" : "ws://") + location.host + "/ws";
}
const NET = {
  mode: "", ready: false, ws: null, lc: null, rid: 0, pend: {}, h: {},
  on(t, fn) { (this.h[t] = this.h[t] || []).push(fn); },
  emit(m) { (this.h[m.t] || []).forEach((f) => { try { f(m); } catch (e) { console.error(e); } }); },
  incoming(m) {
    if (m.t === "res") { const p = this.pend[m.rid]; if (p) { clearTimeout(p.to); delete this.pend[m.rid]; p.r(m); } return; }
    if (m.t === "hi") { this.id = m.id; EV.custom = m.events || []; applyCatalog(m.catalog); EV.refresh(); }
    this.emit(m);
  },
  send(m) {
    if (this.mode === "server" && this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify(m));
    else if (this.mode === "local" && this.lc) this.lc.send(m);
    else if (this.mode === "p2p" && this.pc) this.pc.send(m);
  },
  ask(m, ms) {
    return new Promise((r) => {
      if (!this.ready) return r({ ok: false, err: "Sem conexão" });
      m.rid = ++this.rid; const to = setTimeout(() => { delete this.pend[m.rid]; r({ ok: false, err: "Tempo esgotado" }); }, ms || 8000);
      this.pend[m.rid] = { r, to }; this.send(m);
    });
  },
  /** Reconexão automática: tenta de novo a cada 3 s e retoma a sessão com o token salvo. */
  hook() {
    this.ws.onclose = () => { this.ready = false; this.emit({ t: "closed" }); clearTimeout(this.rt); this.rt = setTimeout(() => this.retry(), 3000); };
  },
  retry() {
    let ws; try { ws = new WebSocket(wsUrl()); } catch (e) { return (this.rt = setTimeout(() => this.retry(), 4000)); }
    ws.onerror = () => {}; ws.onclose = () => { if (!this.ready) this.rt = setTimeout(() => this.retry(), 4000); };
    ws.onmessage = async (e) => { let m; try { m = JSON.parse(e.data); } catch (x) { return; } if (m.t !== "hi") return;
      this.ws = ws; this.ready = true; ws.onmessage = (ev) => { try { this.incoming(JSON.parse(ev.data)); } catch (x) { /* ignore */ } }; this.hook(); this.incoming(m);
      let tok = null; try { tok = localStorage.getItem(this.tokKey()); } catch (x) { /* ignore */ }
      if (tok && ACC.user) { const r = await this.ask({ t: "resume", token: tok }); if (r.ok) { setSocial(r.social); toast("🔌 Reconectado ao servidor"); } }
    };
  },
  /** Servidor WebSocket (opcional): mesma origem em /ws, ou window.MARS_SERVER / ?server=. */
  async connectServer() {
    const explicit = /^wss?:/.test(window.MARS_SERVER || "") || /[?&]server=/.test(location.search);
    const web = /^https?:$/.test(location.protocol) && !/[?&]local\b/.test(location.search) && (explicit || !location.hostname.endsWith(".vercel.app"));
    if (!web) return false;
    const ok = await new Promise((res) => {
      let ws; const to = setTimeout(() => { try { ws.close(); } catch (e) { /* ignore */ } res(false); }, 2500);
      try { ws = new WebSocket(wsUrl()); } catch (e) { clearTimeout(to); return res(false); }
      ws.onmessage = (e) => { let m; try { m = JSON.parse(e.data); } catch (x) { return; } if (m.t === "hi") { clearTimeout(to); this.ws = ws; this.mode = "server"; this.world = "srv"; this.ready = true; ws.onmessage = (ev) => { try { this.incoming(JSON.parse(ev.data)); } catch (x) { /* ignore */ } }; this.incoming(m); res(true); } };
      ws.onerror = () => { clearTimeout(to); res(false); };
    });
    if (ok) this.hook(); return ok;
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
    if (this.ws) { this.ws.onclose = null; try { this.ws.close(); } catch (e) { /* ignore */ } } clearTimeout(this.rt);
    this.lc = this.pc = this.ws = null; this.ready = false; this.mode = ""; this.world = ""; Object.values(this.pend).forEach((p) => { clearTimeout(p.to); p.r({ ok: false, err: "Desconectado" }); }); this.pend = {};
  },
  tokKey() { return "mars-token:" + (this.world || "x"); },
};
