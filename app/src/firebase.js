import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, push, update, remove } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || 'demo-key',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'demo.firebaseapp.com',
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL || 'https://demo-default-rtdb.firebaseio.com',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || 'demo.appspot.com',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId: process.env.REACT_APP_FIREBASE_APP_ID || '1:000000000000:web:demo',
};

const DEMO_MODE = !process.env.REACT_APP_FIREBASE_DATABASE_URL;

let app = null;
let database = null;

if (!DEMO_MODE) {
  app = initializeApp(firebaseConfig);
  database = getDatabase(app);
}

export { database, ref, onValue, set, push, update, remove, DEMO_MODE };
