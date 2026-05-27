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

window.firebaseAuth = auth;
window.firebaseDb = db;

/* ========================================
   LOGIN GOOGLE
======================================== */

async function loginGoogle() {
  try {
    const provider = new firebase.auth.GoogleAuthProvider();

    const result = await auth.signInWithPopup(provider);

    console.log("✅ Usuario conectado:", result.user.email);

    return result.user;
  } catch (error) {
    console.error("❌ Error login:", error);
  }
}

/* ========================================
   LOGOUT
======================================== */

async function logout() {
  try {
    await auth.signOut();
    location.reload();
  } catch (error) {
    console.error(error);
  }
}

/* ========================================
   OBTENER USUARIO ACTUAL
======================================== */

function getCurrentUser() {
  return auth.currentUser;
}

/* ========================================
   GUARDAR DATOS DEL USUARIO
======================================== */

async function saveUserData(data) {
  const user = auth.currentUser;

  if (!user) {
    console.warn("Usuario no autenticado");
    return;
  }

  try {
    await db.collection("users")
      .doc(user.uid)
      .set(data, { merge: true });

    console.log("✅ Datos guardados");
  } catch (error) {
    console.error("❌ Error guardando:", error);
  }
}

/* ========================================
   OBTENER DATOS DEL USUARIO
======================================== */

async function getUserData() {
  const user = auth.currentUser;

  if (!user) return null;

  try {
    const doc = await db
      .collection("users")
      .doc(user.uid)
      .get();

    if (doc.exists) {
      return doc.data();
    }

    return null;
  } catch (error) {
    console.error(error);
    return null;
  }
}

/* ========================================
   ESCUCHAR CAMBIOS EN TIEMPO REAL
======================================== */

function listenUserData(callback) {
  const user = auth.currentUser;

  if (!user) return;

  return db.collection("users")
    .doc(user.uid)
    .onSnapshot((doc) => {

      if (doc.exists) {
        callback(doc.data());
      }

    });
}

/* ========================================
   AUTH READY
======================================== */

auth.onAuthStateChanged(async (user) => {

  if (user) {
    console.log("✅ Sesión iniciada:", user.uid);

    // Crear documento si no existe
    await db.collection("users")
      .doc(user.uid)
      .set({
        uid: user.uid,
        email: user.email || "",
        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

  } else {
    console.log("⚠️ Usuario no logueado");
  }

});

/* ========================================
   GLOBAL
======================================== */

window.loginGoogle = loginGoogle;
window.logout = logout;
window.saveUserData = saveUserData;
window.getUserData = getUserData;
window.listenUserData = listenUserData;
window.getCurrentUser = getCurrentUser;
