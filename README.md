# KI-Musikstudio 🎧

Ein modernes, deutschsprachiges KI-Musikstudio im Browser. Songs planen, Texte entwerfen, Instrumente ausprobieren, Audiodateien importieren und Projekte lokal speichern.

## Funktionen

- **KI-Instrumental-Generator:** Prompt, Genre, Stimmung und Dauer konfigurieren. Echte Audio-Generierung über Replicate / Meta MusicGen.
- **Songtext-Assistent:** Erstellt einen editierbaren Songtext mit Strophen, Refrain und Bridge.
- **Studio / DAW:** Mehrspur-Timeline, Spuren hinzufügen und entfernen, Audio importieren und Sounds im Browser abspielen.
- **Instrumente:** Browser-Synthesizer-Klänge für Piano, Bass, Lead und Drum-Pattern.
- **Projektverwaltung:** Projekte lokal im Browser speichern und wieder öffnen.

> **Wichtig zur KI:** Meta MusicGen erzeugt Instrumentalmusik, keine fertig gesungenen Songs mit echten Gesangsstimmen. Der Songtext-Assistent ist separat. Für vollständige Songs mit KI-Gesang braucht das Projekt zusätzlich ein geeignetes Text-to-Song-Modell. MusicGen-Ausgaben sind hier auf 5–30 Sekunden begrenzt. Prüfe vor kommerzieller Nutzung die Modelllizenz.

## Schnellstart

Voraussetzung: Node.js 20 oder neuer.

```bash
npm install
cp .env.example .env
npm start
```

Dann http://localhost:3000 öffnen.

## KI aktivieren

1. Erstelle einen Account bei [Replicate](https://replicate.com/).
2. Erzeuge unter [API Tokens](https://replicate.com/account/api-tokens) einen API-Token.
3. Hinterlege diese Variablen in Railway (oder lokal in `.env`):

| Variable | Wert |
|---|---|
| `REPLICATE_API_TOKEN` | Dein privater Replicate-Token |
| `REPLICATE_MODEL_VERSION` | `671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb` |
| `REPLICATE_EXTRA_INPUT_JSON` | `{"model_version":"stereo-large","output_format":"mp3","normalization_strategy":"peak"}` |

Der Token bleibt serverseitig und darf niemals in GitHub oder im Browser-Code gespeichert werden.

MusicGen läuft auf GPU-Hardware. Replicate berechnet die Generierung nach Nutzung; die Modellseite nennt ungefähr 0,10 US-Dollar pro Lauf, abhängig von Eingaben und tatsächlicher Laufzeit. Prüfe den aktuellen Preis vor der Nutzung.

Modell: [Replicate – meta/musicgen](https://replicate.com/meta/musicgen)

## Deployment

Startbefehl: `npm start`. Railway setzt `PORT` automatisch.

## Datenschutz

Projekte und importierte Audiodateien bleiben im Browser (Local Storage / Arbeitsspeicher), solange keine eigene Datenbank ergänzt wird.
