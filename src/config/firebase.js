import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app;
let db;
let isMockMode = false;

// Check if credentials are placeholders or empty
const isPlaceholder = (val) => !val || val.includes('your_') || val.includes('_here');

if (
  isPlaceholder(firebaseConfig.apiKey) ||
  isPlaceholder(firebaseConfig.projectId)
) {
  console.warn('Firebase keys are not configured or are placeholders. App will run in LOCAL MOCK MODE.');
  isMockMode = true;
} else {
  try {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }
    
    db = getDatabase(app);
    console.log('Firebase Realtime Database initialized successfully.');
  } catch (error) {
    console.error('Firebase initialization failed. Falling back to LOCAL MOCK MODE:', error);
    isMockMode = true;
  }
}

export { db, isMockMode };
