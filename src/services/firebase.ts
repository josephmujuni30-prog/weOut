// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage"; 
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDXqA1aTlst18DAtwuNAA1jP2ET7JIAlII",
  authDomain: "gen-lang-client-0555876362.firebaseapp.com",
  projectId: "gen-lang-client-0555876362",
  storageBucket: "gen-lang-client-0555876362.firebasestorage.app",
  messagingSenderId: "24417247247",
  appId: "1:24417247247:web:9513a86a3174387bbd037a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// 2. Define the services and EXPORT them
export const auth = getAuth(app); // This must be named 'auth'
export const db = getFirestore(app); // This must be named 'db'
export const storage = getStorage(app);