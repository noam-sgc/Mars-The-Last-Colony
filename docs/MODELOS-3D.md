# Modelos 3D (.glb) dos personagens

O jogo carrega modelos de `assets/models/models.json` (via `js/models.js`). Sem esse arquivo, vale o avatar desenhado em código.

```json
{ "chars": [ { "id": "tm1", "n": "Mei Tanaka", "file": "mei.glb" } ],
  "body": { "file": "base.glb" } }
```

- `chars`: personagens prontos da aba Equipe (`tm1`…`tm8`), com a arte original. Quem usa o personagem vê o modelo.
- `body` (opcional): corpo base recolorível. Os materiais chamados Traje, Acento, Pele, Cabelo, Botas e Mochila recebem as cores escolhidas no Guarda-roupa.
- Animações: clipes com "walk"/"andar" e "idle"/"parado" no nome tocam sozinhos. A altura é ajustada automaticamente.
- `assets/models/fonte/`: recortes da ficha de equipe usados para gerar os modelos (imagem → 3D).
