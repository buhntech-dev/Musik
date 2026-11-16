# KI-Musikstudio 🎧

Ein deutschsprachiges KI-Musikstudio mit Songgenerator, Songtext-Assistent, Instrumenten und Mehrspur-Editor.

## KI-Funktionen

- **MiniMax Music 2.5 via Replicate:** vollständige Songs mit Gesang, Liedtext und Instrumenten.
- **Stimmen:** männlich, weiblich oder Duett als Regieanweisung im Prompt.
- **Songtexte:** Songtext-Assistent mit Strophen, Refrain und Bridge; Texte können im Generator bearbeitet/eingefügt werden.
- **Instrumental:** Der Musikdienst kann mit einer Instrumental-Anweisung genutzt werden.
- **Studio:** Mehrspur-Timeline, Audioimport, Browser-Instrumente und lokale Projektverwaltung.

Hinweis: Die Aussprachequalität auf Deutsch kann variieren. Laut Modelldokumentation sind Englisch und Mandarin besonders gut unterstützt. Die Stimme ist synthetisch, kein Klon einer realen Person.

## Lokal starten

Voraussetzung: Node.js 20 oder neuer.

```bash
npm install
cp .env.example .env
npm start
```

Öffne http://localhost:3000.

## KI aktivieren

1. Registriere dich bei https://replicate.com/.
2. Erstelle einen privaten API-Token unter https://replicate.com/account/api-tokens.
3. Füge in Railway unter Service → Variables die Variable REPLICATE_API_TOKEN mit deinem privaten Token hinzu.
4. Railway deployt die App erneut.

Den Token niemals in GitHub oder in Browser-Dateien eintragen.

Modell: https://replicate.com/minimax/music-2.5. Das Modell nimmt Liedtext (bis 3.500 Zeichen) und eine Stilbeschreibung entgegen und liefert Audio zurück. Prüfe aktuelle Modellpreise und Nutzungsbedingungen vor der Nutzung.

## Deployment

Railway verwendet den Startbefehl npm start und stellt PORT automatisch bereit.

## Datenschutz

Der Replicate-Token bleibt serverseitig. Projekte und importierte Audiodateien werden lokal im Browser gespeichert bzw. verarbeitet. Für Mehrbenutzerkonten und Cloud-Projekte ist später eine Datenbank erforderlich.
