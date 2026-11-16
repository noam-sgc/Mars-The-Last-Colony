# CONTEXT.md — Base do projeto *Mars: The Last Colony*

> Arquivo de contexto para quem (pessoa ou IA) for continuar o projeto. Resume **o que o jogo é, as regras
> decididas pelo dono do projeto, a arquitetura e o que ainda está em aberto**. Atualize-o a cada mudança de regra.

## 1. O jogo
Jogo web 3D (Three.js r128, sem build) sobre colônias em Marte. Três modos: **Solo/Campanha**, **Sandbox** e **Multiplayer**.
Idioma da interface: português (pt-BR). Funciona em desktop e celular (toque + joystick virtual).

## 2. Regras definidas pelo dono do projeto (fonte da verdade)

### 2.1 Eventos e moedas
- Há eventos **toda semana** (implementado: sexta a domingo, tema rotativo por semana ISO) e em **datas comemorativas**.
- Multiplicador de moedas: **x2** nos eventos comuns; **x5** nos dias **1º de fevereiro, 11 de abril e 12 de junho**.
- O multiplicador vale para toda moeda ganha (`earn()` em `js/state.js`): recompensas de fase, missões, renda passiva, multi.
- Cada evento libera um **traje especial exclusivo** (resgate gratuito durante o evento; fica para sempre no guarda-roupa).
- Admins podem criar eventos extras (nome, ícone, cor, multiplicador 1–10, início/fim).
- Lógica compartilhada em `shared/rules.js` (`activeEvents`, `multiplier`, `upcoming`). Os nomes dos três dias x5 e das
  datas comemorativas são sugestões e podem ser trocados lá.

### 2.2 Contas, papéis e verificação
- Autenticação com **usuário + senha + país**. Convidado pode jogar Solo/Sandbox/bots, mas sem chat/amigos/multi online.
- **Admins (3):** `ADMVinnil`, `ADMKezle`, `ADMLefaar` → acesso às *admin tools*: **mensagens globais** e **organização de eventos**.
- **Desenhistas (2):** apenas `ADMVinnil` e `ADMKezle` → *Estúdio*: criar e **publicar globalmente** cosméticos, **peças** e **upgrades**.
  (`ADMLefaar` é admin, mas **não** é desenhista.)
- Nomes reservados: ninguém mais pode registrar esses nomes nem qualquer nome iniciado em `ADM`.
- **Selo de verificação (✔)**: administradores (selo dourado) e **amigos de administradores** (selo azul).
- Trajes **para admins** (`adm_*`) só podem ser equipados por admins/desenhistas (validado no cliente **e** no servidor).

### 2.3 Social e multiplayer
- **Chat** dentro do Modo Multi (canais: Global, Sala, Grupo e mensagens diretas).
- **Amigos**: mostra **todos os usuários existentes no servidor** (com busca, online, país, selo); pedido → aceite.
- **Grupos** (até 8): líder convida, expulsa e chama o grupo para a sala; membros do grupo ficam na mesma equipe.
- Modo Multi dividido em: **Cooperativo**, **Equipes** (2 equipes) e **Todos contra todos**.
- **Sem limite de bots** (o número é livre; para manter a fluidez cada bot constrói no máximo `clamp(400/N, 1, 14)` peças).

### 2.4 Campanha
- **+15 fases** da saga **Invasão Alienígena (pacífica) · Ultimate** → fases 31–45 (total: 45).
  Peças novas (Antena de contato, Embaixada, Jardim xeno), emissários alienígenas e naves-mãe no céu.
- **Fases mais longas** (180 s + 10 s/fase; fases alienígenas +60 s) e **missões bônus** (2 por fase, 3 na saga alienígena):
  conversar com colonos, arrumar edifícios, entrar em edifícios, construir peças, manter moral, contato alienígena.

### 2.5 Jogabilidade 3D
- **WASD** move o astronauta; **arrastar a tela** gira a câmera (roda do mouse = zoom). Joystick virtual em telas de toque.
- **Interação com colonos** (NPCs): clicar ou `E` perto → conversar (+moral), pedir relatório, presentear.
- **Entrar em edifícios** (`E` perto, ou ferramenta 🖐 Interagir): **pausa o tempo** (Solo/Sandbox; no Multi o tempo segue),
  abre **outra simulação 3D** (interior) onde se **organiza** itens bagunçados nas prateleiras. A *ordem* do edifício (0–100%)
  altera a produção (x0,75 a x1,25) e decai devagar com o tempo.
- **Trilha sonora** procedural (Web Audio, `js/music.js`): 6 climas (menu, colônia, interior, pilotagem, tempestade, alienígena); botão 🔊, volume e tecla **M**. Sem arquivos de áudio.
- Visual melhorado: sombras, tonemapping, céu em degradê, crateras, peças com animações, astronauta com capacete/mochila/brilho.
- **Guarda-roupa** com pré-visualização 3D, abas (trajes, calças, relógios, capacetes, mochilas, eventos, admin).

## 3. Arquitetura

```
index.html            casca HTML (telas e modais)
css/style.css         estilos
js/                   cliente (scripts clássicos, ordem em index.html)
  data.js             peças, fases (45), missões, upgrades, cosméticos
  state.js            S (moedas), P (perfil), ACC (conta), EV (eventos), CAT (catálogo global), earn()
  net.js              conexão: WebSocket do servidor; se indisponível usa o servidor local
  localhub.js         servidor local de demonstração (mesmo Hub, dados em localStorage)
  world.js            renderer, terreno, peças (mk), astronauta (av), colonos
  input.js            WASD/setas, E, Esc, joystick
  game.js             modos, jogador, colonos, tanques, missões, fim de fase
  interior.js         simulação 3D do interior dos edifícios
  nav.js              fases de pilotagem (Terra→Marte, pouso)
  multi.js            salas, modos, bots ilimitados, lobby/sala de espera, resultados
  ui.js               conta, menu, catálogo, loja, guarda-roupa, social, chat
  studio.js           visualizador 3D, ferramentas ADM e Estúdio
  music.js            trilha sonora procedural
  main.js             laço principal, ponteiro, HUD, boot
shared/rules.js       papéis, países, eventos (cliente e servidor)
shared/hub.js         lógica do servidor (contas, amigos, chat, grupos, salas, eventos, catálogo, ranking)
server/server.js      HTTP estático + WebSocket (/ws) em volta do Hub, persistência em JSON
tests/hub.test.js     testes do Hub e das regras (node --test)
assets/img/           imagens extraídas do antigo index.html monolítico
vendor/three.min.js   Three.js r128 local (sem CDN)
```

- **Protocolo**: JSON por WebSocket; pedidos com `rid` recebem `{t:"res",rid,ok,...}`; o resto são *pushes*
  (`peers`, `chat`, `social`, `party`, `party.inv`, `party.go`, `gmsg`, `events`, `cat`).
- **Multiplayer** usa presença por sala (`g-CÓDIGO`): cada cliente publica suas peças; o anfitrião (entrada mais antiga)
  simula os bots. Cada cliente simula localmente os tanques dos outros times/jogadores a partir das peças publicadas.
- **Servidor local**: abrir `index.html` sem servidor (ou página estática publicada) usa o `Hub` no navegador.
  Contas ADM de teste nesse modo: senha `demo-admin` (somente demonstração — não é seguro).

## 3.1 Publicação
Veja `docs/DEPLOY.md` (Dockerfile e `render.yaml`; variáveis `PORT`, `DATA_DIR`, `ADM_PASSWORDS`). O cliente reconecta sozinho ao WebSocket.

## 4. Segurança (o que vale e o que não)
- Servidor: senhas com **scrypt**, papéis checados **no servidor** (`adm.*`, `cat.*`), sanitização de textos/cores/números,
  limite de taxa no chat, nomes ADM reservados. Senhas dos admins vêm de `ADM_PASSWORDS` ou são geradas em
  `server/data/admin-credentials.txt` (fora do git).
- **Limitação conhecida**: o progresso (moedas/créditos) é enviado pelo cliente; um cliente adulterado pode trapacear.
  Para torneios sérios, mover a economia para o servidor.

## 5. Em aberto / ideias
- Posições dos outros jogadores em tempo real no Multi (hoje ficam em círculo no centro).
- Economia autoritativa no servidor; ranking por modo; reconexão automática do WebSocket.
- Mais interiores únicos por edifício; mais eventos temáticos com mini-metas.
