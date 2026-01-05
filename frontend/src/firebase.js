import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyDZF_wR0KJqjf7GaHBWtTM1ucKbR2-L6Nk",
    authDomain: "gdg-open-build.firebaseapp.com",
    projectId: "gdg-open-build",
    storageBucket: "gdg-open-build.firebasestorage.app",
    messagingSenderId: "408775848590",
    appId: "1:408775848590:web:5eb88a82d18a40f3420fdf",
    measurementId: "G-8C563KPJSP"
};

// Debug logging
console.log("🔥 Firebase Configuration:");
console.log("  Project ID:", firebaseConfig.projectId);
console.log("  Auth Domain:", firebaseConfig.authDomain);
console.log("  API Key (first 10 chars):", firebaseConfig.apiKey.substring(0, 10) + "...");
console.log("  App ID:", firebaseConfig.appId);

const app = initializeApp(firebaseConfig);
console.log("✅ Firebase app initialized successfully");

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

console.log("✅ Firebase Auth instance created");
console.log("  Current user:", auth.currentUser);
