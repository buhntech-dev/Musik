import express from "express";
import dotenv from "dotenv";
dotenv.config();
const app = express();
const port = Number(process.env.PORT || 3000);
app.use(express.json({ limit: "2mb" }));
app.use(express.static("public"));

app.get("/api/health", (_req, res) => res.json({
  ok: true,
  service: "KI-Musikstudio",
  generationConfigured: true,
  freeSingingVoice: "local",
  songModel: "OpenUtau + DiffSinger (lokaler Windows-PC)",
  billing: "Keine externen KI-API-Aufrufe für den Gesang"
}));

app.post("/api/generate", (req, res) => {
  const { lyrics = "", genre = "Pop", mood = "Emotional", vocals = "Weibliche Stimme", duration = 180, instrumental = false, language = "Deutsch", title = "Mein KI-Song" } = req.body || {};
  const cleanLyrics = String(lyrics).trim();
  if (!instrumental && (cleanLyrics.length < 10 || cleanLyrics.length > 3500)) {
    return res.status(400).json({ error: "Für einen Song mit Gesang werden 10 bis 3.500 Zeichen Liedtext benötigt." });
  }
  return res.json({
    mode: "local-diffsinger",
    status: "ready",
    title: String(title).slice(0, 80),
    lyrics: cleanLyrics,
    genre: String(genre),
    mood: String(mood),
    vocals: String(vocals),
    duration: Math.max(10, Math.min(180, Number(duration) || 180)),
    instrumental: Boolean(instrumental),
    language: String(language),
    instructions: "Der Gesang wird lokal mit OpenUtau/DiffSinger auf deinem PC gerendert."
  });
});

app.get("*", (_req, res) => res.sendFile(process.cwd() + "/public/index.html"));
app.listen(port, "0.0.0.0", () => console.log("KI-Musikstudio bereit auf Port " + port));
