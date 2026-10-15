import {initializeApp} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import {getAuth,GoogleAuthProvider,signInWithPopup,signInWithRedirect,getRedirectResult,onAuthStateChanged,signOut} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import {getFirestore,doc,getDoc,onSnapshot,setDoc} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';
const config={apiKey:"AIzaSyDRHDEclE5c5MBQ2O6bHSVYyCUtN_G_XnY",authDomain:"leo-trip.firebaseapp.com",projectId:"leo-trip",storageBucket:"leo-trip.firebasestorage.app",messagingSenderId:"498989067615",appId:"1:498989067615:web:e6a99081132eebc9695aea"};
const app=initializeApp(config),auth=getAuth(app),db=getFirestore(app),ref=doc(db,'trips','leo-blue-mountains'),provider=new GoogleAuthProvider();
const signin=document.getElementById('sync-signin'),signout=document.getElementById('sync-signout'),msg=document.getElementById('sync-message'),identity=document.getElementById('sync-identity');
let unsubscribe=null,ready=false,busy=false,writing=Promise.resolve(),lastRemote='';
function say(s){msg.textContent=s}
function queueSave(){if(!ready||busy)return;const payload=window.leoSyncBridge.read();writing=writing.then(()=>setDoc(ref,{...payload,updatedAt:Date.now(),updatedBy:auth.currentUser?.uid||''})).catch(e=>say('Sync error: '+e.message));}
window.addEventListener('leo-local-change',queueSave);
signin.addEventListener('click',async()=>{try{await signInWithPopup(auth,provider)}catch(e){if(e.code==='auth/popup-blocked'){await signInWithRedirect(auth,provider)}else say('Sign-in error: '+e.message)}});
signout.addEventListener('click',()=>signOut(auth));
getRedirectResult(auth).catch(e=>say('Sign-in error: '+e.message));
onAuthStateChanged(auth,async user=>{
if(unsubscribe){unsubscribe();unsubscribe=null}ready=false;
signin.hidden=!!user;signout.hidden=!user;
if(!user){identity.textContent='';say('Packing list saved locally. Sign in to share.');return}
identity.textContent='Signed in: '+(user.email||'Google account')+' · User ID: '+user.uid;
say('Checking access to shared checklist…');
try{const first=await getDoc(ref);if(!first.exists()){await setDoc(ref,{...window.leoSyncBridge.read(),updatedAt:Date.now(),updatedBy:user.uid})}else{busy=true;window.leoSyncBridge.apply(first.data());busy=false}
unsubscribe=onSnapshot(ref,snap=>{if(!snap.exists())return;const data=snap.data();if(data.updatedBy===auth.currentUser?.uid&&ready)return;busy=true;window.leoSyncBridge.apply(data);busy=false;say('Shared checklist is up to date ✓')},e=>{ready=false;say('Firestore access unavailable: '+e.message)});
ready=true;say('Shared checklist connected ✓');
}catch(e){busy=false;ready=false;say('Firestore access not ready: '+e.message+'. Your local checklist still works.')}
});
