const API_URL = "http://localhost:5000/api/orders";

let orders = [];
let filteredOrders = [];

document.addEventListener("DOMContentLoaded", () => {
    checkLogin();
    initializeEvents();
    loadOrders();
});

/* ===========================
   LOGIN CHECK
=========================== */

function checkLogin() {
    const token =
        localStorage.getItem("token") ||
        sessionStorage.getItem("token");

    if (!token) {
        localStorage.setItem(
            "redirectAfterLogin",
            "my-orders.html"
        );

        window.location.href = "login.html";
    }
}

/* ===========================
   EVENTS
=========================== */

function initializeEvents() {

    const searchInput =
        document.getElementById("orderSearchInput");

    const statusFilter =
        document.getElementById("orderStatusFilter");

    if (searchInput) {
        searchInput.addEventListener(
            "input",
            filterOrders
        );
    }

    if (statusFilter) {
        statusFilter.addEventListener(
            "change",
            filterOrders
        );
    }

}

/* ===========================
   LOAD ORDERS
=========================== */

async function loadOrders() {

    showLoading();

    try {

        const token =
            localStorage.getItem("token") ||
            sessionStorage.getItem("token");

        const response = await fetch(
            `${API_URL}/my-orders`,
            {
                headers: {
                    Authorization:
                        `Bearer ${token}`
                }
            }
        );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Unable to load orders."
            );
        }

        orders =
            data.orders ||
            data.data ||
            [];

        filteredOrders = [...orders];

        updateSummary();

        renderOrders();

    }

    catch (error) {

        console.error(error);

        showError(
            error.message
        );

    }

}

/* ===========================
   SUMMARY
=========================== */

function updateSummary() {

    const totalOrders =
        orders.length;

    const pendingOrders =
        orders.filter(order =>
            (
                order.orderStatus ||
                ""
            ).toLowerCase() ===
            "pending"
        ).length;

    const deliveredOrders =
        orders.filter(order =>
            (
                order.orderStatus ||
                ""
            ).toLowerCase() ===
            "delivered"
        ).length;

    const totalValue =
        orders.reduce(
            (
                total,
                order
            ) =>
                total +
                Number(
                    order.totalAmount ||
                    0
                ),
            0
        );

    setText(
        "summaryTotalOrders",
        totalOrders
    );

    setText(
        "summaryPendingOrders",
        pendingOrders
    );

    setText(
        "summaryDeliveredOrders",
        deliveredOrders
    );

    setText(
        "summaryTotalValue",
        formatCurrency(
            totalValue
        )
    );

}

/* ===========================
   FILTER
=========================== */

function filterOrders() {

    const keyword =
        document
            .getElementById(
                "orderSearchInput"
            )
            .value
            .trim()
            .toLowerCase();

    const status =
        document
            .getElementById(
                "orderStatusFilter"
            )
            .value;

    filteredOrders =
        orders.filter(order => {

            const orderNumber =
                String(
                    order.orderNumber ||
                    order._id
                ).toLowerCase();

            const orderStatus =
                (
                    order.orderStatus ||
                    ""
                ).toLowerCase();

            const matchesSearch =
                orderNumber.includes(
                    keyword
                );

            const matchesStatus =
                status === "all"
                    ? true
                    : orderStatus === status;

            return (
                matchesSearch &&
                matchesStatus
            );

        });

    renderOrders();

}
/* ===========================
   RENDER ORDERS
=========================== */

function renderOrders() {
    const container = document.getElementById("ordersList");

    if (!container) return;

    if (!filteredOrders.length) {
        showEmpty();
        return;
    }

    const sortedOrders = [...filteredOrders].sort((first, second) => {
        return (
            new Date(second.createdAt).getTime() -
            new Date(first.createdAt).getTime()
        );
    });

    container.innerHTML = sortedOrders
        .map((order) => createOrderCard(order))
        .join("");

    initializeOrderCardEvents();
}

function createOrderCard(order) {
    const orderId = String(order._id || "");
    const orderNumber =
        order.orderNumber || `#${orderId.slice(-8).toUpperCase()}`;

    const status = normalizeStatus(
        order.orderStatus || "pending"
    );

    const items = Array.isArray(order.items)
        ? order.items
        : [];

    const previewItems = items.slice(0, 2);

    const remainingItems =
        items.length > previewItems.length
            ? items.length - previewItems.length
            : 0;

    const canCancel =
        status === "pending" ||
        status === "confirmed";

    return `
        <article class="order-card">

            <div class="order-card-header">

                <div class="order-number">
                    <h3>${escapeHTML(orderNumber)}</h3>

                    <p>
                        Placed on ${escapeHTML(
                            formatDate(order.createdAt)
                        )}
                    </p>
                </div>

                <span class="order-status ${status}">
                    ${escapeHTML(formatStatus(status))}
                </span>

                <strong class="order-total">
                    ${formatCurrency(order.totalAmount)}
                </strong>

            </div>

            <div class="order-card-body">

                <div class="order-items-preview">

                    ${
                        previewItems.length
                            ? previewItems
                                  .map((item) =>
                                      createPreviewItem(item)
                                  )
                                  .join("")
                            : `
                                <div class="more-items">
                                    No product details available.
                                </div>
                              `
                    }

                    ${
                        remainingItems > 0
                            ? `
                                <p class="more-items">
                                    +${remainingItems} more item${
                                      remainingItems > 1 ? "s" : ""
                                  }
                                </p>
                              `
                            : ""
                    }

                </div>

                <div class="order-meta">

                    <div class="order-meta-item">
                        <span>Payment</span>

                        <strong>
                            ${escapeHTML(
                                formatPaymentMethod(
                                    order.paymentMethod
                                )
                            )}
                        </strong>
                    </div>

                    <div class="order-meta-item">
                        <span>Items</span>

                        <strong>
                            ${getTotalItemQuantity(items)}
                        </strong>
                    </div>

                    <div class="order-meta-item">
                        <span>Delivery City</span>

                        <strong>
                            ${escapeHTML(
                                order.deliveryAddress?.city ||
                                    order.customer?.city ||
                                    "Not available"
                            )}
                        </strong>
                    </div>

                    <div class="order-meta-item">
                        <span>Order Status</span>

                        <strong>
                            ${escapeHTML(formatStatus(status))}
                        </strong>
                    </div>

                </div>

            </div>

            <div class="order-card-footer">

                ${
                    canCancel
                        ? `
                            <button
                                type="button"
                                class="cancel-order-button"
                                data-order-id="${escapeHTML(orderId)}"
                            >
                                <i class="fas fa-ban"></i>
                                Cancel Order
                            </button>
                          `
                        : ""
                }

                <button
                    type="button"
                    class="view-order-button"
                    data-order-id="${escapeHTML(orderId)}"
                >
                    <i class="fas fa-eye"></i>
                    View Details
                </button>

            </div>

        </article>
    `;
}

function createPreviewItem(item) {
    const image = getProductImage(item);
    const name =
        item.name ||
        item.product?.name ||
        "Product";

    const quantity = Number(item.quantity || 1);

    return `
        <div class="order-preview-item">

            <img
                src="${escapeHTML(image)}"
                alt="${escapeHTML(name)}"
                onerror="this.src='images/placeholder-product.png'"
            >

            <div>
                <h4>${escapeHTML(name)}</h4>

                <p>
                    Quantity: ${quantity}
                </p>
            </div>

        </div>
    `;
}

/* ===========================
   ORDER CARD EVENTS
=========================== */

function initializeOrderCardEvents() {
    document
        .querySelectorAll(".view-order-button")
        .forEach((button) => {
            button.addEventListener("click", () => {
                openOrderDetails(button.dataset.orderId);
            });
        });

    document
        .querySelectorAll(".cancel-order-button")
        .forEach((button) => {
            button.addEventListener("click", () => {
                cancelOrder(button.dataset.orderId);
            });
        });
}

/* ===========================
   ORDER DETAILS MODAL
=========================== */

function openOrderDetails(orderId) {
    const order = orders.find(
        (item) => String(item._id) === String(orderId)
    );

    if (!order) {
        showAlert("Order details were not found.", "error");
        return;
    }

    const modal = document.getElementById("orderDetailsModal");
    const modalTitle = document.getElementById("orderModalTitle");
    const modalBody = document.getElementById("orderModalBody");

    if (!modal || !modalTitle || !modalBody) return;

    const orderNumber =
        order.orderNumber ||
        `#${String(order._id || "").slice(-8).toUpperCase()}`;

    modalTitle.textContent = orderNumber;
    modalBody.innerHTML = createOrderModalContent(order);

    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
}

function createOrderModalContent(order) {
    const status = normalizeStatus(
        order.orderStatus || "pending"
    );

    const items = Array.isArray(order.items)
        ? order.items
        : [];

    const customerName =
        order.customer?.name ||
        order.user?.name ||
        "Not available";

    const customerPhone =
        order.customer?.phone ||
        order.phone ||
        "Not available";

    const address = formatAddress(
        order.deliveryAddress
    );

    return `
        <section class="modal-section">

            <h3>Order Information</h3>

            <div class="modal-info-grid">

                <div class="modal-info-item">
                    <span>Status</span>

                    <strong>
                        ${escapeHTML(formatStatus(status))}
                    </strong>
                </div>

                <div class="modal-info-item">
                    <span>Placed Date</span>

                    <strong>
                        ${escapeHTML(formatDate(order.createdAt))}
                    </strong>
                </div>

                <div class="modal-info-item">
                    <span>Payment Method</span>

                    <strong>
                        ${escapeHTML(
                            formatPaymentMethod(
                                order.paymentMethod
                            )
                        )}
                    </strong>
                </div>

                <div class="modal-info-item">
                    <span>Payment Status</span>

                    <strong>
                        ${escapeHTML(
                            formatStatus(
                                order.paymentStatus || "pending"
                            )
                        )}
                    </strong>
                </div>

            </div>

        </section>


        <section class="modal-section">

            <h3>Delivery Information</h3>

            <div class="modal-info-grid">

                <div class="modal-info-item">
                    <span>Customer Name</span>

                    <strong>
                        ${escapeHTML(customerName)}
                    </strong>
                </div>

                <div class="modal-info-item">
                    <span>Phone Number</span>

                    <strong>
                        ${escapeHTML(customerPhone)}
                    </strong>
                </div>

                <div class="modal-info-item">
                    <span>Delivery Address</span>

                    <strong>
                        ${escapeHTML(address)}
                    </strong>
                </div>

                <div class="modal-info-item">
                    <span>Delivery Note</span>

                    <strong>
                        ${escapeHTML(
                            order.deliveryNote ||
                                "No delivery note"
                        )}
                    </strong>
                </div>

            </div>

        </section>


        <section class="modal-section">

            <h3>Products</h3>

            <div>
                ${
                    items.length
                        ? items
                              .map((item) =>
                                  createModalItem(item)
                              )
                              .join("")
                        : `
                            <p>
                                Product details are not available.
                            </p>
                          `
                }
            </div>

        </section>


        <section class="modal-section">

            <h3>Payment Summary</h3>

            <div class="modal-totals">

                <div class="modal-total-row">
                    <span>Subtotal</span>

                    <strong>
                        ${formatCurrency(order.subtotal)}
                    </strong>
                </div>

                <div class="modal-total-row">
                    <span>Delivery Fee</span>

                    <strong>
                        ${formatCurrency(order.deliveryFee)}
                    </strong>
                </div>

                <div class="modal-total-row grand-total">
                    <span>Total Amount</span>

                    <strong>
                        ${formatCurrency(order.totalAmount)}
                    </strong>
                </div>

            </div>

        </section>
    `;
}

function createModalItem(item) {
    const name =
        item.name ||
        item.product?.name ||
        "Product";

    const price = Number(item.price || 0);
    const quantity = Number(item.quantity || 1);
    const total = price * quantity;
    const image = getProductImage(item);

    return `
        <div class="modal-item">

            <img
                src="${escapeHTML(image)}"
                alt="${escapeHTML(name)}"
                onerror="this.src='images/placeholder-product.png'"
            >

            <div>
                <h4>${escapeHTML(name)}</h4>

                <p>
                    ${quantity} × ${formatCurrency(price)}
                </p>
            </div>

            <strong>
                ${formatCurrency(total)}
            </strong>

        </div>
    `;
}

/* ===========================
   MODAL EVENTS
=========================== */

function initializeModalEvents() {
    const modal = document.getElementById("orderDetailsModal");
    const closeButton =
        document.getElementById("closeOrderModalButton");

    closeButton?.addEventListener(
        "click",
        closeOrderDetails
    );

    modal
        ?.querySelectorAll("[data-close-modal]")
        .forEach((element) => {
            element.addEventListener(
                "click",
                closeOrderDetails
            );
        });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeOrderDetails();
        }
    });
}

function closeOrderDetails() {
    const modal = document.getElementById(
        "orderDetailsModal"
    );

    if (!modal) return;

    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
}
/* ===========================
   CANCEL ORDER
=========================== */

async function cancelOrder(orderId) {
    const order = orders.find(
        (item) => String(item._id) === String(orderId)
    );

    if (!order) {
        showAlert("Order was not found.", "error");
        return;
    }

    const status = normalizeStatus(
        order.orderStatus || "pending"
    );

    if (!["pending", "confirmed"].includes(status)) {
        showAlert(
            "This order can no longer be cancelled.",
            "error"
        );
        return;
    }

    const confirmed = window.confirm(
        "Are you sure you want to cancel this order?"
    );

    if (!confirmed) return;

    const button = document.querySelector(
        `.cancel-order-button[data-order-id="${CSS.escape(
            String(orderId)
        )}"]`
    );

    setCancelButtonLoading(button, true);

    try {
        const token =
            localStorage.getItem("token") ||
            sessionStorage.getItem("token");

        const response = await fetch(
            `${API_URL}/${orderId}/cancel`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await parseResponse(response);

        if (response.status === 401) {
            clearAuthData();

            localStorage.setItem(
                "redirectAfterLogin",
                "my-orders.html"
            );

            window.location.href = "login.html";
            return;
        }

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Unable to cancel the order."
            );
        }

        const updatedOrder =
            data.data ||
            data.order ||
            {
                ...order,
                orderStatus: "cancelled"
            };

        updateOrderInMemory(updatedOrder);

        updateSummary();
        filterOrders();

        showAlert(
            data.message ||
            "Order cancelled successfully.",
            "success"
        );
    } catch (error) {
        console.error("Cancel order error:", error);

        showAlert(
            error.message ||
            "Unable to cancel the order.",
            "error"
        );
    } finally {
        setCancelButtonLoading(button, false);
    }
}

function updateOrderInMemory(updatedOrder) {
    const updatedId = String(updatedOrder._id || "");

    orders = orders.map((order) => {
        if (String(order._id) !== updatedId) {
            return order;
        }

        return {
            ...order,
            ...updatedOrder
        };
    });

    filteredOrders = filteredOrders.map((order) => {
        if (String(order._id) !== updatedId) {
            return order;
        }

        return {
            ...order,
            ...updatedOrder
        };
    });
}

function setCancelButtonLoading(button, loading) {
    if (!button) return;

    button.disabled = loading;

    button.innerHTML = loading
        ? `
            <i class="fas fa-spinner fa-spin"></i>
            Cancelling...
          `
        : `
            <i class="fas fa-ban"></i>
            Cancel Order
          `;
}

/* ===========================
   LOADING / EMPTY / ERROR
=========================== */

function showLoading() {
    const container = document.getElementById("ordersList");

    if (!container) return;

    container.innerHTML = `
        <div class="orders-loading">
            <i class="fas fa-spinner fa-spin"></i>

            <p>
                Loading your orders...
            </p>
        </div>
    `;
}

function showEmpty() {
    const container = document.getElementById("ordersList");

    if (!container) return;

    const searchInput =
        document.getElementById("orderSearchInput");

    const statusFilter =
        document.getElementById("orderStatusFilter");

    const hasSearch =
        Boolean(searchInput?.value.trim()) ||
        statusFilter?.value !== "all";

    container.innerHTML = hasSearch
        ? `
            <div class="orders-empty">
                <i class="fas fa-magnifying-glass"></i>

                <h3>
                    No Matching Orders
                </h3>

                <p>
                    No orders match the selected search or status.
                </p>
            </div>
          `
        : `
            <div class="orders-empty">
                <i class="fas fa-box-open"></i>

                <h3>
                    No Orders Yet
                </h3>

                <p>
                    You have not placed any orders yet.
                </p>

                <a href="products.html">
                    Browse Products
                </a>
            </div>
          `;
}

function showError(message) {
    const container = document.getElementById("ordersList");

    if (!container) return;

    container.innerHTML = `
        <div class="orders-error">
            <i class="fas fa-circle-exclamation"></i>

            <h3>
                Unable to Load Orders
            </h3>

            <p>
                ${escapeHTML(message)}
            </p>

            <button
                type="button"
                class="view-order-button"
                id="retryOrdersButton"
            >
                <i class="fas fa-rotate-right"></i>
                Try Again
            </button>
        </div>
    `;

    document
        .getElementById("retryOrdersButton")
        ?.addEventListener("click", loadOrders);
}

/* ===========================
   ALERT
=========================== */

function showAlert(message, type) {
    const alert = document.getElementById("ordersAlert");

    if (!alert) return;

    alert.textContent = message;
    alert.className = `orders-alert ${type} show`;

    window.clearTimeout(showAlert.timeoutId);

    showAlert.timeoutId = window.setTimeout(() => {
        alert.classList.remove("show");
    }, 4000);
}

/* ===========================
   AUTH HELPERS
=========================== */

function clearAuthData() {
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

/* ===========================
   RESPONSE HELPER
=========================== */

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

/* ===========================
   TEXT HELPER
=========================== */

function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}

/* ===========================
   FORMAT HELPERS
=========================== */

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

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
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

function formatPaymentMethod(value) {
    const method = String(value || "")
        .trim()
        .toLowerCase();

    const labels = {
        cod: "Cash on Delivery",
        "cash-on-delivery": "Cash on Delivery",
        cash: "Cash on Delivery",
        card: "Card Payment",
        bank: "Bank Transfer",
        "bank-transfer": "Bank Transfer"
    };

    return labels[method] || formatStatus(method || "Not available");
}

/* ===========================
   ORDER HELPERS
=========================== */

function getTotalItemQuantity(items) {
    if (!Array.isArray(items)) {
        return 0;
    }

    return items.reduce((total, item) => {
        return total + Number(item.quantity || 0);
    }, 0);
}

function getProductImage(item) {
    const image =
        item.image ||
        item.product?.image ||
        "images/placeholder-product.png";

    if (
        image.startsWith("http://") ||
        image.startsWith("https://") ||
        image.startsWith("data:")
    ) {
        return image;
    }

    return image.replace(/^\/+/, "");
}

function formatAddress(address) {
    if (!address || typeof address !== "object") {
        return "Not available";
    }

    return [
        address.streetAddress,
        address.addressLine1,
        address.city,
        address.district,
        address.postalCode
    ]
        .filter(Boolean)
        .join(", ") || "Not available";
}

/* ===========================
   SECURITY HELPER
=========================== */

function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}