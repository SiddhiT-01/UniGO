// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// CONFIG HERE
const firebaseConfig = {
  apiKey: "AIzaSyDeewroudrh-GJsciJvEvOB6UTO5T9j1iA",
  authDomain: "unigo-fa425.firebaseapp.com",
  projectId: "unigo-fa425",
  storageBucket: "unigo-fa425.firebasestorage.app",
  messagingSenderId: "351387176342",
  appId: "1:351387176342:web:62daa1b4ff6fd00ef7e1b7",
  measurementId: "G-WWCQZQLJ5V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the services 
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);