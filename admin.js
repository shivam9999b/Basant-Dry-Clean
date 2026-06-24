// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp 
} from "firebase/firestore";

// Your web app's Firebase configuration
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

// Collection names
const COLLECTIONS = {
  BOOKINGS: 'bookings',
  CONTENT: 'content',
  SETTINGS: 'settings'
};

// ===== FIREBASE HELPERS =====

async function saveToFirebase(collectionName, data, id = null) {
  try {
    if (id) {
      const docRef = doc(db, collectionName, id);
      await setDoc(docRef, data, { merge: true });
      return id;
    } else {
      const docRef = await addDoc(collection(db, collectionName), data);
      return docRef.id;
    }
  } catch (error) {
    console.error(`Error saving to ${collectionName}:`, error);
    throw error;
  }
}

async function getAllFromFirebase(collectionName) {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    const results = [];
    querySnapshot.forEach((doc) => {
      results.push({ id: doc.id, ...doc.data() });
    });
    return results;
  } catch (error) {
    console.error(`Error getting from ${collectionName}:`, error);
    return [];
  }
}

async function getFromFirebase(collectionName, id) {
  try {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error(`Error getting document from ${collectionName}:`, error);
    return null;
  }
}

async function deleteFromFirebase(collectionName, id) {
  try {
    await deleteDoc(doc(db, collectionName, id));
    return true;
  } catch (error) {
    console.error(`Error deleting from ${collectionName}:`, error);
    return false;
  }
}

function subscribeToBookings(callback) {
  const q = query(collection(db, COLLECTIONS.BOOKINGS), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (querySnapshot) => {
    const bookings = [];
    querySnapshot.forEach((doc) => {
      bookings.push({ id: doc.id, ...doc.data() });
    });
    callback(bookings);
  });
}

function subscribeToContent(callback) {
  const q = query(collection(db, COLLECTIONS.CONTENT));
  return onSnapshot(q, (querySnapshot) => {
    const contents = [];
    querySnapshot.forEach((doc) => {
      contents.push({ id: doc.id, ...doc.data() });
    });
    callback(contents);
  });
}

function subscribeToSettings(callback) {
  const q = query(collection(db, COLLECTIONS.SETTINGS));
  return onSnapshot(q, (querySnapshot) => {
    const settings = [];
    querySnapshot.forEach((doc) => {
      settings.push({ id: doc.id, ...doc.data() });
    });
    callback(settings);
  });
}

// ===== ORIGINAL FUNCTIONS (UNCHANGED) =====
// Store original functions
const originalGetBookings = window.getBookings || function() {
  try {
    return JSON.parse(localStorage.getItem(bookingKey) || JSON.stringify([]));
  } catch {
    return [];
  }
};

const originalSaveBookings = window.saveBookings || function(bookings) {
  localStorage.setItem(bookingKey, JSON.stringify(bookings));
};

const originalReadJson = window.readJson || function(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
};

const originalWriteJson = window.writeJson || function(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
};

// ===== MODIFIED FUNCTIONS (SYNC VERSION - NO ASYNC) =====
// These now work synchronously like original

function getBookings() {
  // Always return from localStorage first (synchronous)
  return originalReadJson(bookingKey, []);
}

function saveBookings(bookings) {
  // Save to localStorage (synchronous)
  originalSaveBookings(bookings);
  
  // Try to save to Firebase in background (don't block)
  try {
    saveBookingsToFirebase(bookings).catch(err => {
      console.warn('Firebase save failed (background):', err);
    });
  } catch (e) {
    console.warn('Firebase not available:', e);
  }
}

function readJson(key, fallback) {
  // Always return from localStorage first (synchronous)
  return originalReadJson(key, fallback);
}

function writeJson(key, value) {
  // Save to localStorage (synchronous)
  originalWriteJson(key, value);
  
  // Try to save to Firebase in background (don't block)
  try {
    if (key === bookingKey) {
      saveBookingsToFirebase(value).catch(err => {
        console.warn('Firebase save failed (background):', err);
      });
    } else if (key === contentKey) {
      saveContentToFirebase(value).catch(err => {
        console.warn('Firebase save failed (background):', err);
      });
    } else if (key === settingsKey) {
      saveSettingsToFirebase(value).catch(err => {
        console.warn('Firebase save failed (background):', err);
      });
    }
  } catch (e) {
    console.warn('Firebase not available:', e);
  }
}

// ===== FIREBASE BACKGROUND SAVE FUNCTIONS =====
async function saveBookingsToFirebase(bookings) {
  try {
    for (const booking of bookings) {
      const { id, ...bookingData } = booking;
      if (id) {
        await saveToFirebase(COLLECTIONS.BOOKINGS, bookingData, id);
      } else {
        await saveToFirebase(COLLECTIONS.BOOKINGS, bookingData);
      }
    }
    return true;
  } catch (error) {
    console.error('Error saving bookings to Firebase:', error);
    return false;
  }
}

async function getBookingsFromFirebase() {
  try {
    return await getAllFromFirebase(COLLECTIONS.BOOKINGS);
  } catch (error) {
    console.error('Error fetching bookings from Firebase:', error);
    return [];
  }
}

async function saveContentToFirebase(contentData) {
  try {
    const existing = await getAllFromFirebase(COLLECTIONS.CONTENT);
    if (existing.length > 0) {
      const docId = existing[0].id;
      await saveToFirebase(COLLECTIONS.CONTENT, contentData, docId);
    } else {
      await saveToFirebase(COLLECTIONS.CONTENT, contentData);
    }
    return true;
  } catch (error) {
    console.error('Error saving content to Firebase:', error);
    return false;
  }
}

async function getContentFromFirebase() {
  try {
    const contents = await getAllFromFirebase(COLLECTIONS.CONTENT);
    if (contents.length > 0) {
      let merged = {};
      contents.forEach(content => {
        merged = { ...merged, ...content };
      });
      delete merged.id;
      return merged;
    }
    return null;
  } catch (error) {
    console.error('Error fetching content from Firebase:', error);
    return null;
  }
}

async function saveSettingsToFirebase(settingsData) {
  try {
    const existing = await getAllFromFirebase(COLLECTIONS.SETTINGS);
    if (existing.length > 0) {
      const docId = existing[0].id;
      await saveToFirebase(COLLECTIONS.SETTINGS, settingsData, docId);
    } else {
      await saveToFirebase(COLLECTIONS.SETTINGS, settingsData);
    }
    return true;
  } catch (error) {
    console.error('Error saving settings to Firebase:', error);
    return false;
  }
}

async function getSettingsFromFirebase() {
  try {
    const settings = await getAllFromFirebase(COLLECTIONS.SETTINGS);
    if (settings.length > 0) {
      const { id, ...settingsData } = settings[0];
      return settingsData;
    }
    return null;
  } catch (error) {
    console.error('Error fetching settings from Firebase:', error);
    return null;
  }
}

// ===== PULL DATA FROM FIREBASE =====
async function pullAllFromFirebase() {
  try {
    contentStatus.textContent = 'Pulling from Firebase...';
    
    const firebaseContent = await getContentFromFirebase();
    if (firebaseContent) {
      originalWriteJson(contentKey, firebaseContent);
      content = mergeContent(firebaseContent);
      setSimpleFields();
      renderRepeatEditors();
    }
    
    const firebaseSettings = await getSettingsFromFirebase();
    if (firebaseSettings) {
      originalWriteJson(settingsKey, firebaseSettings);
      loadSettings();
    }
    
    const firebaseBookings = await getBookingsFromFirebase();
    if (firebaseBookings.length > 0) {
      originalSaveBookings(firebaseBookings);
      renderBookings();
    }
    
    contentStatus.textContent = 'All data pulled from Firebase successfully!';
  } catch (error) {
    contentStatus.textContent = 'Pull failed: ' + error.message;
    console.error('Pull failed:', error);
  }
}

// ===== INITIALIZE FIREBASE LISTENERS =====
let isSubscribed = false;

function initFirebaseListeners() {
  if (isSubscribed) return;
  
  try {
    subscribeToBookings((bookings) => {
      if (bookings.length > 0) {
        // Only update if different from localStorage
        const local = originalReadJson(bookingKey, []);
        if (JSON.stringify(local) !== JSON.stringify(bookings)) {
          originalSaveBookings(bookings);
          renderBookings();
          console.log('Bookings updated from Firebase');
        }
      }
    });
    
    subscribeToContent((contents) => {
      if (contents.length > 0) {
        const { id, ...contentData } = contents[0];
        const local = originalReadJson(contentKey, {});
        if (JSON.stringify(local) !== JSON.stringify(contentData)) {
          originalWriteJson(contentKey, contentData);
          content = mergeContent(contentData);
          setSimpleFields();
          renderRepeatEditors();
          console.log('Content updated from Firebase');
        }
      }
    });
    
    subscribeToSettings((settings) => {
      if (settings.length > 0) {
        const { id, ...settingsData } = settings[0];
        const local = originalReadJson(settingsKey, {});
        if (JSON.stringify(local) !== JSON.stringify(settingsData)) {
          originalWriteJson(settingsKey, settingsData);
          loadSettings();
          console.log('Settings updated from Firebase');
        }
      }
    });
    
    isSubscribed = true;
    console.log('Firebase real-time listeners active');
  } catch (error) {
    console.warn('Firebase listeners not available:', error);
  }
}

// ===== UI CONTROLS =====
function addFirebaseControls() {
  const controlsContainer = document.createElement('div');
  controlsContainer.className = 'firebase-controls';
  controlsContainer.style.cssText = `
    display: flex;
    gap: 10px;
    margin: 10px 0;
    padding: 15px;
    background: #f0f7ff;
    border-radius: 8px;
    border: 1px solid #b8d4f0;
    align-items: center;
    flex-wrap: wrap;
  `;
  
  controlsContainer.innerHTML = `
    <span style="font-weight: 600; color: #1a5a8a;">☁️ Firebase:</span>
    <button class="button" id="pullFromFirebase">Pull from Cloud</button>
    <span id="firebaseStatus" style="color: #2d7a3a; font-size: 0.9rem;">Connected</span>
  `;
  
  const statusContainer = document.querySelector('#contentStatus')?.parentElement;
  if (statusContainer) {
    statusContainer.insertAdjacentElement('afterend', controlsContainer);
  }
  
  document.querySelector('#pullFromFirebase')?.addEventListener('click', pullAllFromFirebase);
}

// ===== MODIFIED loadAll =====
// Keep original loadAll, just add Firebase listener initialization
const originalLoadAll = window.loadAll || function() {
  content = mergeContent(readJson(contentKey, defaultContent));
  setSimpleFields();
  renderRepeatEditors();
  loadSettings();
  renderBookings();
};

window.loadAll = function() {
  // Call original
  originalLoadAll();
  
  // Initialize Firebase listeners in background
  setTimeout(() => {
    try {
      initFirebaseListeners();
      contentStatus.textContent = 'Connected to Firebase';
    } catch (e) {
      console.warn('Firebase init skipped:', e);
    }
  }, 1000);
};

// ===== DOM READY =====
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(addFirebaseControls, 500);
  loadAll();
  console.log('FreshPress Admin with Firebase (fixed) initialized');
});

// Export for debugging
window.__firebase = {
  db,
  getBookingsFromFirebase,
  saveBookingsToFirebase,
  getContentFromFirebase,
  saveContentToFirebase,
  getSettingsFromFirebase,
  saveSettingsToFirebase,
  pullAllFromFirebase
};
