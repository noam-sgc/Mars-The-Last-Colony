/* Servidor de Mars: The Last Colony.
   - Serve o jogo (arquivos estáticos da raiz do repositório)
   - WebSocket em /ws com contas, amigos, chat, grupos, salas, eventos, catálogo e ranking
   Uso: cd server && npm install && npm start     (PORT=8080 por padrão) */
const http = require("http"), fs = require("fs"), path = require("path"), crypto = require("crypto");
const { WebSocketServer } = require("ws");
const { Hub } = require("../shared/hub.js");
const R = require("../shared/rules.js");

const ROOT = path.resolve(__dirname, ".."), DATA = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(__dirname, "data"), DB = path.join(DATA, "db.json");
fs.mkdirSync(DATA, { recursive: true });
let store = {}; try { store = JSON.parse(fs.readFileSync(DB, "utf8")); } catch (e) { /* primeira execução */ }

let timer = null;
const persist = (s) => { clearTimeout(timer); timer = setTimeout(() => fs.writeFile(DB + ".tmp", JSON.stringify(s), (e) => { if (!e) fs.rename(DB + ".tmp", DB, () => {}); }), 300); };
const hash = (pw) => new Promise((res, rej) => { const salt = crypto.randomBytes(16); crypto.scrypt(pw, salt, 32, (e, k) => (e ? rej(e) : res(salt.toString("hex") + ":" + k.toString("hex")))); });
const verify = (pw, h) => new Promise((res) => { const [s, k] = String(h).split(":"); if (!s || !k) return res(false);
  crypto.scrypt(pw, Buffer.from(s, "hex"), 32, (e, d) => res(!e && crypto.timingSafeEqual(d, Buffer.from(k, "hex")))); });

const hub = new Hub({ store, persist, hash, verify });
store = hub.store;

// Contas administrativas: senhas vêm de ADM_PASSWORDS="ADMVinnil=...,ADMKezle=...,ADMLefaar=..."
// ou, se não informadas, são geradas uma única vez e gravadas em server/data/admin-credentials.txt (fora do git).
(async () => {
  const env = {}; String(process.env.ADM_PASSWORDS || "").split(",").forEach((p) => { const [n, v] = p.split("="); if (n && v) env[n.trim()] = v.trim(); });
  const creds = {}; R.ADMINS.forEach((n) => { creds[n] = env[n] || crypto.randomBytes(9).toString("base64url"); });
  const made = await hub.ensureAdmins(creds);
  if (made.length) {
    const txt = made.map((n) => `${n}: ${creds[n]}`).join("\n") + "\n";
    if (!R.ADMINS.every((n) => env[n])) { fs.writeFileSync(path.join(DATA, "admin-credentials.txt"), txt, { mode: 0o600 }); console.log("Contas admin criadas. Senhas em server/data/admin-credentials.txt"); }
    else console.log("Contas admin criadas a partir de ADM_PASSWORDS.");
  }
})();

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".png": "image/png", ".json": "application/json", ".md": "text/plain; charset=utf-8" };
const PUBLIC = ["index.html", "css", "js", "shared", "assets", "vendor"];
const server = http.createServer((req, res) => {
  let p = decodeURIComponent((req.url || "/").split("?")[0]); if (p === "/healthz") { res.writeHead(200, { "Content-Type": "text/plain" }); return res.end("ok"); } if (p === "/") p = "/index.html";
  const f = path.normalize(path.join(ROOT, p));
  const rel = path.relative(ROOT, f).split(path.sep);
  if (!f.startsWith(ROOT + path.sep) || !PUBLIC.includes(rel[0])) { res.writeHead(404); return res.end("404"); }
  fs.readFile(f, (e, d) => { if (e) { res.writeHead(404); return res.end("404"); } res.writeHead(200, { "Content-Type": MIME[path.extname(f)] || "application/octet-stream", "Cache-Control": "no-cache" }); res.end(d); });
});
const wss = new WebSocketServer({ server, path: "/ws", maxPayload: 64 * 1024 });
wss.on("connection", (ws) => {
  const c = hub.connect((m) => { if (ws.readyState === 1) ws.send(JSON.stringify(m)); });
  ws.on("message", (d) => { let m; try { m = JSON.parse(d); } catch (e) { return; } hub.handle(c, m); });
  ws.on("close", () => hub.disconnect(c)); ws.on("error", () => {});
});
const PORT = +process.env.PORT || 8080;
server.listen(PORT, "0.0.0.0", () => console.log(`Mars: The Last Colony em http://localhost:${PORT}`));
process.on("SIGTERM", () => { fs.writeFileSync(DB, JSON.stringify(hub.store)); process.exit(0); });
