/* Hub: toda a lógica do "servidor" (contas, amigos, chat, grupos, salas, eventos,
   catálogo global, ranking). Roda no Node (server/server.js, via WebSocket) e também
   no navegador como "mundo" do anfitrião (js/localhub.js + WebRTC em js/p2p.js), com o mesmo protocolo. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./rules.js"));
  else root.MarsHub = factory(root.MarsRules);
})(typeof self !== "undefined" ? self : this, function (R) {
  "use strict";
  const rnd = (n) => Array.from({ length: n }, () => "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)]).join("");
  const clean = (s, n) => String(s == null ? "" : s).replace(/[\u0000-\u001f\u007f<>]/g, "").trim().slice(0, n);
  const num = (v, a, b, d) => { v = +v; return Number.isFinite(v) ? Math.max(a, Math.min(b, v)) : d; };
  const color = (c, d) => (/^#[0-9a-f]{6}$/i.test(c) ? c : d);

  class Hub {
    /** opts: { store, persist(), hash(pw)->Promise<string>, verify(pw,h)->Promise<bool>, now() } */
    constructor(opts) {
      this.o = opts;
      const s = (this.store = opts.store || {});
      s.users = s.users || {}; s.sessions = s.sessions || {}; s.events = s.events || [];
      s.catalog = s.catalog || { cos: [], part: [], up: [] }; s.lb = s.lb || {}; s.global = s.global || [];
      this.conns = new Map(); this.rooms = new Map(); this.parties = new Map(); this.lastChat = new Map();
      this.now = opts.now || (() => Date.now());
    }
    save() { try { this.o.persist && this.o.persist(this.store); } catch (e) { /* ignore */ } }

    /** Cria contas administrativas reservadas, se faltarem. creds: {nome: senha}. Retorna as criadas. */
    async ensureAdmins(creds, countries) {
      const made = [];
      for (const name of R.ADMINS) {
        const k = R.key(name);
        if (this.store.users[k]) continue;
        const pw = creds[name]; if (!pw) continue;
        this.store.users[k] = this.newUser(name, (countries && countries[name]) || "BR", await this.o.hash(pw));
        made.push(name);
      }
      if (made.length) this.save();
      return made;
    }
    newUser(name, country, pass) {
      return { name, country, pass, friends: [], reqIn: [], reqOut: [], prof: null, created: this.now(), npc: false };
    }

    // ---------- conexões ----------
    connect(send) {
      const c = { id: "p" + rnd(6), send: (m) => { try { send(m); } catch (e) { /* conexão caiu */ } }, user: null, rooms: new Set(), room: null, party: null };
      this.conns.set(c.id, c); c.send({ t: "hi", id: c.id, events: this.store.events, catalog: this.store.catalog });
      return c;
    }
    disconnect(c) {
      this.leaveParty(c, true);
      [...c.rooms].forEach((r) => this.leaveRoom(c, r));
      this.conns.delete(c.id);
      if (c.user) { this.pushSocial(c.user, true); this.bcast({ t: "roster" }); }
    }
    online(k) { for (const c of this.conns.values()) if (c.user === k) return c; return null; }
    isOnline(k) { const u = this.store.users[k]; return !!(u && (u.npc || this.online(k))); }
    isVerified(k) {
      const u = this.store.users[k]; if (!u) return false;
      if (R.isAdmin(u.name)) return true;
      const gf = u.prof && u.prof.p && u.prof.p.fr && u.prof.p.fr.f;
      return u.friends.some((f) => this.store.users[f] && R.isAdmin(this.store.users[f].name)) || (Array.isArray(gf) && gf.some((n) => R.isAdmin(n)));
    }
    pub(k) {
      const u = this.store.users[k]; if (!u) return null;
      return { u: u.name, cc: u.country, role: R.roleOf(u.name), vf: this.isVerified(k), on: this.isOnline(k) };
    }
    social(k) {
      const u = this.store.users[k];
      return { friends: u.friends.map((f) => this.pub(f)).filter(Boolean), reqIn: u.reqIn.map((f) => this.pub(f)).filter(Boolean), reqOut: u.reqOut.map((f) => this.pub(f)).filter(Boolean) };
    }
    pushSocial(k, onlyFriends) {
      const u = this.store.users[k]; if (!u) return;
      const targets = new Set(onlyFriends ? u.friends : [k]);
      if (!onlyFriends) { u.friends.forEach((f) => targets.add(f)); u.reqOut.forEach((f) => targets.add(f)); }
      targets.forEach((t) => { const c = this.online(t); if (c) c.send(Object.assign({ t: "social" }, this.social(t))); });
    }
    bcast(msg, filter) { this.conns.forEach((c) => { if (c.user && (!filter || filter(c))) c.send(msg); }); }

    // ---------- despacho ----------
    async handle(c, m) {
      if (!m || typeof m !== "object") return;
      const rid = m.rid, ok = (x) => rid != null && c.send(Object.assign({ t: "res", rid, ok: true }, x || {})),
        no = (err) => rid != null && c.send({ t: "res", rid, ok: false, err });
      const me = c.user ? this.store.users[c.user] : null;
      const need = (cond, err) => { if (!cond) { no(err || "Sem permissão"); throw 0; } };
      try {
        switch (m.t) {
          case "reg": return await this.register(c, m, ok, no);
          case "login": return await this.login(c, m, ok, no);
          case "resume": {
            const k = this.store.sessions[m.token]; need(k && this.store.users[k], "Sessão expirada");
            return this.enter(c, k, m.token, ok);
          }
          case "logout": { if (m.token) delete this.store.sessions[m.token]; this.leaveParty(c, true); if (c.user) { const k = c.user; c.user = null; this.pushSocial(k, true); } this.save(); return ok(); }
          case "ping": return ok({ now: this.now() });
          case "users": {
            need(me, "Entre primeiro");
            return ok({ anon: [...this.conns.values()].filter((q) => !q.user).length, users: Object.keys(this.store.users).map((k) => Object.assign(this.pub(k), { fr: me.friends.includes(k) ? 2 : me.reqOut.includes(k) ? 1 : me.reqIn.includes(k) ? 3 : 0 })).sort((a, b) => (b.on - a.on) || a.u.localeCompare(b.u)) });
          }
          case "fr": need(me, "Entre primeiro"); return this.friendOp(c, me, m, ok, no);
          case "chat": need(me, "Entre primeiro"); return this.chat(c, me, m, ok, no);
          case "join": need(me, "Entre primeiro"); this.joinRoom(c, clean(m.room, 24)); return ok();
          case "leave": this.leaveRoom(c, clean(m.room, 24)); return ok();
          case "pres": need(me); return this.presence(c, me, m);
          case "party": need(me, "Entre primeiro"); return this.partyOp(c, me, m, ok, no);
          case "prof": need(me); me.prof = this.sanitizeProf(me, m.data); this.save(); return ok();
          case "lb": return ok({ rows: Object.values(this.store.lb).sort((a, b) => b.pp - a.pp).slice(0, 50) });
          case "win": {
            need(me); const k = c.user, o = this.store.lb[k] || { name: me.name, wins: 0, pp: 0, score: 0 };
            o.wins += 1; o.pp += num(m.pp, 0, 200, 0); o.score = Math.max(o.score, num(m.score, 0, 1e6, 0)); this.store.lb[k] = o; this.save(); return ok();
          }
          case "adm.msg": {
            need(me && R.isAdmin(me.name), "Apenas administradores");
            const text = clean(m.text, 240); need(text, "Mensagem vazia");
            const msg = { t: "gmsg", from: me.name, text, ts: this.now() };
            this.bcast(msg); this.pushChat("global", { u: "📢 " + me.name, role: "admin", vf: true, cc: me.country }, text, true);
            return ok();
          }
          case "adm.ev.add": {
            need(me && R.isAdmin(me.name), "Apenas administradores");
            const e = m.ev || {}, start = num(e.start, 0, 4e12, 0), end = num(e.end, 0, 4e12, 0);
            need(clean(e.name, 40) && end > start, "Dados do evento inválidos");
            this.store.events.push({ id: "c" + rnd(6), name: clean(e.name, 40), icon: clean(e.icon, 4) || "🎉", col: color(e.col, "#ff6a2b"), mult: num(e.mult, 1, 10, 2), start, end, by: me.name });
            this.store.events = this.store.events.slice(-60); this.save(); this.bcast({ t: "events", events: this.store.events }); return ok();
          }
          case "adm.ev.del": {
            need(me && R.isAdmin(me.name), "Apenas administradores");
            this.store.events = this.store.events.filter((e) => e.id !== m.id); this.save(); this.bcast({ t: "events", events: this.store.events }); return ok();
          }
          case "cat.pub": need(me && R.isArtist(me.name), "Apenas desenhistas"); return this.publish(me, m, ok, no);
          case "cat.del": {
            need(me && R.isArtist(me.name), "Apenas desenhistas");
            const l = this.store.catalog[m.kind]; need(l, "Tipo inválido");
            this.store.catalog[m.kind] = l.filter((x) => x.id !== m.id); this.save(); this.bcast({ t: "cat", catalog: this.store.catalog }); return ok();
          }
          default: return no("Mensagem desconhecida");
        }
      } catch (e) { if (e !== 0) { rid != null && c.send({ t: "res", rid, ok: false, err: "Erro interno" }); } }
    }

    // ---------- contas ----------
    async register(c, m, ok, no) {
      const name = clean(m.u, 16), k = R.key(name);
      if (!R.validName(name)) return no("Usuário: 3 a 16 letras, números, _ ou -");
      // Nomes ADM são reservados a quem os criar primeiro: depois de registrados, ninguém mais os usa.
      if (!R.isAdmin(name) && /^adm/i.test(name)) return no("Nomes iniciados em ADM são reservados");
      if (String(m.p || "").length < 6) return no("A senha precisa de 6+ caracteres");
      if (!R.validCountry(m.c)) return no("Escolha um país");
      if (this.store.users[k]) return no(R.isAdmin(name) ? "Este nome reservado já foi registrado por outra pessoa" : "Usuário já existe");
      this.store.users[k] = this.newUser(name, m.c, await this.o.hash(String(m.p)));
      this.save(); const token = rnd(32); this.store.sessions[token] = k; this.save();
      return this.enter(c, k, token, ok);
    }
    async login(c, m, ok, no) {
      const k = R.key(m.u), u = this.store.users[k];
      if (!u || u.npc || !(await this.o.verify(String(m.p || ""), u.pass))) return no("Usuário ou senha incorretos");
      const token = rnd(32); this.store.sessions[token] = k; this.save();
      return this.enter(c, k, token, ok);
    }
    enter(c, k, token, ok) {
      if (c.user && c.user !== k) this.leaveParty(c, true);
      c.user = k; const u = this.store.users[k];
      this.joinRoom(c, "lobby");
      ok({ token, me: this.pub(k), prof: u.prof, social: this.social(k), events: this.store.events, catalog: this.store.catalog, party: this.partyOf(k) && this.partyPub(this.partyOf(k)), hist: this.store.global.slice(-40) });
      this.pushSocial(k, true); this.bcast({ t: "roster" });
    }
    sanitizeProf(u, d) {
      d = d && typeof d === "object" ? d : {};
      const role = R.roleOf(u.name), p = d.p || {}, s = d.s || {};
      const all = [].concat(R.ADMIN_COSMETICS, this.store.catalog.cos);
      const allowed = (id) => { const it = all.find((x) => x.id === id); return !it || R.canUse(it, role); };
      const own = (Array.isArray(p.own) ? p.own : []).filter((x) => typeof x === "string" && x.length < 40 && allowed(x)).slice(0, 300);
      const eq = {}; ["s", "p", "w", "h", "b"].forEach((l) => { const id = p.eq && p.eq[l]; eq[l] = typeof id === "string" && allowed(id) && own.includes(id) ? id : l + "0"; });
      const nm = (a) => (Array.isArray(a) ? a.filter((x) => R.validName(x)).slice(0, 300) : []), fr0 = p.fr || {}, frs = { f: nm(fr0.f), in: nm(fr0.in), out: nm(fr0.out) };
      const sp = p.sp === "alien" ? "alien" : "human", skin = ["verde", "violeta", "azul", "laranja", "cinza"].includes(p.skin) ? p.skin : "verde", spChosen = !!p.spChosen;
      const facts = (Array.isArray(p.facts) ? p.facts : []).filter((x) => Number.isInteger(x) && x >= 0 && x < 500).slice(0, 500), q0 = p.quiz || {}, quiz = { ok: (Array.isArray(q0.ok) ? q0.ok : []).filter((x) => Number.isInteger(x) && x >= 0 && x < 500).slice(0, 500), day: clean(q0.day, 10) };
      const evs = {}; Object.keys(p.evs || {}).slice(0, 100).forEach((id) => { const e = p.evs[id] || {}; if (/^ev_[\w-]{1,40}$/.test(id)) evs[id] = { id, l: "s", c: 0, ev: clean(e.ev, 40), n: clean(e.n, 60), col: color(e.col, "#ff6a2b"), glow: color(e.glow, "#ff6a2b") }; });
      return { p: { cr: num(p.cr, 0, 1e9, 0), pp: num(p.pp, 0, 1e9, 0), rp: num(p.rp, 0, 1e9, 0), w: num(p.w, 0, 1e6, 0), own, eq, evs, fr: frs, facts, quiz, sp, skin, spChosen, day: clean(p.day, 10) },
        s: { coins: num(s.coins, 0, 1e12, 500), own: (Array.isArray(s.own) ? s.own : []).filter((x) => typeof x === "string").slice(0, 200), done: s.done && typeof s.done === "object" ? s.done : {}, color: color(s.color, "#d8d0c4") } };
    }

    // ---------- amigos ----------
    friendOp(c, me, m, ok, no) {
      const mk = c.user, tk = R.key(m.u), t = this.store.users[tk];
      if (!t || tk === mk) return no("Usuário inválido");
      const rm = (a, x) => { const i = a.indexOf(x); if (i >= 0) a.splice(i, 1); };
      if (m.op === "add") {
        if (me.friends.includes(tk)) return no("Já são amigos");
        if (me.reqIn.includes(tk)) { rm(me.reqIn, tk); rm(t.reqOut, mk); me.friends.push(tk); t.friends.push(mk); }
        else if (!me.reqOut.includes(tk)) { me.reqOut.push(tk); t.reqIn.push(mk); if (t.npc) this.npcAccept(tk, mk); }
      } else if (m.op === "acc") {
        if (!me.reqIn.includes(tk)) return no("Sem pedido");
        rm(me.reqIn, tk); rm(t.reqOut, mk); me.friends.push(tk); t.friends.push(mk);
      } else if (m.op === "rej" || m.op === "cancel") { rm(me.reqIn, tk); rm(t.reqOut, mk); rm(me.reqOut, tk); rm(t.reqIn, mk); }
      else if (m.op === "rm") { rm(me.friends, tk); rm(t.friends, mk); }
      else return no("Operação inválida");
      this.save(); this.pushSocial(mk); this.pushSocial(tk); ok(this.social(mk));
    }
    npcAccept(npc, k) { setTimeout(() => { const n = this.store.users[npc], u = this.store.users[k]; if (!n || !u || !u.reqOut.includes(npc)) return;
      u.reqOut = u.reqOut.filter((x) => x !== npc); n.reqIn = n.reqIn.filter((x) => x !== k); u.friends.push(npc); n.friends.push(k); this.save(); this.pushSocial(k); }, 1500); }

    // ---------- chat ----------
    pushChat(ch, from, text, sys) {
      const msg = { t: "chat", ch, from, m: text, ts: this.now(), sys: !!sys };
      if (ch === "global") { this.store.global.push(msg); this.store.global = this.store.global.slice(-60); this.bcast(msg); this.save(); }
      return msg;
    }
    chat(c, me, m, ok, no) {
      const text = clean(m.m, 200); if (!text) return no("Mensagem vazia");
      const last = this.lastChat.get(c.id) || 0; if (this.now() - last < 600) return no("Devagar! Aguarde um instante.");
      this.lastChat.set(c.id, this.now());
      const from = { u: me.name, role: R.roleOf(me.name), vf: this.isVerified(c.user), cc: me.country };
      const ch = String(m.ch || "global");
      if (ch === "global") { this.pushChat("global", from, text); return ok(); }
      const msg = { t: "chat", ch, from, m: text, ts: this.now() };
      if (ch === "room") {
        if (!c.room) return no("Você não está em uma sala");
        msg.ch = "room"; (this.rooms.get("g-" + c.room) || new Map()).forEach((_, id) => { const q = this.conns.get(id); q && q.send(msg); });
      } else if (ch === "party") {
        const p = this.partyOf(c.user); if (!p) return no("Você não está em um grupo");
        p.members.forEach((k) => { const q = this.online(k); q && q.send(msg); });
      } else if (ch.startsWith("dm:")) {
        const tk = R.key(ch.slice(3)), t = this.store.users[tk]; if (!t) return no("Usuário não existe");
        msg.ch = "dm:" + me.name; msg.to = t.name;
        const q = this.online(tk); if (q) q.send(msg); else if (!t.npc) return no("Usuário offline");
        c.send(Object.assign({}, msg, { ch: "dm:" + t.name }));
        if (t.npc) this.npcReply(c, t, text);
      } else return no("Canal inválido");
      ok();
    }
    npcReply(c, t, text) {
      const lines = ["Oi! Estou construindo uma estufa nova.", "Bora jogar em equipe hoje?", "A tempestade de poeira derrubou meus painéis…", "Já viu o evento da semana? Moedas em dobro!", "Boa! Me convida pro seu grupo.", "Tô na base ARES-1, tudo tranquilo por aqui."];
      setTimeout(() => c.send({ t: "chat", ch: "dm:" + t.name, from: { u: t.name, role: "user", vf: this.isVerified(R.key(t.name)), cc: t.country }, m: lines[Math.floor(Math.random() * lines.length)], ts: this.now() }), 900 + Math.random() * 900);
    }

    // ---------- salas (presença) ----------
    joinRoom(c, room) {
      if (!room) return; let r = this.rooms.get(room); if (!r) this.rooms.set(room, (r = new Map()));
      if (!r.has(c.id)) r.set(c.id, {}); c.rooms.add(room); if (room.startsWith("g-")) c.room = room.slice(2);
      this.broadcastPeers(room);
    }
    leaveRoom(c, room) {
      const r = this.rooms.get(room); if (!r) return; r.delete(c.id); c.rooms.delete(room); if (c.room && room === "g-" + c.room) c.room = null;
      if (!r.size) this.rooms.delete(room); else this.broadcastPeers(room);
    }
    presence(c, me, m) {
      const room = clean(m.room, 24), r = this.rooms.get(room); if (!r || !r.has(c.id)) return;
      const cur = r.get(c.id), patch = m.patch && typeof m.patch === "object" ? m.patch : {};
      if (JSON.stringify(patch).length > 12000) return;
      Object.keys(patch).forEach((k) => { if (patch[k] === null) delete cur[k]; else cur[k] = patch[k]; });
      cur.n_u = me.name; cur.vf = this.isVerified(c.user); cur.cc = me.country; cur.rl = R.roleOf(me.name);
      if (cur.u != null) cur.u = me.name;
      const p = this.partyOf(c.user); cur.pt = p ? p.id : null;
      this.broadcastPeers(room);
    }
    broadcastPeers(room) {
      const r = this.rooms.get(room); if (!r) return;
      const peers = [...r.entries()].map(([id, presence]) => ({ peer: id, presence }));
      r.forEach((_, id) => { const q = this.conns.get(id); q && q.send({ t: "peers", room, peers }); });
    }

    // ---------- grupos ----------
    partyOf(k) { for (const p of this.parties.values()) if (p.members.includes(k)) return p; return null; }
    partyPub(p) { return p && { id: p.id, leader: this.store.users[p.leader].name, members: p.members.map((k) => this.pub(k)) }; }
    pushParty(p) { p.members.forEach((k) => { const q = this.online(k); q && q.send({ t: "party", party: this.partyPub(p) }); }); }
    leaveParty(c, silent) {
      const p = c.user && this.partyOf(c.user); if (!p) return;
      p.members = p.members.filter((k) => k !== c.user);
      if (!silent) c.send({ t: "party", party: null });
      if (!p.members.length) this.parties.delete(p.id); else { if (p.leader === c.user) p.leader = p.members[0]; this.pushParty(p); }
      if (silent) c.send({ t: "party", party: null });
    }
    partyOp(c, me, m, ok, no) {
      const k = c.user; let p = this.partyOf(k);
      switch (m.op) {
        case "make": if (p) return no("Você já está em um grupo"); p = { id: "G" + rnd(4).toUpperCase(), leader: k, members: [k], inv: new Set() }; this.parties.set(p.id, p); this.pushParty(p); return ok();
        case "inv": {
          if (!p) { p = { id: "G" + rnd(4).toUpperCase(), leader: k, members: [k], inv: new Set() }; this.parties.set(p.id, p); }
          if (p.leader !== k) return no("Só o líder convida"); const tk = R.key(m.u), t = this.store.users[tk]; if (!t) return no("Usuário inválido");
          if (p.members.length >= 8) return no("Grupo cheio (8)"); if (this.partyOf(tk)) return no("Já está em um grupo");
          p.inv.add(tk); const q = this.online(tk); if (q) q.send({ t: "party.inv", id: p.id, from: me.name });
          if (t.npc) setTimeout(() => { if (p.inv.has(tk) && !this.partyOf(tk) && this.parties.has(p.id)) { p.inv.delete(tk); p.members.push(tk); this.pushParty(p); } }, 1200);
          this.pushParty(p); return ok();
        }
        case "acc": {
          const q = this.parties.get(m.id); if (!q || !q.inv.has(k)) return no("Convite expirou"); if (p) this.leaveParty(c, true);
          q.inv.delete(k); q.members.push(k); this.pushParty(q); return ok();
        }
        case "leave": this.leaveParty(c); return ok();
        case "kick": {
          if (!p || p.leader !== k) return no("Só o líder expulsa"); const tk = R.key(m.u); if (tk === k || !p.members.includes(tk)) return no("Inválido");
          p.members = p.members.filter((x) => x !== tk); const q = this.online(tk); if (q) q.send({ t: "party", party: null }); this.pushParty(p); return ok();
        }
        case "go": {
          if (!p || p.leader !== k) return no("Só o líder inicia"); const code = clean(m.code, 8).toUpperCase();
          p.members.forEach((x) => { if (x === k) return; const q = this.online(x); q && q.send({ t: "party.go", code }); }); return ok();
        }
        default: return no("Operação inválida");
      }
    }

    // ---------- catálogo global (desenhistas) ----------
    publish(me, m, ok, no) {
      const kind = m.kind, it = m.item || {}, name = clean(it.n, 40); if (!name) return no("Dê um nome");
      let out;
      if (kind === "cos") {
        const layer = ["s", "p", "w", "h", "b"].includes(it.l) ? it.l : "s";   // traje, calça, relógio, capacete, mochila
        out = { id: "u_c_" + rnd(6), l: layer, n: name, c: num(it.c, 0, 5000, 100), col: color(it.col, "#ff6a2b"), glow: it.glow ? color(it.glow, "#ffffff") : "", adm: ["admin", "artist"].includes(it.adm) ? it.adm : "", by: me.name };
      } else if (kind === "part") {
        out = { id: "u_p_" + rnd(6), n: name, c: num(it.c, 5, 500, 50), k: ["eff", "water", "food", "oxy", "fuel", "morale"].includes(it.k) ? it.k : "eff", p: num(it.p, 0.2, 3, 1),
          shape: ["box", "cyl", "dome", "tower", "ring"].includes(it.shape) ? it.shape : "box", col: color(it.col, "#9aa7b8"), glow: color(it.glow, "#44ffcc"), h: num(it.h, 1, 8, 3), w: num(it.w, 1, 6, 3), by: me.name };
      } else if (kind === "up") {
        const pm = {}, cr = {}; ["eff", "water", "food", "oxy", "fuel", "morale"].forEach((k) => { if (it.pm && it.pm[k]) pm[k] = num(it.pm[k], 0, 1, 0); if (it.cr && it.cr[k]) cr[k] = num(it.cr[k], 0, 0.8, 0); });
        out = { id: "u_u_" + rnd(6), k: it.k === "Software" ? "Software" : "Hardware", n: name, d: clean(it.d, 90) || "Upgrade da comunidade", c: num(it.c, 50, 5000, 300), pm, cr, time: num(it.time, 0, 120, 0), rw: num(it.rw, 0, 0.5, 0), by: me.name };
      } else return no("Tipo inválido");
      const l = this.store.catalog[kind]; l.push(out); if (l.length > 150) l.shift();
      this.save(); this.bcast({ t: "cat", catalog: this.store.catalog }); c_ok(ok, out);
    }
  }
  function c_ok(ok, out) { ok({ item: out }); }
  return { Hub, rnd };
});
