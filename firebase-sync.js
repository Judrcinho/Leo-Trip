import {initializeApp} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import {getFirestore,doc,getDoc,onSnapshot,setDoc} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';
const app=initializeApp({apiKey:"AIzaSyDRHDEclE5c5MBQ2O6bHSVYyCUtN_G_XnY",authDomain:"leo-trip.firebaseapp.com",projectId:"leo-trip",storageBucket:"leo-trip.firebasestorage.app",messagingSenderId:"498989067615",appId:"1:498989067615:web:e6a99081132eebc9695aea"});
const db=getFirestore(app),ref=doc(db,'trips','leo-blue-mountains'),msg=document.getElementById('sync-message');
let ready=false,busy=false,writeQueue=Promise.resolve(),unsubscribe,localVersion=0,remoteVersion=0;
function say(s){msg.textContent=s}
function saveLocalChange(){
 localVersion++;
 if(!ready){say('Not connected to Firestore — changes saved on this phone only');return}
 const data=window.leoSyncBridge.read();
 const version=localVersion;
 say('Saving to cloud…');
 writeQueue=writeQueue.then(async()=>{
  await setDoc(ref,{...data,updatedAt:Date.now()});
  if(version===localVersion)say('Saved to cloud ✓');
 }).catch(e=>say('Sync failed: '+e.message+'. Changes are still on this phone.'));
}
window.addEventListener('leo-local-change',saveLocalChange);
async function start(){
 try{
  say('Connecting to Firestore…');
  const first=await getDoc(ref);
  if(first.exists()){
   busy=true;window.leoSyncBridge.apply(first.data());busy=false;
  }else{
   await setDoc(ref,{...window.leoSyncBridge.read(),updatedAt:Date.now()});
  }
  unsubscribe=onSnapshot(ref,{includeMetadataChanges:true},snap=>{
   if(!snap.exists()||!ready)return;
   if(snap.metadata.hasPendingWrites){say('Saving to cloud…');return}
   if(localVersion>remoteVersion){remoteVersion=localVersion;say('Saved to cloud ✓');return}
   busy=true;window.leoSyncBridge.apply(snap.data());busy=false;
   say(snap.metadata.fromCache?'Offline — showing cached checklist':'Synced across phones ✓');
  },e=>{ready=false;say('Sync failed: '+e.message)});
  ready=true;say('Connected to Firestore ✓');
 }catch(e){busy=false;ready=false;say('Firestore connection failed: '+e.message+'. Changes save only on this phone.')}
}
start();

/* Mobile packing: tap anywhere on a row to toggle its packed state. */
const tapStyle=document.createElement('style');
tapStyle.textContent='.item{cursor:pointer}.item:focus-visible{outline:3px solid #2e867d;outline-offset:2px}.item>span:first-child{font-size:23px;font-weight:800}.item[data-status="packed"]>span:first-child{color:#25836d}@media(max-width:640px){.item .name{font-size:17px;line-height:1.45}}';
document.head.appendChild(tapStyle);
function togglePackingCard(card){
 const select=card.querySelector('select.status');
 if(!select||!window.leoSyncBridge)return;
 const group=decodeURIComponent(select.dataset.group),item=decodeURIComponent(select.dataset.item);
 const data=window.leoSyncBridge.read();
 const id=group+'|'+item;
 data.statuses[id]=select.value==='packed'?'todo':'packed';
 window.leoSyncBridge.apply(data);
 window.dispatchEvent(new Event('leo-local-change'));
}
document.addEventListener('click',event=>{
 const card=event.target.closest('.item');
 if(!card||event.target.closest('button,select,option'))return;
 togglePackingCard(card);
});
document.addEventListener('keydown',event=>{
 if(event.key!=='Enter'&&event.key!==' ')return;
 const card=event.target.closest('.item');
 if(!card||event.target!==card)return;
 event.preventDefault();togglePackingCard(card);
});
const watchCards=new MutationObserver(()=>{
 document.querySelectorAll('.item').forEach(card=>{
  if(card.hasAttribute('tabindex'))return;
  card.tabIndex=0;card.setAttribute('role','checkbox');
  card.setAttribute('aria-checked',String(card.dataset.status==='packed'));
  const indicator=card.querySelector('span:first-child');
  if(indicator)indicator.textContent=card.dataset.status==='packed'?'✓':card.dataset.status==='progress'?'◐':'○';
 });
});
watchCards.observe(document.getElementById('categories'),{childList:true,subtree:true});
watchCards.takeRecords();
document.querySelectorAll('.item').forEach(card=>{card.tabIndex=0;card.setAttribute('role','checkbox');card.setAttribute('aria-checked',String(card.dataset.status==='packed'));const indicator=card.querySelector('span:first-child');if(indicator)indicator.textContent=card.dataset.status==='packed'?'✓':card.dataset.status==='progress'?'◐':'○'});
