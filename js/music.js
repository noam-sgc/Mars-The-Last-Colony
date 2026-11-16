/* Trilha sonora procedural (Web Audio, sem arquivos): pads, baixo, arpejos e vento marciano.
   O clima musical muda conforme a tela: menu, colônia, interior, pilotagem, tempestade e saga alienígena. */
const Music = (() => {
  const MOODS = {
    menu: { root: 50, tempo: 54, chords: [[0, 7, 12, 15], [-4, 3, 7, 12], [-2, 5, 9, 14], [-5, 2, 7, 10]], scale: [0, 3, 5, 7, 10], arp: .45, pad: 1, wind: .5 },
    colony: { root: 57, tempo: 70, chords: [[0, 7, 11, 16], [-3, 4, 9, 12], [-7, 0, 5, 9], [-5, 2, 7, 11]], scale: [0, 2, 4, 7, 9], arp: .75, pad: .9, wind: .35 },
    interior: { root: 53, tempo: 58, chords: [[0, 4, 7, 11], [2, 5, 9, 12], [-3, 0, 4, 7], [-5, 2, 5, 9]], scale: [0, 2, 4, 7, 9], arp: .3, pad: .8, wind: 0 },
    nav: { root: 45, tempo: 98, chords: [[0, 7, 12], [-2, 5, 10], [-4, 3, 8], [-5, 2, 7]], scale: [0, 3, 5, 7, 10], arp: 1.1, pad: .7, pulse: true, wind: 0 },
    storm: { root: 43, tempo: 80, chords: [[0, 6, 12], [-1, 5, 11], [-3, 4, 9], [0, 3, 10]], scale: [0, 1, 3, 6, 7], arp: .5, pad: 1, pulse: true, wind: .9 },
    alien: { root: 55, tempo: 64, chords: [[0, 7, 14, 18], [2, 9, 14, 18], [-5, 2, 9, 12], [0, 4, 11, 18]], scale: [0, 2, 4, 6, 7, 9, 11], arp: 1, pad: 1, wind: .2, shimmer: true },
  };
  let ctx, master, bus, mood = "menu", on = true, vol = .5, half = 0, chord = -1, nextT = 0, timer, wind, windG, windF, started = false;
  try { on = localStorage.getItem("mars-music") !== "0"; vol = +(localStorage.getItem("mars-vol") || .5); } catch (e) { /* ignore */ }
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12), pick = (a) => a[Math.floor(Math.random() * a.length)];
  function init() {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false; ctx = new AC();
    master = ctx.createGain(); master.gain.value = on ? vol : 0; const comp = ctx.createDynamicsCompressor(); master.connect(comp); comp.connect(ctx.destination);
    bus = ctx.createGain(); bus.gain.value = .8;
    const dry = ctx.createGain(); dry.gain.value = .7; bus.connect(dry); dry.connect(master);
    const len = ctx.sampleRate * 3.2, ir = ctx.createBuffer(2, len, ctx.sampleRate); for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    const conv = ctx.createConvolver(); conv.buffer = ir; const wet = ctx.createGain(); wet.gain.value = .55; bus.connect(conv); conv.connect(wet); wet.connect(master);
    const dl = ctx.createDelay(1.5); dl.delayTime.value = .46; const fb = ctx.createGain(); fb.gain.value = .38, dl.connect(fb); fb.connect(dl); const dw = ctx.createGain(); dw.gain.value = .28; bus.connect(dl); dl.connect(dw); dw.connect(conv); dw.connect(master);
    // vento: ruído filtrado
    const nb = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate), nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    wind = ctx.createBufferSource(); wind.buffer = nb; wind.loop = true; windF = ctx.createBiquadFilter(); windF.type = "bandpass"; windF.frequency.value = 500; windF.Q.value = .7; windG = ctx.createGain(); windG.gain.value = 0;
    wind.connect(windF); windF.connect(windG); windG.connect(master); wind.start();
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = .08; lg.gain.value = 280; lfo.connect(lg); lg.connect(windF.frequency); lfo.start();
    return true;
  }
  function env(g, t, a, peak, hold, rel) { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.setValueAtTime(peak, t + a + hold); g.gain.exponentialRampToValueAtTime(.0001, t + a + hold + rel); }
  function pad(t, note, dur, level, shimmer) {
    const f = mtof(note), g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.setValueAtTime(500, t); lp.frequency.linearRampToValueAtTime(shimmer ? 1700 : 1100, t + dur * .6); lp.Q.value = .6;
    env(g, t, dur * .35, level, dur * .3, dur * .5 + 1.5); lp.connect(g); g.connect(bus);
    [-7, 0, 7].forEach((c) => { const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = f; o.detune.value = c; o.connect(lp); o.start(t); o.stop(t + dur * 1.2 + 2); });
  }
  function bass(t, note, dur, level) { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = "sine"; o.frequency.value = mtof(note); env(g, t, .6, level, dur * .8, 1.5); o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 2.5); }
  function pluck(t, note, level, shimmer) {
    const o = ctx.createOscillator(), g = ctx.createGain(), p = ctx.createStereoPanner ? ctx.createStereoPanner() : null; o.type = shimmer ? "sine" : "triangle"; o.frequency.value = mtof(note);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(level, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + 1.6); o.connect(g); if (p) { p.pan.value = Math.random() * 1.2 - .6; g.connect(p); p.connect(bus); } else g.connect(bus); o.start(t); o.stop(t + 1.8);
  }
  function step(t) {
    const m = MOODS[mood], sec = 60 / m.tempo / 2;
    if (half % 16 === 0) { chord = (chord + 1) % m.chords.length; const ch = m.chords[chord], dur = sec * 16;
      ch.forEach((n, i) => pad(t + i * .08, m.root + n, dur, .05 * m.pad, m.shimmer)); bass(t, m.root + ch[0] - 24, dur, .22 * Math.min(1, m.pad + .2)); }
    if (m.pulse && half % 2 === 0) bass(t, m.root + m.chords[Math.max(0, chord)][0] - 24, sec, .1);
    if (Math.random() < m.arp * .5) { const ch = m.chords[Math.max(0, chord)], base = m.root + 12 + pick([0, 12]); pluck(t, base + pick(m.scale), .06, m.shimmer); if (m.shimmer && Math.random() < .4) pluck(t + sec / 2, base + 12 + pick(m.scale), .03, true); }
    half++;
  }
  function loop() { if (!ctx || ctx.state !== "running") return; while (nextT < ctx.currentTime + .5) { step(Math.max(nextT, ctx.currentTime + .05)); nextT += 60 / MOODS[mood].tempo / 2; } }
  function start() {
    if (started) { if (ctx && ctx.state === "suspended") ctx.resume(); return; } if (!init()) return; started = true; nextT = ctx.currentTime + .1; ctx.resume(); timer = setInterval(loop, 120); setMood(mood, true);
    document.addEventListener("visibilitychange", () => { if (!ctx) return; if (document.hidden) ctx.suspend(); else ctx.resume(); });
  }
  function setMood(m, force) { if (!MOODS[m] || (m === mood && !force)) return; mood = m; if (windG) windG.gain.setTargetAtTime(MOODS[m].wind * .06, ctx.currentTime, 1.5); }
  function apply() { if (master) master.gain.setTargetAtTime(on ? vol : 0, ctx.currentTime, .25); try { localStorage.setItem("mars-music", on ? "1" : "0"); localStorage.setItem("mars-vol", String(vol)); } catch (e) { /* ignore */ } ui(); }
  function toggle() { start(); on = !on; apply(); }
  function setVol(v) { vol = clamp(v, 0, 1); if (!on && vol > 0) on = true; start(); apply(); }
  function ui() { const b = document.getElementById("musb"), r = document.getElementById("musv"); if (b) b.textContent = on && vol > 0 ? "🔊" : "🔇"; if (r) r.value = vol; }
  ["pointerdown", "keydown"].forEach((ev) => addEventListener(ev, () => start(), { once: false, passive: true }));
  addEventListener("keydown", (e) => { if ((e.key === "m" || e.key === "M") && !typing()) toggle(); });
  document.addEventListener("DOMContentLoaded", ui); setTimeout(ui, 0);
  return { setMood, toggle, setVol, get mood() { return mood; }, get on() { return on; }, get ctx() { return ctx; }, MOODS };
})();
