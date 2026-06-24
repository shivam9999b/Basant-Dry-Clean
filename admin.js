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

// Save data to Firebase
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

// Get all documents from a collection
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

// Get a single document
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

// Delete a document
async function deleteFromFirebase(collectionName, id) {
  try {
    await deleteDoc(doc(db, collectionName, id));
    return true;
  } catch (error) {
    console.error(`Error deleting from ${collectionName}:`, error);
    return false;
  }
}

// Real-time listener for bookings
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

// Real-time listener for content
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

// Real-time listener for settings
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

// ===== CONVERT EXISTING FUNCTIONS TO USE FIREBASE =====

// Override localStorage functions with Firebase versions
const originalGetBookings = getBookings;
const originalSaveBookings = saveBookings;
const originalReadJson = readJson;
const originalWriteJson = writeJson;

// New Firebase-aware functions
async function getBookingsFromFirebase() {
  try {
    return await getAllFromFirebase(COLLECTIONS.BOOKINGS);
  } catch (error) {
    console.error('Error fetching bookings from Firebase:', error);
    return [];
  }
}

async function saveBookingsToFirebase(bookings) {
  try {
    // Convert bookings to Firebase format
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

async function getContentFromFirebase() {
  try {
    const contents = await getAllFromFirebase(COLLECTIONS.CONTENT);
    if (contents.length > 0) {
      // Merge content from all documents (assuming one main content doc)
      let merged = {};
      contents.forEach(content => {
        merged = { ...merged, ...content };
      });
      delete merged.id; // Remove the id field
      return merged;
    }
    return null;
  } catch (error) {
    console.error('Error fetching content from Firebase:', error);
    return null;
  }
}

async function saveContentToFirebase(contentData) {
  try {
    // Check if content already exists
    const existing = await getAllFromFirebase(COLLECTIONS.CONTENT);
    if (existing.length > 0) {
      // Update existing content
      const docId = existing[0].id;
      await saveToFirebase(COLLECTIONS.CONTENT, contentData, docId);
    } else {
      // Create new content
      await saveToFirebase(COLLECTIONS.CONTENT, contentData);
    }
    return true;
  } catch (error) {
    console.error('Error saving content to Firebase:', error);
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

// ===== MODIFIED FUNCTIONS FOR FIREBASE COMPATIBILITY =====

// Modified getBookings to use Firebase with localStorage fallback
function getBookings() {
  // Try to get from Firebase, fallback to localStorage
  return getBookingsFromFirebase().then(bookings => {
    if (bookings.length > 0) {
      return bookings;
    }
    // Fallback to localStorage
    return originalGetBookings();
  }).catch(() => {
    return originalGetBookings();
  });
}

// Modified saveBookings to use Firebase
function saveBookings(bookings) {
  // Save to localStorage as backup
  originalSaveBookings(bookings);
  // Save to Firebase
  return saveBookingsToFirebase(bookings).catch(error => {
    console.error('Failed to save to Firebase, but localStorage is updated:', error);
  });
}

// Modified readJson to use Firebase
function readJson(key, fallback) {
  if (key === bookingKey) {
    // For bookings, use Firebase
    return getBookingsFromFirebase().then(bookings => {
      return bookings.length > 0 ? bookings : fallback;
    }).catch(() => {
      return originalReadJson(key, fallback);
    });
  } else if (key === contentKey) {
    // For content, use Firebase
    return getContentFromFirebase().then(content => {
      return content || fallback;
    }).catch(() => {
      return originalReadJson(key, fallback);
    });
  } else if (key === settingsKey) {
    // For settings, use Firebase
    return getSettingsFromFirebase().then(settings => {
      return settings || fallback;
    }).catch(() => {
      return originalReadJson(key, fallback);
    });
  }
  return originalReadJson(key, fallback);
}

// Modified writeJson to use Firebase
function writeJson(key, value) {
  // Save to localStorage as backup
  originalWriteJson(key, value);
  
  // Save to Firebase
  if (key === bookingKey) {
    return saveBookingsToFirebase(value).catch(error => {
      console.error('Failed to save bookings to Firebase:', error);
    });
  } else if (key === contentKey) {
    return saveContentToFirebase(value).catch(error => {
      console.error('Failed to save content to Firebase:', error);
    });
  } else if (key === settingsKey) {
    return saveSettingsToFirebase(value).catch(error => {
      console.error('Failed to save settings to Firebase:', error);
    });
  }
}

// ===== INITIALIZATION WITH REAL-TIME UPDATES =====

// Flag to prevent multiple subscriptions
let isSubscribed = false;

// Enhanced loadAll with Firebase real-time updates
function loadAllWithFirebase() {
  // Load initial data
  loadAll();
  
  // Set up real-time listeners if not already subscribed
  if (!isSubscribed) {
    // Subscribe to bookings updates
    subscribeToBookings((bookings) => {
      if (bookings.length > 0) {
        // Update localStorage with Firebase data
        originalSaveBookings(bookings);
        renderBookings();
        console.log('Bookings updated from Firebase');
      }
    });
    
    // Subscribe to content updates
    subscribeToContent((contents) => {
      if (contents.length > 0) {
        const { id, ...contentData } = contents[0];
        originalWriteJson(contentKey, contentData);
        // Reload content without affecting bookings
        content = mergeContent(contentData);
        setSimpleFields();
        renderRepeatEditors();
        contentStatus.textContent = 'Content updated from Firebase';
        console.log('Content updated from Firebase');
      }
    });
    
    // Subscribe to settings updates
    subscribeToSettings((settings) => {
      if (settings.length > 0) {
        const { id, ...settingsData } = settings[0];
        originalWriteJson(settingsKey, settingsData);
        loadSettings();
        console.log('Settings updated from Firebase');
      }
    });
    
    isSubscribed = true;
    contentStatus.textContent = 'Connected to Firebase with real-time updates';
  }
}

// ===== SYNC FUNCTIONS =====

// Function to force sync all data to Firebase
async function syncAllToFirebase() {
  try {
    contentStatus.textContent = 'Syncing to Firebase...';
    
    // Sync content
    await saveContentToFirebase(content);
    
    // Sync settings
    const settings = {
      pickup: fields.pickup.checked,
      urgent: fields.urgent.checked,
      note: fields.note.value.trim()
    };
    await saveSettingsToFirebase(settings);
    
    // Sync bookings
    const bookings = originalGetBookings();
    await saveBookingsToFirebase(bookings);
    
    contentStatus.textContent = 'All data synced to Firebase successfully!';
    console.log('All data synced to Firebase');
  } catch (error) {
    contentStatus.textContent = 'Sync failed: ' + error.message;
    console.error('Sync failed:', error);
  }
}

// Function to force pull from Firebase
async function pullAllFromFirebase() {
  try {
    contentStatus.textContent = 'Pulling from Firebase...';
    
    // Pull content
    const firebaseContent = await getContentFromFirebase();
    if (firebaseContent) {
      writeJson(contentKey, firebaseContent);
      content = mergeContent(firebaseContent);
      setSimpleFields();
      renderRepeatEditors();
    }
    
    // Pull settings
    const firebaseSettings = await getSettingsFromFirebase();
    if (firebaseSettings) {
      writeJson(settingsKey, firebaseSettings);
      loadSettings();
    }
    
    // Pull bookings
    const firebaseBookings = await getBookingsFromFirebase();
    if (firebaseBookings.length > 0) {
      originalSaveBookings(firebaseBookings);
      renderBookings();
    }
    
    contentStatus.textContent = 'All data pulled from Firebase successfully!';
    console.log('All data pulled from Firebase');
  } catch (error) {
    contentStatus.textContent = 'Pull failed: ' + error.message;
    console.error('Pull failed:', error);
  }
}

// ===== MODIFIED EXPORT FUNCTIONS =====

// Modified exportAllData to include Firebase data
async function exportAllDataWithFirebase() {
  try {
    const data = {
      content: await getContentFromFirebase() || readJson(contentKey, defaultContent),
      settings: await getSettingsFromFirebase() || readJson(settingsKey, defaultSettings),
      bookings: await getBookingsFromFirebase() || getBookings(),
      exportedAt: new Date().toISOString(),
      source: 'Firebase'
    };
    downloadText('freshpress-admin-data.json', JSON.stringify(data, null, 2), 'application/json;charset=utf-8');
    contentStatus.textContent = 'Data exported from Firebase';
  } catch (error) {
    contentStatus.textContent = 'Export failed: ' + error.message;
  }
}

// ===== CONNECT UI BUTTONS =====

// Add sync buttons to UI
function addFirebaseControls() {
  // Create Firebase control container
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
    <button class="button" id="syncToFirebase">Sync to Cloud</button>
    <button class="button" id="pullFromFirebase">Pull from Cloud</button>
    <button class="button" id="exportFirebaseData">Export Cloud Data</button>
    <span id="firebaseStatus" style="color: #2d7a3a; font-size: 0.9rem;">Connected</span>
  `;
  
  // Insert after the content status
  const statusContainer = document.querySelector('#contentStatus').parentElement;
  statusContainer.insertAdjacentElement('afterend', controlsContainer);
  
  // Add event listeners
  document.querySelector('#syncToFirebase').addEventListener('click', syncAllToFirebase);
  document.querySelector('#pullFromFirebase').addEventListener('click', pullAllFromFirebase);
  document.querySelector('#exportFirebaseData').addEventListener('click', exportAllDataWithFirebase);
}

// ===== LOAD WITH FIREBASE =====

// Override loadAll to use Firebase
const originalLoadAll = window.loadAll || loadAll;
window.loadAll = function() {
  // First try to load from localStorage
  originalLoadAll();
  
  // Then try to load from Firebase
  setTimeout(() => {
    try {
      // Load content from Firebase
      getContentFromFirebase().then(firebaseContent => {
        if (firebaseContent) {
          content = mergeContent(firebaseContent);
          setSimpleFields();
          renderRepeatEditors();
          contentStatus.textContent = 'Loaded from Firebase';
        }
      });
      
      // Load bookings from Firebase
      getBookingsFromFirebase().then(firebaseBookings => {
        if (firebaseBookings.length > 0) {
          originalSaveBookings(firebaseBookings);
          renderBookings();
        }
      });
      
      // Load settings from Firebase
      getSettingsFromFirebase().then(firebaseSettings => {
        if (firebaseSettings) {
          originalWriteJson(settingsKey, firebaseSettings);
          loadSettings();
        }
      });
      
      // Set up real-time listeners
      if (!isSubscribed) {
        subscribeToBookings((bookings) => {
          if (bookings.length > 0) {
            originalSaveBookings(bookings);
            renderBookings();
          }
        });
        
        subscribeToContent((contents) => {
          if (contents.length > 0) {
            const { id, ...contentData } = contents[0];
            originalWriteJson(contentKey, contentData);
            content = mergeContent(contentData);
            setSimpleFields();
            renderRepeatEditors();
          }
        });
        
        subscribeToSettings((settings) => {
          if (settings.length > 0) {
            const { id, ...settingsData } = settings[0];
            originalWriteJson(settingsKey, settingsData);
            loadSettings();
          }
        });
        
        isSubscribed = true;
        contentStatus.textContent = 'Connected to Firebase with real-time updates';
      }
    } catch (error) {
      console.warn('Firebase connection fallback to localStorage:', error);
      contentStatus.textContent = 'Running in offline mode (localStorage)';
    }
  }, 500);
};

// ===== INITIALIZATION =====

// Initialize with Firebase
document.addEventListener('DOMContentLoaded', () => {
  // Add Firebase controls to UI
  setTimeout(addFirebaseControls, 1000);
  
  // Load with Firebase
  loadAll();
  
  console.log('FreshPress Admin with Firebase initialized');
});

// Export Firebase functions for debugging
window.__firebase = {
  db,
  getBookingsFromFirebase,
  saveBookingsToFirebase,
  getContentFromFirebase,
  saveContentToFirebase,
  getSettingsFromFirebase,
  saveSettingsToFirebase,
  syncAllToFirebase,
  pullAllFromFirebase
};
