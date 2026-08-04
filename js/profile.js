const API_BASE_URL = "http://localhost:5000/api";

document.addEventListener("DOMContentLoaded", initializeProfilePage);

async function initializeProfilePage() {
    const token = getAuthToken();
    const storedUser = getStoredUser();

    if (!token || !storedUser) {
        localStorage.setItem("redirectAfterLogin", "profile.html");
        window.location.href = "login.html";
        return;
    }

    setupProfileEvents();
    setupPasswordToggles();

    await Promise.all([
        loadProfile(),
        loadOrders()
    ]);
}

/* =========================================
   AUTH HELPERS
========================================= */

function getAuthToken() {
    return (
        localStorage.getItem("token") ||
        sessionStorage.getItem("token")
    );
}

function getStoredUser() {
    const rawUser =
        localStorage.getItem("user") ||
        sessionStorage.getItem("user");

    if (!rawUser) return null;

    try {
        return JSON.parse(rawUser);
    } catch (error) {
        console.error("Invalid stored user data:", error);
        clearAuthenticationData();
        return null;
    }
}

function saveUserData(user) {
    if (localStorage.getItem("token")) {
        localStorage.setItem("user", JSON.stringify(user));
        sessionStorage.removeItem("user");
        return;
    }

    if (sessionStorage.getItem("token")) {
        sessionStorage.setItem("user", JSON.stringify(user));
        localStorage.removeItem("user");
        return;
    }

    localStorage.setItem("user", JSON.stringify(user));
}

function clearAuthenticationData() {
    const keys = [
        "token",
        "user",
        "adminToken",
        "adminUser",
        "redirectAfterLogin"
    ];

    keys.forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    });
}

/* =========================================
   PROFILE EVENTS
========================================= */

function setupProfileEvents() {
    const editButton = document.getElementById("editProfileButton");
    const cancelButton = document.getElementById("cancelEditButton");
    const profileForm = document.getElementById("profileForm");
    const changePasswordForm =
        document.getElementById("changePasswordForm");
    const logoutButton =
        document.getElementById("profileLogoutButton");

    editButton?.addEventListener("click", enableProfileEdit);
    cancelButton?.addEventListener("click", cancelProfileEdit);
    profileForm?.addEventListener("submit", updateProfile);
    changePasswordForm?.addEventListener(
        "submit",
        updatePassword
    );
    logoutButton?.addEventListener("click", logoutUser);
}

/* =========================================
   LOAD PROFILE
========================================= */

async function loadProfile() {
    const token = getAuthToken();

    try {
        const response = await fetch(
            `${API_BASE_URL}/auth/profile`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const result = await parseResponse(response);

        if (!response.ok) {
            handleUnauthorizedResponse(response);

            throw new Error(
                result.message || "Unable to load profile."
            );
        }

        if (!result.user) {
            throw new Error("Profile data was not found.");
        }

        updateProfileInterface(result.user);
        saveUserData(result.user);
    } catch (error) {
        console.error("Load profile error:", error);
        showAlert(error.message, "error");
    }
}

function updateProfileInterface(user) {
    const name = String(user.name || "User");
    const email = String(user.email || "");
    const role = String(user.role || "customer");
    const joinedDate = formatDate(user.createdAt);

    setText("sidebarUserName", name);
    setText("sidebarUserEmail", email);
    setText("sidebarUserRole", capitalize(role));
    setText(
        "profileInitial",
        name.charAt(0).toUpperCase() || "U"
    );

    setInputValue("profileName", name);
    setInputValue("profileEmail", email);
    setInputValue("profileRole", capitalize(role));
    setInputValue("profileJoinedDate", joinedDate);
}

/* =========================================
   LOAD ORDERS
========================================= */

async function loadOrders() {
    const token = getAuthToken();
    const ordersContainer =
        document.getElementById("recentOrdersList");

    try {
        const response = await fetch(
            `${API_BASE_URL}/orders/my-orders`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const result = await parseResponse(response);

        if (!response.ok) {
            handleUnauthorizedResponse(response);

            throw new Error(
                result.message || "Unable to load orders."
            );
        }

        const orders = Array.isArray(result.data)
            ? result.data
            : Array.isArray(result.orders)
                ? result.orders
                : [];

        updateOrderStatistics(orders);
        renderRecentOrders(orders);
    } catch (error) {
        console.error("Load orders error:", error);

        setText("totalOrders", "0");
        setText("deliveredOrders", "0");
        setText("totalSpent", formatPrice(0));

        if (ordersContainer) {
            ordersContainer.innerHTML = `
                <div class="error-orders">
                    <i class="fas fa-circle-exclamation"></i>
                    <p>${escapeHTML(error.message)}</p>
                </div>
            `;
        }
    }
}

function updateOrderStatistics(orders) {
    const deliveredOrders = orders.filter((order) => {
        return normalizeStatus(order.orderStatus) === "delivered";
    });

    const totalSpent = deliveredOrders.reduce(
        (total, order) => {
            return total + Number(order.totalAmount || 0);
        },
        0
    );

    setText("totalOrders", String(orders.length));
    setText(
        "deliveredOrders",
        String(deliveredOrders.length)
    );
    setText("totalSpent", formatPrice(totalSpent));
}

function renderRecentOrders(orders) {
    const container =
        document.getElementById("recentOrdersList");

    if (!container) return;

    if (!orders.length) {
        container.innerHTML = `
            <div class="empty-orders">
                <i class="fas fa-box-open"></i>
                <p>No orders found.</p>
                <a href="products.html">
                    Browse Products
                </a>
            </div>
        `;
        return;
    }

    const sortedOrders = [...orders].sort((first, second) => {
        return (
            new Date(second.createdAt).getTime() -
            new Date(first.createdAt).getTime()
        );
    });

    container.innerHTML = sortedOrders
        .slice(0, 5)
        .map((order) => {
            const status = normalizeStatus(
                order.orderStatus || "pending"
            );

            const orderNumber =
                order.orderNumber ||
                `#${String(order._id || "").slice(-8)}`;

            return `
                <div class="recent-order-item">
                    <div class="order-main-info">
                        <h3>
                            ${escapeHTML(orderNumber)}
                        </h3>

                        <p>
                            ${escapeHTML(formatDate(order.createdAt))}
                        </p>
                    </div>

                    <span class="order-status ${status}">
                        ${escapeHTML(capitalize(status))}
                    </span>

                    <strong class="order-amount">
                        ${formatPrice(order.totalAmount)}
                    </strong>
                </div>
            `;
        })
        .join("");
}

/* =========================================
   PROFILE EDIT
========================================= */

function enableProfileEdit() {
    const nameInput = document.getElementById("profileName");
    const emailInput = document.getElementById("profileEmail");
    const actions = document.getElementById(
        "profileFormActions"
    );
    const editButton = document.getElementById(
        "editProfileButton"
    );

    if (nameInput) nameInput.disabled = false;
    if (emailInput) emailInput.disabled = false;

    nameInput
        ?.closest(".input-box")
        ?.classList.add("editing");

    emailInput
        ?.closest(".input-box")
        ?.classList.add("editing");

    actions?.classList.add("show");

    if (editButton) {
        editButton.style.display = "none";
    }

    nameInput?.focus();
}

async function cancelProfileEdit() {
    clearProfileErrors();
    disableProfileEdit();
    await loadProfile();
}

function disableProfileEdit() {
    const nameInput = document.getElementById("profileName");
    const emailInput = document.getElementById("profileEmail");
    const actions = document.getElementById(
        "profileFormActions"
    );
    const editButton = document.getElementById(
        "editProfileButton"
    );

    if (nameInput) nameInput.disabled = true;
    if (emailInput) emailInput.disabled = true;

    nameInput
        ?.closest(".input-box")
        ?.classList.remove("editing");

    emailInput
        ?.closest(".input-box")
        ?.classList.remove("editing");

    actions?.classList.remove("show");

    if (editButton) {
        editButton.style.display = "inline-flex";
    }
}

async function updateProfile(event) {
    event.preventDefault();
    clearProfileErrors();

    const token = getAuthToken();
    const nameInput = document.getElementById("profileName");
    const emailInput = document.getElementById("profileEmail");
    const saveButton = document.getElementById(
        "saveProfileButton"
    );

    const name = nameInput?.value.trim() || "";
    const email = emailInput?.value.trim().toLowerCase() || "";

    if (!validateProfileForm(name, email)) {
        showAlert(
            "Please correct the highlighted fields.",
            "error"
        );
        return;
    }

    setButtonLoading(
        saveButton,
        true,
        "Saving...",
        "Save Changes",
        "fa-check"
    );

    try {
        const response = await fetch(
            `${API_BASE_URL}/users/profile`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    name,
                    email
                })
            }
        );

        const result = await parseResponse(response);

        if (!response.ok) {
            handleUnauthorizedResponse(response);

            throw new Error(
                result.message || "Unable to update profile."
            );
        }

        const updatedUser = result.user || {
            ...getStoredUser(),
            name,
            email
        };

        saveUserData(updatedUser);
        updateProfileInterface(updatedUser);
        disableProfileEdit();

        window.dispatchEvent(
            new CustomEvent("profileUpdated", {
                detail: updatedUser
            })
        );

        showAlert(
            result.message || "Profile updated successfully.",
            "success"
        );
    } catch (error) {
        console.error("Update profile error:", error);
        showAlert(error.message, "error");
    } finally {
        setButtonLoading(
            saveButton,
            false,
            "Saving...",
            "Save Changes",
            "fa-check"
        );
    }
}

function validateProfileForm(name, email) {
    let valid = true;

    if (!name) {
        showProfileError(
            "profileName",
            "Full name is required."
        );
        valid = false;
    } else if (name.length < 2) {
        showProfileError(
            "profileName",
            "Full name must contain at least 2 characters."
        );
        valid = false;
    }

    if (!email) {
        showProfileError(
            "profileEmail",
            "Email address is required."
        );
        valid = false;
    } else if (!validateEmail(email)) {
        showProfileError(
            "profileEmail",
            "Enter a valid email address."
        );
        valid = false;
    }

    return valid;
}

/* =========================================
   CHANGE PASSWORD
========================================= */

async function updatePassword(event) {
    event.preventDefault();
    clearPasswordErrors();

    const token = getAuthToken();
    const form = document.getElementById(
        "changePasswordForm"
    );
    const button = document.getElementById(
        "changePasswordButton"
    );

    const currentPassword =
        document.getElementById("currentPassword")
            ?.value || "";

    const newPassword =
        document.getElementById("newPassword")
            ?.value || "";

    const confirmPassword =
        document.getElementById("confirmPassword")
            ?.value || "";

    if (
        !validatePasswordForm(
            currentPassword,
            newPassword,
            confirmPassword
        )
    ) {
        showAlert(
            "Please correct the password fields.",
            "error"
        );
        return;
    }

    setButtonLoading(
        button,
        true,
        "Updating...",
        "Update Password",
        "fa-lock"
    );

    try {
        const response = await fetch(
            `${API_BASE_URL}/users/change-password`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            }
        );

        const result = await parseResponse(response);

        if (!response.ok) {
            handleUnauthorizedResponse(response);

            throw new Error(
                result.message || "Unable to update password."
            );
        }

        form?.reset();

        [
            "currentPassword",
            "newPassword",
            "confirmPassword"
        ].forEach((id) => {
            const input = document.getElementById(id);
            if (input) input.type = "password";
        });

        resetPasswordToggleIcons();

        showAlert(
            result.message || "Password updated successfully.",
            "success"
        );
    } catch (error) {
        console.error("Change password error:", error);
        showAlert(error.message, "error");
    } finally {
        setButtonLoading(
            button,
            false,
            "Updating...",
            "Update Password",
            "fa-lock"
        );
    }
}

function validatePasswordForm(
    currentPassword,
    newPassword,
    confirmPassword
) {
    let valid = true;

    if (!currentPassword) {
        showPasswordError(
            "currentPassword",
            "Current password is required."
        );
        valid = false;
    }

    if (!newPassword) {
        showPasswordError(
            "newPassword",
            "New password is required."
        );
        valid = false;
    } else if (newPassword.length < 6) {
        showPasswordError(
            "newPassword",
            "Password must contain at least 6 characters."
        );
        valid = false;
    } else if (newPassword === currentPassword) {
        showPasswordError(
            "newPassword",
            "New password must be different."
        );
        valid = false;
    }

    if (!confirmPassword) {
        showPasswordError(
            "confirmPassword",
            "Please confirm your new password."
        );
        valid = false;
    } else if (newPassword !== confirmPassword) {
        showPasswordError(
            "confirmPassword",
            "Passwords do not match."
        );
        valid = false;
    }

    return valid;
}

/* =========================================
   PASSWORD TOGGLE
========================================= */

function setupPasswordToggles() {
    document
        .querySelectorAll(".password-toggle")
        .forEach((button) => {
            button.addEventListener("click", () => {
                const targetId = button.dataset.target;
                const input =
                    document.getElementById(targetId);
                const icon = button.querySelector("i");

                if (!input) return;

                const shouldShow =
                    input.type === "password";

                input.type = shouldShow
                    ? "text"
                    : "password";

                if (icon) {
                    icon.classList.toggle(
                        "fa-eye",
                        !shouldShow
                    );

                    icon.classList.toggle(
                        "fa-eye-slash",
                        shouldShow
                    );
                }

                button.setAttribute(
                    "aria-label",
                    shouldShow
                        ? "Hide password"
                        : "Show password"
                );
            });
        });
}

function resetPasswordToggleIcons() {
    document
        .querySelectorAll(".password-toggle")
        .forEach((button) => {
            const icon = button.querySelector("i");

            if (!icon) return;

            icon.classList.remove("fa-eye-slash");
            icon.classList.add("fa-eye");

            button.setAttribute(
                "aria-label",
                "Show password"
            );
        });
}

/* =========================================
   LOGOUT
========================================= */

function logoutUser() {
    const confirmed = window.confirm(
        "Are you sure you want to logout?"
    );

    if (!confirmed) return;

    clearAuthenticationData();
    window.location.href = "login.html";
}

/* =========================================
   VALIDATION ERRORS
========================================= */

function showProfileError(id, text) {
    const input = document.getElementById(id);
    const error = document.getElementById(`${id}Error`);

    input
        ?.closest(".input-box")
        ?.classList.add("error");

    if (error) {
        error.textContent = text;
    }
}

function clearProfileErrors() {
    const form = document.getElementById("profileForm");

    form
        ?.querySelectorAll(".input-box")
        .forEach((box) => {
            box.classList.remove("error");
        });

    form
        ?.querySelectorAll(".error-message")
        .forEach((error) => {
            error.textContent = "";
        });
}

function showPasswordError(id, text) {
    const input = document.getElementById(id);
    const error = document.getElementById(`${id}Error`);

    input
        ?.closest(".input-box")
        ?.classList.add("error");

    if (error) {
        error.textContent = text;
    }
}

function clearPasswordErrors() {
    const form = document.getElementById(
        "changePasswordForm"
    );

    form
        ?.querySelectorAll(".input-box")
        .forEach((box) => {
            box.classList.remove("error");
        });

    form
        ?.querySelectorAll(".error-message")
        .forEach((error) => {
            error.textContent = "";
        });
}

/* =========================================
   UI HELPERS
========================================= */

function showAlert(text, type) {
    const alert = document.getElementById("profileAlert");

    if (!alert) return;

    alert.textContent = text;
    alert.className = `profile-alert ${type} show`;

    window.clearTimeout(showAlert.timeoutId);

    showAlert.timeoutId = window.setTimeout(() => {
        alert.classList.remove("show");
    }, 4000);
}

function setButtonLoading(
    button,
    loading,
    loadingText,
    normalText,
    normalIcon
) {
    if (!button) return;

    button.disabled = loading;

    button.innerHTML = loading
        ? `
            <i class="fas fa-spinner fa-spin"></i>
            ${loadingText}
          `
        : `
            <i class="fas ${normalIcon}"></i>
            ${normalText}
          `;
}

function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}

function setInputValue(id, value) {
    const input = document.getElementById(id);

    if (input) {
        input.value = value;
    }
}

function handleUnauthorizedResponse(response) {
    if (response.status !== 401) return;

    clearAuthenticationData();
    localStorage.setItem(
        "redirectAfterLogin",
        "profile.html"
    );

    window.location.href = "login.html";
}

async function parseResponse(response) {
    const contentType =
        response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
        return response.json();
    }

    const text = await response.text();

    return {
        message:
            text ||
            `Server returned status ${response.status}.`
    };
}

/* =========================================
   FORMAT HELPERS
========================================= */

function formatPrice(value) {
    return Number(value || 0).toLocaleString(
        "en-LK",
        {
            style: "currency",
            currency: "LKR",
            minimumFractionDigits: 2
        }
    );
}

function formatDate(value) {
    if (!value) return "Not available";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Not available";
    }

    return date.toLocaleDateString("en-LK", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}

function normalizeStatus(value) {
    return String(value || "pending")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-");
}

function capitalize(value) {
    const text = String(value || "");

    if (!text) return "";

    return (
        text.charAt(0).toUpperCase() +
        text.slice(1).replace(/-/g, " ")
    );
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}