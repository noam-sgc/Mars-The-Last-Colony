# Mars: The Last Colony

Jogo 3D de colônias em Marte — **campanha solo (45 fases)**, **sandbox** e **multiplayer peer-to-peer por WebRTC** (cooperativo, equipes e
todos contra todos) com contas, amigos, grupos, chat, eventos com moedas em dobro, trilha sonora e ferramentas de administração.

> Contexto completo e regras do projeto: **[CONTEXT.md](CONTEXT.md)** · Publicação: **[docs/DEPLOY.md](docs/DEPLOY.md)**

## Jogar
```bash
npm start      # servidor estático em http://localhost:8080 (ou publique a pasta na Vercel/GitHub Pages)
```
Não há servidor de jogo: **toda a comunicação (multiplayer, chat, amigos, grupos, presença) usa WebRTC**.
Cada jogador tem o **próprio mundo**: o navegador dele roda a lógica do servidor e mostra um **código** (ex.: `K7M2QX`) com botão de copiar.
Amigos escolhem *Entrar no mundo de um amigo*, digitam o código e jogam juntos por conexão direta entre navegadores. O sinalizador gratuito do
PeerJS só ajuda a se achar; os dados do jogo não passam por ele. As contas e o chat vivem no mundo do anfitrião, que precisa estar com o jogo aberto.

**Contas ADM (3):** só existem como hash em `js/config.js`. Gere/troque as senhas com `node tools/set-admin-passwords.js`
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
| Música | botão 🔊 ou tecla **M** |

## Testes
```bash
npm test
```
