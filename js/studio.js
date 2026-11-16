/* Visualizador 3D em miniatura + Ferramentas de administração e estúdio de criação. */
class MiniView {
  constructor(box, w, h) {
    window.studioStop && studioStop(); this.box = box; this.r = new THREE.WebGLRenderer({ antialias: true, alpha: true }); this.r.setPixelRatio(Math.min(devicePixelRatio, 2)); this.r.setSize(w, h); this.r.shadowMap.enabled = true; box.innerHTML = ""; box.appendChild(this.r.domElement);
    this.s = new THREE.Scene(); this.s.add(new THREE.HemisphereLight(0xfff0e0, 0x402010, .9)); const d = new THREE.DirectionalLight(0xffffff, 1.2); d.position.set(4, 8, 6); d.castShadow = true; this.s.add(d); const rim = new THREE.DirectionalLight(0x88aaff, .6); rim.position.set(-5, 3, -6); this.s.add(rim);
    this.c = new THREE.PerspectiveCamera(40, w / h, .1, 100); this.c.position.set(0, 2.8, 9.6); this.c.lookAt(0, 1.9, 0); this.spin = true; this.ry = .6; this.grp = new THREE.Group(); this.s.add(this.grp);
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.4, .25, 32), new THREE.MeshStandardMaterial({ color: 0x2a1a14, metalness: .6, roughness: .4 })); ped.position.y = -.12; ped.receiveShadow = true; this.s.add(ped);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.25, .04, 6, 48), new THREE.MeshBasicMaterial({ color: 0xff6a2b })); ring.rotation.x = Math.PI / 2; this.s.add(ring);
    let down = null; const cv2 = this.r.domElement; cv2.style.touchAction = "none"; cv2.onpointerdown = (e) => { down = e.clientX; cv2.setPointerCapture(e.pointerId); }; cv2.onpointermove = (e) => { if (down != null) { this.ry += (e.clientX - down) * .01; down = e.clientX; } }; cv2.onpointerup = () => (down = null);
    this.alive = true; this.t0 = performance.now(); const loop = () => { if (!this.alive) return; if (!box.isConnected) return this.destroy(); const t = (performance.now() - this.t0) / 1000; if (this.spin) this.ry += .012; this.grp.rotation.y = this.ry; this.grp.children.forEach((o) => { o.userData.anim && o.userData.anim.forEach((f) => f(t)); if (o.userData.legs) walkAnim(o, t, 0); }); this.r.render(this.s, this.c); this.raf = requestAnimationFrame(loop); }; loop(); window.studioCur = this;
  }
  setObj(o, y, fit) { while (this.grp.children.length) this.grp.remove(this.grp.children[0]); if (!o) return; this.grp.add(o); if (fit) { const b = new THREE.Box3().setFromObject(o), sz = b.getSize(new THREE.Vector3()), k = Math.min(1, 4.2 / Math.max(sz.y, .1), 4 / Math.max(sz.x, sz.z, .1)); o.scale.multiplyScalar(k); } o.position.set(0, y || 0, 0); }
  destroy() { this.alive = false; cancelAnimationFrame(this.raf); try { this.r.dispose(); this.r.domElement.remove(); } catch (e) { /* ignore */ } if (window.studioCur === this) window.studioCur = null; }
}
function studioStop() { if (window.studioCur) window.studioCur.destroy(); TMPCX.length = 0; delete TY.__tmp; }

// ---------- ferramentas ADM ----------
let ADMTAB = "msg", STAB = "cos";
function adminTools(tab) {
  if (!isAdminAcc()) return; ADMTAB = tab || ADMTAB; if (ADMTAB == "studio" && !isArtistAcc()) ADMTAB = "msg";
  const tabs = [["msg", "📢 Mensagem global"], ["ev", "🎉 Eventos"]].concat(isArtistAcc() ? [["studio", "🎨 Estúdio (cosméticos, peças, upgrades)"]] : []);
  openModal(`<div class="up"><b style="font-size:18px">🛡 Ferramentas ADM · ${esc(ACC.user)}</b><button id="cls">Fechar</button></div><div class="tabs">${tabs.map(([k, t]) => `<button data-a="${k}" class="${k == ADMTAB ? "sel" : ""}">${t}</button>`).join("")}</div><div id="admc"></div>`);
  $("#cls").onclick = closeModal; $("#admb").querySelectorAll("[data-a]").forEach((b) => (b.onclick = () => { studioStop(); adminTools(b.dataset.a); }));
  if (ADMTAB == "msg") admMsg(); else if (ADMTAB == "ev") admEv(); else admStudio();
}
function admMsg() {
  $("#admc").innerHTML = `<p class="mu">Envia um aviso imediato para <b>todos os jogadores conectados</b> (aparece como faixa no topo e no chat global).</p><textarea id="gm" rows="3" maxlength="240" style="width:100%" placeholder="Ex.: Manutenção às 20h — evento de moedas x5 começa amanhã!"></textarea><div class="row" style="margin-top:8px"><button class="pri" id="gs">Enviar para todos</button><span id="gr" class="mu"></span></div>`;
  $("#gs").onclick = async () => { const r = await NET.ask({ t: "adm.msg", text: $("#gm").value }); $("#gr").textContent = r.ok ? "✔ Enviado" : r.err || "Erro"; if (r.ok) $("#gm").value = ""; };
}
const dtl = (t) => { const d = new Date(t - new Date(t).getTimezoneOffset() * 60000); return d.toISOString().slice(0, 16); };
function admEv() {
  const list = EV.custom.slice().sort((a, b) => a.start - b.start), now = Date.now();
  $("#admc").innerHTML = `<p class="mu">Organize eventos extras. Os eventos automáticos (semanais, datas comemorativas e x5 em 1/fev, 11/abr, 12/jun) já funcionam sozinhos. Cada evento libera um traje exclusivo.</p>
  <div class="fm"><label class="f">Nome<input id="en" maxlength="40" placeholder="Maratona Marciana"></label><label class="f">Ícone<input id="ei" maxlength="2" value="🎉"></label><label class="f">Cor<input id="ec" type="color" value="#ff6a2b"></label><label class="f">Multiplicador de moedas (1–10)<input id="em" type="number" min="1" max="10" value="3"></label>
  <label class="f">Início<input id="es" type="datetime-local" value="${dtl(now)}"></label><label class="f">Fim<input id="ee" type="datetime-local" value="${dtl(now + 864e5)}"></label></div><div class="row" style="margin:8px 0"><button class="pri" id="ea">Criar evento</button><span class="mu" id="er"></span></div>
  <h3>Eventos criados</h3>${list.map((e) => `<div class="up"><div><b>${esc(e.icon || "")} ${esc(e.name)}</b> <span class="chip">x${e.mult}</span><p>${new Date(e.start).toLocaleString("pt-BR")} → ${new Date(e.end).toLocaleString("pt-BR")} · por ${esc(e.by || "?")} ${now >= e.start && now <= e.end ? "· <b class='dn'>ativo</b>" : now > e.end ? "· encerrado" : "· agendado"}</p></div><button data-d="${esc(e.id)}">Remover</button></div>`).join("") || `<p class="mu">Nenhum.</p>`}`;
  $("#ea").onclick = async () => { const ev = { name: $("#en").value, icon: $("#ei").value, col: $("#ec").value, mult: +$("#em").value, start: new Date($("#es").value).getTime(), end: new Date($("#ee").value).getTime() }; const r = await NET.ask({ t: "adm.ev.add", ev }); if (r.ok) { setTimeout(() => admEv(), 150); } else $("#er").textContent = r.err || "Erro"; };
  $("#admc").querySelectorAll("[data-d]").forEach((b) => (b.onclick = async () => { await NET.ask({ t: "adm.ev.del", id: b.dataset.d }); setTimeout(() => admEv(), 150); }));
}
function admStudio() {
  const sub = [["cos", "Cosméticos"], ["part", "Peças"], ["up", "Upgrades"]];
  $("#admc").innerHTML = `<p class="mu">Tudo que for publicado aparece <b>imediatamente para todos os jogadores</b>.</p><div class="tabs">${sub.map(([k, t]) => `<button data-s="${k}" class="${k == STAB ? "sel" : ""}">${t}</button>`).join("")}</div><div id="stf"></div>`;
  $("#admc").querySelectorAll("[data-s]").forEach((b) => (b.onclick = () => { studioStop(); STAB = b.dataset.s; admStudio(); }));
  const f = $("#stf"); const pubList = (kind, arr) => `<h3 style="margin-top:12px">Publicados (${arr.length})</h3>` + (arr.map((x) => `<div class="up"><div><b>${esc(x.n)}</b><p>${x.by ? "por " + esc(x.by) + " · " : ""}${x.c != null ? x.c + " " : ""}${kind == "up" ? "🪙" : ""}</p></div><button data-x="${esc(x.id)}">Excluir</button></div>`).join("") || `<p class="mu">Nada publicado ainda.</p>`);
  const del = () => f.querySelectorAll("[data-x]").forEach((b) => (b.onclick = async () => { await NET.ask({ t: "cat.del", kind: STAB, id: b.dataset.x }); setTimeout(admStudio, 200); }));
  const pub = async (item) => { const r = await NET.ask({ t: "cat.pub", kind: STAB, item }); $("#sr2").textContent = r.ok ? "✔ Publicado para todos!" : r.err || "Erro"; if (r.ok) setTimeout(() => { studioStop(); admStudio(); }, 300); };
  if (STAB == "cos") {
    f.innerHTML = `<div class="row" style="align-items:flex-start"><div class="pv" id="spv" style="width:240px;height:300px"></div><div class="fm" style="flex:1;min-width:240px"><label class="f">Camada<select id="cl"><option value="s">Traje</option><option value="p">Calça</option><option value="w">Relógio</option><option value="h">Capacete</option><option value="b">Mochila</option></select></label><label class="f">Nome<input id="cn" maxlength="40" value="Traje Aurora"></label>
    <label class="f">Preço (créditos)<input id="cp" type="number" min="0" max="5000" value="300"></label><label class="f">Cor principal<input id="cc1" type="color" value="#33ccff"></label><label class="f">Brilho (emissivo)<input id="cg" type="color" value="#9affff"></label><label class="f"><span><input type="checkbox" id="cgo" checked style="width:auto"> Ativar brilho</span></label>
    <label class="f">Quem pode usar<select id="cr"><option value="">Todos</option><option value="admin">Somente administradores</option><option value="artist">Somente desenhistas</option></select></label></div></div><div class="row" style="margin-top:8px"><button class="pri" id="sp">Publicar globalmente</button><span class="mu" id="sr2"></span></div>${pubList("cos", CAT.cos)}`;
    const read = () => ({ l: $("#cl").value, n: $("#cn").value, c: +$("#cp").value, col: $("#cc1").value, glow: $("#cgo").checked ? $("#cg").value : "", adm: $("#cr").value });
    const mv = new MiniView($("#spv"), 240, 300), upd = () => { const it = read(); TMPCX.length = 0; TMPCX.push(Object.assign({ id: "__tmp" }, it)); mv.setObj(av(Object.assign({}, P.eq, { [it.l]: "__tmp" })), 0); }; f.querySelectorAll("input,select").forEach((i) => (i.oninput = upd)); upd(); $("#sp").onclick = () => pub(read());
  } else if (STAB == "part") {
    f.innerHTML = `<div class="row" style="align-items:flex-start"><div class="pv" id="spv" style="width:240px;height:300px"></div><div class="fm" style="flex:1;min-width:240px"><label class="f">Nome<input id="pn" maxlength="40" value="Torre de Pesquisa"></label><label class="f">Forma<select id="psh"><option value="box">Bloco</option><option value="cyl">Cilindro</option><option value="dome">Cúpula</option><option value="tower">Torre</option><option value="ring">Anel</option></select></label>
    <label class="f">Classe<select id="pcs">${K.map((k) => `<option value="${k}">${KN[k]}</option>`).join("")}</select></label><label class="f">Produção (0.2–3)<input id="pp" type="number" step=".1" min=".2" max="3" value="1.2"></label><label class="f">Custo (moedas)<input id="pc" type="number" min="5" max="500" value="60"></label>
    <label class="f">Largura (1–6)<input id="pw" type="range" min="1" max="6" step=".1" value="3"></label><label class="f">Altura (1–8)<input id="ph" type="range" min="1" max="8" step=".1" value="3.5"></label><label class="f">Cor<input id="pcl" type="color" value="#9aa7b8"></label><label class="f">Brilho<input id="pgl" type="color" value="#44ffcc"></label></div></div><div class="row" style="margin-top:8px"><button class="pri" id="sp">Publicar globalmente</button><span class="mu" id="sr2"></span></div>${pubList("part", CAT.part)}`;
    const read = () => ({ n: $("#pn").value, shape: $("#psh").value, k: $("#pcs").value, p: +$("#pp").value, c: +$("#pc").value, w: +$("#pw").value, h: +$("#ph").value, col: $("#pcl").value, glow: $("#pgl").value });
    const mv = new MiniView($("#spv"), 240, 300), upd = () => { const it = read(); TY.__tmp = { n: it.n, c: it.c, k: it.k, p: it.p, custom: it }; const m = mk("__tmp", S.color); mv.setObj(m, 0, true); }; f.querySelectorAll("input,select").forEach((i) => (i.oninput = upd)); upd(); $("#sp").onclick = () => pub(read());
  } else {
    f.innerHTML = `<div class="fm"><label class="f">Nome<input id="un" maxlength="40" value="Painéis de grafeno"></label><label class="f">Tipo<select id="uk"><option>Hardware</option><option>Software</option></select></label><label class="f">Custo (moedas)<input id="uc" type="number" min="50" max="5000" value="450"></label><label class="f">Descrição<input id="ud" maxlength="90" value="Mais energia e menos consumo"></label>
    <label class="f">+Tempo por fase (s, 0–120)<input id="ut" type="number" min="0" max="120" value="0"></label><label class="f">+Moedas por fase (%) (0–50)<input id="ur" type="number" min="0" max="50" value="0"></label></div>
    <b>Produção extra por classe (%)</b><div class="fm">${K.map((k) => `<label class="f">${KN[k]}<input data-pm="${k}" type="number" min="0" max="100" value="${k == "eff" ? 25 : 0}"></label>`).join("")}</div><b>Redução de consumo por classe (%)</b><div class="fm">${K.map((k) => `<label class="f">${KN[k]}<input data-cr="${k}" type="number" min="0" max="80" value="0"></label>`).join("")}</div>
    <div class="row" style="margin-top:8px"><button class="pri" id="sp">Publicar globalmente</button><span class="mu" id="sr2"></span></div>${pubList("up", CAT.up)}`;
    $("#sp").onclick = () => { const pm = {}, cr = {}; f.querySelectorAll("[data-pm]").forEach((i) => { if (+i.value) pm[i.dataset.pm] = +i.value / 100; }); f.querySelectorAll("[data-cr]").forEach((i) => { if (+i.value) cr[i.dataset.cr] = +i.value / 100; }); pub({ n: $("#un").value, k: $("#uk").value, c: +$("#uc").value, d: $("#ud").value, time: +$("#ut").value, rw: +$("#ur").value / 100, pm, cr }); };
  }
  del();
}
