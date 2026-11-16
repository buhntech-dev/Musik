import express from "express";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const port = Number(process.env.PORT || 3000);
app.use(express.json({ limit: "2mb" }));
app.use(express.static("public"));

const jobs = new Map();

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "KI-Musikstudio", generationConfigured: Boolean(process.env.REPLICATE_API_TOKEN && process.env.REPLICATE_MODEL_VERSION) });
});

app.post("/api/generate", async (req, res) => {
  try {
    const { prompt, genre = "Pop", mood = "Emotional", vocals = "Mit Gesang", duration = 30 } = req.body || {};
    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 8) {
      return res.status(400).json({ error: "Bitte beschreibe deinen Song etwas genauer (mindestens 8 Zeichen)." });
    }
    if (!process.env.REPLICATE_API_TOKEN || !process.env.REPLICATE_MODEL_VERSION) {
      return res.status(503).json({ error: "KI-Generierung ist noch nicht eingerichtet. Hinterlege REPLICATE_API_TOKEN und REPLICATE_MODEL_VERSION in den Server-Umgebungsvariablen. Das Studio und der Demo-Modus funktionieren trotzdem." });
    }

    let extras = {};
    try { extras = JSON.parse(process.env.REPLICATE_EXTRA_INPUT_JSON || "{}"); }
    catch { return res.status(500).json({ error: "REPLICATE_EXTRA_INPUT_JSON ist kein gültiges JSON." }); }

    const input = {
      ...extras,
      [process.env.REPLICATE_INPUT_PROMPT_KEY || "prompt"]: [
        prompt.trim(), `Genre: ${genre}`, `Stimmung: ${mood}`, `Gesang: ${vocals}`, `Zieldauer: ${Math.min(180, Math.max(5, Number(duration) || 30))} Sekunden`
      ].join(". ")
    };

    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ version: process.env.REPLICATE_MODEL_VERSION, input })
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.detail || data.error || "Der Musikdienst hat die Anfrage abgelehnt." });
    jobs.set(data.id, { id: data.id, status: data.status, urls: data.urls, output: data.output || null, createdAt: Date.now() });
    res.json({ id: data.id, status: data.status, pollUrl: `/api/generate/${data.id}` });
  } catch (error) {
    console.error("Generation error:", error);
    res.status(500).json({ error: "Die Generierungsanfrage konnte nicht gestartet werden." });
  }
});

app.get("/api/generate/:id", async (req, res) => {
  try {
    const response = await fetch(`https://api.replicate.com/v1/predictions/${encodeURIComponent(req.params.id)}`, {
      headers: { Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}` }
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.detail || "Status konnte nicht geladen werden." });
    res.json({ id: data.id, status: data.status, output: data.output || null, error: data.error || null });
  } catch {
    res.status(502).json({ error: "Der Musikdienst ist gerade nicht erreichbar." });
  }
});

app.get("*", (_req, res) => res.sendFile(process.cwd() + "/public/index.html"));
app.listen(port, () => console.log(`KI-Musikstudio läuft auf Port ${port}`));
