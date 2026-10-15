import {initializeApp} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import {getFirestore,doc,getDoc,onSnapshot,setDoc} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';
const app=initializeApp({apiKey:"AIzaSyDRHDEclE5c5MBQ2O6bHSVYyCUtN_G_XnY",authDomain:"leo-trip.firebaseapp.com",projectId:"leo-trip",storageBucket:"leo-trip.firebasestorage.app",messagingSenderId:"498989067615",appId:"1:498989067615:web:e6a99081132eebc9695aea"});
const db=getFirestore(app),ref=doc(db,'trips','leo-blue-mountains'),msg=document.getElementById('sync-message');
let ready=false,busy=false,writeQueue=Promise.resolve(),unsubscribe;
function say(s){msg.textContent=s}
window.addEventListener('leo-local-change',()=>{if(!ready||busy)return;const data=window.leoSyncBridge.read();writeQueue=writeQueue.then(()=>setDoc(ref,{...data,updatedAt:Date.now()})).catch(e=>say('Sync error: '+e.message))});
async function start(){
try{
const first=await getDoc(ref);
if(first.exists()){busy=true;window.leoSyncBridge.apply(first.data());busy=false}
else await setDoc(ref,{...window.leoSyncBridge.read(),updatedAt:Date.now()});
unsubscribe=onSnapshot(ref,snap=>{if(!snap.exists())return;const data=snap.data();busy=true;window.leoSyncBridge.apply(data);busy=false;say('Shared checklist connected ✓')},e=>{ready=false;say('Sync unavailable: '+e.message)});
ready=true;say('Shared checklist connected ✓');
}catch(e){busy=false;ready=false;say('Firestore access not ready: '+e.message+'. Local checklist still works.')}
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

/* Single clear completion control: no native dropdown or duplicate ticks. */
const simpleStyles=document.createElement('style');
simpleStyles.textContent='.item select.status{display:none!important}.item .progress-action{grid-column:2;grid-row:2;justify-self:start;min-height:46px;padding:10px 14px;border-radius:14px;border:1px solid #d7e5df;background:#f3f8f5;color:#387967;font-size:14px;font-weight:750;cursor:pointer}.item[data-status="progress"] .progress-action{background:#fff0d5;color:#97661b;border-color:#f0d49c}.item[data-status="packed"] .progress-action{background:#e6f4ec;color:#237b61}@media(max-width:640px){.item .progress-action{font-size:14px;min-height:50px}.item .name{line-height:1.5}}';
document.head.appendChild(simpleStyles);
function enhancePackingRows(){
 document.querySelectorAll('.item').forEach(card=>{
  if(card.querySelector('.progress-action'))return;
  const select=card.querySelector('select.status');
  if(!select)return;
  const action=document.createElement('button');
  action.type='button';action.className='progress-action';
  action.textContent=select.value==='progress'?'↩ To pack':'⏳ In progress';
  action.setAttribute('aria-label',select.value==='progress'?'Return item to To pack':'Mark item In progress');
  action.addEventListener('click',event=>{
   event.stopPropagation();
   const data=window.leoSyncBridge.read();
   const id=decodeURIComponent(select.dataset.group)+'|'+decodeURIComponent(select.dataset.item);
   data.statuses[id]=select.value==='progress'?'todo':'progress';
   window.leoSyncBridge.apply(data);
   window.dispatchEvent(new Event('leo-local-change'));
  });
  select.insertAdjacentElement('afterend',action);
 });
}
const simpleObserver=new MutationObserver(enhancePackingRows);
simpleObserver.observe(document.getElementById('categories'),{childList:true,subtree:true});
enhancePackingRows();
