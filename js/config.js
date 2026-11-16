/* Configuração do cliente. */
// Opcional: servidor de sinalização PeerJS próprio. Vazio = nuvem pública gratuita do PeerJS. (Todo o multiplayer, chat, amigos e grupos usa WebRTC.)
window.MARS_PEER = null; // ex.: { host: "peer.exemplo.com", port: 443, path: "/", secure: true }
// Hashes (PBKDF2) das senhas das contas ADM. Gerados por: node tools/set-admin-passwords.js
window.MARS_ADMIN_HASHES = {
  "ADMVinnil": "p1:150000:28e55fb6bc5150e536ab5b9307be7a39:f52077b3e69a470565ee2ef22d47c16844714113c6d2f2fbc5e0e2f588b9b1d8",
  "ADMKezle": "p1:150000:efa275195439b740538b75638f64cbda:43ab476fd343643ff0c63c7b7930d4e10b1121eedb327784510e4312c4f23110",
  "ADMLefaar": "p1:150000:fc643ec69ad81a60fdfc2c291e3bf170:e9cb189e26b35b459fe9833c2aa0c77394c458d35e40b999c98fa7714e6d3b4c"
};
