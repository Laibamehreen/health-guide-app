const fs = require('fs');
const path = require('path');

// Parse .env file to load EXPO_PUBLIC environment variables
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      if (key) {
        process.env[key] = val;
      }
    }
  });
}

const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set, get, child } = require('firebase/database');

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

console.log('Firebase Configuration:');
console.log('- Database URL:', firebaseConfig.databaseURL);
console.log('- Project ID:', firebaseConfig.projectId);

try {
  const app = initializeApp(firebaseConfig);
  const db = getDatabase(app);

  const testId = 'test_' + Date.now();
  console.log(`\nWriting test record to paths: tests/${testId} ...`);

  const dbRef = ref(db);
  const testRef = ref(db, 'tests/' + testId);

  set(testRef, {
    message: 'Hello from the CLI connection check script!',
    timestamp: new Date().toISOString()
  })
  .then(() => {
    console.log('✅ Write successful!');
    console.log('Reading the record back...');
    return get(child(dbRef, `tests/${testId}`));
  })
  .then((snapshot) => {
    if (snapshot.exists()) {
      console.log('✅ Read successful! Data retrieved:');
      console.log(JSON.stringify(snapshot.val(), null, 2));
      process.exit(0);
    } else {
      console.error('❌ Data read returned empty / not found.');
      process.exit(1);
    }
  })
  .catch((err) => {
    if (err.code === 'PERMISSION_DENIED') {
      console.error('\n❌ PERMISSION DENIED: Your Firebase Realtime Database rules are blocking read/write access.');
      console.error('\n👉 TO FIX THIS:');
      console.error('1. Open your Firebase Console: https://console.firebase.google.com/');
      console.error('2. Navigate to "Realtime Database" under the Build menu.');
      console.error('3. Click the "Rules" tab at the top.');
      console.error('4. Update the rules to allow public read/write access for testing:');
      console.error('   {\n     "rules": {\n       ".read": true,\n       ".write": true\n     }\n   }');
      console.error('5. Click "Publish".');
      console.error('6. Re-run this CLI test command: node test-db.js\n');
    } else {
      console.error('❌ Database operation failed:', err);
    }
    process.exit(1);
  });
} catch (e) {
  console.error('❌ Initialization Error:', e);
  process.exit(1);
}
