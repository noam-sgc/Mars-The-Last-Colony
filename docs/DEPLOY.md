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
3. Abra a URL `https://<nome>.onrender.com`: o jogo detecta o servidor sozinho.

## Docker em qualquer lugar (Fly.io, VPS, Railway…)
```bash
docker build -t mars .
docker run -d -p 80:8080 -v mars-data:/data -e ADM_PASSWORDS="ADMVinnil=...,ADMKezle=...,ADMLefaar=..." mars
```
Use HTTPS na frente (o cliente usa `wss://` automaticamente).

## Vercel (cliente + WebRTC, sem servidor)
A Vercel não mantém WebSocket, então o servidor Node não roda nela, mas **não é necessário**: o jogo usa WebRTC.
1. Em vercel.com/new, importe o repositório (*Framework Preset: Other*, sem build command). O `vercel.json` já está incluso.
2. Abra o site: *Entrar no meu mundo* gera o código; amigos entram com ele. O site só serve os arquivos; o jogo roda nos navegadores.
3. Para trocar o sinalizador gratuito do PeerJS por um seu, preencha `window.MARS_PEER` em `js/config.js`
   (servidor `npx peerjs --port 9000`). Para usar um servidor WebSocket próprio no lugar do WebRTC, preencha `window.MARS_SERVER`.

Limites do modo WebRTC: sem TURN, algumas redes (CGNAT/corporativas) não conectam diretamente; o mundo some quando o anfitrião fecha o jogo;
eventos e catálogo publicados por ADM valem para quem está naquele mundo.

## Notas
- Sem disco persistente, contas somem a cada deploy.
- Reinicie com cuidado: salas ao vivo são em memória; o cliente reconecta sozinho em ~3 s.
