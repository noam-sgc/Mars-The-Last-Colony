/* Cliente de rede: WebSocket do servidor web quando existir; senão, o servidor local (LocalHub). */
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
    let ws; try { ws = new WebSocket((location.protocol === "https:" ? "wss://" : "ws://") + location.host + "/ws"); } catch (e) { return (this.rt = setTimeout(() => this.retry(), 4000)); }
    ws.onerror = () => {}; ws.onclose = () => { if (!this.ready) this.rt = setTimeout(() => this.retry(), 4000); };
    ws.onmessage = async (e) => { let m; try { m = JSON.parse(e.data); } catch (x) { return; } if (m.t !== "hi") return;
      this.ws = ws; this.ready = true; ws.onmessage = (ev) => { try { this.incoming(JSON.parse(ev.data)); } catch (x) { /* ignore */ } }; this.hook(); this.incoming(m);
      let tok = null; try { tok = localStorage.getItem("mars-token"); } catch (x) { /* ignore */ }
      if (tok && ACC.user) { const r = await this.ask({ t: "resume", token: tok }); if (r.ok) { setSocial(r.social); toast("🔌 Reconectado ao servidor"); } }
    };
  },
  /** Tenta o servidor web (mesma origem, /ws); se falhar, usa o servidor local. */
  async connect() {
    const web = /^https?:$/.test(location.protocol) && !/[?&]local\b/.test(location.search);
    if (web) {
      const ok = await new Promise((res) => {
        let ws; const to = setTimeout(() => { try { ws.close(); } catch (e) { /* ignore */ } res(false); }, 2500);
        try { ws = new WebSocket((location.protocol === "https:" ? "wss://" : "ws://") + location.host + "/ws"); } catch (e) { clearTimeout(to); return res(false); }
        ws.onmessage = (e) => { let m; try { m = JSON.parse(e.data); } catch (x) { return; } if (m.t === "hi") { clearTimeout(to); this.ws = ws; this.mode = "server"; this.ready = true; ws.onmessage = (ev) => { try { this.incoming(JSON.parse(ev.data)); } catch (x) { /* ignore */ } }; this.incoming(m); res(true); } };
        ws.onerror = () => { clearTimeout(to); res(false); };
      });
      if (ok) { this.hook(); return "server"; }
    }
    await LocalHub.ready; this.mode = "local"; this.ready = true;
    this.lc = LocalHub.connect((m) => this.incoming(m)); return "local";
  },
};
