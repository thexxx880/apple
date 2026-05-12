// js/firebase/applelz.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDb1vEGCkNpcarttuwLLvuB40g8reRFTGM",
  authDomain: "applelz-b5883.firebaseapp.com",
  projectId: "applelz-b5883",
  storageBucket: "applelz-b5883.firebasestorage.app",
  messagingSenderId: "489468218632",
  appId: "1:489468218632:web:598a550f7ebe7c6de7b0bd",
  measurementId: "G-J085DHR8M3"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Exponer globalmente para que cualquier archivo JS pueda usarlo
window.firebaseAuth = auth;
window.firebaseDb = db;

// Iniciar sesión anónima automáticamente
signInAnonymously(auth)
  .then(() => console.log("✅ Firebase: Autenticado anónimamente"))
  .catch(err => console.error("Error de autenticación Firebase:", err));
