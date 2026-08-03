document.addEventListener("DOMContentLoaded", () => {
    const API_URL = "http://localhost:5000/api/auth/login";

    const loginForm = document.getElementById("loginForm");
    const emailInput = document.getElementById("loginEmail");
    const passwordInput = document.getElementById("loginPassword");
    const message = document.getElementById("loginMessage");
    const rememberMe = document.getElementById("rememberMe");
    const forgotPassword = document.getElementById("forgotPassword");

    if (!loginForm || !emailInput || !passwordInput) {
        console.error("Required login elements not found.");
        return;
    }

    loadRememberedEmail();
    setupPasswordToggles();

    loginForm.addEventListener("submit", handleLogin);

    forgotPassword?.addEventListener("click", (event) => {
        event.preventDefault();
        showMessage(
            "Forgot password feature will be added later.",
            "error"
        );
    });

    async function handleLogin(event) {
        event.preventDefault();
        clearErrors();

        const email = emailInput.value.trim().toLowerCase();
        const password = passwordInput.value;

        if (!validateLoginForm(email, password)) {
            showMessage(
                "Please correct the highlighted fields.",
                "error"
            );
            return;
        }

        const button = loginForm.querySelector(".auth-btn");
        setLoadingState(button, true);

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    password
                })
            });

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

            localStorage.setItem("token", data.token);
            localStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );

            sessionStorage.removeItem("token");
            sessionStorage.removeItem("user");

            if (rememberMe?.checked) {
                localStorage.setItem(
                    "rememberedEmail",
                    email
                );
            } else {
                localStorage.removeItem(
                    "rememberedEmail"
                );
            }

            showMessage(
                "Login successful! Redirecting...",
                "success"
            );

            setTimeout(() => {
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
            setLoadingState(button, false);
        }
    }

    function validateLoginForm(email, password) {
        let valid = true;

        if (!email) {
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

        if (!password) {
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

        return valid;
    }

    function redirectUser(user) {
        const redirectAfterLogin =
            localStorage.getItem("redirectAfterLogin");

        if (redirectAfterLogin) {
            localStorage.removeItem(
                "redirectAfterLogin"
            );
            window.location.href =
                redirectAfterLogin;
            return;
        }

        const role = String(
            user?.role || ""
        ).toLowerCase();

        window.location.href =
            role === "admin"
                ? "admin/dashboard.html"
                : "index.html";
    }

    function clearOldLoginData() {
        const keys = [
            "token",
            "user",
            "adminToken",
            "adminUser"
        ];

        keys.forEach((key) => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        });
    }

    function loadRememberedEmail() {
        const rememberedEmail =
            localStorage.getItem(
                "rememberedEmail"
            );

        if (!rememberedEmail) return;

        emailInput.value = rememberedEmail;

        if (rememberMe) {
            rememberMe.checked = true;
        }
    }

    function setupPasswordToggles() {
        document
            .querySelectorAll(".password-toggle")
            .forEach((button) => {
                button.addEventListener(
                    "click",
                    () => {
                        const input =
                            document.getElementById(
                                button.dataset.target
                            );

                        const icon =
                            button.querySelector("i");

                        if (!input) return;

                        const showPassword =
                            input.type === "password";

                        input.type =
                            showPassword
                                ? "text"
                                : "password";

                        if (icon) {
                            icon.classList.toggle(
                                "fa-eye",
                                !showPassword
                            );

                            icon.classList.toggle(
                                "fa-eye-slash",
                                showPassword
                            );
                        }
                    }
                );
            });
    }

    function setLoadingState(button, loading) {
        if (!button) return;

        button.disabled = loading;

        button.innerHTML = loading
            ? `
                <i class="fas fa-spinner fa-spin"></i>
                Logging in...
              `
            : `
                <span>Login</span>
                <i class="fas fa-arrow-right"></i>
              `;
    }

    function showError(id, text) {
        const input =
            document.getElementById(id);

        const error =
            document.getElementById(
                `${id}Error`
            );

        input
            ?.closest(".input-box")
            ?.classList.add("error");

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
            message.className =
                "form-message";
        }
    }

    function showMessage(text, type) {
        if (!message) return;

        message.textContent = text;
        message.className =
            `form-message ${type}`;
    }

    function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            email
        );
    }
});