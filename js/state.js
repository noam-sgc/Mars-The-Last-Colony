/* Estado do jogador: moedas (S), perfil/cosméticos (P), conta (ACC), eventos (EV), catálogo global (CAT). */
let S = { coins: 500, own: [], done: {}, color: "#d8d0c4", v: 3 };
let P = { name: "", cr: 0, pp: 0, rp: 0, w: 0, day: "", own: DEF_OWN.slice(), eq: Object.assign({}, DEF_EQ), evs: {}, fr: { f: [], in: [], out: [], cc: {} }, v: 3 };
const ACC = { user: null, role: "guest", cc: "", vf: false, token: null };
let CAT = { cos: [], part: [], up: [] };
const isAdminAcc = () => ACC.role === "admin" || ACC.role === "artist";
const isArtistAcc = () => ACC.role === "artist";

const skey = () => "mlc" + (ACC.user ? ":" + ACC.user : ""), pkey = () => "mlp" + (ACC.user ? ":" + ACC.user : "");
function normalize() {
  S.v = 3; P.v = 3; S.own = S.own || []; S.done = S.done || {}; P.evs = P.evs || {};
  DEF_OWN.forEach((id) => { if (!P.own.includes(id)) P.own.push(id); });
  P.eq = Object.assign({}, DEF_EQ, P.eq || {}); P.sp = P.sp === "alien" ? "alien" : "human"; P.skin = SKINS[P.skin] ? P.skin : "verde"; P.facts = Array.isArray(P.facts) ? P.facts : []; P.quiz = P.quiz && Array.isArray(P.quiz.ok) ? P.quiz : { ok: [], day: "" };
  const f = P.fr = P.fr || {}; ["f", "in", "out"].forEach((k) => { f[k] = Array.isArray(f[k]) ? f[k] : []; }); f.cc = f.cc && typeof f.cc === "object" ? f.cc : {};
}
function loadLocal() {
  try { Object.assign(S, JSON.parse(localStorage.getItem(skey()) || "{}")); } catch (e) { /* ignore */ }
  try { Object.assign(P, JSON.parse(localStorage.getItem(pkey()) || "{}")); } catch (e) { /* ignore */ }
  normalize();
}
let pushT = 0;
function pushProf() {
  clearTimeout(pushT);
  pushT = setTimeout(() => { if (ACC.user && NET.ready) NET.send({ t: "prof", data: { p: P, s: S } }); }, 1200);
}
const save = () => { try { localStorage.setItem(skey(), JSON.stringify(S)); } catch (e) { /* ignore */ } pushProf(); };
const saveP = () => { try { localStorage.setItem(pkey(), JSON.stringify(P)); } catch (e) { /* ignore */ } pushProf(); };

// ---------- eventos ----------
const EV = {
  custom: [], active: [], mult: 1,
  refresh() {
    this.active = MarsRules.activeEvents(new Date(), this.custom);
    this.mult = this.active.reduce((a, e) => Math.max(a, e.mult), 1);
    this.active.forEach((e) => { if (P.evs[e.suit.id]) Object.assign(P.evs[e.suit.id], { n: e.suit.n }); });
  },
  suits() { return Object.values(P.evs || {}); },
  claim(ev) {
    const s = ev.suit; if (P.own.includes(s.id)) return false;
    P.evs[s.id] = { id: s.id, l: "s", c: 0, ev: ev.id, n: s.n, col: s.col, glow: s.glow }; P.own.push(s.id); saveP(); return true;
  },
  top() { return this.active.slice().sort((a, b) => b.mult - a.mult)[0]; },
};
/** Ganha moedas aplicando o multiplicador do evento ativo. Retorna o valor creditado. */
function earn(n) { const v = n * EV.mult; S.coins += v; return v; }

// ---------- peças/upgrades/cosméticos publicados pelos desenhistas ----------
function applyCatalog(c) {
  CAT = { cos: (c && c.cos) || [], part: (c && c.part) || [], up: (c && c.up) || [] };
  Object.keys(TY).forEach((k) => { if (!BUILTIN.includes(k)) delete TY[k]; });
  CAT.part.forEach((p) => { TY[p.id] = { n: p.n, c: p.c, k: p.k, p: p.p, custom: p }; });
}
const B = (k) => allUP().filter((u) => S.own.includes(u.id)).reduce((a, u) => a + (u[k] || 0), 0);
const B2 = (f, k) => allUP().filter((u) => S.own.includes(u.id)).reduce((a, u) => a + ((u[f] || {})[k] || 0), 0);
const cost = (t) => Math.ceil(TY[t].c * (1 - Math.min(.4, B("disc"))));
const canUseItem = (it) => MarsRules.canUse(it, ACC.role);
