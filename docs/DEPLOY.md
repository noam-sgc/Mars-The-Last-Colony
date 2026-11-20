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

## Contas e progresso na nuvem (para o jogo ficar "online de verdade")
Sem um cofre persistente, contas e progresso só existem enquanto algum navegador estiver aberto. O repositório inclui `api/bul.js`
(função da Vercel) que guarda o **mural global** (contas, progresso, eventos, itens do Estúdio, avisos) num Redis REST.
O chat, os amigos online e as partidas continuam 100% WebRTC; a nuvem é só o "cofre".

1. No projeto da Vercel: **Storage → Create → Upstash for Redis** (plano grátis) e conecte ao projeto. Ele cria as variáveis
   `KV_REST_API_URL` e `KV_REST_API_TOKEN` (ou `UPSTASH_REDIS_REST_URL/TOKEN`).
2. Faça um novo deploy (Redeploy). Pronto: `GET /api/bul` passa a responder `{"cloud":true}` e a tela de login mostra
   "☁ Online: contas e progresso na nuvem".
3. Sem Redis o jogo continua funcionando (mural entre navegadores), apenas sem persistência entre aparelhos.
Localmente, `npm start` usa um cofre em memória para testes.
Segurança: as validações são as mesmas do cliente (`shared/bulletin.js`); o cofre guarda o hash PBKDF2 da senha (nunca a senha).
