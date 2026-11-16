# Publicar

O jogo é 100% estático: não há servidor de jogo. Qualquer hospedagem de arquivos serve (Vercel, GitHub Pages, Netlify…). Use **HTTPS** (WebRTC e Web Crypto exigem).

## Vercel
1. Em vercel.com/new, importe o repositório. *Framework Preset: Other*, sem build command.
2. Deploy. O `vercel.json` e o `.vercelignore` já estão no repositório.

## Como o multiplayer funciona
- Topologia em estrela: o anfitrião (dono do mundo) roda o Hub no navegador; cada convidado abre um canal de dados WebRTC com ele.
  Chat, amigos, grupos, salas, eventos e catálogo usam esse mesmo canal e o mesmo protocolo (`shared/hub.js`).
- Sinalização: nuvem gratuita do PeerJS. Para usar a sua: `npx peerjs --port 9000` e preencha `window.MARS_PEER` em `js/config.js`.
- Sem TURN, algumas redes (CGNAT/corporativas) não fecham a conexão direta.

## Contas ADM
Crie ADMVinnil, ADMKezle e ADMLefaar pelo fluxo normal de *Criar conta* (o primeiro a registrar cada nome o possui).
Admins: ADMVinnil, ADMKezle, ADMLefaar. Desenhistas: apenas ADMKezle e ADMLefaar.
