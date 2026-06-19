// ================== FIREBASE ==================
const firebaseConfig = {
  apiKey: "AIzaSyDb1vEGCkNpcarttuwLLvuB40g8reRFTGM",
  authDomain: "applelz-b5883.firebaseapp.com",
  projectId: "applelz-b5883",
  storageBucket: "applelz-b5883.firebasestorage.app",
  messagingSenderId: "489468218632",
  appId: "1:489468218632:web:598a550f7ebe7c6de7b0bd"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

// Guarda la sesión aunque cierres y abras la app.
const authPersistenceReady = auth
  .setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  .catch((error) => {
    console.error("Error configurando persistencia:", error);
  });

const REDIRECT_URL = "https://lzplayhd.online/apple/data%20base/";

const loginCard = document.getElementById("loginCard");
const welcomeScreen = document.getElementById("welcomeScreen");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const mainBtn = document.getElementById("mainBtn");
const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");
const loading = document.getElementById("loading");
const forgotPassword = document.getElementById("forgotPassword");

let isLogin = true;

// ================== TOAST ==================
function showToast(message, icon = "fa-circle-check", color = "#46d369") {
  const toast = document.getElementById("toast");
  toast.innerHTML = `<i class="fa-solid ${icon}" style="color:${color}"></i> ${message}`;
  toast.style.borderLeft = `5px solid ${color}`;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3200);
}

// ================== CARGAR DATOS DEL USUARIO ==================
async function loadUserData(user) {
  try {
    const doc = await db.collection("users").doc(user.uid).get();

    let name = "Usuario";
    let avatar = "https://wallpapers.com/images/hd/netflix-profile-pictures-1000-x-1000-qo9h82134t9nv0j0.jpg";

    if (doc.exists) {
      const data = doc.data();
      name = data.name || data.displayName || user.displayName || "Usuario";
      avatar = data.photo || user.photoURL || avatar;
    } else {
      name = user.displayName || "Usuario";
      avatar = user.photoURL || avatar;
    }

    const savedIcon = localStorage.getItem("profileIcon");
    if (savedIcon) avatar = savedIcon;

    document.getElementById("welcomeName").innerHTML = `¡Hola, <strong>${name}</strong>!`;
    document.getElementById("welcomeAvatar").src = avatar;
  } catch (error) {
    console.error("Error cargando datos:", error);
    document.getElementById("welcomeName").innerHTML = "¡Hola!";
  }
}

// ================== CERRAR SESIÓN ==================
async function logout() {
  try {
    loading.style.display = "block";

    await authPersistenceReady;

    localStorage.removeItem("profileIcon");
    localStorage.setItem("lzplaySessionState", "closed");

    await auth.signOut();

    loginCard.style.display = "block";
    welcomeScreen.style.display = "none";

    showToast("Sesión cerrada correctamente", "fa-check-circle", "#46d369");
  } catch (error) {
    console.error(error);
    showToast("Error al cerrar sesión", "fa-exclamation-triangle", "#ff4444");
  } finally {
    loading.style.display = "none";
  }
}

// ================== IR AL INICIO ==================
function goToHome() {
  window.location.href = REDIRECT_URL;
}

// ================== ERRORES FIREBASE ==================
function showAuthError(error) {
  console.error(error);

  if (error.code === "auth/email-already-in-use") {
    showToast("Este correo ya está registrado", "fa-exclamation-triangle", "#ff4444");
  } else if (error.code === "auth/invalid-email") {
    showToast("Correo inválido", "fa-exclamation-triangle", "#ff4444");
  } else if (error.code === "auth/weak-password") {
    showToast("La contraseña es muy débil", "fa-exclamation-triangle", "#ff4444");
  } else if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
    showToast("Correo o contraseña incorrectos", "fa-exclamation-triangle", "#ff4444");
  } else if (error.code === "auth/user-not-found") {
    showToast("No existe una cuenta con este correo", "fa-exclamation-triangle", "#ff4444");
  } else if (error.code === "auth/operation-not-allowed") {
    showToast("Activa Email/Password en Firebase", "fa-exclamation-triangle", "#ff4444");
  } else if (error.code === "auth/too-many-requests") {
    showToast("Demasiados intentos. Intenta más tarde", "fa-exclamation-triangle", "#ff4444");
  } else {
    showToast("Error: " + error.message, "fa-exclamation-triangle", "#ff4444");
  }
}

// ================== TABS ==================
loginTab.onclick = () => {
  isLogin = true;
  loginTab.classList.add("active");
  registerTab.classList.remove("active");
  mainBtn.innerText = "Iniciar sesión";
  passwordInput.setAttribute("autocomplete", "current-password");
};

registerTab.onclick = () => {
  isLogin = false;
  registerTab.classList.add("active");
  loginTab.classList.remove("active");
  mainBtn.innerText = "Crear cuenta";
  passwordInput.setAttribute("autocomplete", "new-password");
};

// ================== BOTÓN PRINCIPAL ==================
mainBtn.onclick = async () => {
  const emailValue = emailInput.value.trim();
  const passwordValue = passwordInput.value.trim();

  if (!emailValue || !passwordValue) {
    showToast("Completa todos los campos", "fa-exclamation-triangle", "#ffcc00");
    return;
  }

  try {
    loading.style.display = "block";

    await authPersistenceReady;

    if (isLogin) {
      await auth.signInWithEmailAndPassword(emailValue, passwordValue);
      localStorage.setItem("lzplaySessionState", "active");
      showToast("Inicio de sesión exitoso", "fa-check-circle", "#46d369");
    } else {
      await auth.createUserWithEmailAndPassword(emailValue, passwordValue);
      localStorage.setItem("lzplaySessionState", "active");
      showToast("Cuenta creada exitosamente", "fa-check-circle", "#46d369");
    }
  } catch (error) {
    showAuthError(error);
  } finally {
    loading.style.display = "none";
  }
};

// ================== OLVIDASTE CONTRASEÑA ==================
forgotPassword.onclick = async () => {
  const emailValue = emailInput.value.trim();

  if (!emailValue) {
    showToast("Ingresa tu correo para restablecer", "fa-exclamation-triangle", "#ffcc00");
    return;
  }

  try {
    loading.style.display = "block";
    await auth.sendPasswordResetEmail(emailValue);
    showToast("Correo de restablecimiento enviado", "fa-envelope", "#46d369");
  } catch (error) {
    showAuthError(error);
  } finally {
    loading.style.display = "none";
  }
};

// ================== DETECTAR SESIÓN ==================
authPersistenceReady.finally(() => {
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      localStorage.setItem("lzplaySessionState", "active");

      loginCard.style.display = "none";
      welcomeScreen.style.display = "block";

      await loadUserData(user);
    } else {
      localStorage.setItem("lzplaySessionState", "closed");

      loginCard.style.display = "block";
      welcomeScreen.style.display = "none";
    }
  });
});

console.log("%cLogin actualizado - Sin Google y con sesión persistente", "color:#46d369;font-weight:bold");
