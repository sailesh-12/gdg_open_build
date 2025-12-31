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

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
