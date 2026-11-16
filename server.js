import express from "express";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const port = Number(process.env.PORT || 3000);
app.use(express.json({ limit: "2mb" }));
app.use(express.static("public"));

const configured = () => Boolean(process.env.REPLICATE_API_TOKEN);
app.get("/api/health", (_req, res) => res.json({
  ok: true, service: "KI-Musikstudio",
  generationConfigured: configured(),
  songModel: "MiniMax Music 2.5",
  instrumentalModel: "Meta MusicGen"
}));

async function replicatePrediction(modelPath, input) {
  const response = await fetch(`https://api.replicate.com/v1/models/${modelPath}/predictions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}`,
      "Content-Type": "application/json",
      Prefer: "wait=5"
    },
    body: JSON.stringify({ input })
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.detail || data.error || "Der Musikdienst hat die Anfrage abgelehnt.");
    error.status = response.status;
    throw error;
  }
  return data;
}

app.post("/api/generate", async (req, res) => {
  try {
    if (!configured()) return res.status(503).json({ error: "Die KI ist noch nicht freigeschaltet. Bitte REPLICATE_API_TOKEN in Railway hinterlegen." });
    const {
      prompt = "", lyrics = "", genre = "Pop", mood = "Emotional",
      vocals = "Weibliche Stimme", duration = 180, instrumental = false,
      language = "Deutsch", title = "Mein KI-Song"
    } = req.body || {};
    const description = [genre, mood, prompt, language + " language", vocals, "professionelle Studio-Produktion"].filter(Boolean).join(", ");
    const cleanLyrics = String(lyrics).trim();
    if (!instrumental && (cleanLyrics.length < 10 || cleanLyrics.length > 3500)) {
      return res.status(400).json({ error: "Für einen Song mit Gesang werden 10 bis 3.500 Zeichen Liedtext benötigt." });
    }
    if (instrumental) {
      const seconds = Math.min(30, Math.max(5, Number(duration) || 15));
      if (!process.env.REPLICATE_MUSICGEN_VERSION) return res.status(503).json({ error: "Für Instrumental-Tracks fehlt REPLICATE_MUSICGEN_VERSION in Railway." });
      const prediction = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          version: process.env.REPLICATE_MUSICGEN_VERSION,
          input: {
            model_version: "stereo-large", output_format: "mp3",
            normalization_strategy: "peak",
            prompt: [prompt, `Genre: ${genre}`, `Stimmung: ${mood}`, "Instrumental, no vocals"].join(". "),
            duration: seconds
          }
        })
      });
      const data = await prediction.json();
      if (!prediction.ok) return res.status(prediction.status).json({ error: data.detail || data.error || "MusicGen-Anfrage fehlgeschlagen." });
      return res.json({ id: data.id, status: data.status, pollUrl: `/api/generate/${data.id}` });
    }

    const input = {
      lyrics: cleanLyrics,
      prompt: description.slice(0, 2000),
      sample_rate: 44100,
      bitrate: 256000,
      audio_format: "mp3"
    };
    const data = await replicatePrediction("minimax/music-2.5", input);
    res.json({ id: data.id, status: data.status, pollUrl: `/api/generate/${data.id}`, model: "MiniMax Music 2.5" });
  } catch (error) {
    console.error("Generation error:", error);
    res.status(error.status || 500).json({ error: error.message || "Die Generierung konnte nicht gestartet werden." });
  }
});

app.get("/api/generate/:id", async (req, res) => {
  if (!configured()) return res.status(503).json({ error: "KI-API-Schlüssel fehlt." });
  try {
    const response = await fetch(`https://api.replicate.com/v1/predictions/${encodeURIComponent(req.params.id)}`, {
      headers: { Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}` }
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.detail || "Status konnte nicht geladen werden." });
    res.json({ id: data.id, status: data.status, output: data.output || null, error: data.error || null });
  } catch { res.status(502).json({ error: "Der Musikdienst ist gerade nicht erreichbar." }); }
});

app.get("*", (_req, res) => res.sendFile(process.cwd() + "/public/index.html"));
app.listen(port, "0.0.0.0", () => console.log(`KI-Musikstudio läuft auf Port ${port}`));
