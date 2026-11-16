/* Dados estáticos do jogo: peças, fases, missões, upgrades, cosméticos. */
const $ = (s) => document.querySelector(s);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => "&#" + c.charCodeAt(0) + ";");
const IMG = { b: "assets/img/b.jpg", p: [0, 1, 2, 3, 4].map((i) => `assets/img/p${i}.jpg`) };
const SV = {}; ["t1", "t2", "t6", "t7", "t8", "t9a", "t9b", "t10", "t11", "t12", "t14", "t16", "fb", "fr"].forEach((k) => (SV[k] = `assets/img/${k}.svg`));

// ---------- peças ----------
const TY = {
  solar: { n: "Painel solar", c: 20, k: "eff", p: .9 }, ctrl: { n: "Centro de controle", c: 60, k: "eff", p: 1.6 }, rover: { n: "Rover", c: 45, k: "eff", p: .7 },
  drill: { n: "Broca de gelo", c: 35, k: "water", p: 1.2 }, purif: { n: "Purificador", c: 45, k: "water", p: 1 },
  green: { n: "Estufa", c: 50, k: "food", p: 1.1 }, hydro: { n: "Hidroponia", c: 70, k: "food", p: 1.8 },
  oxy: { n: "Gerador de O₂", c: 45, k: "oxy", p: 1.3 }, fuel: { n: "Refinaria", c: 55, k: "fuel", p: 1.1 },
  rec: { n: "Cúpula de lazer", c: 40, k: "morale", p: .9 }, hab: { n: "Habitat", c: 40, k: "crew", p: 0 },
  // peças da saga alienígena (liberadas a partir da fase 31)
  ant: { n: "Antena de contato", c: 65, k: "eff", p: 1.5, alien: 1 }, emb: { n: "Embaixada", c: 80, k: "morale", p: 1.6, alien: 1 }, xeno: { n: "Jardim xeno", c: 75, k: "food", p: 1.9, alien: 1 },
};
const BUILTIN = Object.keys(TY);
const KN = { water: "Água", food: "Comida", oxy: "Oxigênio", fuel: "Combustível", morale: "Moral", eff: "Eficiência" }, K = Object.keys(KN);
const CO = { water: .07, food: .06, oxy: .08, fuel: .02, morale: .05, eff: .03 }, TC = { water: "#4aa3ff", food: "#6fd45a", oxy: "#9be7ff", fuel: "#ff9a3c", morale: "#d78bff", eff: "#ffe14a" };
const CL = ["oxy", "eff", "water", "food", "fuel", "morale"], MC = { oxy: 45, eff: 20, water: 35, food: 50, fuel: 55, morale: 40 };
const partKeys = () => Object.keys(TY);
const tcode = (t) => { const i = BUILTIN.indexOf(t); return i >= 0 ? i : t; };
const tdecode = (c) => (typeof c === "number" ? BUILTIN[c] : TY[c] ? c : null);

// ---------- capas ----------
const cov = (t, h) => "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="hsl(${h},60%,12%)"/><stop offset="1" stop-color="hsl(${h},70%,38%)"/></linearGradient></defs><rect width="640" height="360" fill="url(#g)"/><circle cx="${420 + h % 90}" cy="110" r="46" fill="hsl(${h + 20},80%,70%)"/><path d="M0 300 Q160 ${240 + h % 40} 320 290 T640 280 V360 H0Z" fill="hsl(${h},55%,18%)"/><text x="24" y="338" fill="#fff" font-family="sans-serif" font-size="26" font-weight="700">${t.replace(/&/g, "&amp;")}</text></svg>`);
// capas da saga alienígena: nave-mãe pacífica sobre a colônia
const covU = (t, h, n) => "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="hsl(${h},70%,8%)"/><stop offset="1" stop-color="hsl(${h},60%,30%)"/></linearGradient><radialGradient id="b" cx=".5" cy="0" r=".9"><stop offset="0" stop-color="hsl(${h + 60},100%,80%)" stop-opacity=".75"/><stop offset="1" stop-color="hsl(${h + 60},100%,60%)" stop-opacity="0"/></radialGradient></defs><rect width="640" height="360" fill="url(#g)"/>${Array.from({ length: 40 }, (_, i) => `<circle cx="${(i * 97 + h * 7) % 640}" cy="${(i * 53 + h * 3) % 200}" r="${(i % 3) * .6 + .6}" fill="#fff" opacity=".7"/>`).join("")}<path d="M250 90 L180 300 H460 L390 90Z" fill="url(#b)"/><ellipse cx="320" cy="88" rx="${70 + n % 5 * 8}" ry="18" fill="hsl(${h + 40},20%,72%)"/><ellipse cx="320" cy="78" rx="34" ry="20" fill="hsl(${h + 60},80%,75%)" opacity=".9"/>${[-44, -22, 0, 22, 44].map((x) => `<circle cx="${320 + x}" cy="90" r="3.4" fill="#aaffdd"/>`).join("")}<path d="M0 310 Q160 ${260 + h % 30} 320 300 T640 295 V360 H0Z" fill="hsl(${h - 160},45%,14%)"/><text x="24" y="338" fill="#fff" font-family="sans-serif" font-size="26" font-weight="700">${t.replace(/&/g, "&amp;")}</text></svg>`);

// ---------- fases ----------
// [título, descrição, capa, tempestade(1)/nav(2 parâmetros), nav]
const A = [
  ["A Grande Travessia", "Pilote a nave da Terra a Marte: desvie de asteroides e gerencie o combustível.", SV.t1, 0, 1],
  ["Os 7 Minutos de Terror", "Entrada, descida e pouso: freie a tempo e acerte a plataforma.", SV.t2, 0, 2],
  ["Primeiro Contato", "Instale energia e o primeiro habitat da base ARES-1.", IMG.p[0]],
  ["Tempestade de Poeira", "Reforce a geração de energia antes que a tempestade chegue.", IMG.p[1], 1],
  ["Território Desconhecido", "Envie um rover para mapear o terreno e monte a base de apoio.", IMG.p[2]],
  ["Água Congelada", "Perfure o gelo subterrâneo e garanta água para a colônia.", IMG.p[3]],
  ["Agricultura Marciana", "Cultive alimento sob as cúpulas e torne a colônia autossuficiente.", IMG.p[4]],
  ["Emergência na Base", "Despressurização no setor C: reparo e selagem do casco.", SV.t6, 1],
  ["O Grande Desfiladeiro", "Valles Marineris: expedição científica de profundidade.", SV.t7],
  ["Descoberta Científica", "Bioassinatura detectada: monte o laboratório de análise.", SV.t8],
  ["Escudo Magnético", "Deflexão do vento solar e proteção contra radiação.", SV.t9a],
  ["Expansão da Humanidade", "Malha de habitats metropolitanos e chegada de novos colonos.", SV.t9b],
  ["Uma Nova Humanidade", "Colônia autossustentável e terraformação global.", SV.t10],
  ["250 Dias no Vácuo", "Segunda onda de colonos: sustente a base enquanto a nave se aproxima.", SV.t11],
  ["Tubos de Lava", "Habitats pressurizados protegidos por 50 metros de basalto.", SV.t12],
  ["Sublimação Polar", "Espelhos orbitais liberam vapor e CO₂ para engrossar a atmosfera.", SV.t14],
  ["Mineração de Regolito", "Extraia ferro e silício do solo para construir sem importar da Terra.", cov("Mineração de Regolito", 20)],
  ["Usina de Combustível Sabatier", "Produza metano e oxigênio a partir de CO₂ e água para a viagem de volta.", cov("Usina de Combustível Sabatier", 35)],
  ["Vidro de Regolito", "Funda vidro marciano para ampliar as cúpulas e as estufas.", cov("Vidro de Regolito", 190)],
  ["Elo Marte–Terra", "Antenas de alto ganho e latência de 20 minutos: mantenha a base eficiente sozinha.", cov("Elo Marte–Terra", 215)],
  ["Tempestade Global", "A poeira cobre o planeta por semanas: sobreviva com energia reduzida.", cov("Tempestade Global", 10), 1],
  ["Missão a Fobos", "Estação em Fobos: logística de combustível e oxigênio em órbita.", cov("Missão a Fobos", 260)],
  ["Aquífero Profundo", "Perfure o aquífero e leve água por dutos a toda a colônia.", cov("Aquífero Profundo", 200)],
  ["Reator de Fissão", "Energia nuclear compacta para noites longas e tempestades.", cov("Reator de Fissão", 120)],
  ["A Primeira Colheita", "Excedente de comida: celebre e sustente a moral de todos.", cov("A Primeira Colheita", 95)],
  ["Crise de Moral", "Isolamento pesa: lazer, comunidade e rotina para evitar o colapso.", cov("Crise de Moral", 300)],
  ["Porto Espacial", "Pista de pouso, refinaria e controle para receber naves em massa.", cov("Porto Espacial", 230)],
  ["Mares de Hellas", "Água líquida na bacia de Hellas: ecossistema e novas cúpulas.", cov("Mares de Hellas", 170)],
  ["Independência de Marte", "Uma colônia autônoma em tudo: energia, água, comida, ar e moral.", cov("Independência de Marte", 45)],
  ["O Desafio Supremo", "Sobrecarga planetária: o teste final da colônia.", SV.t16],
];
// Invasão alienígena (pacífica) · Ultimate: 15 fases novas (31–45)
const ALIEN = [
  ["Luzes sobre Tharsis", "Uma frota desconhecida entra em órbita. Não é um ataque: mantenha a calma e a colônia estável.", 200],
  ["O Sinal", "Uma melodia de rádio se repete. Monte as antenas de contato para decifrá-la.", 160, { ant: 1 }],
  ["Pouso Pacífico", "A nave-mãe pede permissão para pousar. Prepare energia e abrigo para os visitantes.", 120],
  ["Embaixada de Marte", "Construa a primeira embaixada interespécies e receba os emissários.", 330, { emb: 1 }],
  ["Intérpretes", "Colonos e visitantes aprendem a língua um do outro: moral e comunicação em alta.", 20, { emb: 1, ant: 1 }],
  ["Banquete Interestelar", "Alimente duas espécies com a mesma colheita. Estufas e jardins xeno.", 95, { xeno: 1 }],
  ["Troca de Tecnologias", "Os visitantes ensinam a captar energia do vento solar. Eficiência acima de tudo.", 55, { ant: 2 }],
  ["Jardim Xeno", "Plantas luminescentes de outro mundo florescem sob as cúpulas.", 150, { xeno: 2 }],
  ["Tempestade Cósmica", "Uma tempestade de partículas atinge Marte: os visitantes ajudam a proteger a base.", 280, { emb: 1, ant: 2 }, 1],
  ["Cidade Flutuante", "Habitats metropolitanos conectados por pontes de luz.", 210, { emb: 2, xeno: 1 }],
  ["Canção das Estrelas", "Um festival interplanetário: lazer, música e moral para todos.", 310, { emb: 2 }],
  ["Portal de Fobos", "Uma passagem estável em Fobos liga Marte à frota: logística em órbita.", 260, { ant: 2, emb: 1 }],
  ["Conselho Galáctico", "Marte é convidada a falar pela humanidade. Colônia impecável em todos os tanques.", 180, { emb: 2, ant: 2, xeno: 1 }],
  ["Aliança Eterna", "Assine o pacto de paz: tudo no máximo e todos felizes.", 130, { emb: 3, ant: 2, xeno: 2 }],
  ["Ultimate: Um Só Povo", "O teste final pacífico: duas civilizações, uma colônia, nenhuma falha.", 70, { emb: 3, ant: 3, xeno: 3 }],
];
ALIEN.forEach((a, n) => A.push([a[0], a[1], covU(a[0], a[2], n), a[4] || 0, 0, a[3] || {}]));
const ALIEN_START = 30;

const MS_POOL = ["talk", "tidy", "enter", "rec", "morale", "rover"];
function genMissions(i, alien) {
  const j = Math.max(0, i - 2), out = [], rw = 30 + j * 4;
  const mk = (ty) => ({
    talk: { id: "talk", txt: "Converse com colonos", n: 2 + (j >> 2), rw },
    tidy: { id: "tidy", txt: "Arrume itens dentro dos edifícios", n: 4 + (j >> 2), rw },
    enter: { id: "enter", txt: "Entre em edifícios diferentes", n: 1 + (j >> 3), rw },
    rec: { id: "rec", txt: "Construa cúpulas de lazer", n: 1 + (j >> 4), rw },
    morale: { id: "morale", txt: "Moral acima de 60%", n: 60, rw: rw + 10 },
    rover: { id: "rover", txt: "Construa rovers", n: 1 + (j >> 4), rw },
  }[ty]);
  out.push(mk(MS_POOL[i % 6])); out.push(mk(MS_POOL[(i + 3) % 6]));
  if (alien) out.push({ id: "contact", txt: "Converse com emissários alienígenas", n: 2 + ((i - ALIEN_START) >> 3), rw: rw + 20 });
  return out;
}
const PH = A.map((a, i) => {
  if (a[4]) return { n: a[0], d: a[1], img: a[2], nav: a[4], need: {}, parts: {}, hab: 0, tg: 0, t: 0, r: a[4] == 1 ? 320 : 420, ms: [] };
  const alien = i >= ALIEN_START, j = i - 2, n = Math.min(6, 2 + Math.floor(j / 2)), np = Math.min(4, 1 + Math.floor(j / 7)), hab = np, need = {}; let c = hab * 40;
  CL.slice(0, n).forEach((k) => { need[k] = np; c += np * MC[k]; });
  const parts = a[5] || {}; Object.keys(parts).forEach((k) => { c += parts[k] * TY[k].c; });
  return { n: a[0], d: a[1], img: a[2], storm: a[3], alien, need, parts, hab, tg: Math.min(alien ? 90 : 85, 45 + j * 3), t: Math.round((180 + j * 10 + (alien ? 60 : 0)) * 1.5), r: Math.ceil(c * 2 / 10) * 10, ms: genMissions(i, alien) };
});

// ---------- upgrades ----------
const UP = [
  { id: "h1", k: "Hardware", n: "Painéis de perovskita", d: "+30% de Eficiência produzida", c: 300, pm: { eff: .3 } },
  { id: "h2", k: "Hardware", n: "Broca de plasma", d: "+30% de Água produzida", c: 350, pm: { water: .3 } },
  { id: "h3", k: "Hardware", n: "Reciclador de água em circuito fechado", d: "-30% no consumo de água", c: 400, cr: { water: .3 } },
  { id: "h4", k: "Hardware", n: "Compressor criogênico de O₂", d: "+30% de Oxigênio produzido", c: 350, pm: { oxy: .3 } },
  { id: "h5", k: "Hardware", n: "Tanques de metano supercríticos", d: "+30% de Combustível produzido", c: 350, pm: { fuel: .3 } },
  { id: "h6", k: "Hardware", n: "LEDs de espectro total", d: "+30% de Comida produzida", c: 350, pm: { food: .3 } },
  { id: "h7", k: "Hardware", n: "Blindagem anti-poeira", d: "+20 s em cada fase", c: 375, time: 20 },
  { id: "h8", k: "Hardware", n: "Rover com tração 6x6", d: "+10% de moedas por fase", c: 500, rw: .1 },
  { id: "s1", k: "Software", n: "IA de logística", d: "+2 moedas/s durante a fase", c: 350, inc: 2 },
  { id: "s2", k: "Software", n: "Previsão climática", d: "+15 s em cada fase", c: 250, time: 15 },
  { id: "s3", k: "Software", n: "Otimizador de energia", d: "-10% no custo das peças", c: 550, disc: .1 },
  { id: "s4", k: "Software", n: "Contabilidade de missão", d: "+15% de moedas por fase", c: 400, rw: .15 },
  { id: "s5", k: "Software", n: "Controle de qualidade do ar", d: "-30% no consumo de oxigênio", c: 450, cr: { oxy: .3 } },
  { id: "s6", k: "Software", n: "Rede social da colônia", d: "+30% de Moral produzida", c: 400, pm: { morale: .3 } },
  { id: "s7", k: "Software", n: "Gêmeo digital da base", d: "+25% de Eficiência produzida", c: 500, pm: { eff: .25 } },
  { id: "s8", k: "Software", n: "Planejador de rotas de combustível", d: "-30% no consumo de combustível", c: 400, cr: { fuel: .3 } },
  { id: "s9", k: "Software", n: "Tradutor universal", d: "+30% de Moral produzida e +10% de moedas", c: 650, pm: { morale: .3 }, rw: .1 },
  { id: "h9", k: "Hardware", n: "Cristais xeno", d: "+30% de Eficiência e -20% no consumo de O₂", c: 800, pm: { eff: .3 }, cr: { oxy: .2 } },
  { id: "h10", k: "Hardware", n: "Robôs de manutenção", d: "Edifícios perdem ordem 40% mais devagar", c: 600, tidy: .4 },
];
// Bônus passivos por espécie (grátis; a espécie pode ser trocada a qualquer momento no Guarda-roupa).
const SPB = { human: { disc: .1, rw: .1 }, alien: { pm: { eff: .15, morale: .1 }, cr: { oxy: .15 } } };
const SPB_TXT = { human: "−10% no custo das peças · +10% de moedas por fase", alien: "+15% Eficiência · +10% Moral · −15% consumo de O₂" };
const SPN = { human: "🧑‍🚀 Humano", alien: "👽 Alienígena" };
// Itens da loja exclusivos de cada espécie (só funcionam enquanto você estiver nela).
UP.push(
  { id: "hs1", sp: "human", k: "Hardware", n: "Cúpulas de engenheiros colonos", d: "+25% de Comida produzida", c: 450, pm: { food: .25 } },
  { id: "hs2", sp: "human", k: "Software", n: "Treinamento de astronautas", d: "+30 s em cada fase", c: 400, time: 30 },
  { id: "hs3", sp: "human", k: "Software", n: "Rede de comércio humana", d: "+20% de moedas por fase", c: 600, rw: .2 },
  { id: "hs4", sp: "human", k: "Hardware", n: "Cooperativas de colonos", d: "-20% no consumo de água e +10% de Moral", c: 500, cr: { water: .2 }, pm: { morale: .1 } },
  { id: "as1", sp: "alien", k: "Hardware", n: "Cristais de luz viva", d: "+30% de Moral produzida", c: 450, pm: { morale: .3 } },
  { id: "as2", sp: "alien", k: "Hardware", n: "Respiração xeno", d: "-25% no consumo de oxigênio", c: 500, cr: { oxy: .25 } },
  { id: "as3", sp: "alien", k: "Hardware", n: "Pulso gravitacional", d: "+30% de Eficiência produzida", c: 550, pm: { eff: .3 } },
  { id: "as4", sp: "alien", k: "Software", n: "Telepatia coletiva", d: "+20 s em cada fase e +10% de moedas", c: 600, time: 20, rw: .1 });
const allUP = () => UP.concat((CAT && CAT.up) || []);

// ---------- cosméticos ----------
// l: s traje · p calça · w relógio · h capacete · b mochila
const CX = [
  { id: "s0", l: "s", n: "Traje ARES branco", c: 0, col: "#e8e8ee" }, { id: "s1", l: "s", n: "Traje laranja de resgate", c: 150, col: "#ff8a1f" }, { id: "s2", l: "s", n: "Traje azul orbital", c: 200, col: "#3d7bff" },
  { id: "s3", l: "s", n: "Traje preto furtivo", c: 250, col: "#2b2b33" }, { id: "s4", l: "s", n: "Traje dourado de comandante", c: 500, col: "#e8b923", glow: "#ffcf3d" },
  { id: "s5", l: "s", n: "Traje verde-cultivo", c: 180, col: "#46b86a" }, { id: "s6", l: "s", n: "Traje magenta nebulosa", c: 320, col: "#c43fd0", glow: "#ff7aff" },
  { id: "p0", l: "p", n: "Calça cinza padrão", c: 0, col: "#808690" }, { id: "p1", l: "p", n: "Calça verde militar", c: 100, col: "#4f6b3a" }, { id: "p2", l: "p", n: "Calça vermelha marciana", c: 120, col: "#b8432b" }, { id: "p3", l: "p", n: "Calça preta tática", c: 150, col: "#1e1e22" },
  { id: "w0", l: "w", n: "Sem relógio", c: 0, col: "" }, { id: "w1", l: "w", n: "Relógio cronógrafo prata", c: 80, col: "#d0d4dc" }, { id: "w2", l: "w", n: "Relógio neon ciano", c: 180, col: "#22e6ff", glow: "#22e6ff" }, { id: "w3", l: "w", n: "Relógio de ouro", c: 400, col: "#ffcc33", glow: "#ffcc33" },
  { id: "h0", l: "h", n: "Capacete branco", c: 0, col: "#f0f0f0" }, { id: "h1", l: "h", n: "Capacete grafite", c: 120, col: "#555a66" }, { id: "h2", l: "h", n: "Capacete laranja", c: 160, col: "#ff9a3c" }, { id: "h3", l: "h", n: "Capacete cromado", c: 300, col: "#c8d6e8", glow: "#9ec9ff" },
  { id: "s7", l: "s", n: "Traje Pioneiro de Marte", c: 180, col: "#c9a66b", sp: "human" }, { id: "h5", l: "h", n: "Capacete Explorador", c: 150, col: "#d9c27a", sp: "human" },
  { id: "s8", l: "s", n: "Manto Estelar", c: 220, col: "#6a4cff", glow: "#a58bff", sp: "alien" }, { id: "h6", l: "h", n: "Bolha Cósmica", c: 200, col: "#7fe8ff", glow: "#7fe8ff", sp: "alien" },
  { id: "b0", l: "b", n: "Mochila padrão", c: 0, col: "#b9bcc4" }, { id: "b1", l: "b", n: "Mochila de oxigênio azul", c: 110, col: "#4a86e8" }, { id: "b2", l: "b", n: "Mochila reforçada", c: 170, col: "#6b5a44" }, { id: "b3", l: "b", n: "Mochila a jato", c: 350, col: "#ff6a2b", glow: "#ffa04a" },
];
const SL = { s: "Trajes", p: "Calças", w: "Relógios", h: "Capacetes", b: "Mochilas", e: "Eventos", a: "Admin" };
const LAYERS = ["s", "p", "w", "h", "b"];
const DEF_EQ = { s: "s0", p: "p0", w: "w0", h: "h0", b: "b0" };
const DEF_OWN = ["s0", "p0", "w0", "h0", "b0"];
const TMPCX = [];
const allCX = () => CX.concat(MarsRules.ADMIN_COSMETICS, (CAT && CAT.cos) || [], EV.suits(), TMPCX);
const cxById = (id) => allCX().find((x) => x.id == id) || {};
const cc = (id) => cxById(id).col || "";
