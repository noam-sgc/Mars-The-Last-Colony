/* Chat com colonos: você conversa e dá feedback; o colono responde, o humor muda e a colônia se beneficia. */
const CHAT_FB = [
  ["👍", "Elogiar o trabalho", { mood: 14, morale: 4, say: ["Obrigado! Ouvir isso me dá energia para o próximo turno.", "Fico feliz que tenha notado. Vou me esforçar ainda mais!"] }],
  ["🛠", "Pedir uma melhoria", { mood: 4, eff: 5, say: ["Boa ideia. Vou reorganizar o meu setor e ver se rende mais.", "Anotado! Já sei por onde começar."] }],
  ["❓", "Perguntar o que falta", { ask: 1 }],
  ["⚠", "Dar uma bronca leve", { mood: -10, eff: 3, say: ["Tudo bem… vou caprichar mais, prometo.", "Entendi. Talvez eu estivesse dispersando."] }],
  ["💡", "Pedir sugestão", { sug: 1 }],
];
const CHAT_BAD = ["Hmm, não sei se concordo, mas vou tentar.", "Isso doeu um pouco, mas tem razão.", "Vou pensar a respeito."];
function chatReply(c, fb) {
  const t = G.tk, low = K.slice().sort((a, b) => t[a] - t[b])[0];
  if (fb.ask) return c.alien ? "Falta harmonia entre nossas luzes e a sua rotina. Cuidem de " + KN[low].toLowerCase() + "." : `Hoje o que mais pesa é <b>${KN[low]}</b> (${Math.floor(t[low])}%). Se melhorarmos isso, todo mundo respira melhor.`;
  if (fb.sug) { const need = (CP[low] || []).map((x) => TY[x].n).slice(0, 2).join(" ou "); return `Eu construiria ${need || "mais habitats"}. ${c.info.job === "engenheiro" || /eng/i.test(c.info.job) ? "Como engenheiro, garanto que vale a pena." : "É o que eu pediria se fosse você."}`; }
  return (c.mood < 40 && fb.mood < 0 ? CHAT_BAD : fb.say)[Math.floor(Math.random() * 2)];
}
function openChat(c) {
  if (!G.run || DLG || G.mode == "nav") return; DLG = c; if (G.mode != "mp") G.paused = true; c.chat = c.chat || { n: 0, log: [] };
  const render = () => {
    const key = c.info.name, lim = c.chat.n >= 3 && performance.now() - (G.lastTalk[key] || 0) < 20000;
    const log = c.chat.log.slice(-4).map((l) => `<div class="cl ${l.me ? "me" : ""}"><b>${l.me ? "Você" : esc(c.info.name)}:</b> ${l.t}</div>`).join("") || `<div class="cl"><b>${esc(c.info.name)}:</b> ${esc(talkLines(c))}</div>`;
    $("#dlgb").innerHTML = `<div class="dlgh"><div class="av">${c.alien ? "👽" : "🧑‍🚀"}</div><div><b>${esc(c.info.name)}</b><div class="mu">${esc(c.info.job)} · humor ${Math.round(c.mood)}%</div></div></div><div class="chatlog" style="max-height:170px;overflow:auto;font-size:13px;line-height:1.45;margin:6px 0">${log}</div>
    <div class="opts">${CHAT_FB.map((f, i) => `<button data-f="${i}" ${lim ? "disabled" : ""}>${f[0]} ${f[1]}</button>`).join("")}<button data-f="p" ${S.coins < 10 || lim ? "disabled" : ""}>🎁 Presentear (10 🪙)</button><button id="d4" class="gh">Fechar</button></div>${lim ? '<div class="mu" style="font-size:11px">Deixe o colono respirar um momento…</div>' : ""}`;
    $("#dlgb").querySelectorAll("[data-f]").forEach((b) => (b.onclick = () => {
      let fb, label;
      if (b.dataset.f === "p") { S.coins -= 10; save(); fb = { mood: 25, morale: 9, say: ["Que gentileza! Vou lembrar disso.", "Nossa, obrigado!"] }; label = "🎁 Presenteou o colono"; toast("🎁 Presente entregue! +9 moral"); }
      else { const f = CHAT_FB[+b.dataset.f]; fb = f[2]; label = f[0] + " " + f[1]; }
      c.chat.log.push({ me: 1, t: label }); const r = chatReply(c, fb); c.chat.log.push({ t: r });
      c.mood = clamp(c.mood + (fb.mood || 0), 0, 100); if (fb.morale) G.tk.morale = clamp(G.tk.morale + fb.morale, 0, 100); if (fb.eff) G.tk.eff = clamp(G.tk.eff + fb.eff, 0, 100);
      G.st.talk++; if (c.alien) G.st.contact++; c.chat.n++; if (c.chat.n % 3 === 0) G.lastTalk[key] = performance.now(); render();
    }));
    $("#d4").onclick = closeDlg;
  };
  render(); $("#dlg").classList.add("on");
}
// substitui a conversa simples pelo chat
const _talkChat = talk; talk = function (c) { if (typeof c === "object" && c && c.info) return openChat(c); return _talkChat(c); };
