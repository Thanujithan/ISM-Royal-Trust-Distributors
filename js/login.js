document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const emailInput = document.getElementById("loginEmail");
    const passwordInput = document.getElementById("loginPassword");
    const message = document.getElementById("loginMessage");
    const rememberMe = document.getElementById("rememberMe");
    const forgotPassword = document.getElementById("forgotPassword");

    if (!loginForm) {
        console.error("Login form not found.");
        return;
    }

    loadRememberedEmail();

    document.querySelectorAll(".password-toggle").forEach((button) => {
        button.addEventListener("click", () => {
            const targetId = button.dataset.target;
            const input = document.getElementById(targetId);
            const icon = button.querySelector("i");

            if (!input) {
                return;
            }

            if (input.type === "password") {
                input.type = "text";

                if (icon) {
                    icon.classList.replace(
                        "fa-eye",
                        "fa-eye-slash"
                    );
                }
            } else {
                input.type = "password";

                if (icon) {
                    icon.classList.replace(
                        "fa-eye-slash",
                        "fa-eye"
                    );
                }
            }
        });
    });

    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        clearErrors();

        const email = emailInput.value.trim().toLowerCase();
        const password = passwordInput.value;

        let valid = true;

        if (email === "") {
            showError(
                "loginEmail",
                "Email address is required."
            );

            valid = false;
        } else if (!validateEmail(email)) {
            showError(
                "loginEmail",
                "Enter a valid email address."
            );

            valid = false;
        }

        if (password === "") {
            showError(
                "loginPassword",
                "Password is required."
            );

            valid = false;
        } else if (password.length < 6) {
            showError(
                "loginPassword",
                "Password must contain at least 6 characters."
            );

            valid = false;
        }

        if (!valid) {
            showMessage(
                "Please correct the highlighted fields.",
                "error"
            );

            return;
        }

        const button = loginForm.querySelector(".auth-btn");

        if (button) {
            button.disabled = true;
            button.innerHTML = `
                <i class="fas fa-spinner fa-spin"></i>
                Logging in...
            `;
        }

        try {
            const response = await fetch(
                "http://localhost:5000/api/auth/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email,
                        password
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Invalid email or password."
                );
            }

            if (!data.token || !data.user) {
                throw new Error(
                    "Invalid login response from server."
                );
            }

            clearOldLoginData();

            saveLoginData(
                data.token,
                data.user,
                rememberMe?.checked
            );

            if (rememberMe?.checked) {
                localStorage.setItem(
                    "rememberedEmail",
                    email
                );
            } else {
                localStorage.removeItem("rememberedEmail");
            }

            showMessage(
                "Login successful! Redirecting...",
                "success"
            );

            window.setTimeout(() => {
                redirectUser(data.user);
            }, 800);
        } catch (error) {
            console.error("Login error:", error);

            showMessage(
                error.message === "Failed to fetch"
                    ? "Cannot connect to the server. Please try again."
                    : error.message,
                "error"
            );
        } finally {
            if (button) {
                button.disabled = false;
                button.innerHTML = `
                    <span>Login</span>
                    <i class="fas fa-arrow-right"></i>
                `;
            }
        }
    });

    if (forgotPassword) {
        forgotPassword.addEventListener("click", (event) => {
            event.preventDefault();

            showMessage(
                "Forgot password feature will be added later.",
                "error"
            );
        });
    }

    function saveLoginData(token, user, rememberUser) {
        const storage = rememberUser
            ? localStorage
            : sessionStorage;

        storage.setItem("token", token);
        storage.setItem("user", JSON.stringify(user));
    }

    function clearOldLoginData() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");

        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("adminToken");
        sessionStorage.removeItem("adminUser");
    }

    function redirectUser(user) {
        const role = String(
            user?.role || ""
        ).toLowerCase();

        if (role === "admin") {
            window.location.href = "admin/dashboard.html";
            return;
        }

        window.location.href = "index.html";
    }

    function loadRememberedEmail() {
        const rememberedEmail =
            localStorage.getItem("rememberedEmail");

        if (rememberedEmail && emailInput) {
            emailInput.value = rememberedEmail;

            if (rememberMe) {
                rememberMe.checked = true;
            }
        }
    }

    function showError(id, text) {
        const input = document.getElementById(id);
        const error = document.getElementById(
            `${id}Error`
        );

        if (input) {
            const inputBox = input.closest(".input-box");

            if (inputBox) {
                inputBox.classList.add("error");
            }
        }

        if (error) {
            error.textContent = text;
        }
    }

    function clearErrors() {
        document
            .querySelectorAll(".input-box")
            .forEach((box) => {
                box.classList.remove("error");
            });

        document
            .querySelectorAll(".error-message")
            .forEach((error) => {
                error.textContent = "";
            });

        if (message) {
            message.textContent = "";
            message.className = "form-message";
        }
    }

    function showMessage(text, type) {
        if (!message) {
            return;
        }

        message.textContent = text;
        message.className = `form-message ${type}`;
    }

    function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
});