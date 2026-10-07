(function(){
'use strict';
function norm(v){return String(v==null?'':v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
function findEmp(label){
  const n=norm(label); if(!n||!window.db||!Array.isArray(db.employees))return{emp:null,amb:[]};
  const all=db.employees.filter(Boolean);
  const exact=all.filter(e=>[
    e.nome+' '+e.cognome,e.cognome+' '+e.nome,e.nome,e.cognome,
    e.nome+' '+String(e.cognome||'').split(' ')[0],
    String(e.cognome||'').split(' ')[0]+' '+e.nome
  ].some(v=>norm(v)===n));
  if(exact.length===1)return{emp:exact[0],amb:[]};
  if(exact.length>1)return{emp:null,amb:exact};
  const tok=n.split(' ').filter(Boolean);
  const scored=all.map(e=>{
    const en=norm(e.nome),ec=norm(e.cognome),full=norm((e.nome||'')+' '+(e.cognome||''));let s=0;
    tok.forEach(t=>{if(en===t||ec===t)s+=10;else if(en.startsWith(t)||ec.startsWith(t))s+=6;else if(full.includes(t))s+=2});
    if(full===n)s+=20; return{e,s};
  }).filter(x=>x.s>0).sort((a,b)=>b.s-a.s);
  if(!scored.length)return{emp:null,amb:[]};
  const top=scored[0].s,near=scored.filter(x=>x.s===top).map(x=>x.e);
  return near.length===1?{emp:near[0],amb:[]}:{emp:null,amb:near};
}
function storeOf(v){
  const n=norm(v);
  if(!n)return null;
  const list=Array.isArray(window.STORES)?STORES:[['GAG','Gaggiolo'],['COC','Cocquio'],['DAV','Daverio'],['VAR','Varese']];
  for(const s of list)if(n===norm(s[0])||n===norm(s[1]))return s[0];
  if(n.includes('gaggiolo'))return'GAG';
  if(n.includes('cocquio'))return'COC';
  if(n.includes('daverio'))return'DAV';
  if(n.includes('varese'))return'VAR';
  return null;
}
function status(v){
  const n=norm(v);if(!n)return'';
  if(n==='x'||n==='turno'||n==='presenza')return'Turno';
  if(n==='riposo')return'Riposo';
  if(n==='rip comp'||n==='riposo comp'||n==='riposo compensativo')return'Riposo Comp.';
  if(n==='ferie')return'Ferie';
  if(n==='malattia')return'Malattia';
  if(n==='infortunio')return'Infortunio';
  const s=storeOf(v);return s||'';
}
function startOfWeek(no){
  const y=new Date().getFullYear(),d=new Date(Date.UTC(y,0,4)),day=d.getUTCDay()||7;
  d.setUTCDate(d.getUTCDate()-day+1+(Number(no)-1)*7);
  return d.toISOString().slice(0,10);
}
function parse(rows,fileName,weekNo){
  const week=startOfWeek(weekNo),dates=shiftWeekDates(week);
  const records=[],unmatched=[],ambiguous=[],unauthorized=[],closed=[],warnings=[];
  let currentStore='';
  for(let r=0;r<rows.length;r++){
    const row=rows[r]||[], vals=row.map(v=>String(v==null?'':v).trim());
    if(!vals.some(Boolean))continue;
    let rowStore='';
    for(const v of vals.slice(0,8)){const s=storeOf(v);if(s){rowStore=s;break}}
    const label=vals[0]||'';
    const match=findEmp(label);
    if(rowStore&&!match.emp){currentStore=rowStore;continue}
    if(!match.emp){
      const any=vals.slice(0,6).map(findEmp).find(x=>x.emp||x.amb.length);
      if(any&&any.emp)Object.assign(match,any);
      else if(any&&any.amb.length)match.amb=any.amb;
    }
    if(!match.emp){
      if(match.amb.length)ambiguous.push(label+' → '+match.amb.map(e=>(e.nome||'')+' '+(e.cognome||'')).join(', '));
      continue;
    }
    const e=match.emp,store=currentStore||rowStore||e.negozio||'';
    for(let d=0;d<7;d++){
      const cells=vals.slice(1+d*4,1+(d+1)*4).filter(Boolean);
      if(!cells.length)continue;
      let raw=cells.find(v=>status(v))||cells[0],type=status(raw);
      if(!type){
        const joined=cells.join(' ');
        if(/\d{1,2}[:.]\d{2}/.test(joined))type='Turno';
        else{warnings.push(label+' '+dates[d]+' · valore non riconosciuto: '+joined);continue}
      }
      let blockedReason='';
      if((type==='Turno'||type==='Riposo'||type==='Riposo Comp.')&&!store){
        warnings.push(label+' '+dates[d]+' · negozio non determinato');continue;
      }
      if(store&&type==='Turno'&&typeof eligibleForStore==='function'&&!eligibleForStore(e,store)){
        unauthorized.push(label+' · '+dates[d]+' → '+(typeof storeNameOf==='function'?storeNameOf(store):store));blockedReason='mobilita';
      }
      if(store&&typeof storeDay==='function'){const h=storeDay(store,dates[d]);if(h&&h.closed){closed.push((typeof storeNameOf==='function'?storeNameOf(store):store)+' · '+dates[d]+' · '+label);blockedReason=blockedReason||'chiuso'}}
      if(type==='Turno'&&typeof approvedAbsence==='function'&&approvedAbsence(e.id,dates[d]))blockedReason=blockedReason||'assenza';
      records.push({emp:e.id,date:dates[d],store,type,orarioDaDefinire:type==='Turno',raw,sourceRow:r+1,blockedReason});
    }
  }
  if(!records.length)throw new Error('Nessuna riga di turni riconosciuta nel file. Il modello deve avere i lavoratori nella prima colonna e 7 giorni con 4 colonne M/M/P/P.');
  return{week,weekNo:Number(weekNo),dates,records,unmatched,ambiguous,unauthorized,closed,warnings,fileName,storeLabels:[...new Set(records.map(x=>x.store).filter(Boolean))]};
}
window.readExcelWeek=function(input){
  const file=input&&input.files&&input.files[0];if(!file)return;
  if(typeof XLSX==='undefined'){alert('Lettore Excel non disponibile.');return}
  let weekNo=prompt('Numero settimana (1–53):');if(weekNo===null)return;
  weekNo=String(weekNo).trim();
  if(!/^\d{1,2}$/.test(weekNo)||+weekNo<1||+weekNo>53){alert('Numero settimana non valido. Inserisci un numero da 1 a 53.');input.value='';return}
  file.arrayBuffer().then(buf=>{
    try{
      const book=XLSX.read(buf,{type:'array',cellDates:false});
      let best=null;
      for(const name of book.SheetNames){
        const rows=XLSX.utils.sheet_to_json(book.Sheets[name],{header:1,defval:'',raw:false});
        if(!rows.length)continue;
        try{const p=parse(rows,file.name+' · '+name,+weekNo);if(!best||p.records.length>best.records.length)best=p}catch(e){}
      }
      if(!best)throw new Error('Nessuna riga di turni riconosciuta. Verifica il foglio Excel e il modello M/M/P/P.');
      window._excelImportPlan=best;
      renderExcelImportPreview(best);
    }catch(e){window._excelImportPlan=null;alert('Import Excel non riuscito: '+(e&&e.message||e))}
  }).catch(e=>alert('Impossibile leggere il file Excel: '+(e&&e.message||e)));
};
})();