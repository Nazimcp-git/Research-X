/**
 * ResearchX - Firebase Initialization Module
 * Firebase JavaScript SDK v8.10.0
 */

const firebaseConfig = {
  apiKey: "AIzaSyDjW6Eas",
  authDomain: "filef.firebaseapp.com",
  databaseURL: "httfiseio.com",
  projectId: "file-"
  storageBucket: "f9b4f.firebasestorage.app",
  messagingSenderId2464291336",
  appId: "1:1924642:webc9f33bd",
  measurementId: "G2JTX7D"
};

// Singleton initialization guard
let appInstance = null;
let authInstance = null;
let databaseInstance = null;

export function initFirebase() {
  if (!window.firebase) {
    throw new Error('Firebase 8.10.0 SDK is not loaded. Please ensure CDN scripts are present.');
  }

  if (!firebase.apps.length) {
    appInstance = firebase.initializeApp(firebaseConfig);
  } else {
    appInstance = firebase.app();
  }

  authInstance = firebase.auth();
  databaseInstance = firebase.database();

  return {
    app: appInstance,
    auth: authInstance,
    database: databaseInstance
  };
}

export function getAuth() {
  if (!authInstance) initFirebase();
  return authInstance;
}

export function getDatabase() {
  if (!databaseInstance) initFirebase();
  return databaseInstance;
}

