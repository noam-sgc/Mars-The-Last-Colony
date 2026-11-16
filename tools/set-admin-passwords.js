/* Gera (ou troca) as senhas das contas ADM do modo sem servidor e grava SÓ os hashes em js/config.js.
   Uso:  node tools/set-admin-passwords.js              -> gera senhas aleatórias e as mostra uma única vez
         node tools/set-admin-passwords.js ADMKezle=nova -> define a senha de uma conta específica (as demais são mantidas) */
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const file = path.join(__dirname, "..", "js", "config.js"), ADMINS = ["ADMVinnil", "ADMKezle", "ADMLefaar"], ITER = 150000;
const src = fs.readFileSync(file, "utf8");
const cur = (() => { const m = src.match(/window\.MARS_ADMIN_HASHES = (\{[\s\S]*?\});/); try { return m ? JSON.parse(m[1]) : {}; } catch (e) { return {}; } })();
const given = {}; process.argv.slice(2).forEach((a) => { const [n, v] = a.split("="); if (ADMINS.includes(n) && v) given[n] = v; });
const out = {}, shown = [];
ADMINS.forEach((n) => {
  if (!given[n] && cur[n] && Object.keys(given).length) { out[n] = cur[n]; return; }
  const pw = given[n] || crypto.randomBytes(12).toString("base64url"), salt = crypto.randomBytes(16).toString("hex");
  out[n] = `p1:${ITER}:${salt}:` + crypto.pbkdf2Sync(pw, Buffer.from(salt, "hex"), ITER, 32, "sha256").toString("hex"); shown.push(`${n}: ${pw}`);
});
const block = "window.MARS_ADMIN_HASHES = " + JSON.stringify(out, null, 2) + ";";
fs.writeFileSync(file, /window\.MARS_ADMIN_HASHES = \{[\s\S]*?\};/.test(src) ? src.replace(/window\.MARS_ADMIN_HASHES = \{[\s\S]*?\};/, block) : src + "\n" + block + "\n");
console.log("Hashes gravados em js/config.js. Senhas (guarde agora, não ficam salvas em lugar nenhum):\n" + shown.join("\n"));
