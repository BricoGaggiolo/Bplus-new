/* B+ production auth bridge — Supabase Auth + WebAuthn Passkeys. */
(function(){
  'use strict';
  const URL='https://ystiqoorxohqgrwefmgv.supabase.co';
  const KEY='sb_publishable_Fcs5BU8QxytiUkfpe8Ii-A_UVlOulz_';
  const VERSION='2.105.0';
  let clientPromise=null;
  async function client(){
    if(clientPromise)return clientPromise;
    clientPromise=import('https://esm.sh/@supabase/supabase-js@2.105.0').then(({createClient})=>createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,experimental:{passkey:true}}}));
    return clientPromise;
  }
  async function signIn(email,password){const s=await client();return s.auth.signInWithPassword({email,password})}
  async function signUp(email,password,meta={}){const s=await client();return s.auth.signUp({email,password,options:{data:meta}})}
  async function updatePassword(password){const s=await client();return s.auth.updateUser({password})}
  async function registerPasskey(){const s=await client();return s.auth.registerPasskey()}
  async function signInPasskey(){const s=await client();return s.auth.signInWithPasskey()}
  async function getSession(){const s=await client();return s.auth.getSession()}
  async function signOut(){const s=await client();return s.auth.signOut()}
  async function listPasskeys(){const s=await client();return s.auth.passkey.list()}
  window.BPlusAuth={version:VERSION,client,signIn,signUp,updatePassword,registerPasskey,signInPasskey,getSession,signOut,listPasskeys};
})();
