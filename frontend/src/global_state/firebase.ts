// NOTE: The following code is copied from the Firebase API web set-up guide.
// It just sets up the keys and resources for the Firebase API to work.
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_GOOGLE_FIREBASE_API_KEY,
  authDomain: "ecs162-final-aa40d.firebaseapp.com",
  projectId: "ecs162-final-aa40d",
  storageBucket: "ecs162-final-aa40d.firebasestorage.app",
  messagingSenderId: "1001934422906",
  appId: "1:1001934422906:web:9c5115a828ff0007c64cc3"
};

const firebaseApp = initializeApp(firebaseConfig);
// https://firebase.google.com/docs/auth/web/start
export const firebaseAuth = getAuth(firebaseApp);