/* Ultra Learn Voyage — conteúdo: 10 capítulos de uma missão tripulada a Marte (arquitetura, Δv, suporte à vida, energia,
   comunicação, radiação, risco, entrada/descida/pouso, recursos locais, retorno). Cada capítulo tem: briefing técnico,
   quiz temático (4 perguntas), painel de gestão (simulação com números) e um evento de decisão.
   Base: conceitos publicados em materiais técnicos de agências espaciais; valores arredondados e simplificados para ensino. */
const ULV_FONTE = "Fonte: NASA (nasa.gov, science.nasa.gov, jpl.nasa.gov) e materiais técnicos de exploração espacial";
const rnd1 = (n) => Math.round(n * 10) / 10;
/** gerador pseudoaleatório determinístico (mesma tentativa = mesmo resultado) */
const ulvRng = (seed) => { let s = (seed >>> 0) || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };
const ULV_SUP = (V) => Math.min(V.sup.o2, V.sup.h2o, V.sup.food);

const ULV = [
  // ───────────────────────────── 1
  { id: "arq", dept: "science", icon: "🧭", title: "Arquitetura da missão e cadeia de comando",
    brief: [
      "Existem duas famílias de missão tripulada a Marte. **Classe conjunção**: estadia longa (~500 dias na superfície), viagem total ~900 dias, trajetórias de menor energia. **Classe oposição**: estadia curta (~30 dias), viagem total ~600 dias, mas exige muito mais Δv e passa perto do Sol.",
      "Na classe oposição quase não há folga: pouca margem para falhas, mais radiação e retorno forçado. Por isso a conjunção é a base da maioria dos estudos de referência.",
      "Tripulação mínima: 4 pessoas (comandante, engenheiro de voo, oficial médico e cientista). **Treinamento cruzado**: cada um sabe fazer o essencial da função do outro, para que a perda de um não derrube a missão.",
      "No controle de missão, o **Diretor de Voo** tem a decisão final de Go/No-Go. O **CAPCOM** (comunicador da cápsula) é a única voz que fala com a tripulação, evitando ordens conflitantes.",
    ],
    quiz: [
      ["Qual arquitetura prevê ~500 dias na superfície e trajetórias de menor energia?", ["Classe oposição", "Classe conjunção", "Sobrevoo sem pouso", "Missão apenas orbital"], 1, "A classe conjunção espera o alinhamento favorável para o retorno, com estadia longa e menor Δv."],
      ["Por que a classe oposição é considerada mais arriscada?", ["Dura mais tempo", "Exige muito mais Δv, passa perto do Sol e tem pouca margem", "Usa menos combustível", "Não precisa de tripulação treinada"], 1, "Estadia curta, Δv alto e maior exposição à radiação deixam pouca folga para qualquer falha."],
      ["No controle de missão, quem fala com a tripulação?", ["Qualquer controlador", "Somente o CAPCOM", "O diretor da agência", "A imprensa"], 1, "O CAPCOM é a voz única: concentra as ordens para evitar mensagens contraditórias."],
      ["Para que serve o treinamento cruzado?", ["Economizar comida", "Se um tripulante ficar incapacitado, outro pode assumir funções críticas", "Reduzir o peso da nave", "Eliminar o controle de missão"], 1, "É redundância humana: a missão continua mesmo com a perda temporária de um especialista."],
    ],
    controls: [
      { id: "arch", label: "Arquitetura", type: "select", opts: ["Classe conjunção (estadia longa)", "Classe oposição (estadia curta)"], val: 0 },
      { id: "crew", label: "Tripulação", type: "select", opts: ["4 pessoas", "6 pessoas"], val: 0 },
      { id: "margin", label: "Margem de consumíveis", type: "range", min: 0, max: 30, step: 1, val: 10, unit: "%", hint: "Reserva além do necessário. Pouca margem = risco; muita = massa extra." },
    ],
    run(c, V, q) {
      const opp = +c.arch === 1, crew = +c.crew === 1 ? 6 : 4, m = +c.margin, L = [], dv = opp ? 1.6 : 1;
      const base = Math.round(300 * (4 / crew) * (1 + m / 100) * (1 + q * .04));
      const days = opp ? { out: 200, surf: 30, back: 370 } : { out: 210, surf: 500, back: 210 };
      L.push([true, `${opp ? "Classe oposição" : "Classe conjunção"}: ida ${days.out} d · superfície ${days.surf} d · volta ${days.back} d (total ${days.out + days.surf + days.back} d).`]);
      L.push([!opp, `Exigência de Δv: ×${dv.toFixed(1)} em relação à conjunção${opp ? " (alta: risco e custo maiores)" : ""}.`]);
      L.push([m >= 8 && m <= 22, `Margem de consumíveis ${m}% → estoque inicial de ${base} dias de autonomia por tripulante-equivalente${m < 8 ? " (margem baixa!)" : m > 22 ? " (massa extra desnecessária)" : ""}.`]);
      L.push([true, `Tripulação de ${crew}: ${crew === 6 ? "mais ciência, porém consumo maior e menos autonomia" : "menor consumo e maior autonomia de suprimentos"}.`]);
      const score = (opp ? 18 : 30) + (m >= 8 && m <= 22 ? 15 : m >= 4 ? 8 : 0) + (crew === 4 ? 5 : 4);
      return { L, score, apply: (V) => { V.arch = opp ? "opp" : "conj"; V.crew = crew; V.dvF = dv; V.days = days; V.sup = { o2: base, h2o: base, food: base }; V.sci = (opp ? .4 : 1) * (crew === 6 ? 1.3 : 1); V.risk += opp ? 18 : 6; V.day = 0; } };
    },
    event: { t: "Três dias antes do lançamento, o oficial médico apresenta febre alta. A janela de lançamento fecha em duas semanas. Qual a decisão do Diretor de Voo?",
      opts: [["Lançar com 3 tripulantes e ninguém no papel médico", 0, "Sem o papel médico a missão perde uma função crítica: risco inaceitável."], ["Ativar o reserva treinado (treinamento cruzado) e manter a janela", 10, "Certo: a equipe de reserva existe para isso, e a janela é preservada."], ["Cancelar a missão e esperar 26 meses", 4, "Seguro, mas desnecessário: há reserva treinado e a janela ainda está aberta."]] } },
  // ───────────────────────────── 2
  { id: "dv", dept: "ship", icon: "🚀", title: "Janela de lançamento, Hohmann e orçamento de Δv",
    brief: [
      "A Terra e Marte se alinham de forma favorável a cada ~26 meses (**período sinódico**, ~780 dias). Fora da janela, o Δv necessário cresce muito.",
      "A **transferência de Hohmann** é a elipse tangente às duas órbitas: ~259 dias teóricos (≈ 8,5 meses). Missões reais levam de 6 a 9 meses.",
      "**Equação do foguete (Tsiolkovsky):** Δv = Isp · g₀ · ln(m₀/m_f). Isp típico: LOX/metano ≈ 360 s, LOX/hidrogênio ≈ 450 s, propulsão nuclear térmica ≈ 900 s.",
      "A injeção trans-Marte exige ~3,6 km/s a partir da órbita baixa da Terra. Engenheiros mantêm uma **margem de 5 a 10%** de Δv para correções e imprecisões.",
    ],
    quiz: [
      ["O que é o período sinódico Terra–Marte?", ["O dia marciano", "O tempo entre alinhamentos favoráveis (~26 meses)", "A duração do voo (~7 meses)", "O ano marciano"], 1, "É o intervalo entre janelas de lançamento: cerca de 780 dias."],
      ["A equação de Tsiolkovsky relaciona o Δv com...", ["A cor do foguete", "O Isp e a razão de massas (ln m₀/m_f)", "A distância à Lua", "O número de tripulantes"], 1, "Δv = Isp · g₀ · ln(m₀/m_f): mais propelente e motor mais eficiente aumentam o Δv."],
      ["Por que manter 5–10% de margem de Δv?", ["Para enfeitar o projeto", "Cobrir correções de trajetória e incertezas", "Porque a lei exige", "Para carregar mais passageiros"], 1, "A navegação real tem erros: a margem paga correções e contingências."],
      ["Qual propulsor tem maior Isp (eficiência)?", ["Química LOX/metano", "Química LOX/hidrogênio", "Nuclear térmica (~900 s)", "Todos iguais"], 2, "A propulsão nuclear térmica dobra o Isp dos motores químicos, mas traz custo e risco tecnológico."],
    ],
    controls: [
      { id: "eng", label: "Propulsão", type: "select", opts: ["LOX/metano · Isp 360 s", "LOX/hidrogênio · Isp 450 s", "Nuclear térmica · Isp 900 s (risco +)"], val: 1 },
      { id: "frac", label: "Fração de propelente (de 1.000 t)", type: "range", min: 50, max: 85, step: 1, val: 65, unit: "%", hint: "Mais propelente = mais Δv, mas menos carga útil (ciência e suprimentos)." },
    ],
    run(c, V, q) {
      const isp = [360, 450, 900][+c.eng], f = +c.frac / 100, m0 = 1000, L = [];
      const dvKm = isp * 9.81 * Math.log(1 / (1 - f)) / 1000, need = 3.6 * (V.dvF || 1) * 1.08, payload = Math.max(0, m0 * (1 - f - .08)), eff = dvKm * (1 + q * .02);
      L.push([eff >= need, `Δv disponível = ${isp}·9,81·ln(1/${(1 - f).toFixed(2)}) = ${eff.toFixed(2)} km/s · necessário (com 8% de margem) = ${need.toFixed(2)} km/s.`]);
      L.push([payload > 120, `Carga útil (estrutura 8%): ${Math.round(payload)} t.`]);
      L.push([+c.eng < 2, `Risco do propulsor: ${["baixo", "médio (hidrogênio líquido evapora)", "alto (tecnologia nuclear nova)"][+c.eng]}.`]);
      const ok = eff >= need;
      const score = ok ? Math.round(24 + Math.min(10, (eff - need) * 8) * 0 + Math.min(12, payload / 40) + (eff - need < 1.2 ? 8 : 3) + (+c.eng === 2 ? -3 : 0)) : 6;
      return { L, score: Math.max(0, Math.min(50, score)), fail: !ok && "Δv insuficiente: a nave não completa a injeção trans-Marte. Aumente a fração de propelente ou use um motor mais eficiente.", apply: (V) => { V.dv = Math.round((eff - need) * 1000); V.payload = Math.round(payload); V.sci *= Math.min(1.4, .6 + payload / 400); V.risk += [2, 5, 14][+c.eng]; V.day = 0; } };
    },
    event: { t: "Na contagem final, um sensor do motor principal acusa uma leitura fora do limite, mas a janela de lançamento tem tolerância de poucas semanas. O que fazer?",
      opts: [["Ignorar o sensor e lançar", 0, "Nunca ignore uma leitura crítica: o Go/No-Go existe para isso."], ["Adiar alguns dias dentro da tolerância, diagnosticar e só então lançar", 10, "Certo: a janela tolera atrasos curtos; diagnóstico antes do lançamento."], ["Cancelar tudo e esperar a próxima janela (26 meses)", 3, "Excessivo: dava para resolver dentro da janela."]] } },
  // ───────────────────────────── 3
  { id: "eclss", dept: "ship", icon: "🫁", title: "Suporte à vida: ar, água e comida",
    brief: [
      "Cada pessoa consome ≈ 0,84 kg de oxigênio por dia e produz ≈ 1 kg de CO₂. Também precisa de água potável, higiene e ~0,6 kg de alimento seco por dia (ordens de grandeza).",
      "Na Estação Espacial Internacional, mais de 90% da água (urina e umidade do ar) é reciclada, e o sistema chegou a 98%. Cada ponto percentual a mais reduz a massa lançada e o risco de falta.",
      "O CO₂ é removido por leitos de aminas ou zeólitas. O **reator Sabatier** combina CO₂ + H₂ → CH₄ + H₂O, recuperando água; a eletrólise da água devolve O₂.",
      "Reciclar mais custa energia: o projeto é um equilíbrio entre massa, energia e confiabilidade.",
    ],
    quiz: [
      ["Quanto oxigênio uma pessoa consome por dia (ordem de grandeza)?", ["≈ 0,08 kg", "≈ 0,84 kg", "≈ 8 kg", "≈ 80 kg"], 1, "Cerca de 0,84 kg de O₂ por pessoa por dia."],
      ["Qual sistema recupera água a partir do CO₂?", ["Painel solar", "Reator Sabatier", "Radiador", "Giroscópio"], 1, "O Sabatier converte CO₂ + H₂ em metano e água."],
      ["Por que reciclar mais água em viagens longas?", ["Para gastar mais energia", "Menos água para lançar da Terra e menos risco de falta", "Para ter mais lixo", "Não faz diferença"], 1, "Cada quilo lançado é caro; reciclar reduz massa e dependência de estoque."],
      ["O que acontece se o CO₂ se acumula na cabine?", ["Nada", "Dor de cabeça, tontura e perda de desempenho: risco crítico", "O ar fica mais fresco", "A nave acelera"], 1, "Por isso a remoção de CO₂ é tratada como função de prioridade máxima."],
    ],
    controls: [
      { id: "rec", label: "Reciclagem de água", type: "range", min: 70, max: 98, step: 1, val: 90, unit: "%", hint: "Mais reciclagem = menos estoque, mas mais energia." },
      { id: "scrub", label: "Remoção de CO₂ / O₂", type: "select", opts: ["Absorvedores descartáveis (simples, gasta estoque)", "Regenerável + Sabatier + eletrólise (recupera O₂ e água)"], val: 1 },
      { id: "ration", label: "Ração calórica", type: "select", opts: ["100% (saúde plena)", "90% (economia leve)", "80% (economia forte, desgasta moral)"], val: 0 },
    ],
    run(c, V, q) {
      const N = V.days ? V.days.out : 210, rec = +c.rec, fw = ((1 - rec / 100) / .1) * (1 - q * .03), fo = +c.scrub ? .6 : 1, ration = [1, .9, .8][+c.ration], L = [];
      const have = V.sup, needW = N * fw, needO = N * fo, needF = N * ration, kw = rnd1(2 + (rec - 70) * .15 + (+c.scrub ? 3 : 1.5));
      const okW = have.h2o >= needW, okO = have.o2 >= needO, okF = have.food >= needF;
      L.push([okW, `Água: estoque ${Math.round(have.h2o)} d · consumo efetivo na ida ${Math.round(needW)} d (reciclagem ${rec}%).`]);
      L.push([okO, `Oxigênio: estoque ${Math.round(have.o2)} d · consumo na ida ${Math.round(needO)} d (${+c.scrub ? "com Sabatier/eletrólise" : "sem recuperação"}).`]);
      L.push([okF, `Alimento: estoque ${Math.round(have.food)} d · consumo na ida ${Math.round(needF)} d (ração ${Math.round(ration * 100)}%).`]);
      L.push([kw <= 12, `Energia do suporte à vida: ${kw} kW (será cobrada no capítulo de energia).`]);
      const ok = okW && okO && okF;
      const score = ok ? 30 + Math.max(0, Math.round(10 - (kw - 4))) + [10, 6, 2][+c.ration] : 5;
      return { L, score: Math.max(0, Math.min(50, score)), fail: !ok && "Há falta de suprimento durante a viagem. Aumente a reciclagem, use a recuperação por Sabatier ou reduza a ração.", apply: (V) => { V.sup = { h2o: have.h2o - needW, o2: have.o2 - needO, food: have.food - needF }; V.loadLife = kw; V.health = Math.min(100, V.health - [0, 2, 7][+c.ration]); V.morale = Math.min(100, V.morale - [0, 2, 9][+c.ration]); V.day = 30; } };
    },
    event: { t: "Alarme: o CO₂ da cabine sobe e o purificador principal falha. A tripulação sente dor de cabeça. O que fazer primeiro?",
      opts: [["Ligar o purificador reserva, reduzir a atividade física e depois diagnosticar", 10, "Certo: restaure a função crítica, reduza a produção de CO₂ e só então investigue."], ["Esperar a próxima conversa com a Terra", 0, "Com a vida em risco, não se espera: use a redundância imediatamente."], ["Abrir uma escotilha para ventilar", 0, "Perigoso: despressuriza a nave. O ar é um recurso fechado."]] } },
  // ───────────────────────────── 4
  { id: "pow", dept: "ship", icon: "⚡", title: "Energia e controle térmico",
    brief: [
      "Em Marte a luz solar é ~43% da recebida na Terra (~590 W/m² contra 1.361 W/m²). Poeira e tempestades reduzem ainda mais a geração: foi uma tempestade global que encerrou a missão do rover Opportunity.",
      "Reatores de fissão de superfície (classe Kilopower, até ~10 kW elétricos) funcionam de noite, em tempestades e em qualquer latitude.",
      "Toda energia elétrica vira calor. No vácuo só se perde calor por radiação: **radiadores** e circuitos de fluido mantêm eletrônicos e tripulação em temperatura segura.",
      "**Priorização de cargas (load shedding)**: se faltar energia, corta-se primeiro a ciência, depois comunicações não essenciais; suporte à vida e controle térmico são os últimos a perder energia.",
    ],
    quiz: [
      ["Quanta luz solar de Terra chega a Marte (em média)?", ["≈ 4%", "≈ 43%", "≈ 100%", "≈ 200%"], 1, "Cerca de 43% (≈ 590 W/m²)."],
      ["Qual carga deve ser a última a ser cortada numa emergência de energia?", ["Experimentos científicos", "Suporte à vida e controle térmico", "Iluminação de lazer", "Transmissão de dados"], 1, "Vida e temperatura primeiro: tudo mais pode esperar."],
      ["Por que naves precisam de radiadores?", ["Para captar luz", "No vácuo o calor só se dissipa por radiação", "Para refletir sinais", "Para esfriar o espaço"], 1, "Sem ar não há convecção: o calor residual precisa ser irradiado."],
      ["Qual a vantagem de um reator de fissão de superfície?", ["Pesa nada", "Gera energia à noite e em tempestades de poeira", "Não precisa de segurança", "Substitui a tripulação"], 1, "Independe do Sol: energia estável em qualquer condição."],
    ],
    controls: [
      { id: "arr", label: "Área de painéis solares", type: "range", min: 80, max: 400, step: 10, val: 200, unit: " m²", hint: "Mais área = mais energia, mas mais massa." },
      { id: "bat", label: "Baterias", type: "range", min: 100, max: 800, step: 20, val: 400, unit: " kWh" },
      { id: "life", label: "Cota: suporte à vida", type: "range", min: 10, max: 60, step: 1, val: 32, unit: "%" },
      { id: "therm", label: "Cota: controle térmico", type: "range", min: 5, max: 40, step: 1, val: 22, unit: "%" },
      { id: "comms", label: "Cota: comunicações", type: "range", min: 2, max: 25, step: 1, val: 8, unit: "%", hint: "A cota de ciência é o que sobra (100% − as demais)." },
    ],
    run(c, V, q) {
      const P = +c.arr * .26 * (1 + q * .03), sci = 100 - (+c.life + +c.therm + +c.comms), L = [];
      const dem = { life: (V.loadLife || 6) + 8, therm: 10, comms: 4, sci: 12 }, al = { life: P * +c.life / 100, therm: P * +c.therm / 100, comms: P * +c.comms / 100, sci: P * Math.max(0, sci) / 100 };
      const ok = { life: al.life >= dem.life, therm: al.therm >= dem.therm, comms: al.comms >= dem.comms }, sSat = Math.min(1, al.sci / dem.sci), needBat = (dem.life + dem.therm + dem.comms) * 12;
      L.push([true, `Geração: ${Math.round(+c.arr)} m² × 0,26 kW/m² = ${P.toFixed(1)} kW (distância média de 1,25 UA do Sol).`]);
      L.push([ok.life, `Suporte à vida: recebe ${al.life.toFixed(1)} kW · precisa de ${dem.life.toFixed(1)} kW.`]);
      L.push([ok.therm, `Controle térmico: recebe ${al.therm.toFixed(1)} kW · precisa de ${dem.therm} kW.`]);
      L.push([ok.comms, `Comunicações: recebe ${al.comms.toFixed(1)} kW · precisa de ${dem.comms} kW.`]);
      L.push([sSat > .5, `Ciência (${Math.max(0, sci)}% da energia): ${Math.round(sSat * 100)}% do necessário.`]);
      L.push([+c.bat >= needBat, `Baterias: ${c.bat} kWh · recomendado ≥ ${Math.round(needBat)} kWh (12 h de cargas críticas).`]);
      const crit = ok.life && ok.therm && ok.comms;
      const score = crit ? Math.round(28 + sSat * 12 + Math.min(10, (+c.bat / needBat) * 10)) : 6;
      return { L, score: Math.max(0, Math.min(50, score)), fail: !crit && "Uma carga crítica (vida, térmico ou comunicações) ficou sem energia suficiente. Ajuste as cotas ou aumente os painéis.", apply: (V) => { V.pow = Math.round((P - dem.life - dem.therm - dem.comms) / P * 100); V.data += Math.round(sSat * 20 * V.sci); V.battery = +c.bat; V.day = 70; V.sciSat = sSat; } };
    },
    event: { t: "Uma tempestade global de poeira cobre Marte e a geração solar cai 60% por semanas. Qual a resposta correta?",
      opts: [["Manter tudo ligado e torcer", 0, "A energia acabaria e o suporte à vida cairia junto."], ["Aplicar load shedding: cortar ciência, manter vida e térmico, usar baterias e reduzir a comunicação", 10, "Certo: prioridade por criticidade, usando as reservas."], ["Desligar o suporte à vida para economizar", 0, "Jamais: é a última carga a ser cortada."]] } },
  // ───────────────────────────── 5
  { id: "com", dept: "science", icon: "📡", title: "Comunicação com atraso e autonomia",
    brief: [
      "O sinal de rádio leva de ~3 a ~22 minutos para ir de um planeta ao outro (em um sentido): não existe conversa em tempo real. Pergunta e resposta podem somar até 44 minutos.",
      "A **Rede de Espaço Profundo (DSN)** usa antenas de até 70 m em três sites (Goldstone, Madri e Canberra) para cobrir o céu o tempo todo.",
      "Na **conjunção solar**, o Sol fica entre os planetas e as comunicações ficam bloqueadas por cerca de duas semanas.",
      "Por isso a tripulação precisa de **autonomia**: procedimentos pré-aprovados (flight rules), automação a bordo e **reporte por exceção** (só se avisa o que foge do plano).",
    ],
    quiz: [
      ["Qual o atraso máximo, em um sentido, do sinal Terra–Marte?", ["≈ 22 segundos", "≈ 22 minutos", "≈ 22 horas", "Não há atraso"], 1, "De 3 a 22 minutos, conforme a distância."],
      ["O que é o blackout da conjunção solar?", ["Falta de luz na nave", "Duas semanas de comunicação bloqueada pelo Sol", "Uma tempestade", "Um defeito da antena"], 1, "Com o Sol entre os planetas, o sinal é degradado ou bloqueado por cerca de 2 semanas."],
      ["Por que a tripulação precisa de autonomia?", ["Para não falar com a Terra", "Decisões críticas não podem esperar dezenas de minutos de ida e volta", "Para economizar energia", "Por tradição"], 1, "Com 40+ minutos de ida e volta, falhas urgentes exigem decisão a bordo."],
      ["O que significa “reportar por exceção”?", ["Avisar tudo o tempo todo", "Só comunicar o que foge do plano", "Nunca comunicar", "Avisar só à noite"], 1, "Reduz o tráfego e o ruído: a Terra foca no que realmente importa."],
    ],
    controls: [
      { id: "aut", label: "Autoridade de decisão a bordo", type: "range", min: 0, max: 100, step: 5, val: 60, unit: "%", hint: "0% = tudo depende da Terra; 100% = a Terra não supervisiona." },
      { id: "rate", label: "Taxa de dados", type: "select", opts: ["Baixa (pouca energia)", "Média", "Alta (mais ciência, mais energia)"], val: 1 },
      { id: "hours", label: "Horas de contato por dia", type: "range", min: 1, max: 8, step: 1, val: 4, unit: " h", hint: "Contato demais cansa a tripulação; de menos reduz o apoio." },
    ],
    run(c, V, q) {
      const aut = +c.aut / 100, delay = 12, resp = (1 - aut) * 2 * delay + aut * 2, rate = +c.rate, hrs = +c.hours, L = [];
      L.push([resp <= 15, `Tempo de resposta a uma falha crítica: ${Math.round(resp)} min (atraso médio de ${delay} min em cada sentido).`]);
      L.push([aut >= .45 && aut <= .9, `Autonomia ${Math.round(aut * 100)}%: ${aut < .45 ? "baixa demais, a nave espera ordens da Terra" : aut > .9 ? "alta demais, sem supervisão independente" : "equilíbrio saudável entre bordo e Terra"}.`]);
      L.push([hrs >= 3 && hrs <= 5, `${hrs} h de contato por dia: ${hrs < 3 ? "pouco apoio de solo" : hrs > 5 ? "carga alta para a tripulação" : "bom compromisso"}.`]);
      L.push([true, `Taxa de dados ${["baixa", "média", "alta"][rate]}: retorno científico ×${[.6, 1, 1.5][rate]} · energia +${[0, 1, 3][rate]} kW.`]);
      const score = Math.round((aut >= .45 && aut <= .9 ? 24 : aut > .9 ? 14 : 8) + (hrs >= 3 && hrs <= 5 ? 12 : 6) + [4, 8, 10][rate] * (1 + q * .05) + 0);
      return { L, score: Math.max(0, Math.min(50, score)), apply: (V) => { V.data += Math.round([6, 12, 20][rate] * V.sci); V.morale = Math.max(0, V.morale - Math.max(0, hrs - 5) * 3); V.risk += aut < .45 ? 10 : aut > .9 ? 6 : 0; V.day = 110; } };
    },
    event: { t: "A 14 minutos da Terra, um vazamento lento de fluido refrigerante dispara um alarme. Existe um procedimento pré-aprovado para isolar a linha. O que fazer?",
      opts: [["Esperar a resposta da Terra (≈ 28 min) antes de agir", 2, "Perderia fluido e tempo; o procedimento já está aprovado."], ["Executar o procedimento de isolamento e informar a Terra em seguida", 10, "Certo: é para isso que servem as flight rules e a autonomia."], ["Improvisar uma solução sem procedimento", 0, "Improvisar sem necessidade aumenta o risco: use o procedimento aprovado."]] } },
  // ───────────────────────────── 6
  { id: "rad", dept: "science", icon: "☢", title: "Radiação e saúde da tripulação",
    brief: [
      "O instrumento RAD, no rover Curiosity, mediu ~1,8 mSv por dia de raios cósmicos galácticos durante o cruzeiro: ~0,3 Sv em uma viagem de ida de ~180 dias.",
      "**Tempestades solares** (eventos de partículas solares) podem entregar doses altas em horas. O remédio é um **abrigo blindado** com materiais ricos em hidrogênio (água, polietileno, suprimentos).",
      "Em microgravidade a perda óssea é de ~1% ao mês nos ossos que sustentam peso; por isso a tripulação faz ~2 h de exercício por dia.",
      "Saúde mental conta: rotina, privacidade, contato com a família e carga de trabalho equilibrada.",
    ],
    quiz: [
      ["Qual a dose diária de radiação medida pelo RAD no cruzeiro?", ["≈ 0,0018 mSv", "≈ 1,8 mSv", "≈ 180 mSv", "≈ 18 Sv"], 1, "Cerca de 1,8 mSv por dia."],
      ["Qual material protege melhor contra raios cósmicos?", ["Chumbo fino", "Materiais ricos em hidrogênio (água, polietileno)", "Alumínio fino", "Vidro comum"], 1, "O hidrogênio fragmenta as partículas sem criar tantos secundários."],
      ["Perda óssea em microgravidade sem contramedidas:", ["≈ 0,01% ao mês", "≈ 1% ao mês", "≈ 50% ao mês", "Não existe"], 1, "Cerca de 1% ao mês: exercício diário é indispensável."],
      ["Alerta de tempestade solar: o que a tripulação faz?", ["Continua o trabalho", "Vai ao abrigo blindado até passar", "Sai para ver", "Desliga a comunicação"], 1, "O abrigo reduz a dose enquanto o fluxo de partículas é alto."],
    ],
    controls: [
      { id: "shield", label: "Blindagem de água", type: "range", min: 0, max: 20, step: 1, val: 8, unit: " g/cm²", hint: "Mais blindagem = menos dose, mas menos Δv (massa)." },
      { id: "ex", label: "Exercício por tripulante", type: "range", min: 0, max: 3, step: .5, val: 2, unit: " h/dia" },
      { id: "drill", label: "Treinos de abrigo", type: "select", opts: ["Nenhum", "Mensais (tripulação ágil)"], val: 1 },
    ],
    run(c, V, q) {
      const N = V.days ? V.days.out : 210, sh = +c.shield, ex = +c.ex, L = [];
      const gcr = 1.84 * N * (1 - .006 * sh) * (1 - q * .02), spe = 40 * (1 - Math.min(.8, .04 * sh)) * (+c.drill ? .5 : 1), dose = gcr + spe, bone = 1 * (N / 30) * (1 - Math.min(.75, ex / 3 * .75));
      L.push([dose <= 420, `Dose total na ida ≈ ${Math.round(dose)} mSv (GCR ${Math.round(gcr)} + tempestade solar ${Math.round(spe)}). Limite didático: 420 mSv; crítico: 600 mSv.`]);
      L.push([bone <= 3, `Perda óssea estimada ≈ ${bone.toFixed(1)}% (${ex} h/dia de exercício).`]);
      L.push([+c.drill === 1, `${+c.drill ? "Treinos mensais: a equipe chega ao abrigo rápido (dose da tempestade reduzida)." : "Sem treino: a dose de uma tempestade solar seria maior."}`]);
      L.push([sh <= 14, `Blindagem de ${sh} g/cm²: custa ~${sh * 15} m/s de Δv em massa extra.`]);
      const fail = dose > 600;
      const score = fail ? 4 : Math.round((dose <= 420 ? 22 : 14) + (bone <= 3 ? 14 : 7) + (+c.drill ? 8 : 0) + (sh <= 14 ? 6 : 2));
      return { L, score: Math.max(0, Math.min(50, score)), fail: fail && "Dose acima do limite crítico. Aumente a blindagem ou o treino de abrigo.", apply: (V) => { V.rad += Math.round(dose); V.health = Math.max(0, V.health - Math.round(bone * 2.5)); V.dv -= sh * 15; V.morale = Math.max(0, V.morale - Math.max(0, ex - 2.5) * 6 - (ex < 1 ? 5 : 0)); V.day = 150; } };
    },
    event: { t: "O alerta de uma erupção solar chega: o fluxo de partículas começará a subir em cerca de 2 horas. O que a tripulação faz?",
      opts: [["Terminar o experimento e ir ao abrigo só quando sentir algo", 0, "Radiação não é sentida: a dose pode ser alta antes de qualquer sintoma."], ["Interromper tarefas, ir ao abrigo blindado com a equipe e esperar o fim do alerta", 10, "Certo: abrigo cedo, com a equipe toda, até o evento terminar."], ["Fugir para o módulo de carga", 2, "Pode ajudar um pouco, mas o abrigo projetado é a melhor proteção."]] } },
  // ───────────────────────────── 7
  { id: "risk", dept: "science", icon: "🛡", title: "Gestão de risco, redundância e Go/No-Go",
    brief: [
      "A **análise de modos de falha (FMEA)** lista o que pode falhar, a probabilidade e a gravidade; o esforço vai primeiro para o que é grave e provável.",
      "Sistemas críticos para a vida devem ser **tolerantes a duas falhas**: continuam seguros mesmo após duas falhas independentes.",
      "**Margens e contingência**: reservas de massa, energia, consumíveis e tempo (comumente 10–30%) cobrem as incertezas do projeto.",
      "No **Go/No-Go**, cada controlador responde “Go” ou “No-Go”; basta um “No-Go” justificado para parar. Lição da Apollo 13 (1970): checklists, trabalho em equipe e improviso disciplinado salvaram a tripulação.",
    ],
    quiz: [
      ["O que significa ser “tolerante a duas falhas”?", ["Nunca falha", "Continua seguro após duas falhas independentes", "Tem dois botões", "Só vale na Terra"], 1, "É um requisito clássico para funções que protegem a vida."],
      ["Quem tem a decisão final de Go/No-Go?", ["O mais velho", "O Diretor de Voo, após ouvir os controladores", "Uma votação do público", "Quem chegar primeiro"], 1, "Ele decide com base nas respostas de cada posição de controle."],
      ["Para que serve a margem de contingência?", ["Enfeite", "Absorver incertezas e falhas imprevistas", "Gastar o orçamento", "Reduzir a segurança"], 1, "É a reserva além do necessário para cobrir o que não se previu."],
      ["Qual lição principal da Apollo 13?", ["Nunca usar checklists", "Disciplina, checklists e trabalho em equipe resolvem emergências", "Voar sem controle de missão", "Ignorar alarmes"], 1, "A tripulação e o solo improvisaram com método e voltaram em segurança."],
    ],
    controls: [
      { id: "r1", label: "Redundância: suporte à vida", type: "range", min: 0, max: 5, step: 1, val: 3 },
      { id: "r2", label: "Redundância: energia", type: "range", min: 0, max: 5, step: 1, val: 2 },
      { id: "r3", label: "Redundância: propulsão", type: "range", min: 0, max: 5, step: 1, val: 2 },
      { id: "r4", label: "Redundância: comunicações", type: "range", min: 0, max: 5, step: 1, val: 1 },
      { id: "r5", label: "Redundância: navegação", type: "range", min: 0, max: 5, step: 1, val: 2, hint: "Você tem exatamente 10 pontos para distribuir." },
    ],
    run(c, V, q) {
      const r = [+c.r1, +c.r2, +c.r3, +c.r4, +c.r5], tot = r.reduce((a, b) => a + b, 0), names = ["suporte à vida", "energia", "propulsão", "comunicações", "navegação"], L = [];
      if (tot !== 10) return { L: [[false, `Você distribuiu ${tot} pontos; o orçamento é de exatamente 10.`]], score: 0, fail: "Distribua exatamente 10 pontos de redundância." };
      const rng = ulvRng((V.seed || 7) + 99), res = [], crit = [0, 1];
      let bad = 0, critBad = 0;
      for (let k = 0; k < 14; k++) { const s = Math.floor(rng() * 5), p = Math.max(.03, .42 - r[s] * .08 - q * .05), fail = rng() < p, saved = fail && r[s] >= (crit.includes(s) ? 2 : 1); if (fail) { if (saved) res.push(`falha em ${names[s]} → coberta pela redundância`); else { bad++; if (crit.includes(s)) critBad++; res.push(`falha em ${names[s]} → NÃO coberta`); } } }
      res.slice(0, 6).forEach((x) => L.push([x.includes("coberta pela"), x]));
      L.push([critBad === 0, `Resultado: ${bad} falha(s) sem cobertura, ${critBad} em sistema crítico (vida/energia).`]);
      L.push([r[0] >= 2 && r[1] >= 2, `Tolerância a duas falhas em vida e energia: ${r[0] >= 2 && r[1] >= 2 ? "atendida" : "NÃO atendida"}.`]);
      const fail = critBad > 0 && r[0] < 2;
      const score = Math.round(Math.max(0, 50 - bad * 7 - critBad * 10 + (r[0] >= 2 && r[1] >= 2 ? 6 : 0)));
      return { L, score: Math.max(0, Math.min(50, score)), fail: fail && "Uma falha em suporte à vida ficou sem cobertura. Reforce a redundância dos sistemas críticos.", apply: (V) => { V.risk = Math.max(0, V.risk - r[0] * 2 - r[1] * 2 + bad * 4); V.health = Math.max(0, V.health - critBad * 8); V.day = 190; } };
    },
    event: { t: "Duas anomalias ao mesmo tempo: temperatura alta em um tanque e ruído em um giroscópio. Qual a prioridade?",
      opts: [["Tratar primeiro a que ameaça a vida ou o veículo mais depressa (o tanque), com checklist, e colocar a outra em monitoramento", 10, "Certo: priorize pela gravidade e urgência, de forma metódica."], ["Resolver a mais fácil primeiro", 3, "Fácil não é sinônimo de importante."], ["Ignorar as duas até serem piores", 0, "Anomalias ignoradas crescem: monitore e aja."]] } },
  // ───────────────────────────── 8
  { id: "edl", dept: "ship", icon: "🪂", title: "Entrada, descida e pouso (EDL)",
    brief: [
      "A atmosfera de Marte tem menos de 1% da pressão da Terra: freia pouco, mas ainda aquece muito. A entrada ocorre a ~20.000 km/h.",
      "Sequência típica: **escudo térmico → paraquedas supersônico → retropropulsão**. Curiosity e Perseverance usaram o *sky crane*. Para pousos humanos (dezenas de toneladas), paraquedas não bastam: são necessários grandes escudos e retropropulsão supersônica.",
      "A **navegação relativa ao terreno (TRN)** compara imagens da câmera com um mapa para evitar crateras e rochas durante a descida.",
      "O pouso leva ~7 minutos; o atraso de comunicação é maior que isso. O sistema precisa ser **totalmente autônomo**.",
    ],
    quiz: [
      ["Por que pousar em Marte é difícil?", ["Marte não tem gravidade", "A atmosfera é fina: freia pouco, mas aquece; e a massa a pousar é grande", "Não há terreno", "A Lua atrapalha"], 1, "O ar fino não desacelera o suficiente por arrasto."],
      ["Ordem típica da descida:", ["Paraquedas → escudo → pouso", "Escudo térmico → paraquedas → retropropulsão", "Retropropulsão → escudo", "Só retropropulsão"], 1, "Primeiro o escudo, depois paraquedas e por fim os motores."],
      ["O que faz a navegação relativa ao terreno (TRN)?", ["Mede a temperatura", "Compara imagens com um mapa para evitar perigos", "Controla o ar", "Fala com a Terra"], 1, "Permite escolher um ponto seguro durante a descida."],
      ["Por que o pouso precisa ser autônomo?", ["Por economia", "O atraso de comunicação é maior que os ~7 minutos de descida", "Porque a Terra não quer ajudar", "Porque o rádio é ruim"], 1, "Quando a Terra recebe o sinal, o pouso já terminou."],
    ],
    controls: [
      { id: "res", label: "Reserva de propelente de pouso", type: "range", min: 500, max: 4000, step: 100, val: 2000, unit: " kg" },
      { id: "dia", label: "Diâmetro do escudo térmico", type: "range", min: 8, max: 18, step: 1, val: 12, unit: " m", hint: "Maior = menor carga aerodinâmica, mas mais massa." },
      { id: "ang", label: "Ângulo de entrada", type: "range", min: -20, max: -8, step: .5, val: -14.5, unit: "°" },
      { id: "trn", label: "Navegação relativa ao terreno", type: "select", opts: ["Desligada", "Ligada (evita perigos)"], val: 1 },
    ],
    run(c, V, q) {
      const res = +c.res, dia = +c.dia, ang = +c.ang, trn = +c.trn, L = [];
      let p = 52 + Math.min(18, (res - 1000) / 140) + (dia - 8) * 1.6 + (trn ? 12 : 0) + (ang >= -16 && ang <= -13 ? 10 : ang < -18 || ang > -10 ? -18 : -4) + q * 6;
      p = Math.max(5, Math.min(98, p));
      const rng = ulvRng((V.seed || 7) + 3), roll = rng() * 100, ok = roll <= p;
      L.push([res >= 1500, `Reserva de propelente: ${res} kg ${res < 1500 ? "(margem de combustível baixa)" : ""}.`]);
      L.push([dia >= 11, `Escudo de ${dia} m: ${dia >= 11 ? "boa desaceleração" : "pouca área para frear"}.`]);
      L.push([ang >= -16 && ang <= -13, `Ângulo ${ang}°: ${ang >= -16 && ang <= -13 ? "dentro do corredor de entrada" : ang < -16 ? "íngreme demais (aquecimento extremo)" : "raso demais (risco de ricochete)"}.`]);
      L.push([!!trn, `TRN ${trn ? "ligada: escolhe pouso seguro" : "desligada: o pouso depende da sorte no terreno"}.`]);
      L.push([ok, `Probabilidade de sucesso estimada: ${Math.round(p)}% — resultado da sequência: ${ok ? "POUSO BEM-SUCEDIDO" : "FALHA NO POUSO"}.`]);
      return { L, score: Math.max(0, Math.min(50, Math.round(p / 2))), fail: !ok && "O pouso falhou nesta simulação. Reforce a reserva, o escudo, o corredor de entrada e ative a TRN para elevar a probabilidade.", apply: (V) => { V.landed = true; V.fuelLeft = res; V.risk += Math.round((100 - p) / 6); V.day = 210; } };
    },
    event: { t: "A 500 m do solo, a câmera da TRN detecta rochas grandes sob o ponto de pouso. O que a nave faz (e o que você decide durante o projeto)?",
      opts: [["Pousar mesmo assim para economizar combustível", 0, "Pousar sobre rochas pode tombar o módulo."], ["Redirecionar para um ponto seguro usando a reserva de propelente", 10, "Certo: é exatamente para isso que existe a reserva e a TRN."], ["Esperar instruções da Terra", 0, "O atraso é maior que a descida: só a autonomia resolve."]] } },
  // ───────────────────────────── 9
  { id: "isru", dept: "science", icon: "⛏", title: "Recursos locais (ISRU) e operações de superfície",
    brief: [
      "**ISRU** é usar recursos de Marte: produzir oxigênio, água e propelente no local, reduzindo o que precisa ser lançado da Terra.",
      "O experimento MOXIE, no Perseverance, produziu oxigênio a partir do CO₂ marciano: 5,37 g no primeiro teste (~10 minutos de respiração de um astronauta).",
      "A água vem do gelo de médias latitudes e dos polos. A reação de Sabatier (CO₂ + 4 H₂ → CH₄ + 2 H₂O) gera metano para o veículo de subida e água.",
      "Na superfície, EVAs seguem o **sistema de dupla**: ninguém sai sozinho; há limite de tempo, planejamento de rota e comunicação constante.",
    ],
    quiz: [
      ["O que o MOXIE demonstrou?", ["Fabricar oxigênio a partir do CO₂ de Marte", "Perfurar gelo", "Cultivar batatas", "Gerar internet"], 0, "Converteu CO₂ marciano em oxigênio respirável (e propelente)."],
      ["Por que o ISRU reduz custos?", ["Porque é grátis", "Menos massa lançada da Terra, e cada quilo lançado é muito caro", "Porque substitui a nave", "Porque dispensa pesquisa"], 1, "Produzir no local evita transportar toneladas de propelente e consumíveis."],
      ["A reação de Sabatier produz...", ["Metano e água", "Só oxigênio", "Ouro", "Nitrogênio puro"], 0, "CO₂ + 4 H₂ → CH₄ + 2 H₂O."],
      ["Regra básica de segurança em EVA:", ["Sair sozinho é mais rápido", "Nunca sair sozinho (sistema de dupla)", "Sem comunicação, para ser rápido", "Sem limite de tempo"], 1, "Em caso de problema, a dupla se ajuda: é regra universal."],
    ],
    controls: [
      { id: "kw", label: "Potência dedicada ao ISRU", type: "range", min: 10, max: 40, step: 1, val: 30, unit: " kW" },
      { id: "hrs", label: "Horas de operação por dia", type: "range", min: 6, max: 24, step: 1, val: 20, unit: " h", hint: "Mais horas = mais produção, mas mais desgaste dos equipamentos." },
      { id: "prop", label: "Parte da produção para propelente", type: "range", min: 40, max: 90, step: 5, val: 75, unit: "%", hint: "O restante vai para oxigênio e água da tripulação." },
    ],
    run(c, V, q) {
      const kw = +c.kw, h = +c.hrs, prop = +c.prop / 100, rate = kw * h / 24 * 3 * (1 + q * .04), T = rate * 450, tP = T * prop, tL = T * (1 - prop), L = [];
      L.push([true, `Produção: ${kw} kW × ${h}/24 h × 3 kg/kW·dia = ${rate.toFixed(0)} kg/dia → ${Math.round(T)} kg em 450 dias.`]);
      L.push([tP >= 30000, `Propelente de subida: ${Math.round(tP)} kg · necessário 30.000 kg.`]);
      L.push([tL >= 10000, `Suporte à vida (O₂/H₂O): ${Math.round(tL)} kg · necessário 10.000 kg.`]);
      L.push([h <= 21, `Desgaste: ${h} h/dia ${h > 21 ? "aumenta muito o risco de falha da planta" : "é sustentável"}.`]);
      const ok = tP >= 30000 && tL >= 10000;
      const score = Math.round((tP >= 30000 ? 20 : Math.max(0, 20 * tP / 30000)) + (tL >= 10000 ? 18 : Math.max(0, 18 * tL / 10000)) + (h <= 21 ? 12 : 6));
      return { L, score: Math.max(0, Math.min(50, score)), fail: !ok && "A produção não cobre as necessidades. Aumente a potência, as horas de operação ou ajuste a divisão.", apply: (V) => { V.propReady = Math.min(100, Math.round(tP / 300)); V.sup = { o2: V.sup.o2 + 200, h2o: V.sup.h2o + 200, food: V.sup.food }; V.risk += h > 21 ? 8 : 2; V.data += Math.round(14 * V.sci); V.day = 460; } };
    },
    event: { t: "A planta de ISRU para de produzir em pleno dia marciano e a tripulação precisa sair para inspecioná-la. Como proceder?",
      opts: [["O engenheiro vai sozinho para ser rápido", 0, "Nunca em EVA sozinho: o sistema de dupla é regra de segurança."], ["Planejar a EVA em dupla, com rota, limite de tempo e comunicação, e só então inspecionar", 10, "Certo: planejamento, dupla e controle de tempo."], ["Ignorar e ficar sem propelente", 0, "Sem propelente de subida a tripulação não volta."]] } },
  // ───────────────────────────── 10
  { id: "ret", dept: "ship", icon: "🏁", title: "Retorno, decisão final e relatório da missão",
    brief: [
      "O retorno depende de nova janela entre os planetas. O **veículo de subida (MAV)** decola com propelente fabricado no local e se encontra com a nave em órbita.",
      "Antes do Go, o Diretor de Voo faz uma **enquete Go/No-Go** com cada posição: propulsão, suporte à vida, energia, saúde, comunicações e janela.",
      "Amostras e equipamentos obedecem a protocolos de **proteção planetária** e de contenção ao chegar à Terra.",
      "Ao final, o **relatório de missão e as lições aprendidas** alimentam a próxima missão: engenharia é um ciclo de aprendizado.",
    ],
    quiz: [
      ["Qual o papel do MAV?", ["Cultivar alimentos", "Levar a tripulação da superfície à órbita para voltar à Terra", "Comunicar com a Terra", "Gerar energia"], 1, "É o foguete de subida, abastecido com propelente produzido em Marte."],
      ["Como funciona a enquete Go/No-Go?", ["Só o comandante vota", "Cada posição de controle responde e o Diretor de Voo decide", "Sorteio", "Votação popular"], 1, "Qualquer No-Go justificado interrompe o processo até ser resolvido."],
      ["Para que servem as lições aprendidas?", ["Para arquivar", "Para melhorar as próximas missões", "Para esconder erros", "Para premiar"], 1, "Transformam erros e acertos em conhecimento para o futuro."],
      ["Por que o retorno precisa de uma nova janela?", ["Porque a Terra mudou de lugar", "Os planetas se movem e o Δv varia com o alinhamento", "Para esperar o fim do inverno", "Por tradição"], 1, "O mesmo princípio da ida: alinhamentos favoráveis economizam Δv."],
    ],
    controls: [
      { id: "dec", label: "Decisão do Diretor de Voo", type: "select", opts: ["GO: iniciar a subida agora", "HOLD: aguardar até 14 dias para completar o propelente e checagens", "ABORT: ficar na superfície"], val: 0 },
      { id: "samples", label: "Amostras científicas", type: "range", min: 0, max: 100, step: 5, val: 40, unit: " kg", hint: "Mais amostras = mais ciência, porém mais massa na subida." },
    ],
    run(c, V, q) {
      const dec = +c.dec, sup = ULV_SUP(V), prop = V.propReady || 0, hth = V.health, L = [];
      const polls = [["Propulsão", prop >= 100 && (V.dv || 0) >= 0], ["Suporte à vida", sup >= 120], ["Energia", (V.pow || 0) >= 0], ["Saúde da tripulação", hth >= 55], ["Comunicações", true], ["Janela de retorno", true]];
      polls.forEach(([n, g]) => L.push([g, `${n}: ${g ? "GO" : "NO-GO"}${n === "Propulsão" ? ` (propelente pronto ${prop}%)` : n === "Suporte à vida" ? ` (autonomia ${Math.round(sup)} d)` : n === "Saúde da tripulação" ? ` (${Math.round(hth)}%)` : ""}.`]));
      const allGo = polls.every((p) => p[1]), sm = +c.samples, massOK = sm <= 70 || prop >= 100;
      L.push([massOK, `Amostras: ${sm} kg ${sm > 70 ? "(massa alta na subida: exige propelente completo)" : ""}.`]);
      let score, fail = false;
      if (dec === 0) { if (allGo && massOK) score = 44 + Math.round(sm / 20); else { score = 6; fail = "GO com NO-GO ativo: a subida falharia. A enquete Go/No-Go existe para impedir isso."; } }
      else if (dec === 1) score = allGo ? 30 : 38;   // aguardar é prudente quando algo está NO-GO
      else score = 12;
      return { L, score: Math.max(0, Math.min(50, score)), fail, apply: (V) => { V.data += Math.round(sm / 5 * V.sci); V.day = 700; V.returned = dec === 0 && allGo; } };
    },
    event: { t: "No dia da subida, o último item da lista aponta um sensor reserva com leitura duvidosa, mas há uma segunda leitura redundante dentro do limite. Qual a decisão correta?",
      opts: [["Seguir com GO usando a leitura redundante e registrar o desvio", 10, "Certo: a redundância confirma o estado e o desvio fica registrado para o relatório."], ["Ignorar a lista e subir sem registrar", 0, "Sem registro se perde o aprendizado e se esconde risco."], ["Cancelar a missão inteira", 2, "Excessivo: há dado redundante dentro do limite."]] } },
];
