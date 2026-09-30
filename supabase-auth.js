/* B+ secure auth bridge — Supabase Auth + Passkeys. */
(function(){
  const URL='https://ystiqoorxohqgrwefmgv.supabase.co';
  const KEY='sb_publishable_Fcs5BU8QxytiUkfpe8Ii-A_UVlOulz_';
  const VERSION='2.105.0';
  window.BPlusAuth={
    load:async function(){
      if(window.supabaseClient)return window.supabaseClient;
      if(!window.supabase){await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@'+VERSION+'/dist/umd/supabase.min.js';s.onload=resolve;s.onerror=reject;document.head.appendChild(s)});}
      window.supabaseClient=window.supabase.createClient(URL,KEY,{auth:{autoRefreshToken:true,persistSession:true,detectSessionInUrl:false,experimental:{passkey:true}}});
      return window.supabaseClient;
    },
    signIn:async function(email,password){const s=await this.load();return s.auth.signInWithPassword({email,password});},
    signUp:async function(email,password,meta){const s=await this.load();return s.auth.signUp({email,password,options:{data:meta||{}}});},
    updatePassword:async function(password){const s=await this.load();return s.auth.updateUser({password});},
    registerPasskey:async function(){const s=await this.load();if(!s.auth.registerPasskey)throw new Error('passkey_not_available');return s.auth.registerPasskey();},
    signInPasskey:async function(){const s=await this.load();if(!s.auth.signInWithPasskey)throw new Error('passkey_not_available');return s.auth.signInWithPasskey();},
    session:async function(){const s=await this.load();return s.auth.getSession();},
    signOut:async function(){const s=await this.load();return s.auth.signOut();}
  };
})();
