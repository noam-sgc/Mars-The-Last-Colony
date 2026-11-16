/* Gera uma página única (CSS e JS embutidos; Three.js via cdnjs) para pré-visualização/publicação estática.
   Uso: node tools/build-preview.js saida.html */
const fs = require("fs"), path = require("path"), root = path.join(__dirname, "..");
const rd = (f) => fs.readFileSync(path.join(root, f), "utf8");
const html = rd("index.html"), css = rd("css/style.css");
const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]).filter((s) => !s.startsWith("vendor/"));
const body = html.split("<body>")[1].split("<script")[0];
const js = scripts.map((s) => `/* ${s} */\n` + rd(s)).join("\n;\n").replace(/<\/script/gi, "<\\/script");
fs.writeFileSync(process.argv[2] || "preview.html", `<title>Mars: The Last Colony</title>\n<style>${css}</style>\n${body}\n<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>\n<script>${js}</script>\n`);
