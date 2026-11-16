const $ = (id) => document.getElementById(id);
const colors = ["#8e70f4", "#4f9bd2", "#dc9458", "#52b99a", "#d46a9d"];
let tracks = [
  {name:"Drums", detail:"Beat · 120 BPM", color:colors[0], clip:"Drum groove"},
  {name:"Bass", detail:"Synth bass", color:colors[1], clip:"Bass line"},
  {name:"Piano", detail:"Grand piano", color:colors[2], clip:"Chord progression"}
];
let audioCtx, playing=false, startAt=0, elapsed=0, timer=null, activeNodes=[];
let project={name:"Mein erster Track",tracks, bpm:120, createdAt:Date.now()};

function showView(name){
  document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.id===`view-${name}`));
  document.querySelectorAll(".nav-item").forEach(v=>v.classList.toggle("active",v.dataset.view===name));
  $("pageTitle").textContent=({studio:"Studio",generator:"KI Songgenerator",lyrics:"Songtexte",library:"Meine Musik"})[name]||"Studio";
  if(name==="library") renderLibrary();
}
document.querySelectorAll("[data-view]").forEach(el=>el.addEventListener("click",()=>showView(el.dataset.view)));
function renderTracks(){
  $("tracks").innerHTML=tracks.map((t,i)=>`<div class="track-row"><div class="track-meta"><span class="track-color" style="background:${t.color}"></span><div><strong>${escapeHtml(t.name)}</strong><small>${escapeHtml(t.detail)}</small></div><button title="Spur entfernen" data-remove="${i}">×</button></div><div class="track-lane">${t.clip?`<div class="clip ${i%3===1?"blue":i%3===2?"orange":""}" style="width:${Math.min(82,30+i*7)}%">${escapeHtml(t.clip)}</div>`:""}</div></div>`).join("");
  $("trackCount").textContent=`${tracks.length} Spuren`;
  document.querySelectorAll("[data-remove]").forEach(b=>b.addEventListener("click",()=>{tracks.splice(Number(b.dataset.remove),1);renderTracks()}));
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function addTrack(name="Neue Spur"){
  tracks.push({name,detail:"Eigene Spur",color:colors[tracks.length%colors.length],clip:""});
  renderTracks();
}
$("addTrack").onclick=()=>addTrack();
$("addTrackCard").onclick=()=>{showView("studio");addTrack("Neue Instrumentenspur")};
$("newProject").onclick=()=>{tracks=[];project.name="Neues Projekt";renderTracks();showView("studio")};
$("bpm").onchange=e=>{project.bpm=Math.max(40,Math.min(220,Number(e.target.value)||120));e.target.value=project.bpm};
function context(){if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==="suspended")audioCtx.resume();return audioCtx}
function tone(freq,duration=.35,type="sine",volume=.12){
  const c=context(),osc=c.createOscillator(),gain=c.createGain();
  osc.type=type;osc.frequency.value=freq;gain.gain.setValueAtTime(volume,c.currentTime);gain.gain.exponentialRampToValueAtTime(.001,c.currentTime+duration);
  osc.connect(gain);gain.connect(c.destination);osc.start();osc.stop(c.currentTime+duration);activeNodes.push(osc);
}
function playDemo(){
  const c=context(), bpm=project.bpm||120, beat=60/bpm;
  const notes=[261.63,329.63,392,329.63,293.66,349.23,440,349.23];
  notes.forEach((n,i)=>setTimeout(()=>{if(playing)tone(n,.3,"triangle",.09)},i*beat*500));
  [0,2,4,6].forEach(i=>setTimeout(()=>{if(playing)tone(90,.09,"sine",.17)},i*beat*500));
}
function updateClock(){elapsed=(Date.now()-startAt)/1000;$("timeDisplay").textContent=new Date(elapsed*1000).toISOString().slice(14,19)}
$("playBtn").onclick=()=>{
  if(playing){playing=false;clearInterval(timer);$("playBtn").textContent="▶";return}
  playing=true;startAt=Date.now()-elapsed*1000;$("playBtn").textContent="Ⅱ";playDemo();timer=setInterval(()=>{updateClock();if(elapsed>30){elapsed=0;startAt=Date.now()}},250);
};
$("stopBtn").onclick=()=>{playing=false;clearInterval(timer);elapsed=0;$("timeDisplay").textContent="00:00";$("playBtn").textContent="▶"};
document.querySelectorAll("[data-instrument]").forEach(btn=>btn.onclick=()=>{
  const name=btn.dataset.instrument;addTrack(name);
  const patterns={Piano:[261.63,329.63,392,523.25],Bass:[82.41,98,110,82.41],Synth:[440,523.25,659.25,783.99],Drums:[90,90,120,90]};
  patterns[name].forEach((n,i)=>setTimeout(()=>tone(n,.28,name==="Drums"?"sine":"triangle",.13),i*220));
});
$("audioUpload").onchange=e=>{
  const file=e.target.files[0];if(!file)return;
  addTrack(file.name.replace(/\.[^.]+$/,""));
  const url=URL.createObjectURL(file);const item=document.createElement("audio");item.src=url;item.controls=true;item.style.cssText="width:100%;margin:10px 0";$("tracks").append(item);
};
$("saveProject").onclick=saveProject;
function saveProject(){
  project={...project,name:project.name||"Mein Track",tracks,bpm:project.bpm||120,updatedAt:Date.now()};
  const list=JSON.parse(localStorage.getItem("ki-musik-projects")||"[]");
  const idx=list.findIndex(x=>x.name===project.name);if(idx>=0)list[idx]=project;else list.unshift(project);
  localStorage.setItem("ki-musik-projects",JSON.stringify(list.slice(0,30)));
  $("serviceStatus").textContent="Gespeichert";
}
function renderLibrary(){
 const list=JSON.parse(localStorage.getItem("ki-musik-projects")||"[]");
 $("libraryList").innerHTML=list.length?list.map((p,i)=>`<div class="library-item"><div class="library-cover">♫</div><div><strong>${escapeHtml(p.name)}</strong><small>${p.tracks?.length||0} Spuren · ${new Date(p.updatedAt||p.createdAt).toLocaleString("de-DE")}</small></div><button data-open="${i}">Öffnen</button></div>`).join(""):'<div class="glass-card">Noch keine Projekte gespeichert. Speichere dein erstes Projekt im Studio.</div>';
 document.querySelectorAll("[data-open]").forEach(b=>b.onclick=()=>{const p=list[Number(b.dataset.open)];project=p;tracks=p.tracks||[];$("bpm").value=p.bpm||120;renderTracks();showView("studio")});
}
function createLyrics(idea,style,lang){
 const english=lang==="Englisch",word=english?"Verse":"Strophe",chorus=english?"Chorus":"Refrain",bridge=english?"Bridge":"Bridge";
 const subject=idea.trim()||"unseren Weg";
 const lines=english?[
  `[Verse 1]\nNeon lights are calling out tonight\nWe chase the echoes till the morning light\nEvery road is leading back to ${subject}\nA thousand little sparks are burning bright`,
  `[Chorus]\nWe are alive, we own the sky\nNo looking back, we're flying high\nThrough every storm, through every flame\nWe'll find our way and sing again`,
  `[Verse 2]\nThe city moves beneath our feet\nA heartbeat turning into a beat\nNo perfect map, no guarantees\nJust open roads and endless dreams`,
  `[Bridge]\nIf the world goes quiet\nWe'll be the sound\nIf the stars stop shining\nWe'll light this town`
 ]:[
  `[Strophe 1]\nDie Lichter malen Farben in die Nacht\nWir haben viel zu lang nur nachgedacht\nJeder neue Schritt führt uns zu ${subject}\nUnd irgendwo wird wieder Hoffnung wach`,
  `[Refrain]\nWir sind noch hier, wir geben nicht auf\nÜber den Wolken nimmt alles seinen Lauf\nWenn die Welt sich dreht, bleiben wir nicht steh'n\nDenn unsere Zeit wird niemals untergeh'n`,
  `[Strophe 2]\nDie Straßen tragen uns durch jedes Licht\nWir suchen unser Morgen im Gesicht\nKein Weg ist leicht, doch jeder Schritt zählt\nWeil am Ende nur die Freiheit fehlt`,
  `[Bridge]\nUnd wenn die Nacht uns fragt, wohin\nDann folgen wir dem Klang tief in uns drin\nEin neuer Anfang, ein neuer Ton\nAus einem Traum wird eine Melodie`
 ];
 return `TITEL: ${subject.slice(0,45)}\nSTIL: ${style}\n\n${lines.join("\n\n")}\n\n[Outro]\nOh-oh, wir bleiben nicht steh'n …`;
}
$("writeLyrics").onclick=()=>{
 const text=createLyrics($("lyricIdea").value,$("lyricStyle").value,$("lyricLanguage").value);
 $("lyricsOutput").textContent=text;
};
$("copyLyrics").onclick=async()=>{await navigator.clipboard.writeText($("lyricsOutput").innerText);$("copyLyrics").textContent="Kopiert ✓";setTimeout(()=>$("copyLyrics").textContent="Text kopieren",1600)};
$("generatorForm").onsubmit=async e=>{
 e.preventDefault();
 const btn=$("generateBtn"),result=$("generationResult");
 const instrumental=$("vocals").value==="Instrumental";
 const lyrics=$("songLyrics").value.trim();
 if(!instrumental&&lyrics.length<10){result.innerHTML='<div class="result-title">LIEDTEXT FEHLT</div><p>Bitte füge einen Liedtext mit Strophe und Refrain ein. Du kannst ihn links unter „Songtexte“ erstellen.</p>';return;}
 btn.disabled=true;btn.textContent="✧ Anfrage wird gestartet …";
 result.innerHTML='<div class="result-title">KI GENERIERT DEINEN SONG</div><p>Verbindung zum Musikdienst wird hergestellt …</p>';
 try{
  const response=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
   prompt:$("songPrompt").value,lyrics,genre:$("genre").value,mood:$("mood").value,
   vocals:$("vocals").value,duration:Number($("duration").value),instrumental,
   language:$("songLanguage").value,title:$("songTitle").value||"Mein KI-Song"
  })});
  const data=await response.json();
  if(!response.ok)throw new Error(data.error||"Generierung nicht verfügbar.");
  result.innerHTML='<div class="result-title">GENERIERUNG LÄUFT</div><p>Dein Song wird erstellt. Status: <b id="jobStatus">starting</b></p>';
  let status=data.status||"starting",job={};
  for(let i=0;i<180&&!['succeeded','failed','canceled'].includes(status);i++){
   await new Promise(r=>setTimeout(r,4000));
   const poll=await fetch(data.pollUrl);job=await poll.json();if(!poll.ok)throw new Error(job.error||"Statusabfrage fehlgeschlagen.");
   status=job.status;const statusNode=$("jobStatus");if(statusNode)statusNode.textContent=status;
  }
  if(status==="succeeded"){
   const outputs=Array.isArray(job.output)?job.output:[job.output];
   const urls=outputs.map(x=>typeof x==="string"?x:x?.url).filter(x=>typeof x==="string"&&/^https:\/\//.test(x));
   if(!urls.length)throw new Error("Die KI hat keinen abspielbaren Audio-Link zurückgegeben.");
   result.innerHTML='<div class="result-title">DEIN SONG IST FERTIG</div>'+urls.map(url=>`<audio controls src="${escapeHtml(url)}" style="width:100%;margin:10px 0"></audio><a href="${escapeHtml(url)}" target="_blank" rel="noopener">Audio herunterladen ↗</a>`).join("<br>");
  }else if(status==="failed"||status==="canceled")throw new Error(job.error||"Die Generierung wurde beendet.");
  else throw new Error("Die Generierung dauert länger. Öffne deine Song-Anfrage später erneut.");
 }catch(err){result.innerHTML=`<div class="result-title">HINWEIS</div><p>${escapeHtml(err.message)}</p>`}
 finally{btn.disabled=false;btn.innerHTML='✧ Song mit KI generieren <span>→</span>'}
};
async function health(){
 try{const r=await fetch("/api/health"),d=await r.json();$("serviceStatus").textContent=d.generationConfigured?"KI-Dienst verbunden":"Studio bereit · KI-API nicht konfiguriert"}
 catch{$("serviceStatus").textContent="Offline-Modus"}
}
renderTracks();health();saveProject();
