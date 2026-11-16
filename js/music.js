/* Trilha sonora procedural (Web Audio, sem arquivos): pads, baixo, arpejos e vento marciano.
   O clima musical muda conforme a tela: menu, colônia, interior, pilotagem, tempestade e saga alienígena. */
const Music = (() => {
  const MOODS = {
    menu: { root: 50, tempo: 54, chords: [[0, 7, 12, 15], [-4, 3, 7, 12], [-2, 5, 9, 14], [-5, 2, 7, 10]], scale: [0, 3, 5, 7, 10], arp: .45, pad: 1, wind: .5 },
    colony: { root: 57, tempo: 70, chords: [[0, 7, 11, 16], [-3, 4, 9, 12], [-7, 0, 5, 9], [-5, 2, 7, 11]], scale: [0, 2, 4, 7, 9], arp: .75, pad: .9, wind: .35 },
    interior: { root: 53, tempo: 58, chords: [[0, 4, 7, 11], [2, 5, 9, 12], [-3, 0, 4, 7], [-5, 2, 5, 9]], scale: [0, 2, 4, 7, 9], arp: .3, pad: .8, wind: 0 },
    nav: { root: 45, tempo: 98, chords: [[0, 7, 12], [-2, 5, 10], [-4, 3, 8], [-5, 2, 7]], scale: [0, 3, 5, 7, 10], arp: 1.1, pad: .7, pulse: true, wind: 0 },
    storm: { root: 43, tempo: 80, chords: [[0, 6, 12], [-1, 5, 11], [-3, 4, 9], [0, 3, 10]], scale: [0, 1, 3, 6, 7], arp: .5, pad: 1, pulse: true, wind: .9 },
    valles: { root: 38, tempo: 46, chords: [[0, 7, 10, 15], [-2, 5, 10, 14], [-5, 2, 7, 12], [-7, 0, 7, 10]], scale: [0, 3, 5, 7, 10], arp: .3, pad: 1.1, wind: .7 },
    polar: { root: 62, tempo: 76, chords: [[0, 4, 7, 14], [-3, 4, 9, 12], [-5, 2, 7, 11], [-8, 0, 4, 9]], scale: [0, 2, 4, 7, 9, 11], arp: 1.2, pad: .7, wind: .1, shimmer: true },
    alien: { root: 55, tempo: 64, chords: [[0, 7, 14, 18], [2, 9, 14, 18], [-5, 2, 9, 12], [0, 4, 11, 18]], scale: [0, 2, 4, 6, 7, 9, 11], arp: 1, pad: 1, wind: .2, shimmer: true },
  };
  // Catálogo da trilha sonora. 'file' = música gravada; 'proc' = gerada em tempo real (nomes inventados).
  const TRACKS = [
    { id: "normal", name: "Marte Tranquila", desc: "Calma e contemplativa, para planejar a colônia", kind: "file", src: "assets/audio/marte-tranquila.mp3" },
    { id: "animated", name: "Marte Animada", desc: "Ritmo animado para construir e explorar", kind: "file", src: "assets/audio/marte-animada.mp3" },
    { id: "jezero", name: "Poeira de Jezero", desc: "Pads suaves e arpejos distantes", kind: "proc", mood: "menu" },
    { id: "amanhecer", name: "Colônia ao Amanhecer", desc: "Cordas elétricas e esperança", kind: "proc", mood: "colony" },
    { id: "cupula", name: "Sob a Cúpula", desc: "Silêncio quente de dentro da base", kind: "proc", mood: "interior" },
    { id: "travessia", name: "Travessia Vermelha", desc: "Pulso constante rumo ao planeta", kind: "proc", mood: "nav" },
    { id: "tempestade", name: "Tempestade de Ferro", desc: "Vento, poeira e tensão", kind: "proc", mood: "storm" },
    { id: "visitantes", name: "Canção dos Visitantes", desc: "Brilhos de outro mundo", kind: "proc", mood: "alien" },
    { id: "valles", name: "Noites de Valles", desc: "Graves profundos no grande cânion", kind: "proc", mood: "valles" },
    { id: "polar", name: "Aurora Polar", desc: "Cristais de gelo sob o céu rosado", kind: "proc", mood: "polar" },
  ];
  // Modo automático: a música acompanha o momento do jogo.
  const AUTO = { menu: "normal", interior: "normal", colony: "animated", nav: "travessia", storm: "tempestade", alien: "visitantes" };
  const CLICKS = { suave: "Bip suave", seco: "Clique seco", gota: "Gota", cristal: "Cristal" };
  const store = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } };
  const put = (k, v) => { try { localStorage.setItem(k, String(v)); } catch (e) { /* ignore */ } };
  let ctx, musicOut, pg, fg, sfxOut, bus, mood = "menu", pmood = "menu", on = store("mars-music", "1") !== "0", vol = +store("mars-vol", ".5"), sel = store("mars-track", "auto"), cur = null;
  let sfxOn = store("mars-sfx", "1") !== "0", sfxVol = +store("mars-sfxvol", ".6"), sfxStyle = store("mars-sfxstyle", "suave");
  let half = 0, chord = -1, nextT = 0, timer, wind, windG, windF, started = false; const els = {};
  if (!TRACKS.some((t) => t.id === sel) && sel !== "auto") sel = "auto";
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12), pick = (a) => a[Math.floor(Math.random() * a.length)];
  function init() {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false; ctx = new AC();
    const comp = ctx.createDynamicsCompressor(); comp.connect(ctx.destination);
    musicOut = ctx.createGain(); musicOut.gain.value = on ? vol : 0; musicOut.connect(comp);       // volume da música
    pg = ctx.createGain(); pg.gain.value = 0; pg.connect(musicOut);                                  // faixas geradas (fade)
    fg = ctx.createGain(); fg.gain.value = 1; fg.connect(musicOut);                                  // faixas gravadas (fade)
    sfxOut = ctx.createGain(); sfxOut.gain.value = sfxVol; sfxOut.connect(ctx.destination);          // efeitos (cliques)
    bus = ctx.createGain(); bus.gain.value = .8;
    const dry = ctx.createGain(); dry.gain.value = .7; bus.connect(dry); dry.connect(pg);
    const len = ctx.sampleRate * 3.2, ir = ctx.createBuffer(2, len, ctx.sampleRate); for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    const conv = ctx.createConvolver(); conv.buffer = ir; const wet = ctx.createGain(); wet.gain.value = .55; bus.connect(conv); conv.connect(wet); wet.connect(pg);
    const dl = ctx.createDelay(1.5); dl.delayTime.value = .46; const fb = ctx.createGain(); fb.gain.value = .38; dl.connect(fb); fb.connect(dl); const dw = ctx.createGain(); dw.gain.value = .28; bus.connect(dl); dl.connect(dw); dw.connect(conv); dw.connect(pg);
    const nb = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate), nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    wind = ctx.createBufferSource(); wind.buffer = nb; wind.loop = true; windF = ctx.createBiquadFilter(); windF.type = "bandpass"; windF.frequency.value = 500; windF.Q.value = .7; windG = ctx.createGain(); windG.gain.value = 0;
    wind.connect(windF); windF.connect(windG); windG.connect(pg); wind.start();
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = .08; lg.gain.value = 280; lfo.connect(lg); lg.connect(windF.frequency); lfo.start();
    return true;
  }
  function env(g, t, a, peak, hold, rel) { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.setValueAtTime(peak, t + a + hold); g.gain.exponentialRampToValueAtTime(.0001, t + a + hold + rel); }
  function pad(t, note, dur, level, shimmer) {
    const f = mtof(note), g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.setValueAtTime(500, t); lp.frequency.linearRampToValueAtTime(shimmer ? 1700 : 1100, t + dur * .6); lp.Q.value = .6;
    env(g, t, dur * .35, level, dur * .3, dur * .5 + 1.5); lp.connect(g); g.connect(bus);
    [-7, 0, 7].forEach((c) => { const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = f; o.detune.value = c; o.connect(lp); o.start(t); o.stop(t + dur * 1.2 + 2); });
  }
  function bass(t, note, dur, level) { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = "sine"; o.frequency.value = mtof(note); env(g, t, .6, level, dur * .8, 1.5); o.connect(g); g.connect(pg); o.start(t); o.stop(t + dur + 2.5); }
  function pluck(t, note, level, shimmer) {
    const o = ctx.createOscillator(), g = ctx.createGain(), p = ctx.createStereoPanner ? ctx.createStereoPanner() : null; o.type = shimmer ? "sine" : "triangle"; o.frequency.value = mtof(note);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(level, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + 1.6); o.connect(g); if (p) { p.pan.value = Math.random() * 1.2 - .6; g.connect(p); p.connect(bus); } else g.connect(bus); o.start(t); o.stop(t + 1.8);
  }
  function step(t) {
    const m = MOODS[pmood], sec = 60 / m.tempo / 2;
    if (half % 16 === 0) { chord = (chord + 1) % m.chords.length; const ch = m.chords[chord], dur = sec * 16;
      ch.forEach((n, i) => pad(t + i * .08, m.root + n, dur, .05 * m.pad, m.shimmer)); bass(t, m.root + ch[0] - 24, dur, .22 * Math.min(1, m.pad + .2)); }
    if (m.pulse && half % 2 === 0) bass(t, m.root + m.chords[Math.max(0, chord)][0] - 24, sec, .1);
    if (Math.random() < m.arp * .5) { const base = m.root + 12 + pick([0, 12]); pluck(t, base + pick(m.scale), .06, m.shimmer); if (m.shimmer && Math.random() < .4) pluck(t + sec / 2, base + 12 + pick(m.scale), .03, true); }
    half++;
  }
  function loop() { const t = TRACKS.find((x) => x.id === cur); if (!ctx || ctx.state !== "running" || !t || t.kind !== "proc") return; while (nextT < ctx.currentTime + .5) { step(Math.max(nextT, ctx.currentTime + .05)); nextT += 60 / MOODS[pmood].tempo / 2; } }

  // ---------- troca de faixa (com fade) ----------
  const resolve = () => (sel === "auto" ? AUTO[mood] || "normal" : sel);
  function fade(g, to, s) { g.gain.cancelScheduledValues(ctx.currentTime); g.gain.setValueAtTime(g.gain.value, ctx.currentTime); g.gain.linearRampToValueAtTime(to, ctx.currentTime + s); }
  function fileEl(t) {
    if (els[t.id]) return els[t.id]; const el = new Audio(); el.src = t.src; el.loop = true; el.preload = "auto"; const g = ctx.createGain(); g.gain.value = 0;
    try { ctx.createMediaElementSource(el).connect(g); g.connect(fg); } catch (e) { /* ignore */ } return (els[t.id] = { el, g });
  }
  function switchTo(id) {
    const t = TRACKS.find((x) => x.id === id); if (!t || !ctx || id === cur) return; const old = TRACKS.find((x) => x.id === cur); cur = id;
    if (old && old.kind === "file" && els[old.id]) { const o = els[old.id]; fade(o.g, 0, 1.4); setTimeout(() => { if (cur !== old.id) o.el.pause(); }, 1600); }
    if (t.kind === "file") { fade(pg, 0, 1.2); const f = fileEl(t); f.el.play().catch(() => { /* bloqueado ou arquivo ausente */ }); fade(f.g, 1, 1.6); }
    else { pmood = t.mood; half = 0; chord = -1; nextT = ctx.currentTime + .15; fade(pg, 1, 1.6); if (windG) windG.gain.setTargetAtTime(MOODS[pmood].wind * .06, ctx.currentTime, 1.5); }
    ui();
  }
  function sync() { if (started) switchTo(resolve()); }
  function start() {
    if (started) { if (ctx && ctx.state === "suspended") ctx.resume(); return; } if (!init()) return; started = true; ctx.resume(); timer = setInterval(loop, 120); sync();
    document.addEventListener("visibilitychange", () => { if (!ctx) return; if (document.hidden) { ctx.suspend(); } else ctx.resume(); });
  }
  // ---------- efeitos: som de clique ----------
  function click(style) {
    if (!ctx || !sfxOn || ctx.state !== "running") return; const t = ctx.currentTime, st = style || sfxStyle, g = ctx.createGain(); g.connect(sfxOut);
    const tone = (type, f0, f1, dur, level) => { const o = ctx.createOscillator(), e = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur); e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(level, t + .004); e.gain.exponentialRampToValueAtTime(.0001, t + dur); o.connect(e); e.connect(g); o.start(t); o.stop(t + dur + .02); };
    if (st === "seco") { const nb = ctx.createBuffer(1, ctx.sampleRate * .04, ctx.sampleRate), d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3); const n = ctx.createBufferSource(), hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 1800; n.buffer = nb; n.connect(hp); hp.connect(g); g.gain.value = .5; n.start(t); tone("square", 220, 140, .04, .12); }
    else if (st === "gota") tone("sine", 900, 300, .12, .5);
    else if (st === "cristal") { tone("triangle", 1320, 0, .22, .3); tone("sine", 1980, 0, .16, .2); }
    else tone("sine", 620, 880, .07, .45);
  }
  addEventListener("click", (e) => { if (!sfxOn) return; const b = e.target.closest && e.target.closest("button, .card, .it, select, [data-m], .sw"); if (b && !b.disabled) click(); }, true);

  function persist() { put("mars-music", on ? 1 : 0); put("mars-vol", vol); put("mars-track", sel); put("mars-sfx", sfxOn ? 1 : 0); put("mars-sfxvol", sfxVol); put("mars-sfxstyle", sfxStyle); }
  function apply() { if (musicOut) musicOut.gain.setTargetAtTime(on ? vol : 0, ctx.currentTime, .2); if (sfxOut) sfxOut.gain.setTargetAtTime(sfxVol, ctx.currentTime, .05); persist(); ui(); }
  function ui() { const b = document.getElementById("setbtn"); if (b) b.dataset.on = on ? "1" : "0"; if (window.settingsRefresh) window.settingsRefresh(); }
  ["pointerdown", "keydown"].forEach((ev) => addEventListener(ev, () => start(), { passive: true }));
  addEventListener("keydown", (e) => { if ((e.key === "m" || e.key === "M") && !typing()) api.toggle(); });
  const api = {
    TRACKS, CLICKS, AUTO,
    get on() { return on; }, get vol() { return vol; }, get sel() { return sel; }, get cur() { return cur; }, get mood() { return mood; },
    get sfxOn() { return sfxOn; }, get sfxVol() { return sfxVol; }, get sfxStyle() { return sfxStyle; }, get ctx() { return ctx; },
    setMood(m) { if (!MOODS[m] || m === mood) return; mood = m; if (sel === "auto") sync(); },
    select(id) { sel = id === "auto" || TRACKS.some((t) => t.id === id) ? id : "auto"; start(); if (!on) { on = true; } apply(); sync(); },
    toggle() { start(); on = !on; apply(); }, setVol(v) { vol = clamp(+v, 0, 1); if (vol > 0) on = true; start(); apply(); },
    setSfx(v) { sfxOn = !!v; apply(); }, setSfxVol(v) { sfxVol = clamp(+v, 0, 1); apply(); }, setSfxStyle(s) { if (CLICKS[s]) { sfxStyle = s; apply(); } },
    click, trackName() { const t = TRACKS.find((x) => x.id === cur); return t ? t.name : ""; },
  };
  return api;
})();
