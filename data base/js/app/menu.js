   firebase.auth().onAuthStateChanged(async (user) => {
            if (!user) {
                window.location.href = "login.html";
                return;
            }

            const savedIcon = localStorage.getItem("profileIcon");
            if (savedIcon) {
                document.getElementById("user-avatar").src = savedIcon;
            }

            try {
                const userDoc = await firebase.firestore()
                    .collection("users")
                    .doc(user.uid)
                    .get();

                if (userDoc.exists) {
                    const data = userDoc.data();
                    const displayName = data.displayName || user.displayName || "Usuario LzPlay";
                    document.getElementById("username").textContent = displayName;

                    if (data.profileIcon) {
                        document.getElementById("user-avatar").src = data.profileIcon;
                        localStorage.setItem("profileIcon", data.profileIcon);
                    }
                }
            } catch (error) {
                console.error("Error cargando perfil:", error);
            }
        });

        // MODALES
        function showEditProfileModal() {
            document.getElementById("edit-modal").style.display = "flex";
        }

        function closeModal() {
            document.getElementById("edit-modal").style.display = "none";
        }

        function showNameModal() {
            closeModal();
            const currentName = document.getElementById("username").textContent;
            document.getElementById("new-name-input").value = currentName;
            document.getElementById("name-modal").style.display = "flex";
            document.getElementById("new-name-input").focus();
        }

        function closeNameModal() {
            document.getElementById("name-modal").style.display = "none";
        }

        // GUARDAR NUEVO NOMBRE
        async function saveNewName() {
            const newName = document.getElementById("new-name-input").value.trim();
            if (!newName) {
                alert("El nombre no puede estar vacío");
                return;
            }

            try {
                const user = firebase.auth().currentUser;

                await user.updateProfile({ displayName: newName });
                await firebase.firestore()
                    .collection("users")
                    .doc(user.uid)
                    .update({ displayName: newName });

                document.getElementById("username").textContent = newName;
                closeNameModal();
                alert("✅ Nombre actualizado correctamente");
            } catch (error) {
                console.error("Error al actualizar nombre:", error);
                alert("❌ Error al actualizar el nombre");
            }
        }

        function changeIcon() {
            closeModal();
            window.location.href = "config/iconos.html";
        }

        async function logout() {
            try {
                localStorage.removeItem("profileIcon");
                await firebase.auth().signOut();
                window.location.href = "login.html";
            } catch (error) {
                console.error("Error al cerrar sesión:", error);
            }
        }

        // Cerrar modales con ESC
        document.addEventListener("keydown", function(e) {
            if (e.key === "Escape") {
                const nameModal = document.getElementById("name-modal");
                if (nameModal.style.display === "flex") {
                    closeNameModal();
                } else {
                    closeModal();
                }
            }
        });
    
