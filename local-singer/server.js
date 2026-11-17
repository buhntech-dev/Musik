import http from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { homedir } from "node:os";
import { spawn } from "node:child_process";
import YAML from "yaml";

const PORT = Number(process.env.LOCAL_SINGER_PORT || 3031);
const ROOT = resolve("output");
const ORIGIN = "https://musik-production-b790f40b.up.railway.app";

function headers(res, type="application/json") {
  res.setHeader("Content-Type", type);
  res.setHeader("Access-Control-Allow-Origin", ORIGIN);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Private-Network", "true");
}
function send(res, code, data) { headers(res); res.writeHead(code); res.end(JSON.stringify(data)); }
async function body(req) {
  let raw=""; for await (const chunk of req) { raw += chunk; if (raw.length > 1_000_000) throw new Error("Anfrage zu groß"); }
  return JSON.parse(raw || "{}");
}
function findOpenUtau() {
  const candidates = [
    process.env.OPENUTAU_EXE,
    join(process.env.LOCALAPPDATA || "", "Programs", "OpenUtau", "OpenUtau.exe"),
    join(process.env.ProgramFiles || "C:\\Program Files", "OpenUtau", "OpenUtau.exe"),
    join(homedir(), "AppData", "Local", "Programs", "OpenUtau", "OpenUtau.exe")
  ].filter(Boolean);
  return candidates.find(p => existsSync(p)) || null;
}
function makeProject({lyrics, notes, bpm=120, title="Mein KI-Song"}) {
  if (!Array.isArray(notes) || !notes.length) throw new Error("Es wurde keine Melodie übergeben.");
  const words = String(lyrics || "").replace(/\[[^\]]*\]/g, " ").trim().split(/\s+/).filter(Boolean);
  if (!words.length) throw new Error("Bitte Liedtext eintragen.");
  const mapped = notes.map((n,i) => ({
    position: Math.max(0, Math.round(Number(n.start || 0) * bpm / 60 * 480)),
    duration: Math.max(60, Math.round(Number(n.duration || 0.5) * bpm / 60 * 480)),
    tone: Math.max(36, Math.min(84, Math.round(Number(n.note || 60)))),
    lyric: words[i % words.length],
    pitch: { data: [{x:-40,y:0,shape:"io"},{x:40,y:0,shape:"io"}], snap_first:true },
    vibrato: { length:75, period:175, depth:20, in:10, out:10, shift:0, drift:0, vol_link:0 },
    phoneme_expressions: [{index:0,abbr:"vel",value:100}],
    phoneme_overrides: []
  }));
  const last = mapped[mapped.length-1];
  return {
    name: String(title).slice(0,80),
    comment: "Vom Musikstudio erzeugtes OpenUtau-Projekt. In OpenUtau eine installierte deutsche DiffSinger-Stimme auswählen und als WAV exportieren.",
    output_dir:"Vocal", cache_dir:"UCache", ustx_version:"0.6", resolution:480,
    bpm:Math.max(50,Math.min(200,Number(bpm)||120)), beat_per_bar:4, beat_unit:4,
    expressions:{
      dyn:{name:"dynamics (curve)",abbr:"dyn",type:"Curve",min:-240,max:120,default_value:0,is_flag:false,flag:""},
      pitd:{name:"pitch deviation (curve)",abbr:"pitd",type:"Curve",min:-1200,max:1200,default_value:0,is_flag:false,flag:""},
      vel:{name:"velocity",abbr:"vel",type:"Numerical",min:0,max:200,default_value:100,is_flag:false,flag:""},
      vol:{name:"volume",abbr:"vol",type:"Numerical",min:0,max:200,default_value:100,is_flag:false,flag:""}
    },
    exp_selectors:["dyn","pitd","vel","vol"], exp_primary:0, exp_secondary:1, key:0,
    time_signatures:[{bar_position:0,beat_per_bar:4,beat_unit:4}],
    tempos:[{position:0,bpm:Math.max(50,Math.min(200,Number(bpm)||120))}],
    tracks:[{phonemizer:"OpenUtau.Core.DiffSinger.DiffSingerPhonemizer",renderer_settings:{},track_name:"Gesang",track_color:"Blue",mute:false,solo:false,volume:0,pan:0,track_expressions:[],voice_color_names:[""]}],
    voice_parts:[{duration:last.position+last.duration+960,name:"Gesang",comment:"",track_no:0,position:0,notes:mapped,curves:[]}],
    wave_parts:[]
  };
}
const server = http.createServer(async (req,res) => {
  if (req.method === "OPTIONS") { headers(res); res.writeHead(204); return res.end(); }
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  if (req.method === "GET" && url.pathname === "/health") {
    const exe = findOpenUtau();
    return send(res,200,{ok:true,openUtauFound:!!exe,openUtauPath:exe||null,mode:"OpenUtau/DiffSinger-Projektgenerator"});
  }
  if (req.method === "POST" && url.pathname === "/sing") {
    try {
      const data = await body(req);
      await mkdir(ROOT,{recursive:true});
      const filename = `song-${Date.now()}.ustx`;
      const file = join(ROOT,filename);
      await writeFile(file,YAML.stringify(makeProject(data)), "utf8");
      const exe = findOpenUtau();
      if (exe) spawn(exe,[file],{detached:true,stdio:"ignore"}).unref();
      return send(res,200,{ok:true,file:filename,projectUrl:`/project/${filename}`,openUtauFound:!!exe,opened:!!exe,message:exe?"Projekt wurde in OpenUtau geöffnet. Bitte Stimme auswählen und WAV exportieren.":"Projekt erstellt. OpenUtau wurde nicht gefunden; bitte die USTX-Datei herunterladen und manuell öffnen."});
    } catch(e) { return send(res,400,{error:e.message}); }
  }
  if (req.method === "GET" && url.pathname.startsWith("/project/")) {
    const name = url.pathname.split("/").pop();
    if (!/^song-\d+\.ustx$/.test(name)) return send(res,400,{error:"Ungültiger Dateiname"});
    const file = join(ROOT,name);
    if (!existsSync(file)) return send(res,404,{error:"Projekt nicht gefunden"});
    headers(res,"application/yaml"); res.setHeader("Content-Disposition",`attachment; filename="${name}"`);
    res.writeHead(200); return res.end(await readFile(file));
  }
  return send(res,404,{error:"Nicht gefunden"});
});
server.listen(PORT,"127.0.0.1",()=>console.log(`Lokale Singstimmen-Verbindung läuft: http://127.0.0.1:${PORT}`));
