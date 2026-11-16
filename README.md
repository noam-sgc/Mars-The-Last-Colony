# Mars: The Last Colony

Jogo 3D de colônias em Marte — **campanha solo (45 fases)**, **sandbox** e **multiplayer** (cooperativo, equipes e todos contra todos) com
contas, amigos, grupos, chat, eventos com moedas em dobro e ferramentas de administração.

> Contexto completo e regras do projeto: **[CONTEXT.md](CONTEXT.md)**

## Jogar

**Com servidor (multiplayer real, contas e chat entre pessoas):**
```bash
npm run setup      # instala a dependência do servidor (ws)
npm start          # http://localhost:8080
```
Na primeira execução o servidor cria as contas `ADMVinnil`, `ADMKezle` e `ADMLefaar` e grava as senhas geradas em
`server/data/admin-credentials.txt`. Para definir as suas: `ADM_PASSWORDS="ADMVinnil=...,ADMKezle=...,ADMLefaar=..." npm start`.

**Sem servidor (WebRTC, ideal para a Vercel):** sirva a pasta como site estático (ex.: `python3 -m http.server`, Vercel, GitHub Pages).
Cada jogador tem o **próprio mundo**: o navegador dele roda o servidor do jogo e mostra um **código** (ex.: `K7M2QX`) com botão de copiar.
Amigos clicam em *Entrar no mundo de um amigo*, digitam o código e jogam juntos por **WebRTC** (conexão direta entre navegadores; o
sinalizador gratuito do PeerJS só ajuda a se achar). As contas, o chat, os amigos e os grupos vivem no mundo do anfitrião, que precisa
estar com o jogo aberto.

**Contas ADM (3):** as senhas ficam só como hash em `js/config.js`. Para gerar/trocar: `node tools/set-admin-passwords.js`
(ou `node tools/set-admin-passwords.js ADMKezle=nova-senha`).

## Controles
| Ação | Como |
|---|---|
| Mover o astronauta | **W A S D** (ou setas) · joystick no celular |
| Girar a câmera | **arrastar** a tela · roda do mouse = zoom |
| Construir | escolha a peça na barra inferior e toque no terreno |
| Conversar / entrar em edifício | **E** perto, ou toque no colono / use 🖐 Interagir no edifício |
| Sair do edifício / fechar diálogo | **Esc** |
| Naves (fases 1–2) | WASD ou arrastar; **Espaço** = impulso |

Publicação em servidor de verdade (Docker/Render): **[docs/DEPLOY.md](docs/DEPLOY.md)**. A trilha sonora é gerada no navegador; use o botão 🔊 ou a tecla **M**.

## Testes
```bash
npm test
```

## Estrutura
Veja a seção *Arquitetura* em [CONTEXT.md](CONTEXT.md). Em resumo: `index.html` + `css/` + `js/` (cliente), `shared/` (regras e lógica do
servidor, usadas no cliente e no Node), `server/` (HTTP + WebSocket), `tests/`, `assets/`, `vendor/`.
