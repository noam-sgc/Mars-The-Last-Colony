/* Cofre compartilhado pelas funções da API: Redis REST (Upstash/Vercel KV), Vercel Blob ou memória (desenvolvimento).
   Arquivos com "_" não viram rotas na Vercel. */
const HASH = "mars:bul:v1";
const parse = (x) => { try { return typeof x === "string" ? JSON.parse(x) : x; } catch (e) { return null; } };
/** Redis REST (Upstash / Vercel KV). */
function redis() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL, token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  const run = async (cmds) => { const r = await fetch(url.replace(/\/$/, "") + "/pipeline", { method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }, body: JSON.stringify(cmds) }); if (!r.ok) throw new Error("redis " + r.status); return (await r.json()).map((x) => { if (x.error) throw new Error(x.error); return x.result; }); };
  return {
    async all(since) { const [a] = await run([["HGETALL", HASH]]); const o = []; for (let i = 0; i < (a || []).length; i += 2) { const r = parse(a[i + 1]); if (r && r.at > since) o.push(r); } return o; },
    async get(fields) { if (!fields.length) return []; const [a] = await run([["HMGET", HASH].concat(fields)]); return a.map(parse); },
    async set(rows) { if (rows.length) await run([["HSET", HASH].concat(rows.map((r) => [r.f, JSON.stringify({ at: r.at, it: r.it })]).flat())]); },
  };
}
/** Vercel Blob: um arquivo JSON por item (bul/<tipo>/<id>.json). Sem Redis, é o cofre usado. */
function blobStore() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  const B = () => require("@vercel/blob"), path = (f) => (f.startsWith("rst:") ? "rst/" + f.slice(4).replace(/:/g, "/") : "bul/" + f.replace(":", "/")) + ".json";   // "rst/" = segredos da redefinição de senha (fora do mural público)
  const rd = async (b) => { const r = await fetch(b.url + "?v=" + new Date(b.uploadedAt).getTime(), { cache: "no-store" }); if (!r.ok) return null; const it = await r.json(); return { at: new Date(b.uploadedAt).getTime(), it }; };
  const lst = async (prefix) => { const { list } = B(); let cursor, out = []; do { const r = await list({ prefix, limit: 1000, cursor }); out = out.concat(r.blobs); cursor = r.hasMore ? r.cursor : null; } while (cursor); return out; };
  const pool = async (arr, fn, n) => { const out = new Array(arr.length); let i = 0; await Promise.all(Array.from({ length: Math.min(n, arr.length) }, async () => { while (i < arr.length) { const k = i++; try { out[k] = await fn(arr[k]); } catch (e) { out[k] = null; } } })); return out; };
  return {
    async all(since) { const bl = (await lst("bul/")).filter((b) => new Date(b.uploadedAt).getTime() > since); return (await pool(bl, rd, 12)).filter(Boolean); },
    async get(fields) { return pool(fields, async (f) => { const bl = (await lst(path(f))).find((b) => b.pathname === path(f)); return bl ? rd(bl) : null; }, 8); },
    async set(rows) { const { put } = B(); await pool(rows, (r) => put(path(r.f), JSON.stringify(r.it), { access: "public", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json", cacheControlMaxAge: 60 }), 6); },
  };
}
const MEM = new Map();
const mem = { async all(since) { return [...MEM.values()].filter((r) => r.at > since); }, async get(f) { return f.map((x) => MEM.get(x) || null); }, async set(rows) { rows.forEach((r) => MEM.set(r.f, { at: r.at, it: r.it })); } };
let db; const store = () => db || (db = redis() || blobStore() || (process.env.VERCEL ? null : mem));

module.exports = { store, parse };
