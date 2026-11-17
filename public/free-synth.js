// Verbindet das Railway-Musikstudio mit der lokalen OpenUtau/DiffSinger-Installation.
(function () {
  const $ = id => document.getElementById(id);
  const form = $("generatorForm");
  if (!form) return;
  const LOCAL = "http://127.0.0.1:3031";
  const scale = [60, 62, 64, 67, 65, 64, 62, 55, 60, 62, 67, 69, 67, 64, 62, 60];

  function wordsFromLyrics(text) {
    return String(text || "").replace(/\[[^\]]*\]/g, " ").replace(/[.,!?;:()"]/g, " ").trim().split(/\s+/).filter(Boolean);
  }
  function melodyFor(words, bpm) {
    const beat = 60 / bpm;
    return words.map((word, i) => ({
      note: scale[i % scale.length] + (i > 15 ? 0 : 0),
      start: i * beat * 1.5,
      duration: beat * 1.35,
      vel: 95
    }));
  }
  async function localRequest(path, options = {}) {
    const response = await fetch(LOCAL + path, { ...options, mode: "cors", cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Lokale Verbindung fehlgeschlagen.");
    return data;
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    const btn = $("generateBtn"), out = $("generationResult");
    const lyrics = $("songLyrics").value.trim();
    const instrumental = $("vocals").value === "Instrumental";
    if (!instrumental && lyrics.length < 10) {
      out.textContent = "Bitte zuerst mindestens 10 Zeichen Liedtext eintragen.";
      return;
    }
    if (instrumental) {
      out.textContent = "Für die echte KI-Singstimme bitte Gesang auswählen und Liedtext eintragen.";
      return;
    }
    const words = wordsFromLyrics(lyrics);
    if (!words.length) {
      out.textContent = "Bitte einen Liedtext eintragen.";
      return;
    }
    btn.disabled = true;
    btn.textContent = "♪ Verbinde mit deiner KI-Singstimme …";
    out.innerHTML = "<div class='result-title'>LOKALE KI-SINGSTIMME</div><p>Prüfe die Verbindung zu OpenUtau auf deinem PC …</p>";
    try {
      const health = await localRequest("/health");
      if (!health.openUtauFound) {
        throw new Error("Die lokale Verbindung läuft, aber OpenUtau wurde nicht gefunden. Installiere OpenUtau oder setze OPENUTAU_EXE.");
      }
      const bpm = Math.max(70, Math.min(160, Number($("bpm")?.value || 120)));
      const payload = {
        lyrics,
        notes: melodyFor(words, bpm),
        bpm,
        title: $("songTitle").value.trim() || "Mein KI-Song"
      };
      const result = await localRequest("/sing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      out.innerHTML = "<div class='result-title'>DEIN DIFFSINGER-PROJEKT IST BEREIT</div>" +
        "<p>" + (result.opened ? "OpenUtau wurde auf deinem PC geöffnet." : "OpenUtau wurde nicht automatisch geöffnet.") + "</p>" +
        "<p>Wähle in OpenUtau eine installierte deutsche DiffSinger-Stimme aus und exportiere den Gesang als WAV.</p>" +
        "<a href='" + LOCAL + result.projectUrl + "' target='_blank' rel='noopener'>OpenUtau-Projekt (.ustx) herunterladen ↗</a>" +
        "<p class='form-note'>Die Stimme wird lokal auf deinem PC erzeugt. Es wird kein Replicate-Guthaben benötigt.</p>";
    } catch (error) {
      out.innerHTML = "<div class='result-title'>LOKALE SINGSTIMME NICHT ERREICHBAR</div><p>" +
        String(error.message).replace(/[&<>"]/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[c])) +
        "</p><p>Starte zuerst <b>local-singer/start.bat</b> auf deinem Windows-PC und lasse das Fenster geöffnet.</p>";
    } finally {
      btn.disabled = false;
      btn.innerHTML = "✧ Song mit KI generieren <span>→</span>";
    }
  });

  const note = document.querySelector(".form-note");
  if (note) note.textContent = "Echte KI-Singstimme über OpenUtau + DiffSinger auf deinem Windows-PC. Kostenlos lokal, ohne Replicate-API. Die erste Einrichtung ist erforderlich.";
})();