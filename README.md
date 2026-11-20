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
PeerJS só ajuda a se achar; os dados do jogo não passam por ele. As contas, salas e o chat do mundo vivem no mundo do anfitrião, que precisa estar com o jogo aberto.
**Contas, eventos e avisos são globais** (mural replicado entre os jogadores por WebRTC): uma conta criada num aparelho vale nos outros e eventos/avisos dos admins chegam a todos. **Dá para pedir amizade pelo nome mesmo com a pessoa offline**: ela responde quando ligar o jogo.
**Amigos não precisam do código do mundo:** todo jogador logado aparece no diretório global (WebRTC), dá para adicionar, conversar por mensagem direta e ver quando estão online.

**Contas ADM (2):** os nomes `ADMKezle` e `ADMLefaar` são reservados: **quem os criar primeiro** (em *Criar conta*, com a própria senha) fica com o nome e com os poderes de admin/desenhista. `ADMVinnil` é um usuário comum.

**Ultra Learn Voyage:** jornada educativa à parte (menu → 🚀) com 10 capítulos de uma missão real a Marte: gestão de recursos com números + quizzes temáticos.

## Controles
| Ação | Como |
|---|---|
| Mover o astronauta | **W A S D** (ou setas) · joystick no celular |
| Girar a câmera | **arrastar** a tela · roda do mouse = zoom |
| Construir | escolha a peça na barra inferior e toque no terreno |
| Conversar / entrar em edifício | **E** perto, ou toque no colono / use 🖐 Interagir no edifício |
| Sair do edifício / fechar diálogo | **Esc** |
| Naves (fases 1–2) | WASD ou arrastar; **Espaço** = impulso |
| Música e sons | botão **⚙ Configurações** (canto superior direito) ou tecla **M** para silenciar |

## Testes
```bash
npm test
```
