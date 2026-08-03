document.addEventListener("DOMContentLoaded", () => {
    initializeNavbar();
    initializeMobileNavigation();
    updateNavbarCartCount();
});

/* ================================
   AUTH NAVBAR
================================ */

function initializeNavbar() {
    const authNavItem = document.getElementById("authNavItem");

    if (!authNavItem) {
        console.warn("authNavItem not found in this page.");
        return;
    }

    const token = getToken();
    const user = getStoredUser();

    if (!token || !user) {
        showGuestNavbar(authNavItem);
        return;
    }

    showUserNavbar(authNavItem, user);
    initializeProfileDropdown();
}

function getToken() {
    return (
        localStorage.getItem("token") ||
        sessionStorage.getItem("token")
    );
}

function getStoredUser() {
    const storedUser =
        localStorage.getItem("user") ||
        sessionStorage.getItem("user");

    if (!storedUser) return null;

    try {
        return JSON.parse(storedUser);
    } catch (error) {
        console.error("Invalid stored user data:", error);
        clearAuthenticationData();
        return null;
    }
}

function showGuestNavbar(authNavItem) {
    authNavItem.innerHTML = `
        <a href="login.html" class="btn-nav-login">
            <i class="fas fa-sign-in-alt"></i>
            <span>Login</span>
        </a>
    `;
}

function showUserNavbar(authNavItem, user) {
    const role = String(user.role || "").toLowerCase();

    const adminDashboardLink =
        role === "admin"
            ? `
                <a href="admin/dashboard.html">
                    <i class="fas fa-gauge-high"></i>
                    <span>Admin Dashboard</span>
                </a>
            `
            : "";

    authNavItem.innerHTML = `
        <div class="profile-dropdown">

            <button
                type="button"
                class="profile-btn"
                id="profileBtn"
                aria-expanded="false"
                aria-controls="profileMenu"
            >
                <i class="fas fa-user-circle"></i>

                <span class="profile-name">
                    ${escapeHTML(user.name || "Profile")}
                </span>

                <i class="fas fa-chevron-down dropdown-arrow"></i>
            </button>

            <div
                class="profile-menu"
                id="profileMenu"
            >
                ${adminDashboardLink}

                <a href="profile.html">
                    <i class="fas fa-user"></i>
                    <span>My Profile</span>
                </a>

                <a href="my-orders.html">
                    <i class="fas fa-box"></i>
                    <span>My Orders</span>
                </a>

                <button
                    type="button"
                    id="logoutBtn"
                >
                    <i class="fas fa-right-from-bracket"></i>
                    <span>Logout</span>
                </button>
            </div>

        </div>
    `;
}

/* ================================
   PROFILE DROPDOWN
================================ */

function initializeProfileDropdown() {
    const profileBtn = document.getElementById("profileBtn");
    const profileMenu = document.getElementById("profileMenu");
    const logoutBtn = document.getElementById("logoutBtn");

    if (!profileBtn || !profileMenu) return;

    profileBtn.addEventListener("click", (event) => {
        event.stopPropagation();

        const isOpen = profileMenu.classList.toggle("show");

        profileBtn.setAttribute(
            "aria-expanded",
            String(isOpen)
        );
    });

    profileMenu.addEventListener("click", (event) => {
        event.stopPropagation();
    });

    document.addEventListener("click", () => {
        closeProfileDropdown(profileBtn, profileMenu);
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeProfileDropdown(profileBtn, profileMenu);
        }
    });

    logoutBtn?.addEventListener("click", logoutUser);
}

function closeProfileDropdown(profileBtn, profileMenu) {
    if (!profileBtn || !profileMenu) return;

    profileMenu.classList.remove("show");
    profileBtn.setAttribute("aria-expanded", "false");
}

/* ================================
   LOGOUT
================================ */

function logoutUser() {
    clearAuthenticationData();
    window.location.href = "login.html";
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

/* ================================
   CART COUNT
================================ */

function getCart() {
    try {
        const storedCart = localStorage.getItem("ismCart");

        if (!storedCart) return [];

        const cart = JSON.parse(storedCart);

        return Array.isArray(cart) ? cart : [];
    } catch (error) {
        console.error("Unable to read cart:", error);
        return [];
    }
}

function updateNavbarCartCount() {
    const cart = getCart();

    const totalQuantity = cart.reduce(
        (total, item) =>
            total + Number(item.quantity || 0),
        0
    );

    document
        .querySelectorAll(".cart-count")
        .forEach((element) => {
            element.textContent = totalQuantity;

            element.style.display =
                totalQuantity > 0
                    ? "inline-flex"
                    : "none";
        });
}

window.addEventListener("storage", (event) => {
    if (event.key === "ismCart") {
        updateNavbarCartCount();
    }
});

window.addEventListener(
    "cartUpdated",
    updateNavbarCartCount
);

/* ================================
   MOBILE NAVIGATION
================================ */

function initializeMobileNavigation() {
    const menuToggle = document.getElementById("menuToggle");
    const navLinks = document.getElementById("navLinks");

    if (!menuToggle || !navLinks) return;

    menuToggle.addEventListener("click", () => {
        navLinks.classList.toggle("show");

        const icon = menuToggle.querySelector("i");

        if (!icon) return;

        if (navLinks.classList.contains("show")) {
            icon.classList.replace(
                "fa-bars",
                "fa-xmark"
            );
        } else {
            icon.classList.replace(
                "fa-xmark",
                "fa-bars"
            );
        }
    });

    navLinks.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
            navLinks.classList.remove("show");

            const icon = menuToggle.querySelector("i");

            if (icon) {
                icon.classList.replace(
                    "fa-xmark",
                    "fa-bars"
                );
            }
        });
    });
}

/* ================================
   HELPERS
================================ */

function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}