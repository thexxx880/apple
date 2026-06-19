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

const REDIRECT_URL = "https://lzplayhd.online/apple/data%20base/";

const loginCard = document.getElementById("loginCard");
const welcomeScreen = document.getElementById("welcomeScreen");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const mainBtn = document.getElementById("mainBtn");
const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");
const loading = document.getElementById("loading");

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
      if (data.photo) avatar = data.photo;
    } else {
      name = user.displayName || "Usuario";
      if (user.photoURL) avatar = user.photoURL;
    }

    const savedIcon = localStorage.getItem("profileIcon");
    if (savedIcon) avatar = savedIcon;

    document.getElementById("welcomeName").innerHTML = `¡Hola, <strong>${name}</strong>!`;
    document.getElementById("welcomeAvatar").src = avatar;

  } catch (error) {
    console.error("Error cargando datos:", error);
    document.getElementById("welcomeName").innerHTML = `¡Hola!`;
  }
}

// ================== CERRAR SESIÓN ==================
async function logout() {
  try {
    localStorage.removeItem("profileIcon");
    await auth.signOut();
    location.reload();
  } catch (error) {
    showToast("Error al cerrar sesión", "fa-exclamation-triangle", "#ff4444");
  }
}

// ================== IR AL INICIO ==================
function goToHome() {
  window.location.href = REDIRECT_URL;
}

// ================== TABS ==================
loginTab.onclick = () => {
  isLogin = true;
  loginTab.classList.add("active");
  registerTab.classList.remove("active");
  mainBtn.innerText = "Iniciar sesión";
};

registerTab.onclick = () => {
  isLogin = false;
  registerTab.classList.add("active");
  loginTab.classList.remove("active");
  mainBtn.innerText = "Crear cuenta";
};

// ================== BOTÓN PRINCIPAL (LOGIN / REGISTRO) ==================
mainBtn.onclick = async () => {
  const emailValue = emailInput.value.trim();
  const passwordValue = passwordInput.value.trim();
  if (!emailValue || !passwordValue) {
    showToast("Completa todos los campos", "fa-exclamation-triangle", "#ffcc00");
    return;
  }
  try {
    loading.style.display = "block";
    if (isLogin) {
      await auth.signInWithEmailAndPassword(emailValue, passwordValue);
      showToast("Inicio de sesión exitoso", "fa-check-circle", "#46d369");
      // ← Ya NO redirige. La pantalla de bienvenida aparecerá sola
    } else {
      const userCredential = await auth.createUserWithEmailAndPassword(emailValue, passwordValue);
      showToast("Cuenta creada exitosamente", "fa-check-circle", "#46d369");
      // ← Ya NO redirige
    }
  } catch (error) {
    console.error(error);
    if (error.code === "auth/email-already-in-use") {
      showToast("Este correo ya está registrado", "fa-exclamation-triangle", "#ff4444");
    } else if (error.code === "auth/invalid-email") {
      showToast("Correo inválido", "fa-exclamation-triangle", "#ff4444");
    } else if (error.code === "auth/weak-password") {
      showToast("La contraseña es muy débil", "fa-exclamation-triangle", "#ff4444");
    } else {
      showToast("Error: " + error.message, "fa-exclamation-triangle", "#ff4444");
    }
  } finally {
    loading.style.display = "none";
  }
};

// ================== OLVIDASTE CONTRASEÑA ==================
document.getElementById("forgotPassword").onclick = async () => {
  const emailValue = emailInput.value.trim();
  if (!emailValue) {
    showToast("Ingresa tu correo para restablecer", "fa-exclamation-triangle", "#ffcc00");
    return;
  }
  try {
    await auth.sendPasswordResetEmail(emailValue);
    showToast("Correo de restablecimiento enviado ✓", "fa-envelope", "#46d369");
  } catch (error) {
    showToast("Error: " + error.message, "fa-exclamation-triangle", "#ff4444");
  }
};

// ================== DETECTAR SI YA ESTÁ LOGUEADO ==================
auth.onAuthStateChanged(async (user) => {
  if (user) {
    // Usuario logueado → Mostrar pantalla de bienvenida
    loginCard.style.display = "none";
    welcomeScreen.style.display = "block";
    await loadUserData(user);
  } else {
    // No logueado → Mostrar formulario
    loginCard.style.display = "block";
    welcomeScreen.style.display = "none";
  }
});

console.log("%c✅ Login actualizado - Sin Google y Sin auto-redirect", "color:#46d369;font-weight:bold");
