// js/firebase/applelz.js
const firebaseConfig = {
  apiKey: "AIzaSyDb1vEGCkNpcarttuwLLvuB40g8reRFTGM",
  authDomain: "applelz-b5883.firebaseapp.com",
  projectId: "applelz-b5883",
  storageBucket: "applelz-b5883.firebasestorage.app",
  messagingSenderId: "489468218632",
  appId: "1:489468218632:web:598a550f7ebe7c6de7b0bd",
  measurementId: "G-J085DHR8M3"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

// Exponer globalmente
window.firebaseAuth = auth;
window.firebaseDb = db;

// Iniciar sesión anónima
auth.signInAnonymously()
  .then(() => console.log("✅ Firebase: Autenticado anónimamente"))
  .catch(err => console.error("Error de autenticación:", err));
