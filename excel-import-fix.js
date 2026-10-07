(function(){
'use strict';
window.excelFindEmployee=function(label){
  const norm=window.excelNorm||function(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()};
  const n=norm(label); if(!n||!window.db||!Array.isArray(db.employees))return{emp:null,amb:[]};
  const all=db.employees.filter(Boolean);
  const names=e=>[e.nome+' '+e.cognome,e.cognome+' '+e.nome,e.nome,e.cognome].map(norm);
  const exact=all.filter(e=>names(e).includes(n));
  if(exact.length===1)return{emp:exact[0],amb:[]};
  if(exact.length>1)return{emp:null,amb:exact};
  const tokens=n.split(' ').filter(Boolean);
  const scored=all.map(e=>{
    const en=norm(e.nome),ec=norm(e.cognome),full=norm((e.nome||'')+' '+(e.cognome||''));
    let score=0;
    tokens.forEach(t=>{if(en===t||ec===t)score+=10;else if(en.startsWith(t)||ec.startsWith(t))score+=6;else if(full.includes(t))score+=2});
    if(full===n)score+=20;
    return{e,score};
  }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
  if(!scored.length)return{emp:null,amb:[]};
  const top=scored[0].score,near=scored.filter(x=>x.score===top).map(x=>x.e);
  return near.length===1?{emp:near[0],amb:[]}:{emp:null,amb:near};
};
})();