/* B+ - Orario punto vendita: continuo = nessuna pausa pranzo. */
(function(){
  'use strict';
  const norm=s=>(s||'').toString().trim().toLowerCase().replace(/à/g,'a').replace(/è/g,'e');
  function isContinuousSelect(el){
    if(!el || el.tagName!=='SELECT') return false;
    return Array.from(el.options||[]).some(o=>/continuato|continuo/.test(norm(o.textContent)));
  }
  function findModeSelect(){
    return Array.from(document.querySelectorAll('select')).find(isContinuousSelect);
  }
  function setVisible(el,show){
    const row=el.closest('label')||el.closest('.form-group')||el.parentElement;
    if(row) row.style.display=show?'':'none';
  }
  function update(){
    const mode=findModeSelect();
    if(!mode) return;
    const selected=norm(mode.options[mode.selectedIndex]?.textContent);
    const continuous=/continuato|continuo/.test(selected);
    Array.from(document.querySelectorAll('input,select,textarea')).forEach(el=>{
      if(el===mode) return;
      const label=norm(el.closest('label')?.textContent || el.parentElement?.textContent || '');
      if(/pausa pranzo|pausa|intervallo/.test(label)){
        setVisible(el,!continuous);
        if(continuous){
          if(el.type==='checkbox') el.checked=false;
          else el.value='';
        }
      }
    });
  }
  document.addEventListener('change',e=>{ if(e.target?.tagName==='SELECT') setTimeout(update,0); });
  new MutationObserver(()=>setTimeout(update,0)).observe(document.body,{childList:true,subtree:true});
  setTimeout(update,300);
  setTimeout(update,1000);
})();
