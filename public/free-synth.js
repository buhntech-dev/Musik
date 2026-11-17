// Kostenlose, synthetische Singstimme – Audio wird direkt im Browser gerendert.
(function(){
 const $=id=>document.getElementById(id);
 function wavBlob(buffer){
  const ch=buffer.numberOfChannels,n=buffer.length,rate=buffer.sampleRate,size=44+n*ch*2,v=new DataView(new ArrayBuffer(size));
  const str=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i));};
  str(0,"RIFF");v.setUint32(4,size-8,true);str(8,"WAVE");str(12,"fmt ");v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,ch,true);v.setUint32(24,rate,true);v.setUint32(28,rate*ch*2,true);v.setUint16(32,ch*2,true);v.setUint16(34,16,true);str(36,"data");v.setUint32(40,n*ch*2,true);
  let p=44;for(let i=0;i<n;i++)for(let c=0;c<ch;c++){let x=Math.max(-1,Math.min(1,buffer.getChannelData(c)[i]));v.setInt16(p,x<0?x*32768:x*32767,true);p+=2;}
  return new Blob([v],{type:"audio/wav"});
 }
 function syllables(text){
  let words=String(text||"la la").replace(/\[[^\]]*\]/g," ").replace(/[^\p{L}\s]/gu," ").split(/\s+/).filter(Boolean),out=[];
  words.forEach(w=>{let parts=w.toLowerCase().match(/[^aeiouyäöü]*[aeiouyäöü]+(?:[^aeiouyäöü]*$)?|[^aeiouyäöü]+$/g)||[w];parts.forEach(x=>out.push((x.match(/[aeiouyäöü]/)||["a"])[0]));});
  return out.length?out:["a","a","a"];
 }
 async function render(data){
  let seconds=Math.max(10,Math.min(180,Number(data.duration)||30)),rate=22050,Offline=window.OfflineAudioContext||window.webkitOfflineAudioContext;
  if(!Offline)throw Error("Bitte verwende einen aktuellen Browser wie Chrome, Edge oder Firefox.");
  let ctx=new Offline(2,Math.floor(seconds*rate),rate),master=ctx.createGain();master.gain.value=.8;master.connect(ctx.destination);
  let syl=syllables(data.lyrics||data.prompt),count=Math.min(500,Math.max(24,Math.floor(seconds*2.2))),step=seconds/count;
  let base=data.vocals==="Männliche Stimme"?130.81:174.61,scale=[0,2,4,7,9,7,4,2],formants={a:[800,1150,2900],e:[530,1840,2480],i:[270,2290,3010],o:[570,840,2410],u:[300,870,2240],ä:[700,1700,2600],ö:[500,1000,2300],ü:[350,1800,2500],y:[350,1800,2500]};
  if(!data.instrumental)for(let i=0;i<count;i++){
   let t=i*step,dur=step*.88,note=base*Math.pow(2,scale[i%8]/12)*Math.pow(2,(Math.floor(i/8)%2)*2/12),vowel=syl[i%syl.length],osc=ctx.createOscillator(),mix=ctx.createGain(),env=ctx.createGain();
   osc.type="sawtooth";osc.frequency.value=note;mix.gain.value=.35;
   (formants[vowel]||formants.a).forEach((f,j)=>{let filter=ctx.createBiquadFilter(),g=ctx.createGain();filter.type="bandpass";filter.frequency.value=f;filter.Q.value=2.5;g.gain.value=j===0?1:j===1?.55:.2;osc.connect(filter);filter.connect(g);g.connect(mix);});
   env.gain.setValueAtTime(.0001,t);env.gain.linearRampToValueAtTime(.12,t+.035);env.gain.setValueAtTime(.08,t+dur*.7);env.gain.linearRampToValueAtTime(.0001,t+dur);
   mix.connect(env);env.connect(master);osc.start(t);osc.stop(t+dur+.01);
  }
  let chordRoots=[110,146.83,130.81,164.81],chord=[0,4,7];
  for(let bar=0;bar<Math.ceil(seconds/2);bar++){
   let t=bar*2,root=chordRoots[bar%4];
   chord.forEach(semi=>{let o=ctx.createOscillator(),g=ctx.createGain(),f=ctx.createBiquadFilter();o.type="triangle";o.frequency.value=root*Math.pow(2,semi/12);f.type="lowpass";f.frequency.value=850;g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.018,t+.15);g.gain.setValueAtTime(.012,Math.min(seconds,t+1.7));g.gain.linearRampToValueAtTime(.0001,Math.min(seconds,t+1.95));o.connect(f);f.connect(g);g.connect(master);o.start(t);o.stop(Math.min(seconds,t+2));});
   let b=ctx.createOscillator(),bg=ctx.createGain();b.type="sine";b.frequency.value=root/2;bg.gain.setValueAtTime(.0001,t);bg.gain.linearRampToValueAtTime(.04,t+.02);bg.gain.exponentialRampToValueAtTime(.0001,Math.min(seconds,t+.5));b.connect(bg);bg.connect(master);b.start(t);b.stop(Math.min(seconds,t+.51));
  }
  return URL.createObjectURL(wavBlob(await ctx.startRendering()));
 }
 const form=$("generatorForm");if(!form)return;
 form.onsubmit=async function(e){
  e.preventDefault();let btn=$("generateBtn"),out=$("generationResult"),instrumental=$("vocals").value==="Instrumental",lyrics=$("songLyrics").value.trim();
  if(!instrumental&&lyrics.length<10){out.innerHTML="<p>Bitte füge mindestens 10 Zeichen Liedtext ein.</p>";return;}
  btn.disabled=true;btn.textContent="✧ Song wird erstellt …";out.innerHTML="<p>Die kostenlose elektronische Singstimme wird in deinem Browser erzeugt …</p>";
  try{
   let response=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:$("songPrompt").value,lyrics:lyrics,genre:$("genre").value,mood:$("mood").value,vocals:$("vocals").value,duration:Number($("duration").value),instrumental:instrumental,language:$("songLanguage").value,title:$("songTitle").value||"Mein KI-Song"})});
   let data=await response.json();if(!response.ok)throw Error(data.error||"Song konnte nicht gestartet werden.");
   if(data.mode!=="free-synth")throw Error("Der externe Musikdienst ist aktiv. Bitte verwende dessen Generierungsstatus.");
   let url=await render(data),safe=(data.title||"Mein-KI-Song").replace(/[^a-z0-9äöüß _-]/gi,"");
   out.innerHTML="<div class=\"result-title\">DEIN KOSTENLOSER SYNTH-SONG IST FERTIG</div><p>Elektronische Singstimme · direkt im Browser erzeugt · keine API-Gebühren</p><audio controls src=\""+url+"\" style=\"width:100%;margin:10px 0\"></audio><a href=\""+url+"\" download=\""+safe+".wav\">Song als WAV herunterladen ↗</a>";
  }catch(err){out.textContent="Fehler: "+err.message;}
  finally{btn.disabled=false;btn.innerHTML="✧ Song mit KI generieren <span>→</span>";}
 };
})();
