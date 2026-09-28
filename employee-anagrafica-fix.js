(()=>{
'use strict';
const DB='bplus_new_v2';
const DAYS=[['1','Lunedì'],['2','Martedì'],['3','Mercoledì'],['4','Giovedì'],['5','Venerdì'],['6','Sabato'],['0','Domenica']];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function readDB(){try{return JSON.parse(localStorage.getItem(DB)||'{}')}catch{return{}}}
function saveDB(db){localStorage.setItem(DB,JSON.stringify(db));window.dispatchEvent(new StorageEvent('storage',{key:DB,newValue:JSON.stringify(db)}));}
function employees(){const db=readDB();return Array.isArray(db.employees)?db.employees:[]}
function getIdFromText(root){
  const all=employees();
  const email=[...root.querySelectorAll('input')].map(x=>x.value||'').find(v=>v.includes('@'));
  if(email){const u=all.find(x=>(x.email||'').toLowerCase()===email.toLowerCase());if(u)return u.id}
  const txt=(root.innerText||'').toLowerCase();
  let u=all.find(x=>{const n=((x.nome||'')+' '+(x.cognome||'')).trim().toLowerCase();return n&&txt.includes(n)});
  return u?.id??null;
}
function getUser(id){return employees().find(x=>String(x.id)===String(id))}
function setUser(id,patch){const db=readDB();db.employees=(db.employees||[]).map(x=>String(x.id)===String(id)?{...x,...patch}:x);saveDB(db)}
function ensureDefaults(u){
 return {...u,
   pausaTipo:u.pausaTipo||u.tipoPausa||'flessibile',
   pausaFissaInizio:u.pausaFissaInizio||u.pausaInizio||'12:00',
   pausaFissaFine:u.pausaFissaFine||u.pausaFine||'13:30',
   pausaDurataMin:Number(u.pausaDurataMin||u.durataPausa||60),
   riposoFissoGiorni:Array.isArray(u.riposoFissoGiorni)?u.riposoFissoGiorni:(u.giornoRiposo?[String(u.giornoRiposo)]:[]),
   riposoCompensativoDomenica:Array.isArray(u.riposoCompensativoDomenica)?u.riposoCompensativoDomenica:[]
 };
}
function style(){if(document.getElementById('bplus-employee-fix-style'))return;const s=document.createElement('style');s.id='bplus-employee-fix-style';s.textContent=`
#bplus-employee-fix{margin-top:12px}#bplus-employee-fix .bef-tabs{display:flex;gap:6px;overflow:auto;margin-bottom:12px}#bplus-employee-fix button,#bplus-employee-fix input,#bplus-employee-fix select{min-height:44px}#bplus-employee-fix .bef-tab{background:#30343a;color:#ddd;border:1px solid #454a52;border-radius:9px;padding:9px 12px;white-space:nowrap;cursor:pointer}#bplus-employee-fix .bef-tab.active{background:#c62828;color:#fff}#bplus-employee-fix .bef-card{background:rgba(255,255,255,.035);border:1px solid #3a3f46;border-radius:12px;padding:12px;margin-bottom:10px}.bef-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.bef-field label{display:block;font-size:12px;color:#aaa;margin-bottom:5px}.bef-field input,.bef-field select{width:100%;background:#292d33;color:#fff;border:1px solid #454a52;border-radius:8px;padding:9px}.bef-checks{display:flex;flex-wrap:wrap;gap:7px}.bef-check{display:flex;align-items:center;gap:6px;background:#292d33;border-radius:8px;padding:7px 9px}.bef-check input{min-height:20px;width:20px}.bef-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:12px}.bef-save{background:#2e9b58;color:#fff;border:0;border-radius:9px;padding:10px 14px}.bef-muted{color:#999;font-size:12px}.bef-danger{color:#ff9b9b}.bef-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 0;border-bottom:1px solid #353a40}.bef-add{background:#2878d7;color:#fff;border:0;border-radius:8px;padding:9px 12px}.bef-remove{background:#63333a;color:#fff;border:0;border-radius:8px;padding:7px 10px}@media(max-width:768px){.bef-grid{grid-template-columns:1fr}.bef-actions{position:sticky;bottom:0;background:#1a1c20;padding-top:8px}}
`;document.head.appendChild(s)}
function findHost(){
 const candidates=[...document.querySelectorAll('[role="dialog"],.modal,.dialog')].filter(x=>getComputedStyle(x).display!=='none');
 return candidates.find(x=>/anagrafica|dipendente|lavoratore/i.test(x.innerText||''))||null;
}
function render(id,tab,host){
 const u=ensureDefaults(getUser(id));if(!u)return;
 let box=document.getElementById('bplus-employee-fix');if(!box){box=document.createElement('div');box.id='bplus-employee-fix';host.appendChild(box)}
 box.innerHTML=`<div class="bef-tabs"><button class="bef-tab ${tab==='anagrafica'?'active':''}" data-bef-tab="anagrafica">Anagrafica</button><button class="bef-tab ${tab==='contratto'?'active':''}" data-bef-tab="contratto">Contratto &amp; Turni</button><button class="bef-tab ${tab==='assenze'?'active':''}" data-bef-tab="assenze">Assenze</button></div><div id="bef-body"></div>`;
 const body=box.querySelector('#bef-body');
 box.querySelectorAll('[data-bef-tab]').forEach(b=>b.onclick=()=>render(id,b.dataset.befTab,host));
 if(tab==='anagrafica'){
  body.innerHTML=`<div class="bef-card"><div class="bef-grid"><div class="bef-field"><label>Nome</label><input id="bef-nome" value="${esc(u.nome)}"></div><div class="bef-field"><label>Cognome</label><input id="bef-cognome" value="${esc(u.cognome)}"></div><div class="bef-field"><label>Email</label><input id="bef-email" type="email" value="${esc(u.email)}"></div><div class="bef-field"><label>Telefono</label><input id="bef-tel" value="${esc(u.telefono)}"></div></div><div class="bef-actions"><button class="bef-save" id="bef-save-an">Salva anagrafica</button></div></div>`;
  body.querySelector('#bef-save-an').onclick=()=>{setUser(id,{nome:body.querySelector('#bef-nome').value.trim(),cognome:body.querySelector('#bef-cognome').value.trim(),email:body.querySelector('#bef-email').value.trim(),telefono:body.querySelector('#bef-tel').value.trim()});alert('Anagrafica salvata');};
 } else if(tab==='contratto'){
  const fixed=u.pausaTipo==='fissa';
  const rest=new Set((u.riposoFissoGiorni||[]).map(String)),comp=new Set((u.riposoCompensativoDomenica||[]).map(String));
  body.innerHTML=`<div class="bef-card"><h3>Tipo di pausa</h3><div class="bef-grid"><div class="bef-field"><label>Modalità</label><select id="bef-pausa"><option value="fissa" ${fixed?'selected':''}>Fissa</option><option value="flessibile" ${!fixed?'selected':''}>Flessibile</option></select></div><div id="bef-pausa-extra"></div></div><p class="bef-muted">Fissa: imposta un intervallo, ad esempio 12:00–13:30. Flessibile: indica la durata, ad esempio 60 minuti.</p></div><div class="bef-card"><h3>Riposo fisso settimanale</h3><p class="bef-muted">Puoi selezionare più giorni.</p><div class="bef-checks">${DAYS.map(([v,n])=>`<label class="bef-check"><input type="checkbox" data-rest="${v}" ${rest.has(v)?'checked':''}>${n}</label>`).join('')}</div></div><div class="bef-card"><h3>Riposo compensativo se lavora la domenica</h3><p class="bef-muted">Seleziona uno o più giorni possibili della stessa settimana. Devono essere diversi dai giorni di riposo fisso.</p><div class="bef-checks">${DAYS.filter(([v])=>v!=='0').map(([v,n])=>`<label class="bef-check"><input type="checkbox" data-comp="${v}" ${comp.has(v)?'checked':''}>${n}</label>`).join('')}</div></div><div class="bef-actions"><button class="bef-save" id="bef-save-contract">Salva Contratto &amp; Turni</button></div>`;
  const extra=body.querySelector('#bef-pausa-extra');
  function pauseUI(){const isF=body.querySelector('#bef-pausa').value==='fissa';extra.innerHTML=isF?`<div class="bef-grid"><div class="bef-field"><label>Inizio pausa</label><input id="bef-p1" type="time" value="${esc(u.pausaFissaInizio)}"></div><div class="bef-field"><label>Fine pausa</label><input id="bef-p2" type="time" value="${esc(u.pausaFissaFine)}"></div></div>`:`<div class="bef-field"><label>Durata pausa (minuti)</label><input id="bef-pdur" type="number" min="1" step="1" value="${Number(u.pausaDurataMin)||60}"></div>`}
  body.querySelector('#bef-pausa').onchange=pauseUI;pauseUI();
  body.querySelector('#bef-save-contract').onclick=()=>{const isF=body.querySelector('#bef-pausa').value==='fissa';const restDays=[...body.querySelectorAll('[data-rest]:checked')].map(x=>x.dataset.rest);const compDays=[...body.querySelectorAll('[data-comp]:checked')].map(x=>x.dataset.comp).filter(v=>!restDays.includes(v));const patch={pausaTipo:isF?'fissa':'flessibile',riposoFissoGiorni:restDays,riposoCompensativoDomenica:compDays};if(isF){patch.pausaFissaInizio=body.querySelector('#bef-p1').value;patch.pausaFissaFine=body.querySelector('#bef-p2').value}else patch.pausaDurataMin=Number(body.querySelector('#bef-pdur').value)||60;setUser(id,patch);alert('Contratto & Turni salvato');};
 } else {
  const abs=Array.isArray(u.assenze)?u.assenze:[];
  body.innerHTML=`<div class="bef-card"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><div><h3>Assenze del lavoratore</h3><p class="bef-muted">Inserisci e visualizza lo storico senza uscire dalla scheda.</p></div><button class="bef-add" id="bef-add-absence">+ Inserisci</button></div><div id="bef-abs-list"></div></div>`;
  const list=body.querySelector('#bef-abs-list');list.innerHTML=abs.length?abs.map((a,i)=>`<div class="bef-row"><div><b>${esc(a.tipo||'Assenza')}</b><div class="bef-muted">${esc(a.inizio||a.data||'')} ${a.fine?'→ '+esc(a.fine):''}${a.note?' · '+esc(a.note):''}</div></div><button class="bef-remove" data-del="${i}">Elimina</button></div>`).join(''):'<p class="bef-muted">Nessuna assenza registrata.</p>';
  list.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{const arr=ensureDefaults(getUser(id)).assenze||[];arr.splice(Number(b.dataset.del),1);setUser(id,{assenze:arr});render(id,'assenze',host)});
  body.querySelector('#bef-add-absence').onclick=()=>{const tipo=prompt('Tipo assenza: Ferie, Permesso, Malattia, Corso, altro','Ferie');if(!tipo)return;const inizio=prompt('Data inizio (YYYY-MM-DD)',new Date().toISOString().slice(0,10));if(!inizio)return;const fine=prompt('Data fine (YYYY-MM-DD)',inizio);const note=prompt('Note','');const arr=[...(ensureDefaults(getUser(id)).assenze||[]),{tipo,inizio,fine: fine||inizio,note,stato:'approvata'}];setUser(id,{assenze:arr});render(id,'assenze',host)};
 }
}
function boot(){style();let lastHost=null,lastId=null;const scan=()=>{const host=findHost();if(!host){lastHost=null;lastId=null;return}const id=getIdFromText(host);if(!id)return;if(host===lastHost&&id===lastId&&document.getElementById('bplus-employee-fix'))return;lastHost=host;lastId=id;render(id,'anagrafica',host)};new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});setInterval(scan,800);scan();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
