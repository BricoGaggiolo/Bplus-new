/* B+ production finalization: removes test UI markers and keeps the deployed build explicit. */
(function(){
  'use strict';
  function finalize(){
    try{
      document.title='B+ Gestionale HR';
      document.querySelectorAll('.muted').forEach(function(el){
        if((el.textContent||'').trim()==='Versione stabile di test') el.textContent='Gestione HR';
      });
    }catch(e){}
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',finalize,{once:true});
  else finalize();
})();
