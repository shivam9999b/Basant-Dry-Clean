// ============================================
// FIREBASE INTEGRATION - SAFE VERSION
// ============================================

// Import Firebase
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  orderBy,
  onSnapshot,
  addDoc 
} from "firebase/firestore";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyDJuljdehf1ItBjFbrsEeHSQ2gGGQTYHYw",
  authDomain: "basant-dry-clean.firebaseapp.com",
  projectId: "basant-dry-clean",
  storageBucket: "basant-dry-clean.firebasestorage.app",
  messagingSenderId: "79904087714",
  appId: "1:79904087714:web:cc044f80eeba4bfe84c1fb"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log('🔥 Firebase initialized');

// ============================================
// FIREBASE BACKGROUND SYNC (UI BLOCK NAHI KAREGA)
// ============================================

// Original functions ko store karo
const _origSaveBookings = window.saveBookings || saveBookings;
const _origGetBookings = window.getBookings || getBookings;
const _origWriteJson = window.writeJson || writeJson;
const _origReadJson = window.readJson || readJson;

// Firebase save functions (background mein chalenge)
async function _syncBookingsToFirebase(bookings) {
  try {
    // Purani bookings hatao
    const snapshot = await getDocs(collection(db, 'bookings'));
    for (const docSnap of snapshot.docs) {
      await deleteDoc(docSnap.ref);
    }
    // Nayi bookings daalo
    for (const booking of bookings) {
      const { id, ...data } = booking;
      await addDoc(collection(db, 'bookings'), { ...data, _id: id });
    }
    console.log('✅ Bookings synced to Firebase');
  } catch (e) {
    console.warn('⚠️ Firebase sync error:', e.message);
  }
}

async function _syncContentToFirebase(contentData) {
  try {
    const snapshot = await getDocs(collection(db, 'content'));
    if (snapshot.empty) {
      await addDoc(collection(db, 'content'), contentData);
    } else {
      await setDoc(doc(db, 'content', snapshot.docs[0].id), contentData);
    }
    console.log('✅ Content synced to Firebase');
  } catch (e) {
    console.warn('⚠️ Firebase content error:', e.message);
  }
}

async function _syncSettingsToFirebase(settingsData) {
  try {
    const snapshot = await getDocs(collection(db, 'settings'));
    if (snapshot.empty) {
      await addDoc(collection(db, 'settings'), settingsData);
    } else {
      await setDoc(doc(db, 'settings', snapshot.docs[0].id), settingsData);
    }
    console.log('✅ Settings synced to Firebase');
  } catch (e) {
    console.warn('⚠️ Firebase settings error:', e.message);
  }
}

// ============================================
// OVERRIDE FUNCTIONS - PEHLE JAISA KAAM KARENGE
// ============================================

// getBookings - localStorage se hi return (instant)
window.getBookings = function() {
  return _origGetBookings();
};

// saveBookings - localStorage + background Firebase
window.saveBookings = function(bookings) {
  _origSaveBookings(bookings);
  // Background mein Firebase save
  _syncBookingsToFirebase(bookings).catch(() => {});
};

// readJson - localStorage se hi return
window.readJson = function(key, fallback) {
  return _origReadJson(key, fallback);
};

// writeJson - localStorage + background Firebase
window.writeJson = function(key, value) {
  _origWriteJson(key, value);
  // Background mein Firebase save
  if (key === 'freshpress-bookings') {
    _syncBookingsToFirebase(value).catch(() => {});
  } else if (key === 'freshpress-content') {
    _syncContentToFirebase(value).catch(() => {});
  } else if (key === 'freshpress-settings') {
    _syncSettingsToFirebase(value).catch(() => {});
  }
};

// ============================================
// PULL FROM FIREBASE (MANUAL)
// ============================================

async function pullFromFirebase() {
  try {
    const statusEl = document.querySelector('#contentStatus');
    if (statusEl) statusEl.textContent = '☁️ Pulling from Firebase...';
    
    // Pull bookings
    const bookingSnapshot = await getDocs(collection(db, 'bookings'));
    const fbBookings = [];
    bookingSnapshot.forEach(doc => {
      const data = doc.data();
      fbBookings.push({ id: data._id || doc.id, ...data });
    });
    if (fbBookings.length > 0) {
      _origSaveBookings(fbBookings);
      if (typeof renderBookings === 'function') renderBookings();
    }
    
    // Pull content
    const contentSnapshot = await getDocs(collection(db, 'content'));
    if (!contentSnapshot.empty) {
      const contentData = contentSnapshot.docs[0].data();
      _origWriteJson('freshpress-content', contentData);
      // Reload content
      content = mergeContent(contentData);
      if (typeof setSimpleFields === 'function') setSimpleFields();
      if (typeof renderRepeatEditors === 'function') renderRepeatEditors();
    }
    
    // Pull settings
    const settingsSnapshot = await getDocs(collection(db, 'settings'));
    if (!settingsSnapshot.empty) {
      const settingsData = settingsSnapshot.docs[0].data();
      _origWriteJson('freshpress-settings', settingsData);
      if (typeof loadSettings === 'function') loadSettings();
    }
    
    if (statusEl) statusEl.textContent = '✅ Pulled from Firebase successfully!';
    console.log('✅ Pulled from Firebase');
  } catch (e) {
    console.error('Pull error:', e);
    const statusEl = document.querySelector('#contentStatus');
    if (statusEl) statusEl.textContent = '❌ Pull failed: ' + e.message;
  }
}

// ============================================
// REAL-TIME LISTENERS (AUTO SYNC)
// ============================================

let _listenersStarted = false;

function startFirebaseListeners() {
  if (_listenersStarted) return;
  _listenersStarted = true;
  
  try {
    // Bookings listener
    const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
    onSnapshot(q, (snapshot) => {
      const bookings = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        bookings.push({ id: data._id || doc.id, ...data });
      });
      if (bookings.length > 0) {
        const local = _origReadJson('freshpress-bookings', []);
        if (JSON.stringify(local) !== JSON.stringify(bookings)) {
          _origSaveBookings(bookings);
          if (typeof renderBookings === 'function') renderBookings();
          console.log('📡 Bookings auto-synced from Firebase');
        }
      }
    });
    
    // Content listener
    onSnapshot(collection(db, 'content'), (snapshot) => {
      if (!snapshot.empty) {
        const contentData = snapshot.docs[0].data();
        const local = _origReadJson('freshpress-content', {});
        if (JSON.stringify(local) !== JSON.stringify(contentData)) {
          _origWriteJson('freshpress-content', contentData);
          content = mergeContent(contentData);
          if (typeof setSimpleFields === 'function') setSimpleFields();
          if (typeof renderRepeatEditors === 'function') renderRepeatEditors();
          console.log('📡 Content auto-synced from Firebase');
        }
      }
    });
    
    // Settings listener
    onSnapshot(collection(db, 'settings'), (snapshot) => {
      if (!snapshot.empty) {
        const settingsData = snapshot.docs[0].data();
        const local = _origReadJson('freshpress-settings', {});
        if (JSON.stringify(local) !== JSON.stringify(settingsData)) {
          _origWriteJson('freshpress-settings', settingsData);
          if (typeof loadSettings === 'function') loadSettings();
          console.log('📡 Settings auto-synced from Firebase');
        }
      }
    });
    
    console.log('🔥 Firebase real-time listeners active');
  } catch (e) {
    console.warn('⚠️ Listeners error:', e.message);
    _listenersStarted = false;
  }
}

// ============================================
// UI MEIN "PULL FROM CLOUD" BUTTON ADD KARO
// ============================================

function addFirebaseButton() {
  const statusEl = document.querySelector('#contentStatus');
  if (!statusEl) return;
  
  const parent = statusEl.parentElement;
  const btn = document.createElement('button');
  btn.textContent = '☁️ Pull from Cloud';
  btn.className = 'button';
  btn.style.marginLeft = '10px';
  btn.onclick = pullFromFirebase;
  
  parent.insertBefore(btn, statusEl.nextSibling);
}

// ============================================
// INIT
// ============================================

setTimeout(() => {
  try {
    addFirebaseButton();
    startFirebaseListeners();
    console.log('✅ Firebase integration complete! Admin panel working normally.');
  } catch (e) {
    console.warn('⚠️ Firebase init warning:', e.message);
  }
}, 500);
