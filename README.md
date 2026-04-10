# AI Code Testing Tutor

Een lokaal draaiende AI-chatassistent gericht op softwaretesten, gebouwd op [Ollama](https://ollama.com) en het model `qwen2.5-coder:1.5b-instruct`. De applicatie draait volledig lokaal in Docker — er wordt geen data naar externe servers gestuurd.

---

## Wat doet de app?

AI Code Testing Tutor is een webgebaseerde chatinterface die fungeert als een expert softwaretester. De agent helpt met:

- Het schrijven van testcases en testplannen
- Het identificeren van edge cases en potentiële foutpunten
- Het reviewen van code op bugs en kwaliteitsproblemen
- Het adviseren over teststrategieën (unit, integratie, E2E, regressie, performance)
- Het schrijven van geautomatiseerde testscripts
- Het uitleggen van testconcepten

Bij het opstarten vraagt de app om een studentnummer en naam. Deze worden tijdens de sessie permanent weergegeven. De rol en het gedrag van de agent zijn configureerbaar via het bestand `config/role.json`.

---

## Vereisten

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (inclusief Docker Compose)
- Minimaal 2 GB vrije schijfruimte (voor het Ollama model)
- Een moderne webbrowser

---

## Installatie

1. Clone of download de projectmap naar je lokale machine.

2. Zorg dat de mapstructuur er als volgt uitziet:

```
AI_Code_Testing_Tutor/
├── Dockerfile
├── .dockerignore
├── docker-compose.yml
├── package.json
├── server.js
├── config/
│   └── role.json
└── public/
    └── index.html
```

3. Er is geen verdere installatie nodig — Docker regelt alles automatisch.

---

## Starten

Open een terminal in de projectmap en voer uit:

```bash
docker-compose up --build
```

Bij de **eerste start** gebeurt het volgende automatisch:
- Het Ollama image wordt gedownload
- Het model `qwen2.5-coder:1.5b-instruct` wordt gedownload (~1 GB, eenmalig)
- De applicatie wordt gebouwd en gestart
- De agent start pas zodra het model volledig geladen is

Zodra alles klaar is open je de app in je browser op:

```
http://localhost:3333
```

Bij **volgende starts** (model al gedownload) gebruik je:

```bash
docker-compose up
```

> **Let op:** `docker-compose up` hergebruikt de bestaande image en pikt wijzigingen in `index.html`, `server.js` of `config/` **niet** automatisch op. Zie [Upgraden](#upgraden) hieronder.

---

## Upgraden

Na het bijwerken van bestanden (zoals `index.html`, `server.js` of `config/role.json`) moet de image opnieuw worden gebouwd. Dankzij `pull_policy: build` in `docker-compose.yml` doet het volgende commando dat automatisch:

```bash
docker-compose up --build
```

Wil je zeker zijn dat er geen oude lagen worden hergebruikt (bij hardnekkige cacheproblemen), gebruik dan:

```bash
docker-compose build --no-cache
docker-compose up
```

Of verwijder de oude image handmatig en start opnieuw:

```bash
docker-compose down
docker rmi sd_testing_agent
docker-compose up
```

---

## Stoppen

Stop de applicatie met:

```bash
docker-compose down
```

Het gedownloade model blijft bewaard in een Docker volume (`ollama_data`) en hoeft niet opnieuw te worden gedownload bij de volgende start.

---

## Rol aanpassen

Pas het bestand `config/role.json` aan en start de applicatie opnieuw op:

```json
{
  "role": "AI Code Testing Tutor",
  "description": "Expert software tester assistant",
  "primaryTask": "Assist with all aspects of software testing",
  "responsibilities": [
    "Write test cases and test plans",
    "..."
  ],
  "behavior": [
    "Be concise and precise",
    "..."
  ]
}
```

Start daarna opnieuw op:

```bash
docker-compose down
docker-compose up --build
```

---

## Poorten

| Service | Poort |
|---|---|
| Webinterface | http://localhost:3333 |
| Ollama API | http://localhost:11434 |

---

## Auteur

**Jan Meeuwissen — ROC Nijmegen**

---

## Notice

Copyright (C) 2026 Jan Meeuwissen — ROC Nijmegen

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
