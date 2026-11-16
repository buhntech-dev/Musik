import express from "express";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const port = Number(process.env.PORT || 3000);
app.use(express.json({ limit: "2mb" }));
app.use(express.static("public"));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "KI-Musikstudio", generationConfigured: Boolean(process.env.REPLICATE_API_TOKEN && process.env.REPLICATE_MODEL_VERSION), model: "MusicGen" });
});

app.post("/api/generate", async (req, res) => {
  try {
    const { prompt, genre = "Pop", mood = "Emotional", duration = 15 } = req.body || {};
    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 8) return res.status(400).json({ error: "Bitte beschreibe deinen Track etwas genauer (mindestens 8 Zeichen)." });
    if (!process.env.REPLICATE_API_TOKEN || !process.env.REPLICATE_MODEL_VERSION) return res.status(503).json({ error: "Die KI ist noch nicht freigeschaltet. Bitte REPLICATE_API_TOKEN und REPLICATE_MODEL_VERSION in Railway hinterlegen." });
    let extras = {};
    try { extras = JSON.parse(process.env.REPLICATE_EXTRA_INPUT_JSON || "{}"); }
    catch { return res.status(500).json({ error: "REPLICATE_EXTRA_INPUT_JSON ist kein gültiges JSON." }); }
    const seconds = Math.min(30, Math.max(5, Number(duration) || 15));
    const input = {
      model_version: "stereo-large",
      output_format: "mp3",
      normalization_strategy: "peak",
      ...extras,
      [process.env.REPLICATE_INPUT_PROMPT_KEY || "prompt"]: [prompt.trim(), `Genre: ${genre}`, `Stimmung: ${mood}`, "Instrumentaler Track ohne Gesang"].join(". "),
      duration: seconds
    };
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ version: process.env.REPLICATE_MODEL_VERSION, input })
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.detail || data.error || "Der Musikdienst hat die Anfrage abgelehnt." });
    res.json({ id: data.id, status: data.status, pollUrl: `/api/generate/${data.id}` });
  } catch (error) {
    console.error("Generation error:", error);
    res.status(500).json({ error: "Die Generierungsanfrage konnte nicht gestartet werden." });
  }
});

app.get("/api/generate/:id", async (req, res) => {
  if (!process.env.REPLICATE_API_TOKEN) return res.status(503).json({ error: "KI-API-Schlüssel fehlt." });
  try {
    const response = await fetch(`https://api.replicate.com/v1/predictions/${encodeURIComponent(req.params.id)}`, { headers: { Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}` } });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.detail || "Status konnte nicht geladen werden." });
    res.json({ id: data.id, status: data.status, output: data.output || null, error: data.error || null });
  } catch { res.status(502).json({ error: "Der Musikdienst ist gerade nicht erreichbar." }); }
});

app.get("*", (_req, res) => res.sendFile(process.cwd() + "/public/index.html"));
app.listen(port, "0.0.0.0", () => console.log(`KI-Musikstudio läuft auf Port ${port}`));
