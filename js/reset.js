/* Redefinir senha por e-mail (api/reset.js). O e-mail da conta fica guardado só no servidor (criptografado).
   Fluxo: pedir → e-mail com link → a MESMA aba que pediu muda sozinha para "Redefinir senha" → nova senha (enviada só como hash). */
const RESET = (() => {
  const post = async (body) => { try { const r = await fetch("/api/reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); return await r.json(); } catch (e) { return { ok: false, err: "Sem conexão com o servidor." }; } };
  let pollT = 0; const stop = () => { clearInterval(pollT); pollT = 0; };
  const close = () => { stop(); $("#dlg").classList.remove("on"); };
  const box = (title, inner) => openDlgHTML(`<div class="dlgh"><div class="av">🔑</div><div><b style="font-size:19px">${title}</b></div></div>${inner}`);
  /** Guarda o e-mail da conta (confere a senha atual). */
  async function setEmail(u, p, email, retry) {   // logo após criar a conta, ela ainda está subindo para a nuvem: tenta de novo
    let r = await post({ op: "setemail", u, p, email });
    for (let i = 0; retry && !r.ok && /incorretos/.test(r.err || "") && i < 8; i++) { await new Promise((q) => setTimeout(q, 1500)); r = await post({ op: "setemail", u, p, email }); }
    return r;
  }

  function ask(prefill) {
    box("Redefinir senha", `<p class="mu">Enviaremos um e-mail com um link para a conta abaixo. Quando você abrir o link, <b>esta tela</b> muda sozinha para a redefinição.</p>
      <label class="f">Usuário<input id="rsu" maxlength="16" value="${esc(prefill || "")}" placeholder="seu usuário"></label><div class="err" id="rse"></div>
      <div class="opts"><button class="pri" id="rsg">📧 Enviar e-mail de redefinição</button><button class="gh" id="rsc">Cancelar</button></div>`);
    $("#rsc").onclick = close; const go = () => start($("#rsu").value.trim()); $("#rsg").onclick = go; $("#rsu").onkeydown = (e) => { if (e.key == "Enter") go(); };
  }
  async function start(u) {
    if (!u) return ($("#rse").textContent = "Digite o usuário.");
    if (!CLOUD.on) return ($("#rse").textContent = "Redefinição só funciona com a nuvem ligada. " + CLOUD.explain());
    $("#rsg").disabled = true; $("#rse").textContent = "Enviando…"; const r = await post({ op: "request", u });
    if (!r.ok) { $("#rsg").disabled = false;
      if (r.err === "noemail") return noEmail(u);
      return ($("#rse").textContent = r.err === "nomail" ? "O envio de e-mails ainda não foi configurado neste site (o administrador precisa ligar o serviço de e-mail)." : r.err || "Falha ao enviar."); }
    waiting(u, r);
  }
  function noEmail(u) {
    const mine = ACC.user && ACC.user.toLowerCase() == u.toLowerCase();
    box("Conta sem e-mail", `<p class="mu">A conta <b>${esc(u)}</b> ainda não tem um e-mail cadastrado, então não dá para enviar o link. ${mine ? "Cadastre agora (confirmando sua senha atual):" : "Entre na conta, abra <b>Configurações → Conta</b> e cadastre um e-mail."}</p>
      ${mine ? `<label class="f">E-mail<input id="rem" type="email" placeholder="voce@exemplo.com"></label><label class="f">Senha atual<input id="rep" type="password"></label><div class="err" id="rse"></div>` : ""}
      <div class="opts">${mine ? `<button class="pri" id="res">Salvar e enviar o link</button>` : ""}<button class="gh" id="rsc">Fechar</button></div>`);
    $("#rsc").onclick = close;
    if (mine) $("#res").onclick = async () => { $("#rse").textContent = "Salvando…"; const s = await setEmail(u, $("#rep").value, $("#rem").value); if (!s.ok) return ($("#rse").textContent = s.err || "Falha"); toast("📧 E-mail salvo: " + esc(s.hint)); ask(u); $("#rsg").click(); };
  }
  function waiting(u, r) {
    box("Verifique seu e-mail", `<p>Enviamos o link para <b>${esc(r.hint)}</b>. Abra o e-mail e clique em <b>Redefinir minha senha</b>.</p>
      <p class="mu">Deixe <b>esta aba aberta</b>: assim que o link for aberto, aparece aqui a tela <b>Redefinir senha</b>. O link vale por 30 minutos.</p>
      ${r.devLink ? `<p class="mu">🧪 Modo local (sem envio real): <a href="${esc(r.devLink)}" target="_blank" rel="noopener" id="rdl">abrir o link do e-mail</a></p>` : ""}
      <div class="mu" id="rsw">⏳ Aguardando você abrir o link…</div><div class="opts"><button class="gh" id="rsc">Cancelar</button></div>`);
    $("#rsc").onclick = close; stop(); let n = 0;
    pollT = setInterval(async () => { if (!$("#dlg").classList.contains("on") || ++n > 720) return stop();
      const p = await post({ op: "poll", id: r.id, secret: r.secret });
      if (p.state === "verified") { stop(); form(r, p); } else if (p.state === "expired" || p.state === "used" || p.state === "none") { stop(); $("#rsw") && ($("#rsw").textContent = "Este pedido expirou. Peça um novo e-mail."); } }, 2500);
  }
  function form(r, p) {
    box("Redefinir senha", `<p>E-mail verificado ✅ Escolha a nova senha de <b>${esc(p.name)}</b>.</p>
      <label class="f">Nova senha<input id="rn1" type="password" autocomplete="new-password" placeholder="mínimo 6 caracteres"></label><label class="f">Repita a nova senha<input id="rn2" type="password" autocomplete="new-password"></label><div class="err" id="rse"></div>
      <div class="opts"><button class="pri" id="rsg">Salvar nova senha</button><button class="gh" id="rsc">Cancelar</button></div>`);
    $("#rsc").onclick = close; const go = async () => {
      const a = $("#rn1").value, b = $("#rn2").value; if (a.length < 6) return ($("#rse").textContent = "A senha precisa de 6+ caracteres."); if (a !== b) return ($("#rse").textContent = "As senhas não são iguais.");
      $("#rsg").disabled = true; $("#rse").textContent = "Salvando…"; const pass = await LocalHub.hashPw(a), s = await post({ op: "set", id: r.id, ticket: p.ticket, pass });
      if (!s.ok) { $("#rsg").disabled = false; return ($("#rse").textContent = s.err || "Falha ao salvar."); }
      try { await CLOUD.refresh(); } catch (e) { /* ignore */ }
      box("Senha alterada ✅", `<p>A senha de <b>${esc(s.name)}</b> foi redefinida. ${ACC.user ? "Use a nova senha no próximo login." : "Entre agora com a nova senha."}</p><div class="opts"><button class="pri" id="rsc">Ok</button></div>`);
      $("#rsc").onclick = () => { close(); if (!ACC.user && typeof authScreen === "function") { authScreen("login"); const i = $("#au"); if (i) i.value = s.name; } };
    }; $("#rsg").onclick = go; $("#rn2").onkeydown = (e) => { if (e.key == "Enter") go(); };
  }
  return { ask, setEmail, start };
})();
