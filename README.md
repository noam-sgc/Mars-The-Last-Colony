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

**Sem servidor (demonstração):** abra `index.html` por qualquer servidor estático (ex.: `python3 -m http.server`) — o jogo usa um
servidor local no navegador (contas ADM de teste com senha `demo-admin`). Use `?local` na URL para forçar esse modo.

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
