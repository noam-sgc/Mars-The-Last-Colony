/* Regras compartilhadas entre cliente (navegador) e servidor (Node).
   UMD: no navegador vira window.MarsRules, no Node vira module.exports. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.MarsRules = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // ---------- papéis ----------
  // Somente estes nomes são administradores (e desenhistas). ADMVinnil é um usuário comum (nome liberado, sem poderes).
  const ADMINS = ["ADMKezle", "ADMLefaar"];
  const ADM_NAME_OK = ["ADMVinnil"];   // nomes iniciados em ADM permitidos para usuários comuns
  const ARTISTS = ["ADMKezle", "ADMLefaar"];
  const key = (n) => String(n || "").trim().toLowerCase();
  const isAdmin = (n) => ADMINS.some((a) => key(a) === key(n));
  const isArtist = (n) => ARTISTS.some((a) => key(a) === key(n));
  const admNameOk = (n) => ADM_NAME_OK.some((a) => key(a) === key(n));
  const roleOf = (n) => (isArtist(n) ? "artist" : isAdmin(n) ? "admin" : "user");
  const NAME_RE = /^[\p{L}\p{N}_-]{3,16}$/u;
  const validName = (n) => NAME_RE.test(String(n || ""));

  // ---------- países ----------
  const COUNTRIES = ("BR:Brasil,PT:Portugal,US:Estados Unidos,CA:Canadá,MX:México,AR:Argentina,CL:Chile,CO:Colômbia,PE:Peru,UY:Uruguai,PY:Paraguai,BO:Bolívia,VE:Venezuela,EC:Equador," +
    "ES:Espanha,FR:França,DE:Alemanha,IT:Itália,GB:Reino Unido,IE:Irlanda,NL:Países Baixos,BE:Bélgica,CH:Suíça,AT:Áustria,SE:Suécia,NO:Noruega,DK:Dinamarca,FI:Finlândia,PL:Polônia,UA:Ucrânia,RU:Rússia,TR:Turquia,GR:Grécia," +
    "JP:Japão,KR:Coreia do Sul,CN:China,IN:Índia,ID:Indonésia,PH:Filipinas,VN:Vietnã,TH:Tailândia,SA:Arábia Saudita,AE:Emirados Árabes,IL:Israel,EG:Egito,ZA:África do Sul,NG:Nigéria,MA:Marrocos,AO:Angola,MZ:Moçambique,CV:Cabo Verde,AU:Austrália,NZ:Nova Zelândia," +
    "GH:Gana,KE:Quênia,ET:Etiópia,SN:Senegal,CM:Camarões,CI:Costa do Marfim,TZ:Tanzânia,DZ:Argélia,TN:Tunísia,GW:Guiné-Bissau,ST:São Tomé e Príncipe,TL:Timor-Leste," +
    "PK:Paquistão,BD:Bangladesh,IR:Irã,IQ:Iraque,JO:Jordânia,LB:Líbano,QA:Catar,MY:Malásia,SG:Singapura,NP:Nepal,LK:Sri Lanka,MN:Mongólia,KZ:Cazaquistão," +
    "CU:Cuba,DO:República Dominicana,HT:Haiti,JM:Jamaica,PA:Panamá,CR:Costa Rica,GT:Guatemala,HN:Honduras,SV:El Salvador,NI:Nicarágua," +
    "CZ:Tchéquia,SK:Eslováquia,HU:Hungria,RO:Romênia,BG:Bulgária,RS:Sérvia,HR:Croácia,IS:Islândia,EE:Estônia,LV:Letônia,LT:Lituânia")
    .split(",").map((s) => { const [c, n] = s.split(":"); return { c, n }; });
  const validCountry = (c) => COUNTRIES.some((x) => x.c === c);
  const flag = (c) => /^[A-Z]{2}$/.test(c) ? String.fromCodePoint(...[...c].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65)) : "🏳";

  // ---------- eventos ----------
  // Eventos acontecem toda semana (sexta a domingo) e em datas comemorativas.
  // Moedas x2 nos eventos comuns; x5 nos dias especiais 1/fev, 11/abr e 12/jun.
  const MULT_NORMAL = 2, MULT_SPECIAL = 5;
  const SPECIAL = [
    { m: 2, d: 1, id: "fundacao", name: "Dia da Fundação de ARES-1", icon: "🚀", col: "#ffd84a" },
    { m: 4, d: 11, id: "pouso", name: "Dia do Grande Pouso", icon: "🛬", col: "#ff7a3c" },
    { m: 6, d: 12, id: "independencia", name: "Dia da Independência de Marte", icon: "🏴", col: "#ff4a6e" },
  ];
  const HOLIDAYS = [
    { m: 1, d: 1, id: "anonovo", name: "Ano Novo Marciano", icon: "🎆", col: "#8ad4ff" },
    { m: 2, d: 18, id: "perseverance", name: "Aniversário do Perseverance", icon: "🤖", col: "#c9d6e8" },
    { m: 4, d: 21, id: "tiradentes", name: "Dia dos Pioneiros", icon: "⛏", col: "#9be07a" },
    { m: 5, d: 1, id: "trabalho", name: "Dia do Trabalhador Espacial", icon: "🛠", col: "#ffb347" },
    { m: 7, d: 20, id: "viking", name: "Aniversário do Viking 1", icon: "🛰", col: "#d0a8ff" },
    { m: 8, d: 6, id: "curiosity", name: "Pouso do Curiosity", icon: "🔬", col: "#6fe3d1" },
    { m: 9, d: 7, id: "independencia-br", name: "Dia da Independência", icon: "🎉", col: "#4fd08a" },
    { m: 10, d: 12, id: "criancas", name: "Dia das Crianças Colonas", icon: "🎈", col: "#ff8fd0" },
    { m: 10, d: 31, id: "halloween", name: "Noite da Poeira Sombria", icon: "🎃", col: "#ff8a1f" },
    { m: 11, d: 15, id: "republica", name: "Dia da Colônia Livre", icon: "🏛", col: "#7fc6ff" },
    { m: 12, d: 25, id: "natal", name: "Natal Vermelho", icon: "🎄", col: "#ff5a5a" },
    { m: 12, d: 31, id: "reveillon", name: "Réveillon Orbital", icon: "🥂", col: "#ffe9a0" },
  ];
  const WEEKLY = [
    { id: "w-poeira", name: "Fim de Semana da Tempestade", icon: "🌪", col: "#d9824a" },
    { id: "w-aurora", name: "Fim de Semana da Aurora", icon: "🌌", col: "#6ad0ff" },
    { id: "w-gelo", name: "Fim de Semana do Gelo", icon: "🧊", col: "#9ee6ff" },
    { id: "w-colheita", name: "Fim de Semana da Colheita", icon: "🌱", col: "#7ddc6a" },
    { id: "w-rover", name: "Fim de Semana dos Rovers", icon: "🛞", col: "#f0c14a" },
    { id: "w-cosmos", name: "Fim de Semana Cósmico", icon: "🪐", col: "#b69bff" },
    { id: "w-fobos", name: "Fim de Semana de Fobos", icon: "🌑", col: "#c0b6ad" },
    { id: "w-solar", name: "Fim de Semana Solar", icon: "☀️", col: "#ffd23f" },
  ];
  const isoWeek = (dt) => {
    const d = new Date(Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate()));
    const dn = d.getUTCDay() || 7; d.setUTCDate(d.getUTCDate() + 4 - dn);
    const y0 = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d - y0) / 864e5 + 1) / 7);
  };
  const suitFor = (ev) => ({ id: "ev_" + ev.id, l: "s", n: "Traje " + ev.name, c: 0, col: ev.col, ev: ev.id, glow: ev.col });

  /** Eventos ativos em `date`. `custom` = eventos criados por admins ({id,name,start,end,mult,col,icon}). */
  function activeEvents(date, custom) {
    const dt = date || new Date(), out = [], m = dt.getMonth() + 1, d = dt.getDate();
    const sp = SPECIAL.find((s) => s.m === m && s.d === d);
    if (sp) out.push(Object.assign({ kind: "special", mult: MULT_SPECIAL }, sp));
    const ho = HOLIDAYS.find((h) => h.m === m && h.d === d);
    if (ho) out.push(Object.assign({ kind: "holiday", mult: MULT_NORMAL }, ho));
    const wd = dt.getDay();
    if (wd === 5 || wd === 6 || wd === 0) out.push(Object.assign({ kind: "weekly", mult: MULT_NORMAL }, WEEKLY[isoWeek(dt) % WEEKLY.length]));
    const t = +dt;
    (custom || []).forEach((e) => { if (e && t >= e.start && t <= e.end) out.push(Object.assign({ kind: "custom" }, e, { mult: Math.max(1, Math.min(10, +e.mult || 2)) })); });
    out.forEach((e) => { e.suit = suitFor(e); });
    return out;
  }
  const multiplier = (date, custom) => activeEvents(date, custom).reduce((a, e) => Math.max(a, e.mult), 1);
  /** Próximos eventos fixos (para o painel): até `n` dias à frente. */
  function upcoming(date, days, custom) {
    const out = [];
    for (let i = 0; i <= days; i++) {
      const dt = new Date((date || new Date()).getFullYear(), (date || new Date()).getMonth(), (date || new Date()).getDate() + i, 12);
      activeEvents(dt, custom).forEach((e) => out.push({ in: i, e, date: dt }));
    }
    return out;
  }

  // ---------- cosméticos de admin ----------
  const ADMIN_COSMETICS = [
    { id: "adm_s1", l: "s", n: "Traje Comando ADM", c: 0, col: "#6a4cff", glow: "#b9a6ff", adm: "admin" },
    { id: "adm_s2", l: "s", n: "Traje Pincel de Ouro", c: 0, col: "#ffcf3d", glow: "#fff1a8", adm: "artist" },
    { id: "adm_w1", l: "w", n: "Relógio do Administrador", c: 0, col: "#b9a6ff", adm: "admin" },
    { id: "adm_p1", l: "p", n: "Calça Estrelada ADM", c: 0, col: "#2a2470", adm: "admin" },
  ];
  /** O papel `role` pode usar um item restrito? */
  const canUse = (item, role) => !item.adm || role === "artist" || (item.adm === "admin" && role === "admin");

  return { ADMINS, ARTISTS, ADM_NAME_OK, admNameOk, isAdmin, isArtist, roleOf, validName, key, COUNTRIES, validCountry, flag,
    MULT_NORMAL, MULT_SPECIAL, SPECIAL, HOLIDAYS, WEEKLY, activeEvents, multiplier, upcoming, suitFor, ADMIN_COSMETICS, canUse };
});
