
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDXqA1aTlst18DAtwuNAA1jP2ET7JIAlII",
  authDomain: "gen-lang-client-0555876362.firebaseapp.com",
  projectId: "gen-lang-client-0555876362",
  storageBucket: "gen-lang-client-0555876362.firebasestorage.app",
  messagingSenderId: "24417247247",
  appId: "1:24417247247:web:9513a86a3174387bbd037a"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
