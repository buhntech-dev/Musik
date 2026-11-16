# KI-Musikstudio 🎧

Ein modernes, deutschsprachiges KI-Musikstudio im Browser. Songs planen, Texte entwerfen, Beats und Instrumente ausprobieren, Audiodateien importieren und Projekte lokal speichern.

## Funktionen

- **Song-Generator:** Prompt, Genre, Stimmung, Tempo, Gesang und Länge konfigurieren. Mit Replicate-API-Anbindung für echte Audio-Generierung.
- **Songtext-Assistent:** Erstellt einen editierbaren Songtext mit Strophen, Refrain und Bridge.
- **Studio / DAW:** Mehrspur-Timeline, Spuren hinzufügen, stummschalten, Lautstärke steuern, Audiodateien importieren, abspielen und exportieren.
- **Instrumente:** Browserbasierte Synthesizer-Klänge für Piano, Bass, Lead und Drum-Pattern als Startpunkt.
- **Projektverwaltung:** Projekte lokal im Browser speichern und wieder öffnen.
- **Export:** Mix als WAV-Datei exportieren.

> Hinweis: Ohne API-Schlüssel arbeitet das Studio im Demo-/DAW-Modus. Für vollständige KI-generierte Songs muss ein kompatibles Musikmodell über Replicate konfiguriert werden. Die API-Kosten und Modellbedingungen liegen beim jeweiligen Anbieter.

## Schnellstart

Voraussetzung: Node.js 20 oder neuer.

```bash
npm install
cp .env.example .env
npm start
```

Dann http://localhost:3000 öffnen.

## Echte KI-Musikgenerierung aktivieren

1. Erstelle einen API-Token bei [Replicate](https://replicate.com/account/api-tokens).
2. Trage ihn in `.env` als `REPLICATE_API_TOKEN` ein.
3. Trage die vom gewählten Replicate-Musikmodell angegebene Versions-ID in `REPLICATE_MODEL_VERSION` ein.
4. Prüfe die Eingabeparameter des Modells. Standardmäßig sendet das Backend `prompt`, `model_version` wird als Replicate-`version` verwendet und optional `duration` / `model_input_overrides` können angepasst werden.

Die Version und Eingabefelder eines Modells unterscheiden sich. Passe bei Bedarf `REPLICATE_INPUT_PROMPT_KEY` und `REPLICATE_EXTRA_INPUT_JSON` an. Das Backend hält den Token serverseitig; er wird niemals an den Browser ausgeliefert.

Beispiel für zusätzliche Modell-Eingaben:
```json
{"duration": 30, "model": "melody"}
```

## Deployment

Die App kann auf Railway, Render oder einem Node.js-Host betrieben werden. Startbefehl: `npm start`. Port wird über `PORT` gesetzt. Setze die Umgebungsvariablen im Hosting-Dashboard, nicht im Git-Repository.

## Sicherheit & Datenschutz

- API-Schlüssel ausschließlich als Server-Umgebungsvariablen speichern.
- Projekte und importierte Audiodateien bleiben im Browser (Local Storage / Arbeitsspeicher), solange keine eigene Datenbank ergänzt wird.
- Vor Veröffentlichung eigener KI-Musik die Rechte- und Lizenzbedingungen des jeweiligen Modells prüfen.

## Projektstruktur

- `public/` – Weboberfläche und Studio
- `server.js` – API und statischer Webserver
- `.env.example` – Konfigurationsvorlage
