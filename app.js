const noteDefs=[
["G",196],["A",220],["B",246.94],["C",261.63],["D",293.66],["E",329.63],["F",349.23],
["G",392],["A",440],["B",493.88],["C",523.25],["D",587.33],["E",659.25],["F",698.46],
["G",783.99],["A",880],["B",987.77],["C",1046.5],["D",1174.66],["E",1318.51],["F",1396.91],
["G",1567.98],["A",1760]
];
const keys=document.getElementById("keys");
const statusEl=document.getElementById("status");
const lastNote=document.getElementById("lastNote");
let ctx=null, master=null, volume=.72, sequenceTimer=null, recording=false, recordEvents=[];
function setupAudio(){
  if(!ctx){ctx=new (window.AudioContext||window.webkitAudioContext)();master=ctx.createGain();master.gain.value=volume;master.connect(ctx.destination);}
  if(ctx.state==="suspended")ctx.resume();
}
function playTone(freq,label){
  setupAudio();
  const now=ctx.currentTime;
  const out=ctx.createGain();out.gain.setValueAtTime(0.0001,now);out.gain.exponentialRampToValueAtTime(.65,now+.012);out.gain.exponentialRampToValueAtTime(.0001,now+1.05);out.connect(master);
  // Plucked wooden-bar approximation: slightly inharmonic partials and a soft mallet transient.
  [[1,1],[2.01,.24],[3.97,.09],[5.43,.025]].forEach(([ratio,amp],i)=>{
    const osc=ctx.createOscillator(),g=ctx.createGain();
    osc.type="sine";osc.frequency.setValueAtTime(freq*ratio,now);
    g.gain.value=amp;osc.connect(g);g.connect(out);osc.start(now);osc.stop(now+1.08);
  });
  lastNote.textContent=label;statusEl.textContent="កំពុងលេង "+label;
  if(recording)recordEvents.push({note:label,time:performance.now()});
}
function flash(id){
 const el=document.querySelector(`[data-id="${id}"]`);if(!el)return;
 el.classList.add("active");setTimeout(()=>el.classList.remove("active"),140);
}
noteDefs.forEach(([label,freq],id)=>{
 const b=document.createElement("button");b.className="key";b.dataset.id=id;
 b.setAttribute("aria-label",`លេងណូត ${label}`);
 b.innerHTML=`<span class="key-label">${label}</span><span class="bar"></span>`;
 const trigger=(e)=>{e.preventDefault();playTone(freq,`${label} · ${id+1}`);flash(id);};
 b.addEventListener("pointerdown",trigger);
 keys.appendChild(b);
});
document.getElementById("volume").addEventListener("input",e=>{volume=Number(e.target.value);if(master)master.gain.setTargetAtTime(volume,ctx.currentTime,.02);});
document.getElementById("playScale").addEventListener("click",()=>{
 stopScale();let i=0;statusEl.textContent="កំពុងលេងសូរេក្រម";
 sequenceTimer=setInterval(()=>{if(i>=noteDefs.length){stopScale();return;}const [n,f]=noteDefs[i];playTone(f,n);flash(i);i++;},260);
});
function stopScale(){if(sequenceTimer){clearInterval(sequenceTimer);sequenceTimer=null;}statusEl.textContent="ត្រៀមលេង";}
document.getElementById("stopScale").addEventListener("click",stopScale);
document.getElementById("recordBtn").addEventListener("click",()=>{
 recording=!recording;recordEvents=[];
 const btn=document.getElementById("recordBtn");
 if(recording){btn.textContent="■ បញ្ចប់ថត";btn.style.background="#762b22";statusEl.textContent="កំពុងកត់ត្រាលំដាប់ណូត";}
 else{btn.textContent="● ថតលេង";btn.style.background="";statusEl.textContent=`បានកត់ត្រា ${recordEvents.length} ណូត`;const blob=new Blob([JSON.stringify(recordEvents,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="roneat-sequence.json";a.click();URL.revokeObjectURL(a.href);}
});
const dlg=document.getElementById("helpDialog");
document.getElementById("helpBtn").onclick=()=>dlg.showModal();
document.getElementById("closeHelp").onclick=()=>dlg.close();
let deferredPrompt=null;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;document.getElementById("installBtn").hidden=false;});
document.getElementById("installBtn").addEventListener("click",async()=>{if(deferredPrompt){deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;}});
if("serviceWorker" in navigator && location.protocol.startsWith("http"))navigator.serviceWorker.register("./sw.js").catch(()=>{});
