// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  initializeFirestore,
  enableIndexedDbPersistence,
} from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// --- Firebase Config ---
const firebaseConfig = {
  apiKey: "AIzaSyDNQ6Wqy2MPtX7via7_Txxj4uLcEDifd5M",
  authDomain: "project-hmm-e7525.firebaseapp.com",
  projectId: "project-hmm-e7525",
  storageBucket: "project-hmm-e7525.firebasestorage.app",
  messagingSenderId: "288078730105",
  appId: "1:288078730105:web:9984e2ff0af5996d3ed5a8",
  measurementId: "G-9GXW4RVP3P",
};

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// --- Firestore (legacy-compatible) ---
const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true,
});

// ✅ Enable offline caching
enableIndexedDbPersistence(db)
  .then(() => console.log("✅ Firestore persistence enabled"))
  .catch((err) => {
    if (err.code === "failed-precondition") {
      console.warn("⚠️ Persistence failed (multiple tabs open)");
    } else if (err.code === "unimplemented") {
      console.warn("⚠️ Persistence not supported on this browser");
    } else {
      console.error("Firestore persistence error:", err);
    }
  });

// --- Exports ---
export { app, analytics, db, auth, googleProvider };
