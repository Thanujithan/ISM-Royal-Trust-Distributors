const API_BASE_URL = "http://localhost:5000/api";

document.addEventListener("DOMContentLoaded", () => {
    loadAdminInformation();
    loadDashboard();
});

async function loadDashboard() {
    await Promise.allSettled([
        loadProducts(),
        loadMessages(),
        loadUsers()
    ]);
}

/* =================================
   TOKEN AND ADMIN INFORMATION
================================= */

function getAdminToken() {
    return (
        localStorage.getItem("token") ||
        localStorage.getItem("adminToken")
    );
}

function getStoredAdmin() {
    const storedUser =
        localStorage.getItem("user") ||
        localStorage.getItem("adminUser");

    if (!storedUser) {
        return null;
    }

    try {
        return JSON.parse(storedUser);
    } catch (error) {
        console.error("Invalid stored admin information:", error);
        return null;
    }
}

function loadAdminInformation() {
    const adminNameElement = document.getElementById("adminName");
    const adminEmailElement = document.getElementById("adminEmail");

    const admin = getStoredAdmin();

    if (!admin) {
        return;
    }

    if (adminNameElement) {
        adminNameElement.textContent =
            admin.name || "Administrator";
    }

    if (adminEmailElement) {
        adminEmailElement.textContent =
            admin.email || "Admin";
    }
}

function getAuthorizationHeaders() {
    const token = getAdminToken();

    if (!token) {
        return {};
    }

    return {
        Authorization: `Bearer ${token}`
    };
}

/* =================================
   PRODUCTS
================================= */

async function loadProducts() {
    const totalProducts =
        document.getElementById("totalProducts");

    const recentProducts =
        document.getElementById("recentProducts");

    try {
        const response = await fetch(
            `${API_BASE_URL}/products`
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message || "Unable to load products."
            );
        }

        const products = extractArray(result);

        const sortedProducts = sortByNewest(products);

        totalProducts.textContent = products.length;

        renderRecentProducts(
            sortedProducts.slice(0, 5)
        );
    } catch (error) {
        console.error("Dashboard products error:", error);

        totalProducts.textContent = "0";

        recentProducts.innerHTML = `
            <p class="error-message">
                Unable to load products.
            </p>
        `;
    }
}

/* =================================
   MESSAGES
================================= */

async function loadMessages() {
    const totalMessages =
        document.getElementById("totalMessages");

    const unreadMessages =
        document.getElementById("unreadMessages");

    const recentMessages =
        document.getElementById("recentMessages");

    try {
        const response = await fetch(
            `${API_BASE_URL}/contact`,
            {
                method: "GET",
                headers: getAuthorizationHeaders()
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message || "Unable to load messages."
            );
        }

        const messages = extractArray(result);

        const sortedMessages = sortByNewest(messages);

        totalMessages.textContent = messages.length;

        const unreadCount = messages.filter(
            (message) =>
                String(message.status).toLowerCase() === "unread"
        ).length;

        unreadMessages.textContent = unreadCount;

        renderRecentMessages(
            sortedMessages.slice(0, 5)
        );
    } catch (error) {
        console.error("Dashboard messages error:", error);

        totalMessages.textContent = "0";
        unreadMessages.textContent = "0";

        recentMessages.innerHTML = `
            <p class="error-message">
                Unable to load messages.
            </p>
        `;
    }
}

/* =================================
   USERS
================================= */

async function loadUsers() {
    const totalUsers =
        document.getElementById("totalUsers");

    try {
        const token = getAdminToken();

        if (!token) {
            throw new Error("Admin token not found.");
        }

        const response = await fetch(
            `${API_BASE_URL}/users`,
            {
                method: "GET",
                headers: getAuthorizationHeaders()
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message || "Unable to load users."
            );
        }

        const users = extractArray(result);

        totalUsers.textContent = users.length;
    } catch (error) {
        console.error("Dashboard users error:", error);

        totalUsers.textContent = "0";
    }
}

/* =================================
   RENDER PRODUCTS
================================= */

function renderRecentProducts(products) {
    const container =
        document.getElementById("recentProducts");

    if (!products.length) {
        container.innerHTML = `
            <p class="empty-message">
                No products found.
            </p>
        `;

        return;
    }

    container.innerHTML = products
        .map((product) => {
            const name = escapeHtml(
                product.name ||
                product.productName ||
                "Unnamed Product"
            );

            const category = escapeHtml(
                product.category || "No category"
            );

            const price = Number(
                product.price || 0
            ).toLocaleString("en-LK", {
                style: "currency",
                currency: "LKR"
            });

            return `
                <div class="recent-item">
                    <div>
                        <h3>${name}</h3>
                        <p>${category}</p>
                    </div>

                    <strong>${price}</strong>
                </div>
            `;
        })
        .join("");
}

/* =================================
   RENDER MESSAGES
================================= */

function renderRecentMessages(messages) {
    const container =
        document.getElementById("recentMessages");

    if (!messages.length) {
        container.innerHTML = `
            <p class="empty-message">
                No customer messages found.
            </p>
        `;

        return;
    }

    container.innerHTML = messages
        .map((message) => {
            const customerName = escapeHtml(
                message.name ||
                message.fullName ||
                "Unknown Customer"
            );

            const subject = escapeHtml(
                message.subject || "No subject"
            );

            const status =
                String(
                    message.status || "unread"
                ).toLowerCase();

            const safeStatus =
                status === "read" ? "read" : "unread";

            return `
                <div class="recent-item">
                    <div>
                        <h3>${customerName}</h3>
                        <p>${subject}</p>
                    </div>

                    <span
                        class="status-badge status-${safeStatus}"
                    >
                        ${escapeHtml(safeStatus)}
                    </span>
                </div>
            `;
        })
        .join("");
}

/* =================================
   HELPERS
================================= */

function extractArray(result) {
    if (Array.isArray(result)) {
        return result;
    }

    if (Array.isArray(result.data)) {
        return result.data;
    }

    if (Array.isArray(result.products)) {
        return result.products;
    }

    if (Array.isArray(result.messages)) {
        return result.messages;
    }

    if (Array.isArray(result.contacts)) {
        return result.contacts;
    }

    if (Array.isArray(result.users)) {
        return result.users;
    }

    return [];
}

function sortByNewest(items) {
    return [...items].sort((firstItem, secondItem) => {
        const firstDate = new Date(
            firstItem.createdAt || 0
        ).getTime();

        const secondDate = new Date(
            secondItem.createdAt || 0
        ).getTime();

        return secondDate - firstDate;
    });
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}