// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDNQ6Wqy2MPtX7via7_Txxj4uLcEDifd5M",
  authDomain: "project-hmm-e7525.firebaseapp.com",
  projectId: "project-hmm-e7525",
  storageBucket: "project-hmm-e7525.firebasestorage.app",
  messagingSenderId: "288078730105",
  appId: "1:288078730105:web:9984e2ff0af5996d3ed5a8",
  measurementId: "G-9GXW4RVP3P"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, analytics, db, auth, googleProvider };
