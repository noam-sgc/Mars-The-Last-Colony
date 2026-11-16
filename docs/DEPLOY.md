# Publicar o servidor (de verdade)

O jogo é um único processo Node (HTTP + WebSocket em `/ws`) que também serve o cliente. Qualquer host que rode Docker ou Node com WebSocket serve.

## Variáveis
| Variável | Uso |
|---|---|
| `PORT` | porta (padrão 8080) |
| `DATA_DIR` | pasta de dados (contas, ranking, catálogo). **Precisa ser persistente** |
| `ADM_PASSWORDS` | `ADMVinnil=senha1,ADMKezle=senha2,ADMLefaar=senha3` (use senhas fortes). Admins: os 3. Desenhistas: só ADMVinnil e ADMKezle |

## Render (recomendado)
1. Em render.com: **New → Blueprint** e escolha este repositório (usa `render.yaml`).
2. No painel, defina o segredo `ADM_PASSWORDS`.
3. Abra a URL `https://<nome>.onrender.com`: o jogo detecta o servidor sozinho (o modo "demonstração" só aparece sem servidor).

## Docker em qualquer lugar (Fly.io, VPS, Railway…)
```bash
docker build -t mars .
docker run -d -p 80:8080 -v mars-data:/data -e ADM_PASSWORDS="ADMVinnil=...,ADMKezle=...,ADMLefaar=..." mars
```
Use HTTPS na frente (o cliente usa `wss://` automaticamente).

## Vercel (somente o cliente)
A Vercel roda funções serverless e **não mantém conexões WebSocket**, então o servidor do jogo (`server/server.js`) não pode rodar nela.
O que dá para publicar na Vercel é o **cliente estático** (`vercel.json` já incluso):
1. Em vercel.com/new, importe o repositório; *Framework Preset: Other*; sem build command; *Output Directory*: raiz (padrão).
2. **Sem servidor:** o jogo roda em *modo demonstração local* (contas só no navegador, sem multiplayer entre pessoas).
3. **Com servidor real:** hospede o servidor no Render/Fly/VPS (acima) e, em `js/config.js`, preencha `window.MARS_SERVER = "wss://SEU-SERVIDOR/ws"`
   (ou abra o site com `?server=wss://SEU-SERVIDOR/ws`). O site da Vercel passa a usar esse servidor.

## Notas
- Sem disco persistente, contas somem a cada deploy.
- Reinicie com cuidado: salas ao vivo são em memória; o cliente reconecta sozinho em ~3 s.
