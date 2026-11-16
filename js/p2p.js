/* WebRTC (PeerJS): o navegador de quem cria o mundo vira o "servidor" (Hub) e amigos entram com um código.
   Sinalização: nuvem pública gratuita do PeerJS (ou window.MARS_PEER). Os dados do jogo trafegam direto entre os navegadores. */
const P2P = {
  code: "", ready: false, guests: 0, host: null, err: "",
  opts() {
    const q = (location.search.match(/[?&]peer=([^&]+)/) || [])[1];
    if (q) { const [h, p] = decodeURIComponent(q).split(":"); return { host: h, port: +p || 9000, path: "/", secure: false }; }
    return window.MARS_PEER || {};
  },
  gen() { const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; return Array.from({ length: 6 }, () => A[Math.floor(Math.random() * A.length)]).join(""); },
  /** Abre o mundo para convidados. O código é guardado para continuar o mesmo entre sessões. */
  startHost() {
    if (this.host || typeof Peer === "undefined") return; let code = null; try { code = localStorage.getItem("mars-world"); } catch (e) { /* ignore */ }
    const open = (c) => {
      let peer; try { peer = new Peer("mars" + c, Object.assign({ debug: 0 }, this.opts())); } catch (e) { this.err = "WebRTC indisponível"; return this.ui(); }
      this.host = peer;
      peer.on("open", () => { this.code = c; this.ready = true; this.err = ""; try { localStorage.setItem("mars-world", c); } catch (e) { /* ignore */ } this.ui(); });
      peer.on("error", (e) => { if (e.type === "unavailable-id") { this.host = null; open(this.gen()); } else if (!this.ready) { this.err = "Sem conexão com o sinalizador (" + (e.type || "erro") + ")"; this.ui(); } });
      peer.on("disconnected", () => { this.ready = false; this.ui(); setTimeout(() => { try { peer.reconnect(); } catch (e) { /* ignore */ } }, 3000); });
      peer.on("connection", (conn) => {
        let a = null; conn.on("open", () => { a = LocalHub.attach((m) => { if (conn.open) conn.send(m); }); this.guests++; this.ui(); });
        conn.on("data", (m) => { if (a && m && typeof m === "object") a.recv(m); });
        const bye = () => { if (a) { a.close(); a = null; this.guests = Math.max(0, this.guests - 1); this.ui(); } }; conn.on("close", bye); conn.on("error", bye);
      });
    };
    open(code && /^[A-Z2-9]{6}$/.test(code) ? code : this.gen());
  },
  /** Conecta ao mundo de outro jogador pelo código. Resolve {send,close} no formato de NET. */
  join(code) {
    return new Promise((res, rej) => {
      if (typeof Peer === "undefined") return rej(new Error("WebRTC indisponível neste navegador"));
      code = String(code || "").toUpperCase().replace(/[^A-Z0-9]/g, ""); if (code.length < 4) return rej(new Error("Código inválido"));
      let done = false, peer; const fail = (m) => { if (done) return; done = true; try { peer.destroy(); } catch (e) { /* ignore */ } rej(new Error(m)); };
      const to = setTimeout(() => fail("Não foi possível conectar. Confira o código e se o anfitrião está com o jogo aberto."), 15000);
      try { peer = new Peer(Object.assign({ debug: 0 }, this.opts())); } catch (e) { clearTimeout(to); return fail("WebRTC indisponível"); }
      peer.on("error", (e) => { clearTimeout(to); fail(e.type === "peer-unavailable" ? "Código não encontrado (o anfitrião precisa estar online)" : "Erro de conexão: " + (e.type || "")); });
      peer.on("open", () => {
        const conn = peer.connect("mars" + code, { serialization: "json", reliable: true });
        conn.on("open", () => { if (done) return; done = true; clearTimeout(to); res({ code, conn, send: (m) => conn.open && conn.send(m), close: () => { try { conn.close(); peer.destroy(); } catch (e) { /* ignore */ } } }); });
        conn.on("error", () => { clearTimeout(to); fail("Falha na conexão"); });
      });
    });
  },
  ui() { if (typeof worldUI === "function") worldUI(); },
};
