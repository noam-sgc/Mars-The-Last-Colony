/* Computador de bordo: diz o próximo passo do jogo conforme o momento (menu, campanha, sandbox, multiplayer,
   dentro de edifícios, rover e naves). Abre/fecha com H; também no botão 🖥. Pode ler em voz alta. */
const CPU = (() => {
  const st = { open: false, timer: 0, target: null, last: "" };
  const wpG = new THREE.Group(); sc.add(wpG); wpG.visible = false;
  { const m = new THREE.Mesh(new THREE.CylinderGeometry(.5, 1.1, 46, 14, 1, true), new THREE.MeshBasicMaterial({ color: 0x4fe3ff, transparent: true, opacity: .25, side: THREE.DoubleSide, depthWrite: false })); m.position.y = 23; wpG.add(m); const r = new THREE.Mesh(new THREE.TorusGeometry(2.2, .12, 6, 28), new THREE.MeshBasicMaterial({ color: 0x4fe3ff })); r.rotation.x = Math.PI / 2; r.position.y = .4; wpG.add(r); }
  const dist2 = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
  const nameOf = (t) => (TY[t] ? TY[t].n : t);
  const cheapest = (k) => (CP[k] || []).slice().sort((a, b) => TY[a].c - TY[b].c)[0];
  const nearest = (list, from) => list.reduce((a, o) => (!a || dist2(o, from) < dist2(a, from) ? o : a), null);
  const pos = (o) => ({ x: o.x, z: o.z });
  const goalsOk = () => { const ph = PH[G.ph]; if (cnt("hab") < ph.hab) return false; for (const k of Object.keys(ph.need)) { const n = G.placed.filter((p) => TY[p.t].k == k && !TY[p.t].alien).length; if (n < ph.need[k] || G.tk[k] < ph.tg) return false; } for (const k of Object.keys(ph.parts)) if (cnt(k) < ph.parts[k]) return false; return true; };

  function stepsMenu() {
    const o = [], push = (pri, icon, text, why) => o.push({ pri, icon, text, why });
    if (!P.spChosen) push(1, "🪐", "Escolha sua espécie (humano ou alienígena) no Guarda-roupa.", "Cada uma tem bônus e itens próprios; é grátis e dá para trocar depois.");
    const first = PH.findIndex((p, i) => !S.done[i] && (i === ALIEN_START || i === 0 || S.done[i - 1]) && i < ALIEN_START);
    if (first >= 0) push(2, "🚀", `Jogue a Fase ${first + 1}: ${PH[first].n} (Modo Solo → Catálogo).`, PH[first].d);
    else if (!S.done[ALIEN_START]) push(2, "👽", "Comece a campanha alienígena: Fase 31 já está liberada.", "É uma campanha à parte, com visitantes pacíficos.");
    if (S.coins >= 300 && S.own.length === 0) push(3, "🛒", "Visite a Loja e compre seu primeiro upgrade.", "Cada upgrade tem manutenção baixa, mas melhora a colônia.");
    if (nextUnread() >= 0) push(4, "📡", "Leia um Fato Espacial: ganha PP e moedas se ler até o fim.");
    if (P.quiz.ok.length < QUIZ.length) push(5, "🛰", `Faça o Quiz Espacial: ${QUIZ.length - P.quiz.ok.length} perguntas inéditas, ${QZ.PER_Q} 🪙 por acerto.`);
    if (!ACC.user) push(6, "👤", "Crie uma conta para jogar com amigos, chat e salas online.");
    else push(6, "👥", "Chame amigos: abra Amigos & grupo ou compartilhe o código do seu mundo (Multiplayer).");
    push(7, "🎮", "Quer construir sem pressão? Abra o Sandbox. Para jogar contra bots, vá em Multiplayer → Jogar com bots.");
    return o;
  }
  function stepsInterior() {
    const I = IN, o = [], push = (pri, icon, text, target, why) => o.push({ pri, icon, text, target, why, inside: true });
    if (I.act) { push(0, "⏳", I.act.kind == "eat" ? "Aguarde: você está comendo." : "Aguarde: você está dormindo."); return o; }
    if (G.mode == "solo") {
      if (G.hunger < 40) { const s = I.stations.find((x) => x.kind == "eat"); push(G.hunger < 20 ? 0 : 1, "🍽", s ? "Vá até a mesa (anel verde) e aperte E para comer." : "Você está com fome: saia e entre numa Hidroponia (construa uma se não tiver).", s ? pos(s) : null); }
      if (G.rest < 40) { const s = I.stations.filter((x) => x.kind == "sleep"); push(G.rest < 20 ? 0 : 1, "😴", s.length ? "Vá até uma cama (anel azul) e aperte E para dormir." : "Você está cansado: saia e entre num Habitat (construa um se não tiver).", s.length ? pos(nearest(s, { x: I.x, z: I.z })) : null); }
    }
    const items = I.items.filter((i) => !i.tidy);
    if (items.length) push(2, "🧹", `Arrume os ${items.length} itens com anel vermelho (chegue perto e aperte E): a produção deste edifício sobe até +25%.`, pos(nearest(items.map((i) => ({ x: i.o.position.x, z: i.o.position.z })), { x: I.x, z: I.z })));
    const fl = I.finds.filter((f) => !f.got); if (fl.length) push(3, "🎁", `Colete os ${fl.length} achados brilhantes: moedas, reserva de tanque e bônus da fase.`, pos(nearest(fl.map((f) => ({ x: f.q.x, z: f.q.z })), { x: I.x, z: I.z })));
    const c = I.cols[0]; if (c) push(4, "💬", `Converse com ${c.info.name} (E perto): melhora o moral e conta nas missões.`, { x: c.g.position.x, z: c.g.position.z });
    push(9, "🚪", "Quando terminar, saia pela porta verde (E) ou pelo botão Sair do edifício.", { x: 0, z: RD + 3 });
    return o;
  }
  function stepsRover() {
    const o = [], push = (pri, icon, text, target) => o.push({ pri, icon, text, target }), rem = RL ? RL.list.filter((q) => !q.got) : [];
    if (rem.length) { const q = nearest(rem, PL); push(1, "🧭", `Colete os achados com colunas de luz (${RL.list.length - rem.length}/${RL.list.length}); mais próximo: ${Math.round(dist2(q, PL))} m.`, pos(q)); }
    push(5, "🚙", "W/S acelera e dá ré, A/D vira. Bater em edifícios e rochas faz você perder velocidade.");
    push(9, "🚪", "Aperte E (ou Esc) para sair do rover e voltar ao jogo a pé.");
    return o;
  }
  function stepsNav() {
    const n = N, o = [], push = (pri, icon, text, target) => o.push({ pri, icon, text, target });
    if (n.fuel < 25) push(0, "⛽", "Combustível baixo! Colete as esferas verdes para recarregar.");
    if (n.L == "fly") { push(1, "☄", "Desvie dos asteroides (setas/WASD, arraste ou incline o celular).");
      if (n.hull < 40) push(0, "🛠", "Casco fraco! Evite os asteroides: mais um impacto pode destruir a nave.");
      push(3, "🟢", "Colete as esferas verdes: recarregam o combustível."); push(4, "🚀", `Segure Espaço/Impulso para acelerar (gasta combustível). Trajeto: ${Math.floor(n.prog * 100)}%.`); }
    else { const d = Math.hypot(n.x, n.z); push(Math.abs(n.vy) > 5 && n.y < 200 ? 0 : 2, "🛬", `Reduza a velocidade vertical para menos de 5 m/s (segure Espaço). Agora: ${Math.abs(n.vy).toFixed(1)} m/s.`);
      push(2, "🎯", d > 9 ? `Alinhe com a plataforma verde: ${Math.round(d)} m de distância (WASD/arraste).` : "Você está sobre a plataforma: mantenha e pouse devagar.", { x: 0, z: 0 }); push(5, "⛽", `Combustível: ${Math.floor(n.fuel)}%. Use o impulso só quando precisar.`); }
    return o;
  }
  function stepsSand() {
    const o = [], push = (pri, icon, text, target) => o.push({ pri, icon, text, target });
    if (!cnt("hab")) push(1, "🏠", "Construa um Habitat: escolha “Habitat” na barra de baixo e toque no terreno.");
    const low = K.slice().sort((a, b) => G.tk[a] - G.tk[b])[0];
    if (G.tk[low] < 60) { const t = cheapest(low); push(2, "📊", `${KN[low]} está em ${Math.floor(G.tk[low])}%: construa ${nameOf(t)} (${CP[low].length > 1 ? "ou outra peça da classe" : "peça da classe"}).`); }
    K.forEach((k) => { if (!G.placed.some((p) => TY[p.t].k == k)) push(3, "🔧", `Ainda não há peças de ${KN[k]}: construa ${nameOf(cheapest(k))}.`); });
    push(6, "🖐", "Use 🖐 Interagir (ou E) para entrar em edifícios, conversar com colonos e dirigir rovers.");
    push(7, "🚙", "Construa um Rover e dirija por Marte (E perto dele) para achar tesouros.");
    return o;
  }
  function stepsMP() {
    const o = [], push = (pri, icon, text, target) => o.push({ pri, icon, text, target }), md = mpMode(), low = K.slice().sort((a, b) => G.tk[a] - G.tk[b])[0];
    if (!cnt("hab")) push(1, "🏠", "Construa um Habitat primeiro: ele é a base da sua colônia.");
    push(2, "📊", `${KN[low]} é seu tanque mais baixo (${Math.floor(G.tk[low])}%): construa ${nameOf(cheapest(low))}.`);
    push(3, "🎯", md == "coop" ? "Meta cooperativa: todos os tanques em 50% ou mais por 30 s, juntos." : md == "team" ? "Estabilize a sua equipe primeiro (todos os tanques ≥ 50% por 30 s) ou lidere em pontos." : "Todos contra todos: maior pontuação (tanques + peças) ao fim do tempo vence.");
    push(5, "💬", "Converse com os outros jogadores pelo chat (botão 💬) e combine as peças.");
    return o;
  }
  function stepsSolo() {
    const ph = PH[G.ph], o = [], push = (pri, icon, text, target, why) => o.push({ pri, icon, text, target, why });
    const own = (t) => G.placed.filter((p) => p.t == t);
    // urgências
    ["oxy", "water"].forEach((k) => { if (G.tk[k] < 18) push(0, "🚨", `Perigo: ${KN[k]} em ${Math.floor(G.tk[k])}%! Construa ${nameOf(cheapest(k))} agora (zero = derrota).`); });
    if (G.hunger < 40) { const hs = own("hydro"); push(G.hunger < 20 ? 0 : 2, "🍽", hs.length ? `Fome (${Math.floor(G.hunger)}%): entre na Hidroponia e coma.` : `Fome (${Math.floor(G.hunger)}%): construa uma Hidroponia (${cost("hydro")} 🪙) e coma nela.`, hs.length ? pos(nearest(hs, PL)) : null, "Abaixo de 20% você perde moedas e, em 0%, é derrotado."); }
    if (G.rest < 40) { const hb = own("hab"); push(G.rest < 20 ? 0 : 2, "😴", hb.length ? `Cansaço (${Math.floor(G.rest)}%): entre num Habitat e durma.` : `Cansaço (${Math.floor(G.rest)}%): construa um Habitat (${cost("hab")} 🪙) e durma nele.`, hb.length ? pos(nearest(hb, PL)) : null, "Abaixo de 20% você perde moedas e, em 0%, é derrotado."); }
    if (G.time < 60 && !goalsOk()) push(1, "⏱", `Pouco tempo: ${Math.ceil(G.time)} s. Foque nos objetivos que faltam.`);
    // objetivos da fase
    if (goalsOk()) push(1, "✅", `Tudo certo! Mantenha os tanques estáveis por 5 s para vencer a fase${G.hold > 0 ? " (" + G.hold.toFixed(1) + " s)" : ""}.`);
    const afford = (t) => (S.coins >= cost(t) ? "" : ` Faltam ${Math.ceil(cost(t) - S.coins)} 🪙: junte moedas (renda passiva, achados e missões bônus).`);
    if (cnt("hab") < ph.hab) push(3, "🏠", `Construa ${ph.hab - cnt("hab")} Habitat(s) (${cnt("hab")}/${ph.hab}) por ${cost("hab")} 🪙 cada.${afford("hab")}`);
    Object.keys(ph.parts).forEach((k) => { if (cnt(k) < ph.parts[k]) push(3, "🛰", `Construa ${nameOf(k)}: ${cnt(k)}/${ph.parts[k]}.${afford(k)}`); });
    Object.keys(ph.need).forEach((k) => {
      const n = G.placed.filter((p) => TY[p.t].k == k && !TY[p.t].alien).length;
      if (n < ph.need[k]) { const t = cheapest(k); push(4, "🔧", `Construa ${nameOf(t)} para ${KN[k]}: ${n}/${ph.need[k]} peças.${afford(t)}`); }
      else if (G.tk[k] < ph.tg) push(5, "📈", `${KN[k]} em ${Math.floor(G.tk[k])}% (meta ${ph.tg}%): entre nos edifícios e arrume os itens (+produção) ou construa mais peças.`);
    });
    // missões bônus
    const msg = { talk: "Converse com colonos (E perto deles)", tidy: "Entre em edifícios e arrume itens vermelhos", enter: "Entre em edifícios diferentes (E perto)", rec: "Construa uma Cúpula de lazer", rover: "Construa um Rover", morale: "Mantenha a Moral acima de 60%", loot: "Colete achados dentro de edifícios e dirigindo um rover", contact: "Converse com os emissários alienígenas (verdes)" };
    ph.ms.forEach((m) => { if (G.msd[m.id]) return; let tg = null; if (m.id == "talk" || m.id == "contact") { const c = nearest(COL.filter((c) => (m.id == "contact") == !!c.alien).map((c) => ({ x: c.g.position.x, z: c.g.position.z })), PL); if (c) tg = c; } push(6, "🎯", `Missão bônus: ${msg[m.id]} (${Math.min(m.n, msProg(m))}/${m.n}) · +${m.rw} 🪙.`, tg); });
    if (S.coins >= 300 && S.own.length === 0) push(8, "🛒", "Você tem moedas: abra a Loja (botão Loja) e compre um upgrade.");
    if (nextUnread() >= 0 && o.length < 3) push(9, "📡", "Enquanto espera, leia um Fato Espacial no menu para ganhar PP e moedas.");
    return o;
  }
  /** Lista de passos em ordem de prioridade (o primeiro é o próximo passo). */
  function steps() {
    let l;
    if (!G.run && !IN) l = stepsMenu();
    else if (IN) l = stepsInterior();
    else if (G.mode == "nav") l = stepsNav();
    else if (DR) l = stepsRover();
    else if (G.mode == "solo") l = stepsSolo();
    else if (G.mode == "mp") l = stepsMP();
    else l = stepsSand();
    if (!l.length) l = [{ pri: 9, icon: "👍", text: "Nada urgente agora. Explore: converse com colonos, entre em edifícios e dirija um rover." }];
    return l.sort((a, b) => a.pri - b.pri);
  }
  // direção relativa à câmera
  function bearing(t) {
    const px = IN ? IN.x : PL.x, pz = IN ? IN.z : PL.z, yw = IN ? IN.yaw : yaw, dx = t.x - px, dz = t.z - pz, d = Math.hypot(dx, dz);
    const fx = -Math.sin(yw), fz = -Math.cos(yw), rx = Math.cos(yw), rz = -Math.sin(yw), a = Math.atan2(dx * rx + dz * rz, dx * fx + dz * fz);   // 0 = em frente, + = direita
    const arrows = ["⬆", "↗", "➡", "↘", "⬇", "↙", "⬅", "↖"], i = ((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8; return { d, arrow: arrows[i] };
  }
  function render() {
    const el = $("#cpu"); if (!el.classList.contains("on")) return; const l = steps(), top = l[0], rest = l.slice(1, 4);
    let tgt = ""; if (top.target) { const b = bearing(top.target); tgt = `<div class="cpu-t">${b.arrow} <b>${Math.round(b.d)} m</b> ${top.inside ? "dentro do edifício" : "· siga o feixe de luz azul no mapa"}</div>`; }
    st.target = !IN && top.target ? top.target : null; st.last = top.text;
    el.innerHTML = `<div class="cpu-h"><b>🖥 Computador de bordo</b><span class="mu">H</span></div><div class="cpu-lab">PRÓXIMO PASSO</div><div class="cpu-main"><span class="cpu-ic">${top.icon}</span><div>${esc(top.text)}${top.why ? `<div class="mu" style="font-size:12px;margin-top:3px">${esc(top.why)}</div>` : ""}</div></div>${tgt}
    ${rest.length ? `<div class="cpu-lab" style="margin-top:8px">DEPOIS</div>${rest.map((s) => `<div class="cpu-s">${s.icon} ${esc(s.text)}</div>`).join("")}` : ""}
    <div class="row" style="margin-top:8px"><button id="cpuv" title="Ler em voz alta">🔈 Ler</button><button id="cpux" class="gh">Fechar (H)</button></div>`;
    $("#cpux").onclick = close; $("#cpuv").onclick = speak;
    wpG.visible = !!st.target; if (st.target) wpG.position.set(st.target.x, H(st.target.x, st.target.z), st.target.z);
  }
  function speak() { try { const u = new SpeechSynthesisUtterance(st.last.replace(/[^\p{L}\p{N}\s.,:;!?()%/+\-–—]/gu, " ")); u.lang = "pt-BR"; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) { toast("Leitura em voz alta indisponível neste navegador."); } }
  function open() { st.open = true; $("#cpu").classList.add("on"); render(); clearInterval(st.timer); st.timer = setInterval(render, 500); }
  function close() { st.open = false; $("#cpu").classList.remove("on"); clearInterval(st.timer); wpG.visible = false; }
  const toggle = () => (st.open ? close() : open());
  addEventListener("keydown", (e) => { if (typing() || e.ctrlKey || e.metaKey || e.altKey) return; if (e.key === "h" || e.key === "H") toggle(); });
  return { open, close, toggle, steps, render, st };
})();
