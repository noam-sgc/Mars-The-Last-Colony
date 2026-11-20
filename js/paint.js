/* Ferramentas de DESENHO do Estúdio (ARTE):
   - PaintPad: pinta à mão a textura do traje / calça / mochila / capacete (atlas 256×256 com regiões guiadas);
   - ProfilePad: desenha a silhueta do tronco do traje (6 raios arrastáveis);
   - HairPad: desenha o cabelo célula a célula numa grade sobre a cabeça (volume + comprimento, simetria, estilos de fio). */
const REG_OF = { s: ["torso", "sleeve"], p: ["leg"], b: ["pack"], h: ["helm"] };
const REG_NAME = { torso: "Tronco (frente no centro)", sleeve: "Mangas", leg: "Pernas", pack: "Mochila", helm: "Capacete" };

class PaintPad {
  constructor(host, o) {
    this.o = o || {}; this.col = "#ff6a2b"; this.size = 6; this.tool = "pen"; this.mirror = true; this.undo = []; this.dirty = false; this.layer = this.o.layer || "s";
    host.innerHTML = `<div class="pp"><div class="pptools">${[["pen", "✏️ Pincel"], ["erase", "🧽 Borracha"], ["fill", "🪣 Balde"], ["line", "📏 Linha"], ["rect", "▭ Retângulo"], ["circ", "◯ Círculo"], ["pick", "💧 Conta-gotas"]].map(([k, n]) => `<button data-tool="${k}" class="${k == "pen" ? "sel" : ""}">${n}</button>`).join("")}
      <label class="f" style="min-width:90px">Cor<input type="color" id="ppc" value="${this.col}"></label><label class="f" style="min-width:120px">Tamanho<input type="range" id="pps" min="1" max="30" value="6"></label>
      <label><input type="checkbox" id="ppm" checked style="width:auto"> Simetria</label><label><input type="checkbox" id="ppg" checked style="width:auto"> Guias</label>
      <button id="ppu">↶ Desfazer</button><button id="ppf">Preencher com a cor base</button><label class="f" style="min-width:140px">Importar imagem<input type="file" id="ppi" accept="image/*"></label></div>
      <div class="ppwrap"><canvas class="ppc" width="256" height="256"></canvas><canvas class="ppo" width="256" height="256"></canvas></div><small class="mu" id="pph"></small></div>`;
    this.cv = host.querySelector(".ppc"); this.ov = host.querySelector(".ppo"); this.x = this.cv.getContext("2d", { willReadFrequently: true }); this.ox = this.ov.getContext("2d");
    this.reset(this.o.base || "#eef0f4", this.o.src);
    host.querySelectorAll("[data-tool]").forEach((b) => (b.onclick = () => { this.tool = b.dataset.tool; host.querySelectorAll("[data-tool]").forEach((q) => q.classList.toggle("sel", q === b)); }));
    host.querySelector("#ppc").oninput = (e) => (this.col = e.target.value); host.querySelector("#pps").oninput = (e) => (this.size = +e.target.value);
    host.querySelector("#ppm").onchange = (e) => (this.mirror = e.target.checked); host.querySelector("#ppg").onchange = (e) => { this.guides = e.target.checked; this.drawGuides(); };
    host.querySelector("#ppu").onclick = () => { const u = this.undo.pop(); if (u) { this.x.putImageData(u, 0, 0); this.changed(); } };
    host.querySelector("#ppf").onclick = () => { this.snap(); this.regions().forEach((r) => { const [a, b, w, h] = TX_REG[r]; this.x.fillStyle = this.o.base || "#eef0f4"; this.x.fillRect(a, b, w, h); }); this.changed(); };
    host.querySelector("#ppi").onchange = (e) => { const f = e.target.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => { const im = new Image(); im.onload = () => { this.snap(); const [a, b, w, h] = TX_REG[this.regions()[0]]; this.x.drawImage(im, a, b, w, h); this.changed(); }; im.src = rd.result; }; rd.readAsDataURL(f); };
    this.guides = true; this.drawGuides(); this.bind();
  }
  regions() { return REG_OF[this.layer] || ["torso"]; }
  setLayer(l, base) { this.layer = l; this.o.base = base || this.o.base; this.drawGuides(); }
  reset(base, src) { this.x.fillStyle = base; this.x.fillRect(0, 0, 256, 256); this.dirty = !!src; if (src) { const im = new Image(); im.onload = () => { this.x.drawImage(im, 0, 0, 256, 256); this.changed(true); }; im.src = src; } }
  drawGuides() {
    const x = this.ox; x.clearRect(0, 0, 256, 256); if (!this.guides) return; const act = this.regions();
    Object.keys(TX_REG).forEach((k) => { const [a, b, w, h] = TX_REG[k], on = act.includes(k); x.strokeStyle = on ? "#22e6ff" : "#ffffff40"; x.lineWidth = on ? 1.5 : 1; x.strokeRect(a + .5, b + .5, w - 1, h - 1);
      if (!on) { x.fillStyle = "#00000088"; x.fillRect(a, b, w, h); } x.fillStyle = on ? "#22e6ff" : "#ffffff70"; x.font = "9px sans-serif"; x.fillText(REG_NAME[k], a + 3, b + 10);
      if (on) { x.setLineDash([3, 3]); x.beginPath(); x.moveTo(a + w / 2, b); x.lineTo(a + w / 2, b + h); x.stroke(); x.setLineDash([]); if (k == "torso") { x.fillText("costas", a + 3, b + h - 4); x.fillText("frente", a + w / 2 - 14, b + h - 4); } } });
  }
  snap() { try { this.undo.push(this.x.getImageData(0, 0, 256, 256)); if (this.undo.length > 25) this.undo.shift(); } catch (e) { /* ignore */ } }
  changed(silent) { this.dirty = true; if (!silent && this.o.onChange) this.o.onChange(); else if (this.o.onChange) this.o.onChange(); }
  pos(e) { const r = this.cv.getBoundingClientRect(); return [Math.floor((e.clientX - r.left) / r.width * 256), Math.floor((e.clientY - r.top) / r.height * 256)]; }
  regAt(px, py) { return Object.keys(TX_REG).find((k) => { const [a, b, w, h] = TX_REG[k]; return px >= a && px < a + w && py >= b && py < b + h; }); }
  mir(px, py) { const k = this.regAt(px, py); if (!k) return null; const [a, , w] = TX_REG[k]; return [a + w - 1 - (px - a), py]; }
  clip(fn, px, py) { const k = this.regAt(px, py); if (!k) return; const [a, b, w, h] = TX_REG[k]; this.x.save(); this.x.beginPath(); this.x.rect(a, b, w, h); this.x.clip(); fn(); this.x.restore(); }
  dot(px, py) { const x = this.x, er = this.tool == "erase"; const go = (qx, qy) => this.clip(() => { x.fillStyle = er ? this.o.base || "#eef0f4" : this.col; x.beginPath(); x.arc(qx, qy, this.size / 2, 0, 6.283); x.fill(); }, qx, qy); go(px, py); const m = this.mirror && this.mir(px, py); if (m) go(m[0], m[1]); }
  seg(p0, p1) { const n = Math.max(1, Math.ceil(Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) / Math.max(1, this.size / 3))); for (let i = 0; i <= n; i++) this.dot(p0[0] + (p1[0] - p0[0]) * i / n, p0[1] + (p1[1] - p0[1]) * i / n); }
  shape(p0, p1, ctx) { const x = ctx || this.x; const one = (a, b) => { x.strokeStyle = this.col; x.fillStyle = this.col; x.lineWidth = this.size; x.beginPath();
      if (this.tool == "line") { x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.stroke(); } else if (this.tool == "rect") { x.fillRect(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])); } else { x.ellipse((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, Math.abs(b[0] - a[0]) / 2 + .5, Math.abs(b[1] - a[1]) / 2 + .5, 0, 0, 6.283); x.fill(); } };
    if (ctx) one(p0, p1); else this.clip(() => one(p0, p1), p0[0], p0[1]);
    const m0 = this.mirror && this.mir(p0[0], p0[1]), m1 = this.mirror && this.mir(p1[0], p1[1]); if (m0 && m1) { if (ctx) one(m0, m1); else this.clip(() => one(m0, m1), m0[0], m0[1]); } }
  fill(px, py) {
    const k = this.regAt(px, py); if (!k) return; const [a, b, w, h] = TX_REG[k], img = this.x.getImageData(0, 0, 256, 256), d = img.data, i0 = (py * 256 + px) * 4, t = [d[i0], d[i0 + 1], d[i0 + 2]], c = new THREE.Color(this.col), nc = [c.r * 255, c.g * 255, c.b * 255].map(Math.round);
    if (Math.abs(t[0] - nc[0]) + Math.abs(t[1] - nc[1]) + Math.abs(t[2] - nc[2]) < 6) return; const st = [[px, py]], seen = new Uint8Array(65536), near = (i) => Math.abs(d[i] - t[0]) + Math.abs(d[i + 1] - t[1]) + Math.abs(d[i + 2] - t[2]) < 40;
    while (st.length) { const [qx, qy] = st.pop(); if (qx < a || qy < b || qx >= a + w || qy >= b + h) continue; const j = qy * 256 + qx; if (seen[j]) continue; seen[j] = 1; const i = j * 4; if (!near(i)) continue; d[i] = nc[0]; d[i + 1] = nc[1]; d[i + 2] = nc[2]; d[i + 3] = 255; st.push([qx + 1, qy], [qx - 1, qy], [qx, qy + 1], [qx, qy - 1]); }
    this.x.putImageData(img, 0, 0);
  }
  bind() {
    let down = null, last = null; const ov = this.ov; ov.style.touchAction = "none";
    ov.onpointerdown = (e) => { ov.setPointerCapture(e.pointerId); const p = this.pos(e); if (this.tool == "pick") { const d = this.x.getImageData(p[0], p[1], 1, 1).data; this.col = "#" + [d[0], d[1], d[2]].map((v) => v.toString(16).padStart(2, "0")).join(""); const ci = ov.closest(".pp").querySelector("#ppc"); ci.value = this.col; return; }
      this.snap(); if (this.tool == "fill") { this.fill(p[0], p[1]); const m = this.mirror && this.mir(p[0], p[1]); if (m) this.fill(m[0], m[1]); this.changed(); return; } down = p; last = p; if (this.tool == "pen" || this.tool == "erase") this.dot(p[0], p[1]); };
    ov.onpointermove = (e) => { if (!down) return; const p = this.pos(e); if (this.tool == "pen" || this.tool == "erase") { this.seg(last, p); last = p; this.changed(true); } else { this.drawGuides(); this.shape(down, p, this.ox); } };
    ov.onpointerup = (e) => { if (!down) return; const p = this.pos(e); if (!(this.tool == "pen" || this.tool == "erase")) { this.shape(down, p); this.drawGuides(); } down = null; this.changed(); };
  }
  /** Exporta a textura (PNG; se ficar grande, WebP). */
  export() { if (!this.dirty) return ""; let u = this.cv.toDataURL("image/png"); if (u.length > 90000) u = this.cv.toDataURL("image/webp", .85); if (u.length > 110000) u = this.cv.toDataURL("image/jpeg", .8); return u; }
}

/** Silhueta do tronco: arraste os 6 pontos (quadril → ombros). */
class ProfilePad {
  constructor(host, pf, onChange) {
    this.pf = (Array.isArray(pf) && pf.length == 6 ? pf : PF_DEF).slice(); this.onChange = onChange; host.innerHTML = `<canvas width="200" height="230" style="background:#0b1424;border:1px solid #3d6a99;border-radius:10px;touch-action:none;max-width:100%"></canvas><div class="row"><button data-pr="0">Padrão</button><button data-pr="1">Atlético (V)</button><button data-pr="2">Robusto</button><button data-pr="3">Ampulheta</button></div>`;
    this.cv = host.querySelector("canvas"); this.x = this.cv.getContext("2d"); this.draw();
    const pre = [PF_DEF, [.4, .44, .5, .58, .62, .44], [.56, .6, .62, .62, .58, .44], [.5, .44, .4, .5, .56, .4]];
    host.querySelectorAll("[data-pr]").forEach((b) => (b.onclick = () => { this.pf = pre[+b.dataset.pr].slice(); this.draw(); this.onChange && this.onChange(); }));
    let drag = -1; const P = (e) => { const r = this.cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * 200, (e.clientY - r.top) / r.height * 230]; };
    this.cv.onpointerdown = (e) => { this.cv.setPointerCapture(e.pointerId); const [px, py] = P(e); let best = 1e9; this.pf.forEach((v, i) => { const [hx, hy] = this.h(i), d = Math.hypot(hx - px, hy - py); if (d < best) { best = d; drag = i; } }); };
    this.cv.onpointermove = (e) => { if (drag < 0) return; const [px] = P(e); this.pf[drag] = Math.round(Math.min(.85, Math.max(.25, (px - 100) / 110)) * 100) / 100; this.draw(); this.onChange && this.onChange(); };
    this.cv.onpointerup = () => (drag = -1);
  }
  h(i) { return [100 + this.pf[i] * 110, 200 - i * 34]; }
  draw() { const x = this.x; x.clearRect(0, 0, 200, 230); x.strokeStyle = "#ffffff30"; x.beginPath(); x.moveTo(100, 10); x.lineTo(100, 220); x.stroke();
    x.fillStyle = "#eef0f4"; x.beginPath(); x.moveTo(100, 208); this.pf.forEach((v, i) => x.lineTo(...this.h(i))); x.lineTo(100, 22); this.pf.slice().reverse().forEach((v, i) => { const [hx, hy] = this.h(5 - i); x.lineTo(200 - hx, hy); }); x.closePath(); x.fill();
    this.pf.forEach((v, i) => { const [hx, hy] = this.h(i); x.fillStyle = "#22e6ff"; x.beginPath(); x.arc(hx, hy, 7, 0, 6.283); x.fill(); }); x.fillStyle = "#cfe8ff"; x.font = "11px sans-serif"; x.fillText("ombros", 6, 34); x.fillText("quadril", 6, 206); }
}

/** Cabelo desenhado: grade 32×14 ao redor da cabeça. */
class HairPad {
  constructor(host, it, onChange) {
    const z = "0".repeat(HAIR_N); this.hv = (it && /^[0-9]+$/.test(it.hv) && it.hv.length == HAIR_N ? it.hv : z).split("").map(Number); this.hl = (it && /^[0-9]+$/.test(it.hl) && it.hl.length == HAIR_N ? it.hl : z).split("").map(Number);
    this.ch = "v"; this.val = 5; this.br = 1; this.mirror = true; this.onChange = onChange; const C = 14;
    host.innerHTML = `<div class="row" style="flex-wrap:wrap"><button data-ch="v" class="sel">🌀 Volume</button><button data-ch="l">📏 Comprimento</button><button data-ch="x">🧽 Apagar</button><label class="f" style="min-width:120px">Intensidade<input type="range" id="hpv" min="1" max="9" value="5"></label><label class="f" style="min-width:110px">Pincel<input type="range" id="hpb" min="0" max="2" value="1"></label><label><input type="checkbox" id="hpm" checked style="width:auto"> Simetria</label></div>
      <div class="row" style="flex-wrap:wrap;margin:4px 0">Começar de: ${["Careca", "Curto", "Médio", "Longo", "Black power", "Franja", "Moicano"].map((n, i) => `<button data-hp="${i}">${n}</button>`).join("")}</div>
      <canvas width="${HAIR_COLS * C}" height="${HAIR_ROWS * C + 18}" style="max-width:100%;background:#0b1424;border:1px solid #3d6a99;border-radius:8px;touch-action:none"></canvas>
      <small class="mu">Cada coluna é uma direção ao redor da cabeça (o rosto fica no centro); cada linha vai do topo (em cima) até a nuca (embaixo). <b>Volume</b> = o quanto o cabelo sai do couro; <b>Comprimento</b> = o quanto os fios caem.</small>`;
    this.cv = host.querySelector("canvas"); this.x = this.cv.getContext("2d"); this.C = C;
    host.querySelectorAll("[data-ch]").forEach((b) => (b.onclick = () => { this.ch = b.dataset.ch; host.querySelectorAll("[data-ch]").forEach((q) => q.classList.toggle("sel", q === b)); }));
    host.querySelector("#hpv").oninput = (e) => (this.val = +e.target.value); host.querySelector("#hpb").oninput = (e) => (this.br = +e.target.value); host.querySelector("#hpm").onchange = (e) => (this.mirror = e.target.checked);
    host.querySelectorAll("[data-hp]").forEach((b) => (b.onclick = () => { this.preset(+b.dataset.hp); this.draw(); this.onChange && this.onChange(); }));
    let down = false; const paint = (e) => { const r = this.cv.getBoundingClientRect(), i = Math.floor((e.clientX - r.left) / r.width * HAIR_COLS), j = Math.floor((e.clientY - r.top) / r.height * (HAIR_ROWS + 18 / C)); if (j >= HAIR_ROWS) return;
      for (let di = -this.br; di <= this.br; di++) for (let dj = -this.br; dj <= this.br; dj++) { const ii = (i + di + HAIR_COLS) % HAIR_COLS, jj = j + dj; if (jj < 0 || jj >= HAIR_ROWS) continue; this.set(ii, jj); if (this.mirror) this.set((HAIR_COLS - 1 - ii + HAIR_COLS) % HAIR_COLS, jj); }
      this.draw(); this.onChange && this.onChange(); };
    this.cv.onpointerdown = (e) => { this.cv.setPointerCapture(e.pointerId); down = true; paint(e); }; this.cv.onpointermove = (e) => down && paint(e); this.cv.onpointerup = () => (down = false); this.draw();
  }
  set(i, j) { const k = j * HAIR_COLS + i; if (this.ch == "x") { this.hv[k] = 0; this.hl[k] = 0; } else if (this.ch == "v") this.hv[k] = this.val; else this.hl[k] = this.val; }
  face(i, j) { const d = hairDir(i, j); return d.z > .25 && d.y < .5; }
  preset(n) { for (let j = 0; j < HAIR_ROWS; j++) for (let i = 0; i < HAIR_COLS; i++) { const k = j * HAIR_COLS + i, d = hairDir(i, j), f = this.face(i, j), back = d.z < .1; let v = 0, l = 0;
      if (n == 1) v = d.y > .25 && !f ? 3 : 0; else if (n == 2) { v = d.y > .1 && !f ? 3 : 0; l = back && d.y > -.1 && d.y < .3 ? 3 : 0; } else if (n == 3) { v = d.y > .1 && !f ? 3 : 0; l = !f && d.z < .25 && d.y > -.2 && d.y < .25 ? 8 : 0; }
      else if (n == 4) v = !f && d.y > -.2 ? 8 : 0; else if (n == 5) { v = d.y > .2 ? 3 : 0; if (f && d.y > .3) v = 2; } else if (n == 6) v = Math.abs(d.x) < .18 && d.y > .1 ? 7 : 0;
      this.hv[k] = v; this.hl[k] = l; } }
  draw() { const x = this.x, C = this.C; x.clearRect(0, 0, this.cv.width, this.cv.height);
    for (let j = 0; j < HAIR_ROWS; j++) for (let i = 0; i < HAIR_COLS; i++) { const k = j * HAIR_COLS + i, v = this.hv[k], l = this.hl[k]; x.fillStyle = this.face(i, j) ? "#3a2a22" : "#16223a"; x.fillRect(i * C, j * C, C - 1, C - 1);
      if (v) { x.fillStyle = `rgba(255,170,90,${.25 + v * .08})`; x.fillRect(i * C, j * C, C - 1, C - 1); } if (l) { x.fillStyle = "#22e6ff"; x.fillRect(i * C + C / 2 - 2, j * C + 2, 4, Math.min(C - 3, 2 + l)); } }
    x.fillStyle = "#cfe8ff"; x.font = "11px sans-serif"; x.fillText("nuca", 2, HAIR_ROWS * C + 13); x.fillText("ROSTO (frente)", HAIR_COLS * C / 2 - 40, HAIR_ROWS * C + 13); x.fillText("nuca", HAIR_COLS * C - 30, HAIR_ROWS * C + 13); }
  data() { return { hv: this.hv.join(""), hl: this.hl.join("") }; }
}
