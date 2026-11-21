/* Servidor estático mínimo para desenvolvimento local (sem dependências): node tools/serve.js [porta] */
const http = require("http"), fs = require("fs"), path = require("path"), root = path.join(__dirname, "..");
const T = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".png": "image/png" };
const PUB = ["index.html", "css", "js", "shared", "assets", "vendor"];
const api = require("../api/bul.js"), apiReset = require("../api/reset.js"); process.env.MARS_DEV_MAIL = process.env.MARS_DEV_MAIL || "1";   // local: o link do e-mail volta na resposta (sem enviar de verdade)
http.createServer((q, r) => {
  const route = (q.url || "").split("?")[0]; if (route === "/api/bul" || route === "/api/reset") { let b = ""; q.on("data", (c) => (b += c)); return q.on("end", () => { try { q.body = b ? JSON.parse(b) : {}; } catch (e) { q.body = {}; } (route === "/api/bul" ? api : apiReset)(q, r); }); }
  let p = decodeURIComponent((q.url || "/").split("?")[0]); if (p === "/") p = "/index.html"; const f = path.normalize(path.join(root, p)), rel = path.relative(root, f).split(path.sep);
  if (!f.startsWith(root + path.sep) || !PUB.includes(rel[0])) { r.writeHead(404); return r.end("404"); }
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end("404"); } r.writeHead(200, { "Content-Type": T[path.extname(f)] || "application/octet-stream", "Cache-Control": "no-cache" }); r.end(d); });
}).listen(+process.argv[2] || 8080, () => console.log("http://localhost:" + (+process.argv[2] || 8080)));
