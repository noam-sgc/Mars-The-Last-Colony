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
- **Fases mais longas** (270 s + 15 s/fase; fases alienígenas +90 s) e **missões bônus** (2 por fase, 3 na saga alienígena):
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
- **Dirigir o rover:** perto de um rover, **E** (ou botão de ação no celular, ou 🖐 Interagir tocando nele) entra nele; **W/S** acelera/ré (até 72 km/h), **A/D** vira, a câmera acompanha a direção; colide com edifícios e rochas; **E/Esc** sai e o rover fica estacionado.
- **Fome e cansaço** (campanha/Solo): barras de **Alimentação** e **Descanso** (100% no começo de cada fase; caem ~0,3%/s e ~0,22%/s, pausam dentro de edifícios). **Comer** em **Hidroponia** (entre nela, vá à mesa, E: 4 s, +55%, −3% da comida da colônia, −10 s de fase) e **dormir** em **Habitat** (nas camas, E: 8 s, +70%, −25 s de fase). **Abaixo de 20%** você **perde moedas** proporcionalmente (até 3 🪙/s por necessidade) e anda mais devagar; em **0% por 6 s** é **derrota** ("desmaiou de fome/cansaço"). Avisos aos 40% e 20%; o HUD mostra a distância da Hidroponia/Habitat mais próximo. Constantes em `NEED` (`js/game.js`).
- **Minimissões de achados** (`lootGrant`, `mkLoot`): ao **entrar num edifício**, há 4–5 achados escondidos na sala (3 bolsas de moedas, 1 reserva de tanque +12% e o ⭐ **bônus da fase**: moedas ≈ 3% da recompensa da fase e +15 s, uma vez por edifício por fase); pegá-los todos dá bônus extra. Ao **dirigir o rover**, 8 achados com colunas de luz aparecem espalhados por Marte e **só ficam visíveis enquanto você está no rover** (somem ao sair); o HUD mostra a contagem e a distância do mais próximo. Renovam com o tempo; contam para a missão bônus "Colete achados" de toda fase.
- **Ultra Learn Voyage** (`js/ulv-data.js`, `js/ulv.js`; botão no menu): jornada à parte da campanha original (que segue intacta). Você comanda uma missão tripulada a Marte dentro da **nave** ou no **departamento de ciências**, com **ciência + gestão de recursos**. 10 capítulos: arquitetura e cadeia de comando, janela/Hohmann/Δv (Tsiolkovsky), suporte à vida, energia e térmico, comunicação com atraso, radiação e saúde, risco/redundância/Go-NoGo, entrada-descida-pouso, ISRU e superfície, retorno. Cada capítulo: **briefing técnico → quiz temático (4) → painel de gestão com números (prévia ao vivo) → evento de decisão**; acertar o quiz dá até +% de eficácia na gestão. Recursos (suprimentos, Δv, energia, saúde, moral, radiação, risco, dados) **carregam entre capítulos**; falhas críticas exigem ajustar o painel. Pontuação 0–100 por capítulo, recompensas (moedas/PP), título final (Tripulante / Engenheiro / Diretor de Voo / Comandante de Missão). Progresso em `P.ulv`.
- **Computador de bordo** (`js/cpu.js`, tecla **H** ou botão 🖥): diz o **próximo passo** conforme o momento (menu, campanha, sandbox, multiplayer, dentro de edifícios, rover, naves), com os próximos 3 passos, direção/distância do alvo (e um feixe de luz azul no mapa) e leitura em voz alta (🔈). Em **Configurações → Computador de bordo** dá para **escrever o próximo passo fixo na tela** (linha discreta acima da barra de peças; tocar nela abre o painel) e **falar o próximo passo automaticamente** (opt-in). Prioriza perigos (oxigênio/água), fome/cansaço, tempo curto, objetivos da fase e missões bônus.
- **Tempo das fases:** (180 s + 10 s/fase, +60 s na saga alienígena) × **1,5** (`js/data.js`).
- **Controle por giro do celular** (`js/tilt.js`): inclinar à direita/esquerda vira e inclinar o topo da tela para a frente acelera/sobe, no **rover** e na **nave** (retrato e paisagem; calibra a posição neutra ao ligar e ao girar a tela). Liga em Configurações → "Controle por giro" ou no botão 📱 que aparece ao dirigir/pilotar no celular; sensibilidade, eixo invertido e calibragem ajustáveis. No iOS pede permissão. Em iframes/páginas sem permissão de sensor (ex.: pré-visualizações embutidas) o navegador pode bloquear o sensor.
- **WASD** move o astronauta; **arrastar a tela** gira a câmera (roda do mouse = zoom). Joystick virtual em telas de toque.
- **Interação com colonos** (NPCs): clicar ou `E` perto → conversar (+moral), pedir relatório, presentear.
- **Entrar em edifícios** (`E` perto, ou ferramenta 🖐 Interagir): **pausa o tempo** (Solo/Sandbox; no Multi o tempo segue),
  abre **outra simulação 3D** (interior) onde se **organiza** itens bagunçados nas prateleiras. A *ordem* do edifício (0–100%)
  altera a produção (x0,75 a x1,25) e decai devagar com o tempo.
- **Trilha sonora** (`js/music.js`): 2 músicas gravadas (`assets/audio/`: *Marte Tranquila* e *Marte Animada*) + 8 faixas geradas em tempo real com nomes inventados (Poeira de Jezero, Colônia ao Amanhecer, Sob a Cúpula, Travessia Vermelha, Tempestade de Ferro, Canção dos Visitantes, Noites de Valles, Aurora Polar). Modo **Automática** troca a faixa conforme o momento do jogo.
- **Configurações** (`js/settings.js`): botão grande e fixo no canto superior direito, presente em todas as telas (a barra do HUD reserva espaço para ele). Permite ligar/desligar e mudar o volume (intensidade) da música, escolher a faixa, e configurar o **som de clique** (liga/desliga, volume, 4 estilos). Preferências em `localStorage`.
- Visual melhorado: sombras, tonemapping, céu em degradê, crateras, peças com animações, astronauta com capacete/mochila/brilho.
- **Espécie do jogador: humano ou alienígena** (primeiro acesso pergunta; muda no Guarda-roupa). O alienígena tem cabeça oval, olhos grandes, antenas e **5 cores de pele**; trajes, calças, relógios, capacetes (viram bolha de vidro) e mochilas continuam valendo. Aparece para os outros no multiplayer (`e.sp`, `e.sk`); colonos e emissários reagem à espécie. Salvo no perfil (`P.sp`, `P.skin`).
- **Manutenção dos upgrades (baixa):** cada upgrade instalado custa ~1/5000 do preço por segundo (400 🪙 → ~5 🪙/min), cobrada só **nas fases da campanha**; sem moedas os upgrades ficam **suspensos** até haver saldo para ~6 s (`MAINT`, `maintain()`, `upM()`). A loja e o HUD mostram o custo; o bônus da espécie é grátis e sem manutenção.
- **Bônus por espécie (grátis; troca a qualquer momento):** Humano = −10% no custo das peças e +10% de moedas por fase; Alienígena = +15% Eficiência, +10% Moral e −15% de consumo de O₂ (`SPB` em `js/data.js`). A **loja** tem 4 upgrades exclusivos por espécie (hs1–hs4 / as1–as4) e o **Guarda-roupa** tem 2 cosméticos exclusivos por espécie; itens de outra espécie ficam ocultos e, se você já os tem, só voltam a valer quando trocar de volta (itens equipados incompatíveis voltam ao padrão ao trocar).
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

- **Mural global replicado** (`shared/bulletin.js`, `js/bulletin.js`, `js/global.js`): **contas**, **eventos**, **itens do Estúdio** e **avisos** dos admins viram itens de um mural que cada navegador guarda (localStorage) e todos sincronizam pelo canal WebRTC global (até visitantes sem login). Assim **eventos e avisos chegam para todo mundo**, e **uma conta criada num aparelho existe nos outros** (login em qualquer lugar; o nome só pode ser criado uma vez — vence a conta mais antiga). Dados só existem enquanto algum navegador os guarda; não há banco central.
- **Amigos offline**: dá para pedir amizade **pelo nome**, mesmo com a pessoa offline; o pedido fica pendente (⏳) e é entregue quando ela ligar o jogo (o registro guarda a correspondência e também reentrega se a conexão cair antes da confirmação). A resposta volta do mesmo jeito.
- **Reset de contas (v5)**: na primeira abertura desta versão, cada navegador apaga contas locais, sessões e progresso por conta (eventos/catálogo do mundo permanecem).
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


## Atualização: aparência, Estúdio, nuvem e ULV jogável
- **Aparência 3D** (`js/look.js`, aba "Aparência" do Guarda-roupa): 8 tons de pele, 10 cabelos (crespo, cacheado volumoso, tranças, dreads, coque, moicano…), cor do cabelo, rosto, olhos, óculos, barba, corpo, altura, bolha de vidro. `P.look` → `myEq().lk`. Colonos usam `lookRandom`.
- **Cosméticos com layout** (Estúdio): camadas novas `r` (cabelo) e `a` (acessório); campos `sh` (forma), `pt` (padrão), `c2` (cor 2), `sz` (tamanho) além de cor/brilho. Validação em `Hub.publish`.
- **Nuvem** (`api/bul.js` + `js/cloud.js`): cofre persistente do mural (novo tipo `sav` = progresso da conta). Requer Upstash Redis na Vercel (docs/DEPLOY.md); sem ele, volta ao gossip. WebRTC segue para comunicação em tempo real.
- **Ultra Learn Voyage jogável** (`js/ulvgame.js`): cada capítulo é uma fase da colônia com ☢ radiação, 🔧 peças, 🔬 dados, falhas, tempestades solares/poeira, terminais de conhecimento (E) e emergência de missão. O quiz solto continua na aba principal; o modo estudo (painéis) permanece.

## Atualização: fichas de equipe e seções do Guarda-roupa
- Guarda-roupa em seções com miniaturas 3D (como a ficha de referência): **Equipe** (8 personagens prontos + os publicados no Estúdio), **Aparência** (Tipos de cabelo ×13, Tons de pele, Nacionalidades com bandeira no braço, rosto/corpo, capacete na mão/cabeça/sem), Trajes, Calças, Capacetes, Mochilas, **Acessórios** (óculos de proteção, headset…), **Equipamentos** (dispositivo de pulso, tablet, garrafa, cinto, kit médico, chave inglesa, lanterna), Cabelos, Relógios, Eventos.
- Itens básicos grátis: 8 trajes, 5 calças, 6 capacetes e 8 mochilas coloridos (`BASE_FREE` em `js/data.js`).
- Estúdio: nova camada Equipamento (`t`) e novo tipo de publicação **chr** (Personagens/Equipe: aparência + itens). Mural/Hub/API aceitam `chr`.

## Atualização: avatar cartoon, 99 bandeiras e desenho livre no Estúdio
- `js/avatar.js`: avatar novo no estilo das fichas (cel-shading `MeshToonMaterial` + contorno; traje branco com painéis de acento `ac`, arnês, joelheiras/botas coloridas, luvas, mochila com tela, capacete com viseira). `lq:1` = sem contorno (colonos).
- `js/flags.js`: bandeiras desenhadas para todos os 99 países de `MarsRules.COUNTRIES` (lista ampliada).
- `js/paint.js`: PaintPad (textura pintada à mão, atlas 256×256: tronco, mangas, pernas, mochila, capacete), ProfilePad (silhueta do tronco, `pf`), HairPad (cabelo desenhado em grade 32×14: `hv` volume, `hl` comprimento, `hs` tipo de fio).
- Hub aceita nos cosméticos: `ac`, `tx` (≤120 KB), `pf`, `hv/hl/hs`. Mural: cosméticos até 130 KB.

## Atualização: avatar do "Avatar Studio" do usuário e ADMVinnil admin
- `js/avatar2.js`: o avatar do jogo passou a ser o modelo do **Mars Colony — Avatar Studio 3D** (HTML criado pelo usuário), portado para Three r128 (cápsulas via torno, `vendor/RoundedBoxGeometry.js`). Converte cosméticos/aparência do jogo (`asState`) e mantém pintura, cabelo desenhado, acessórios do Estúdio (`headExtras`), alienígenas e animação de andar/piscar.
- Aparência ganhou cor dos olhos (`ec`) e acessórios grátis da missão (`ax`, bitmask: óculos, fones, pulso, tablet, garrafa, cinto, kit, chave, lanterna). Equipe = Yuki, Kwame, Saoirse, Amira, Wei, Nia, Rafael, Emma.
- ADMVinnil voltou a ser **admin** (sem Estúdio). Admins: ADMVinnil, ADMKezle, ADMLefaar; desenhistas: ADMKezle e ADMLefaar.
