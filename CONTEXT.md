# CONTEXT.md — Base do projeto *Mars: The Last Colony*

> Arquivo de contexto para quem (pessoa ou IA) for continuar o projeto. Resume **o que o jogo é, as regras
> decididas pelo dono do projeto, a arquitetura e o que ainda está em aberto**. Atualize-o a cada mudança de regra.

## 0. Decisão de arquitetura
**Multiplayer peer-to-peer: todo canal de comunicação usa WebRTC** (jogo, chat, amigos, grupos, presença). Não há servidor de jogo nem WebSocket.

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
- **Desenhistas (2):** apenas `ADMKezle` e `ADMLefaar` → *Estúdio*: criar e **publicar** cosméticos, **peças** e **upgrades** (valem para todos no mundo).
  (`ADMVinnil` é admin, mas **não** é desenhista.)
- Nomes reservados: os três nomes acima valem para **quem os criar primeiro** (a conta é criada pelo fluxo normal, com a senha escolhida pela pessoa); depois de registrados, ninguém mais os usa. Outros nomes iniciados em `ADM` ficam proibidos.
- **Selo de verificação (✔)**: administradores (selo dourado) e **amigos de administradores** (selo azul).
- Trajes **para admins** (`adm_*`) só podem ser equipados por admins/desenhistas (validado no cliente **e** no servidor).

### 2.3 Social e multiplayer
- **Chat** dentro do Modo Multi (canais: Global, Sala, Grupo e mensagens diretas).
- **Amigos** (globais, **sem precisar do código do mundo**): lista todos os usuários online (diretório global por WebRTC, `js/global.js`) e os do mundo atual, com busca, país e selo; pedido → aceite; mensagens diretas. Amigos ficam salvos no perfil (`P.fr`) e os pedidos pendentes são reenviados quando o alvo fica online.
- **Grupos** (até 8): líder convida, expulsa e chama o grupo para a sala; membros do grupo ficam na mesma equipe.
- Modo Multi dividido em: **Cooperativo**, **Equipes** (2 equipes) e **Todos contra todos**.
- **Sem limite de bots** (o número é livre; para manter a fluidez cada bot constrói no máximo `clamp(400/N, 1, 14)` peças).

### 2.4 Campanha
- **+15 fases** da saga **Invasão Alienígena (pacífica) · Ultimate** → fases 31–45 (total: 45).
  Peças novas (Antena de contato, Embaixada, Jardim xeno), emissários alienígenas e naves-mãe no céu.
- **Fases mais longas** (180 s + 10 s/fase; fases alienígenas +60 s) e **missões bônus** (2 por fase, 3 na saga alienígena):
  conversar com colonos, arrumar edifícios, entrar em edifícios, construir peças, manter moral, contato alienígena.

### 2.4b Conteúdo educativo (fatos espaciais)
- **Quiz Espacial** (`js/espaco.js` + `js/learn.js`): 58 perguntas com explicação. Acerto inédito = **40 🪙** (+1 PP); repetido = 4 🪙; bônus de rodada (80%+ → 300 🪙 + 10 PP; 100% → +600 🪙 + 20 PP) **1 vez por dia**. Moedas passam por `earn()` (evento x2/x5).
- **Fatos Espaciais**: 43 cartões. **Só ganha (25 🪙 + 2 PP) quem lê até o fim** (botão libera após o tempo de leitura); **pular não dá nada** e o fato volta depois. Um fato inédito é oferecido antes de abrir uma fase (no máx. 1 a cada 3 min).
- **Regra:** o nome da agência espacial não aparece em títulos, botões nem no texto das perguntas/fatos; só na linha de **Fonte** (constante `FONTE` em `js/espaco.js`) e nestas referências. Conteúdo baseado em fatos publicados em nasa.gov, science.nasa.gov e jpl.nasa.gov; ao editar, confira nas fontes.
- **Campanha alienígena (fases 31–45) é uma campanha à parte**: a fase 31 já começa liberada e vencer a fase 30 não leva automaticamente a ela.

### 2.4c Textos que somem e acessibilidade (smartphone)
- **Tocar/clicar num texto faz ele desaparecer** (`js/a11y.js`): avisos (toasts) e dicas ("E · conversar…") somem (a dica só volta se o texto mudar); painéis grandes (Tanques, Objetivos, Sala, Edifício) viram um chip pequeno que reabre ao tocar. Configurações → "Mostrar todos" restaura tudo.
- Celular: alvos de toque ≥ 44 px, campos com 16 px (sem zoom do iOS), barra de peças em linha única rolável, joystick maior, **pinça com dois dedos = zoom da câmera**, vibração curta ao tocar (opcional), `touch-action: manipulation`, ARIA (`role=dialog`, `aria-live`, rótulos), foco visível.
- Configurações → "Acessibilidade e celular": tamanho do texto (Normal/Grande/Muito grande), alto contraste, reduzir animações (também respeita `prefers-reduced-motion`), vibração.

### 2.5 Jogabilidade 3D
- **Colisão:** o astronauta e os colonos **não atravessam** edifícios (próprios e de outros jogadores/bots), rochas nem os móveis dos interiores (beliches, mesas, bancadas, canteiros); círculos por tipo de peça em `COLR`/`solids()` (`js/game.js`) e caixas `solidBoxes` (`js/interior.js`).
- **WASD** move o astronauta; **arrastar a tela** gira a câmera (roda do mouse = zoom). Joystick virtual em telas de toque.
- **Interação com colonos** (NPCs): clicar ou `E` perto → conversar (+moral), pedir relatório, presentear.
- **Entrar em edifícios** (`E` perto, ou ferramenta 🖐 Interagir): **pausa o tempo** (Solo/Sandbox; no Multi o tempo segue),
  abre **outra simulação 3D** (interior) onde se **organiza** itens bagunçados nas prateleiras. A *ordem* do edifício (0–100%)
  altera a produção (x0,75 a x1,25) e decai devagar com o tempo.
- **Trilha sonora** (`js/music.js`): 2 músicas gravadas (`assets/audio/`: *Marte Tranquila* e *Marte Animada*) + 8 faixas geradas em tempo real com nomes inventados (Poeira de Jezero, Colônia ao Amanhecer, Sob a Cúpula, Travessia Vermelha, Tempestade de Ferro, Canção dos Visitantes, Noites de Valles, Aurora Polar). Modo **Automática** troca a faixa conforme o momento do jogo.
- **Configurações** (`js/settings.js`): botão grande e fixo no canto superior direito, presente em todas as telas (a barra do HUD reserva espaço para ele). Permite ligar/desligar e mudar o volume (intensidade) da música, escolher a faixa, e configurar o **som de clique** (liga/desliga, volume, 4 estilos). Preferências em `localStorage`.
- Visual melhorado: sombras, tonemapping, céu em degradê, crateras, peças com animações, astronauta com capacete/mochila/brilho.
- **Guarda-roupa** com pré-visualização 3D, abas (trajes, calças, relógios, capacetes, mochilas, eventos, admin).

## 3. Arquitetura

```
index.html            casca HTML (telas e modais)
css/style.css         estilos
js/                   cliente (scripts clássicos, ordem em index.html)
  data.js             peças, fases (45), missões, upgrades, cosméticos
  state.js            S (moedas), P (perfil), ACC (conta), EV (eventos), CAT (catálogo global), earn()
  net.js              rede: modo local (anfitrião) ou p2p (convidado), mesmo protocolo
  localhub.js         "mundo" local: o mesmo Hub dentro do navegador (dados em localStorage)
  global.js           diretório global + amigos + DM (registro eleito entre os jogadores, via PeerJS)
  p2p.js              WebRTC (PeerJS): anfitrião aceita convidados por código; convidado conecta ao anfitrião
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
shared/hub.js         lógica do "mundo" (contas, amigos, chat, grupos, salas, eventos, catálogo, ranking)
tools/                serve.js (estático p/ dev), build-preview.js
tests/hub.test.js     testes do Hub e das regras (node --test)
assets/img/           imagens extraídas do antigo index.html monolítico
vendor/three.min.js   Three.js r128 local (sem CDN)
```

- **Protocolo**: JSON por canal de dados WebRTC (PeerJS); pedidos com `rid` recebem `{t:"res",rid,ok,...}`; o resto são *pushes*
  (`peers`, `chat`, `social`, `party`, `party.inv`, `party.go`, `gmsg`, `events`, `cat`).
- **Multiplayer** usa presença por sala (`g-CÓDIGO`): cada cliente publica suas peças; o anfitrião (entrada mais antiga)
  simula os bots. Cada cliente simula localmente os tanques dos outros times/jogadores a partir das peças publicadas.
- **Sem servidor (padrão na Vercel)**: o navegador de quem cria o mundo roda o `Hub` e aceita convidados por **WebRTC**
  (código de 6 caracteres, copiável). O mesmo protocolo (`shared/hub.js`) corre pelo canal de dados WebRTC (`js/p2p.js`, `js/net.js`).
  Contas, amigos, grupos, chat, eventos e catálogo vivem no mundo do anfitrião (não há servidor global).
  Contas ADM: criadas pelo fluxo normal; o primeiro a registrar o nome o possui (em cada mundo).

- **Diretório global**: id fixo no sinalizador PeerJS; o primeiro jogador logado vira o *registro* (lista online, repassa mensagens); se sair, outro assume sozinho. Identidade no diretório é declarada pelo cliente (não há autoridade central).

## 3.1 Publicação
Veja `docs/DEPLOY.md` (site estático na Vercel; sem servidor de jogo).

## 4. Segurança
- Senhas com PBKDF2 (150 mil iterações); papéis checados no Hub do mundo (`adm.*`, `cat.*`); textos/cores/números sanitizados; limite de taxa no chat; nomes ADM reservados.
- Um anfitrião com cliente modificado controla o próprio mundo (não afeta outros mundos). Em mundo alheio, quem registrar um nome ADM antes do dono o ocupa: crie suas contas ADM no seu mundo. O progresso (moedas/créditos) é do cliente.

## 5. Em aberto / ideias
- Posições dos outros jogadores em tempo real no Multi (hoje ficam em círculo no centro).
- Malha completa entre convidados (hoje estrela via anfitrião); TURN próprio; ranking por modo; migração de anfitrião.
- Mais interiores únicos por edifício; mais eventos temáticos com mini-metas.
