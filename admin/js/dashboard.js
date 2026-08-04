const API_BASE_URL = "http://localhost:5000/api";
let monthlyRevenueChartInstance = null;
let orderStatusChartInstance = null;
let monthlyOrdersChartInstance = null;

document.addEventListener("DOMContentLoaded", () => {
    initializeDashboard();
});

async function initializeDashboard() {
    loadAdminInformation();
    initializeSidebar();
    initializeLogout();

    const token = getAdminToken();
    const admin = getStoredAdmin();

    if (!token || !admin) {
        window.location.href = "../login.html";
        return;
    }

    if (
        String(admin.role || "").toLowerCase() !==
        "admin"
    ) {
        clearAuthenticationData();
        window.location.href = "../login.html";
        return;
    }

    await loadDashboard();
}

/* =================================
   AUTH
================================= */

function getAdminToken() {
    return (
        localStorage.getItem("token") ||
        sessionStorage.getItem("token") ||
        localStorage.getItem("adminToken") ||
        sessionStorage.getItem("adminToken")
    );
}

function getStoredAdmin() {
    const storedUser =
        localStorage.getItem("user") ||
        sessionStorage.getItem("user") ||
        localStorage.getItem("adminUser") ||
        sessionStorage.getItem("adminUser");

    if (!storedUser) {
        return null;
    }

    try {
        return JSON.parse(storedUser);
    } catch (error) {
        console.error(
            "Invalid stored admin data:",
            error
        );

        clearAuthenticationData();
        return null;
    }
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

function loadAdminInformation() {
    const admin = getStoredAdmin();

    if (!admin) {
        return;
    }

    setText(
        "adminName",
        admin.name || "Administrator"
    );

    setText(
        "adminEmail",
        admin.email || "Admin"
    );
}

function initializeLogout() {
    document
        .getElementById("logoutButton")
        ?.addEventListener("click", () => {
            const confirmed = window.confirm(
                "Are you sure you want to logout?"
            );

            if (!confirmed) {
                return;
            }

            clearAuthenticationData();
            window.location.href = "../login.html";
        });
}

/* =================================
   SIDEBAR
================================= */

function initializeSidebar() {
    const menuButton =
        document.getElementById("menuButton");

    const sidebar =
        document.getElementById("sidebar");

    menuButton?.addEventListener("click", () => {
        sidebar?.classList.toggle("open");
    });

    document
        .querySelectorAll(".sidebar-nav a")
        .forEach((link) => {
            link.addEventListener("click", () => {
                sidebar?.classList.remove("open");
            });
        });
}

/* =================================
   LOAD DASHBOARD
================================= */

async function loadDashboard() {
    setDashboardLoading();

    try {
        const response = await fetch(
            `${API_BASE_URL}/dashboard`,
            {
                headers: {
                    Authorization:
                        `Bearer ${getAdminToken()}`
                }
            }
        );

        const result =
            await parseResponse(response);

        if (
            response.status === 401 ||
            response.status === 403
        ) {
            clearAuthenticationData();
            window.location.href = "../login.html";
            return;
        }

        if (!response.ok) {
            throw new Error(
                result.message ||
                "Unable to load dashboard."
            );
        }

        const statistics =
            result.statistics || {};

        const recent =
            result.recent || {};

        const charts =
            result.charts || {};

        renderStatistics(statistics);
        renderDashboardCharts(charts);

        renderRecentOrders(
            Array.isArray(recent.orders)
                ? recent.orders
                : []
        );

        renderRecentProducts(
            Array.isArray(recent.products)
                ? recent.products
                : []
        );

        renderRecentMessages(
            Array.isArray(recent.messages)
                ? recent.messages
                : []
        );
    } catch (error) {
        console.error(
            "Dashboard load error:",
            error
        );

        showDashboardAlert(
            error.message ||
            "Unable to load dashboard.",
            "error"
        );

        renderStatistics({});
        renderRecentOrders([]);
        renderRecentProducts([]);
        renderRecentMessages([]);
    }
}

/* =================================
   STATISTICS
================================= */

function renderStatistics(statistics) {
    setText(
        "totalProducts",
        String(statistics.totalProducts || 0)
    );

    setText(
        "totalOrders",
        String(statistics.totalOrders || 0)
    );

    setText(
        "totalUsers",
        String(statistics.totalUsers || 0)
    );

    setText(
        "totalRevenue",
        formatCurrency(
            statistics.totalRevenue || 0
        )
    );

    setText(
        "pendingOrders",
        String(statistics.pendingOrders || 0)
    );

    setText(
        "processingOrders",
        String(statistics.processingOrders || 0)
    );

    setText(
        "deliveredOrders",
        String(statistics.deliveredOrders || 0)
    );

    setText(
        "unreadMessages",
        String(statistics.unreadMessages || 0)
    );
}

/* =================================
   RECENT ORDERS
================================= */

function renderRecentOrders(orders) {
    const container =
        document.getElementById("recentOrders");

    if (!container) {
        return;
    }

    if (!orders.length) {
        container.innerHTML = `
            <p class="empty-message">
                No orders found.
            </p>
        `;
        return;
    }

    container.innerHTML = orders
        .slice(0, 5)
        .map((order) => {
            const orderNumber =
                order.orderNumber ||
                `#${String(order._id || "")
                    .slice(-8)
                    .toUpperCase()}`;

            const customerName =
                order.customer?.name ||
                order.user?.name ||
                "Unknown Customer";

            const status =
                normalizeStatus(
                    order.orderStatus
                );

            return `
                <div class="recent-item">

                    <div>
                        <h3>
                            ${escapeHTML(orderNumber)}
                        </h3>

                        <p>
                            ${escapeHTML(customerName)}
                            ·
                            ${escapeHTML(
                                formatDate(order.createdAt)
                            )}
                        </p>
                    </div>

                    <div class="dashboard-recent-right">

                        <strong>
                            ${formatCurrency(
                                order.totalAmount
                            )}
                        </strong>

                        <span
                            class="admin-status-badge ${status}"
                        >
                            ${escapeHTML(
                                formatStatus(status)
                            )}
                        </span>

                    </div>

                </div>
            `;
        })
        .join("");
}

/* =================================
   RECENT PRODUCTS
================================= */

function renderRecentProducts(products) {
    const container =
        document.getElementById("recentProducts");

    if (!container) {
        return;
    }

    if (!products.length) {
        container.innerHTML = `
            <p class="empty-message">
                No products found.
            </p>
        `;
        return;
    }

    container.innerHTML = products
        .slice(0, 5)
        .map((product) => {
            const name =
                product.name ||
                "Unnamed Product";

            const category =
                product.category ||
                "No category";

            return `
                <div class="recent-item">

                    <div>
                        <h3>
                            ${escapeHTML(name)}
                        </h3>

                        <p>
                            ${escapeHTML(category)}
                            · Stock:
                            ${Number(product.stock || 0)}
                        </p>
                    </div>

                    <strong>
                        ${formatCurrency(product.price)}
                    </strong>

                </div>
            `;
        })
        .join("");
}

/* =================================
   RECENT MESSAGES
================================= */

function renderRecentMessages(messages) {
    const container =
        document.getElementById("recentMessages");

    if (!container) {
        return;
    }

    if (!messages.length) {
        container.innerHTML = `
            <p class="empty-message">
                No customer messages found.
            </p>
        `;
        return;
    }

    container.innerHTML = messages
        .slice(0, 5)
        .map((message) => {
            const customerName =
                message.name ||
                "Unknown Customer";

            const subject =
                message.subject ||
                "No subject";

            const status =
                String(
                    message.status || "unread"
                ).toLowerCase();

            const safeStatus =
                status === "read"
                    ? "read"
                    : "unread";

            return `
                <div class="recent-item">

                    <div>
                        <h3>
                            ${escapeHTML(customerName)}
                        </h3>

                        <p>
                            ${escapeHTML(subject)}
                        </p>
                    </div>

                    <span
                        class="status-badge status-${safeStatus}"
                    >
                        ${escapeHTML(safeStatus)}
                    </span>

                </div>
            `;
        })
        .join("");
}

/* =================================
   UI STATES
================================= */

function setDashboardLoading() {
    [
        "totalProducts",
        "totalOrders",
        "totalUsers",
        "totalRevenue",
        "pendingOrders",
        "processingOrders",
        "deliveredOrders",
        "unreadMessages"
    ].forEach((id) => {
        setText(id, "...");
    });
}

function showDashboardAlert(message, type) {
    const alert =
        document.getElementById("dashboardAlert");

    if (!alert) {
        return;
    }

    alert.hidden = false;
    alert.textContent = message;

    alert.className =
        type === "success"
            ? "page-alert page-alert-success"
            : "page-alert page-alert-error";
}

/* =================================
   HELPERS
================================= */

async function parseResponse(response) {
    const contentType =
        response.headers.get("content-type") || "";

    if (
        contentType.includes(
            "application/json"
        )
    ) {
        return response.json();
    }

    const text =
        await response.text();

    return {
        message:
            text ||
            `Server returned status ${response.status}.`
    };
}

function setText(id, value) {
    const element =
        document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}

function formatCurrency(value) {
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
    if (!value) {
        return "Not available";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "Not available";
    }

    return date.toLocaleDateString(
        "en-LK",
        {
            year: "numeric",
            month: "short",
            day: "numeric"
        }
    );
}

function normalizeStatus(value) {
    return String(value || "pending")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-");
}

function formatStatus(value) {
    return normalizeStatus(value)
        .split("-")
        .map((word) => {
            return (
                word.charAt(0).toUpperCase() +
                word.slice(1)
            );
        })
        .join(" ");
}

function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

/* =================================
   DASHBOARD CHARTS
================================= */

function renderDashboardCharts(charts) {
    if (typeof Chart === "undefined") {
        console.error("Chart.js is not loaded.");
        return;
    }

    renderMonthlyRevenueChart(charts);
    renderOrderStatusChart(charts);
    renderMonthlyOrdersChart(charts);
}

function renderMonthlyRevenueChart(charts) {
    const canvas =
        document.getElementById(
            "monthlyRevenueChart"
        );

    if (!canvas) return;

    monthlyRevenueChartInstance?.destroy();

    monthlyRevenueChartInstance =
        new Chart(canvas, {
            type: "bar",

            data: {
                labels:
                    charts.monthlyLabels || [],

                datasets: [
                    {
                        label: "Revenue (LKR)",

                        data:
                            charts.monthlyRevenue ||
                            [],

                        borderWidth: 1,
                        borderRadius: 8
                    }
                ]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,

                plugins: {
                    legend: {
                        display: false
                    },

                    tooltip: {
                        callbacks: {
                            label(context) {
                                return formatCurrency(
                                    context.raw
                                );
                            }
                        }
                    }
                },

                scales: {
                    y: {
                        beginAtZero: true,

                        ticks: {
                            callback(value) {
                                return `LKR ${Number(
                                    value
                                ).toLocaleString(
                                    "en-LK"
                                )}`;
                            }
                        }
                    },

                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
}

function renderOrderStatusChart(charts) {
    const canvas =
        document.getElementById(
            "orderStatusChart"
        );

    if (!canvas) return;

    orderStatusChartInstance?.destroy();

    const labels = Array.isArray(
        charts.statusLabels
    )
        ? charts.statusLabels.map(
              formatStatus
          )
        : [];

    orderStatusChartInstance =
        new Chart(canvas, {
            type: "doughnut",

            data: {
                labels,

                datasets: [
                    {
                        data:
                            charts.statusCounts || [],

                        borderWidth: 2
                    }
                ]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,

                plugins: {
                    legend: {
                        position: "bottom",

                        labels: {
                            usePointStyle: true,
                            padding: 16
                        }
                    }
                },

                cutout: "65%"
            }
        });
}

function renderMonthlyOrdersChart(charts) {
    const canvas =
        document.getElementById(
            "monthlyOrdersChart"
        );

    if (!canvas) return;

    monthlyOrdersChartInstance?.destroy();

    monthlyOrdersChartInstance =
        new Chart(canvas, {
            type: "line",

            data: {
                labels:
                    charts.monthlyLabels || [],

                datasets: [
                    {
                        label: "Orders",

                        data:
                            charts.monthlyOrderCount ||
                            [],

                        borderWidth: 3,
                        tension: 0.35,
                        fill: false,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }
                ]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,

                plugins: {
                    legend: {
                        display: false
                    }
                },

                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    },

                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
}