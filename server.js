import express from "express";
import dotenv from "dotenv";
dotenv.config();
const app = express();
const port = Number(process.env.PORT || 3000);
app.use(express.json({ limit: "2mb" }));
app.use(express.static("public"));

// Kostenloser Modus: Es werden keine externen KI-APIs aufgerufen.
app.get("/api/health", (_req, res) => res.json({
  ok: true,
  service: "KI-Musikstudio",
  generationConfigured: true,
  freeSingingVoice: true,
  songModel: "Kostenloser Browser-Synthesizer",
  billing: "Keine externen API-Aufrufe"
}));

app.post("/api/generate", (req, res) => {
  const {
    prompt = "",
    lyrics = "",
    genre = "Pop",
    mood = "Emotional",
    vocals = "Weibliche Stimme",
    duration = 30,
    instrumental = false,
    language = "Deutsch",
    title = "Mein KI-Song"
  } = req.body || {};

  const cleanLyrics = String(lyrics).trim();
  if (!instrumental && (cleanLyrics.length < 10 || cleanLyrics.length > 3500)) {
    return res.status(400).json({
      error: "Für einen Song mit Gesang werden 10 bis 3.500 Zeichen Liedtext benötigt."
    });
  }

  return res.json({
    mode: "free-synth",
    status: "succeeded",
    title: String(title).slice(0, 80),
    lyrics: cleanLyrics,
    prompt: String(prompt).slice(0, 500),
    genre: String(genre),
    mood: String(mood),
    vocals: String(vocals),
    duration: Math.max(10, Math.min(180, Number(duration) || 30)),
    instrumental: Boolean(instrumental),
    language: String(language)
  });
});

app.get("*", (_req, res) => res.sendFile(process.cwd() + "/public/index.html"));
app.listen(port, "0.0.0.0", () => console.log("KI-Musikstudio läuft im kostenlosen Modus auf Port " + port));
