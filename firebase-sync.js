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
