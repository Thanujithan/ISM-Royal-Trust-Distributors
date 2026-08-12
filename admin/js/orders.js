const ORDERS_API_URL =
    "http://localhost:5000/api/orders";

let allOrders = [];
let filteredOrders = [];

document.addEventListener(
    "DOMContentLoaded",
    () => {
        initializeAdminOrdersPage();
    }
);

async function initializeAdminOrdersPage() {
    if (!checkAdminAuthentication()) {
        return;
    }

    initializePageEvents();
    initializeOrderModal();
    loadAdminName();

    await loadOrders();
}

/* =========================================
   ADMIN AUTHENTICATION
========================================= */

function checkAdminAuthentication() {
    const token = getAdminToken();
    const user = getStoredAdminUser();

    if (!token || !user) {
        window.location.href = "../login.html";
        return false;
    }

    const role = String(
        user.role || ""
    ).toLowerCase();

    if (role !== "admin") {
        clearAdminAuthentication();
        window.location.href = "../login.html";
        return false;
    }

    return true;
}

function getAdminToken() {
    return (
        localStorage.getItem("token") ||
        sessionStorage.getItem("token") ||
        localStorage.getItem("adminToken") ||
        sessionStorage.getItem("adminToken")
    );
}

function getStoredAdminUser() {
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
            "Invalid admin user data:",
            error
        );

        clearAdminAuthentication();
        return null;
    }
}

function clearAdminAuthentication() {
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

function loadAdminName() {
    const user = getStoredAdminUser();

    const nameElement =
        document.getElementById(
            "adminUserName"
        );

    if (nameElement && user) {
        nameElement.textContent =
            user.name || "Administrator";
    }
}

/* =========================================
   PAGE EVENTS
========================================= */

function initializePageEvents() {
    const searchInput =
        document.getElementById(
            "orderSearchInput"
        );

    const statusFilter =
        document.getElementById(
            "orderStatusFilter"
        );

    const refreshButton =
        document.getElementById(
            "refreshOrdersButton"
        );

    const menuButton =
        document.getElementById(
            "adminMenuButton"
        );

    const sidebar =
        document.querySelector(
            ".admin-sidebar"
        );

    searchInput?.addEventListener(
        "input",
        filterOrders
    );

    statusFilter?.addEventListener(
        "change",
        filterOrders
    );

    refreshButton?.addEventListener(
        "click",
        loadOrders
    );

    menuButton?.addEventListener(
        "click",
        () => {
            sidebar?.classList.toggle("show");
        }
    );

    document
        .getElementById(
            "adminLogoutButton"
        )
        ?.addEventListener(
            "click",
            () => {
                const confirmed =
                    window.confirm(
                        "Are you sure you want to logout?"
                    );

                if (!confirmed) {
                    return;
                }

                clearAdminAuthentication();

                window.location.href =
                    "../login.html";
            }
        );
}

/* =========================================
   LOAD ORDERS
========================================= */

async function loadOrders() {
    showOrdersLoading();
    setRefreshLoading(true);

    try {
        const response = await fetch(
            ORDERS_API_URL,
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
            clearAdminAuthentication();

            window.location.href =
                "../login.html";

            return;
        }

        if (!response.ok) {
            throw new Error(
                result.message ||
                "Unable to load orders."
            );
        }

        allOrders = Array.isArray(
            result.data
        )
            ? result.data
            : [];

        filteredOrders = [
            ...allOrders
        ];

        updateStatistics();
        renderOrders();
    } catch (error) {
        console.error(
            "Load orders error:",
            error
        );

        showOrdersError(
            error.message
        );
    } finally {
        setRefreshLoading(false);
    }
}

/* =========================================
   STATISTICS
========================================= */

function updateStatistics() {
    const pendingOrders =
        allOrders.filter((order) => {
            return (
                normalizeStatus(
                    order.orderStatus
                ) === "pending"
            );
        });

    const deliveredOrders =
        allOrders.filter((order) => {
            return (
                normalizeStatus(
                    order.orderStatus
                ) === "delivered"
            );
        });

    const totalRevenue =
        deliveredOrders.reduce(
            (total, order) => {
                return (
                    total +
                    Number(
                        order.totalAmount || 0
                    )
                );
            },
            0
        );

    setText(
        "totalOrders",
        String(allOrders.length)
    );

    setText(
        "pendingOrders",
        String(pendingOrders.length)
    );

    setText(
        "deliveredOrders",
        String(deliveredOrders.length)
    );

    setText(
        "totalRevenue",
        formatCurrency(totalRevenue)
    );
}

/* =========================================
   SEARCH AND FILTER
========================================= */

function filterOrders() {
    const keyword = String(
        document
            .getElementById(
                "orderSearchInput"
            )
            ?.value || ""
    )
        .trim()
        .toLowerCase();

    const selectedStatus =
        document
            .getElementById(
                "orderStatusFilter"
            )
            ?.value || "all";

    filteredOrders =
        allOrders.filter((order) => {
            const orderNumber =
                String(
                    order.orderNumber ||
                    order._id ||
                    ""
                ).toLowerCase();

            const customerName =
                String(
                    order.customer?.name ||
                    order.user?.name ||
                    ""
                ).toLowerCase();

            const customerEmail =
                String(
                    order.customer?.email ||
                    order.user?.email ||
                    ""
                ).toLowerCase();

            const status =
                normalizeStatus(
                    order.orderStatus
                );

            const matchesKeyword =
                orderNumber.includes(keyword) ||
                customerName.includes(keyword) ||
                customerEmail.includes(keyword);

            const matchesStatus =
                selectedStatus === "all" ||
                status === selectedStatus;

            return (
                matchesKeyword &&
                matchesStatus
            );
        });

    renderOrders();
}
/* =========================================
   RENDER ORDERS TABLE
========================================= */

function renderOrders() {
    const tableBody =
        document.getElementById(
            "ordersTableBody"
        );

    if (!tableBody) {
        return;
    }

    if (!filteredOrders.length) {
        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    class="admin-table-message"
                >
                    <i class="fas fa-box-open"></i>
                    No matching orders found.
                </td>
            </tr>
        `;

        return;
    }

    const sortedOrders = [
        ...filteredOrders
    ].sort((first, second) => {
        return (
            new Date(
                second.createdAt
            ).getTime() -
            new Date(
                first.createdAt
            ).getTime()
        );
    });

    tableBody.innerHTML =
        sortedOrders
            .map((order) => {
                return createOrderRow(order);
            })
            .join("");

    initializeRowEvents();
}

function createOrderRow(order) {
    const orderId =
        String(order._id || "");

    const orderNumber =
        order.orderNumber ||
        `#${orderId
            .slice(-8)
            .toUpperCase()}`;

    const customerName =
        order.customer?.name ||
        order.user?.name ||
        "Unknown Customer";

    const customerEmail =
        order.customer?.email ||
        order.user?.email ||
        "No email";

    const status =
        normalizeStatus(
            order.orderStatus
        );

    const totalItems =
        getTotalItemQuantity(
            order.items
        );

    return `
        <tr>

            <td>
                <div class="admin-order-number">

                    <strong>
                        ${escapeHTML(orderNumber)}
                    </strong>

                    <span>
                        ${totalItems}
                        item${totalItems === 1 ? "" : "s"}
                    </span>

                </div>
            </td>


            <td>
                <div class="admin-customer-info">

                    <strong>
                        ${escapeHTML(customerName)}
                    </strong>

                    <span>
                        ${escapeHTML(customerEmail)}
                    </span>

                </div>
            </td>


            <td>
                ${escapeHTML(
                    formatDate(
                        order.createdAt
                    )
                )}
            </td>


            <td>
                <strong class="admin-order-amount">
                    ${formatCurrency(
                        order.totalAmount
                    )}
                </strong>
            </td>


            <td>
                <span
                    class="admin-status-badge ${status}"
                >
                    ${escapeHTML(
                        formatStatus(status)
                    )}
                </span>
            </td>


            <td>
                <div class="admin-table-actions">

                    <button
                        type="button"
                        class="admin-view-button"
                        data-order-id="${escapeHTML(orderId)}"
                        aria-label="View order details"
                        title="View Order"
                    >
                        <i class="fas fa-eye"></i>
                    </button>

                    <button
                        type="button"
                        class="admin-edit-button"
                        data-order-id="${escapeHTML(orderId)}"
                        aria-label="Update order status"
                        title="Update Order"
                    >
                        <i class="fas fa-pen"></i>
                    </button>

                </div>
            </td>

        </tr>
    `;
}

/* =========================================
   TABLE BUTTON EVENTS
========================================= */

function initializeRowEvents() {
    document
        .querySelectorAll(
            ".admin-view-button"
        )
        .forEach((button) => {
            button.addEventListener(
                "click",
                () => {
                    openOrderModal(
                        button.dataset.orderId,
                        false
                    );
                }
            );
        });

    document
        .querySelectorAll(
            ".admin-edit-button"
        )
        .forEach((button) => {
            button.addEventListener(
                "click",
                () => {
                    openOrderModal(
                        button.dataset.orderId,
                        true
                    );
                }
            );
        });
}

/* =========================================
   ORDER MODAL INITIALIZATION
========================================= */

function initializeOrderModal() {
    const modal =
        document.getElementById(
            "orderModal"
        );

    const closeButton =
        document.getElementById(
            "closeOrderModalButton"
        );

    closeButton?.addEventListener(
        "click",
        closeOrderModal
    );

    modal
        ?.querySelectorAll(
            "[data-close-order-modal]"
        )
        .forEach((element) => {
            element.addEventListener(
                "click",
                closeOrderModal
            );
        });

    document.addEventListener(
        "keydown",
        (event) => {
            if (event.key === "Escape") {
                closeOrderModal();
            }
        }
    );
}

/* =========================================
   OPEN ORDER MODAL
========================================= */

function openOrderModal(
    orderId,
    editMode
) {
    const order =
        allOrders.find((item) => {
            return (
                String(item._id) ===
                String(orderId)
            );
        });

    if (!order) {
        showAlert(
            "Order details were not found.",
            "error"
        );

        return;
    }

    const modal =
        document.getElementById(
            "orderModal"
        );

    const modalTitle =
        document.getElementById(
            "orderModalTitle"
        );

    const modalBody =
        document.getElementById(
            "orderModalBody"
        );

    if (
        !modal ||
        !modalTitle ||
        !modalBody
    ) {
        return;
    }

    const orderNumber =
        order.orderNumber ||
        `#${String(order._id || "")
            .slice(-8)
            .toUpperCase()}`;

    modalTitle.textContent =
        orderNumber;

    modalBody.innerHTML =
        createOrderModalContent(
            order,
            editMode
        );

    modal.classList.add("show");

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.style.overflow =
        "hidden";

    initializeInvoiceButton(order);

    if (editMode) {
        initializeStatusUpdateForm(
            order
        );
    }
}

/* =========================================
   CLOSE ORDER MODAL
========================================= */

function closeOrderModal() {
    const modal =
        document.getElementById(
            "orderModal"
        );

    if (!modal) {
        return;
    }

    modal.classList.remove("show");

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.style.overflow =
        "";
}

/* =========================================
   CREATE ORDER MODAL CONTENT
========================================= */

function createOrderModalContent(
    order,
    editMode
) {
    const items =
        Array.isArray(order.items)
            ? order.items
            : [];

    const status =
        normalizeStatus(
            order.orderStatus
        );

    const paymentStatus =
        normalizeStatus(
            order.paymentStatus
        );

    const customerName =
        order.customer?.name ||
        order.user?.name ||
        "Not available";

    const customerEmail =
        order.customer?.email ||
        order.user?.email ||
        "Not available";

    const customerPhone =
        order.customer?.phone ||
        "Not available";

    return `
        <section class="admin-modal-section">

            <h3>
                Customer Information
            </h3>

            <div class="admin-modal-grid">

                ${createInfoItem(
                    "Customer",
                    customerName
                )}

                ${createInfoItem(
                    "Email",
                    customerEmail
                )}

                ${createInfoItem(
                    "Phone",
                    customerPhone
                )}

                ${createInfoItem(
                    "Order Date",
                    formatDate(
                        order.createdAt
                    )
                )}

            </div>

        </section>


        <section class="admin-modal-section">

            <h3>
                Delivery Information
            </h3>

            <div class="admin-modal-grid">

                ${createInfoItem(
                    "Address",
                    formatAddress(
                        order.deliveryAddress
                    )
                )}

                ${createInfoItem(
                    "Delivery Note",
                    order.deliveryNote ||
                    "No delivery note"
                )}

                ${createInfoItem(
                    "Payment Method",
                    formatPaymentMethod(
                        order.paymentMethod
                    )
                )}

                ${createInfoItem(
                    "Payment Status",
                    formatStatus(
                        paymentStatus
                    )
                )}

            </div>

        </section>


        <section class="admin-modal-section">

            <h3>
                Products
            </h3>

            <div class="admin-order-items">

                ${
                    items.length
                        ? items
                            .map(
                                createModalOrderItem
                            )
                            .join("")
                        : `
                            <p>
                                No product information available.
                            </p>
                        `
                }

            </div>

        </section>


        <section class="admin-modal-section">

            <h3>
                Payment Summary
            </h3>

            <div class="admin-modal-totals">

                ${createTotalRow(
                    "Subtotal",
                    order.subtotal
                )}

                ${createTotalRow(
                    "Delivery Fee",
                    order.deliveryFee
                )}

                ${createTotalRow(
                    "Total Amount",
                    order.totalAmount,
                    true
                )}

            </div>

        </section>


        <section class="admin-modal-section">

            <div class="invoice-actions">

                <button
                    type="button"
                    class="admin-print-button"
                    id="printInvoiceButton"
                >
                    <i class="fas fa-print"></i>
                    Print / Save Invoice
                </button>

            </div>

        </section>


        ${
            editMode
                ? createStatusUpdateSection(
                    order,
                    status,
                    paymentStatus
                )
                : `
                    <section class="admin-modal-section">

                        <h3>
                            Order Status
                        </h3>

                        <span
                            class="admin-status-badge ${status}"
                        >
                            ${escapeHTML(
                                formatStatus(status)
                            )}
                        </span>

                    </section>
                `
        }
    `;
}
/* =========================================
   MODAL HELPER CONTENT
========================================= */

function createInfoItem(label, value) {
    return `
        <div class="admin-modal-info-item">

            <span>
                ${escapeHTML(label)}
            </span>

            <strong>
                ${escapeHTML(value)}
            </strong>

        </div>
    `;
}

function createModalOrderItem(item) {

    const name =
        item.name ||
        item.product?.name ||
        "Product";


    const netContent =
        item.netContent ||
        item.product?.netContent ||
        "";


    const image =
        getProductImage(item);


    const price =
        Number(
            item.price || 0
        );


    const quantity =
        Number(
            item.quantity || 1
        );


    const itemTotal =
        price * quantity;


    return `
        <div class="admin-modal-order-item">

            <img
                src="${escapeHTML(image)}"
                alt="${escapeHTML(name)}"
                onerror="
                    this.onerror=null;
                    this.src='../images/placeholder-product.png';
                "
            >


            <div class="admin-order-product-details">

                <div class="admin-product-title-row">

                    <h4>
                        ${escapeHTML(name)}
                    </h4>


                    ${
                        netContent
                            ? `
                                <span class="admin-net-content">
                                    ${escapeHTML(netContent)}
                                </span>
                              `
                            : ""
                    }

                </div>


                <p>
                    ${quantity}
                    ×
                    ${formatCurrency(price)}
                </p>

            </div>


            <strong>
                ${formatCurrency(itemTotal)}
            </strong>

        </div>
    `;
}

function createTotalRow(
    label,
    value,
    isTotal = false
) {
    return `
        <div class="admin-modal-total-row ${
            isTotal
                ? "grand-total"
                : ""
        }">

            <span>
                ${escapeHTML(label)}
            </span>

            <strong>
                ${formatCurrency(value)}
            </strong>

        </div>
    `;
}

/* =========================================
   STATUS UPDATE SECTION
========================================= */

function createStatusUpdateSection(
    order,
    orderStatus,
    paymentStatus
) {
    return `
        <section class="admin-modal-section">

            <h3>
                Update Status
            </h3>

            <form
                id="updateOrderStatusForm"
                data-order-id="${escapeHTML(
                    order._id
                )}"
            >

                <div class="admin-status-form-grid">

                    <div class="admin-form-group">

                        <label for="modalOrderStatus">
                            Order Status
                        </label>

                        <select id="modalOrderStatus">

                            ${createStatusOption(
                                "pending",
                                orderStatus
                            )}

                            ${createStatusOption(
                                "confirmed",
                                orderStatus
                            )}

                            ${createStatusOption(
                                "processing",
                                orderStatus
                            )}

                            ${createStatusOption(
                                "shipped",
                                orderStatus
                            )}

                            ${createStatusOption(
                                "delivered",
                                orderStatus
                            )}

                            ${createStatusOption(
                                "cancelled",
                                orderStatus
                            )}

                        </select>

                    </div>


                    <div class="admin-form-group">

                        <label for="modalPaymentStatus">
                            Payment Status
                        </label>

                        <select id="modalPaymentStatus">

                            ${createStatusOption(
                                "pending",
                                paymentStatus
                            )}

                            ${createStatusOption(
                                "paid",
                                paymentStatus
                            )}

                            ${createStatusOption(
                                "failed",
                                paymentStatus
                            )}

                        </select>

                    </div>

                </div>


                <button
                    type="submit"
                    class="admin-save-button"
                    id="saveOrderStatusButton"
                >
                    <i class="fas fa-check"></i>
                    Update Order
                </button>

            </form>

        </section>
    `;
}

function createStatusOption(
    value,
    selectedValue
) {
    const isSelected =
        value === selectedValue;

    return `
        <option
            value="${value}"
            ${isSelected ? "selected" : ""}
        >
            ${formatStatus(value)}
        </option>
    `;
}

/* =========================================
   INITIALIZE STATUS FORM
========================================= */

function initializeStatusUpdateForm(order) {
    const form =
        document.getElementById(
            "updateOrderStatusForm"
        );

    form?.addEventListener(
        "submit",
        (event) => {
            updateOrderStatus(
                event,
                order
            );
        }
    );
}

/* =========================================
   UPDATE ORDER STATUS
========================================= */

async function updateOrderStatus(
    event,
    order
) {
    event.preventDefault();

    const orderStatus =
        document
            .getElementById(
                "modalOrderStatus"
            )
            ?.value;

    const paymentStatus =
        document
            .getElementById(
                "modalPaymentStatus"
            )
            ?.value;

    const saveButton =
        document.getElementById(
            "saveOrderStatusButton"
        );

    if (
        !orderStatus ||
        !paymentStatus
    ) {
        showAlert(
            "Please select order and payment status.",
            "error"
        );

        return;
    }

    setStatusButtonLoading(
        saveButton,
        true
    );

    try {
        const response = await fetch(
            `${ORDERS_API_URL}/${order._id}/status`,
            {
                method: "PUT",

                headers: {
                    "Content-Type":
                        "application/json",

                    Authorization:
                        `Bearer ${getAdminToken()}`
                },

                body: JSON.stringify({
                    orderStatus,
                    paymentStatus
                })
            }
        );

        const result =
            await parseResponse(response);

        if (
            response.status === 401 ||
            response.status === 403
        ) {
            clearAdminAuthentication();

            window.location.href =
                "../login.html";

            return;
        }

        if (!response.ok) {
            throw new Error(
                result.message ||
                "Unable to update order."
            );
        }

        const updatedOrder =
            result.data || {
                ...order,
                orderStatus,
                paymentStatus
            };

        updateOrderInMemory(
            updatedOrder
        );

        updateStatistics();
        filterOrders();
        closeOrderModal();

        showAlert(
            result.message ||
            "Order updated successfully.",
            "success"
        );
    } catch (error) {
        console.error(
            "Update order error:",
            error
        );

        showAlert(
            error.message ||
            "Unable to update order.",
            "error"
        );
    } finally {
        setStatusButtonLoading(
            saveButton,
            false
        );
    }
}

/* =========================================
   UPDATE LOCAL ORDER DATA
========================================= */

function updateOrderInMemory(
    updatedOrder
) {
    allOrders =
        allOrders.map((order) => {
            if (
                String(order._id) !==
                String(updatedOrder._id)
            ) {
                return order;
            }

            return {
                ...order,
                ...updatedOrder
            };
        });

    filteredOrders =
        [...allOrders];
}

/* =========================================
   STATUS BUTTON LOADING
========================================= */

function setStatusButtonLoading(
    button,
    loading
) {
    if (!button) {
        return;
    }

    button.disabled = loading;

    button.innerHTML = loading
        ? `
            <i class="fas fa-spinner fa-spin"></i>
            Updating...
        `
        : `
            <i class="fas fa-check"></i>
            Update Order
        `;
}

/* =========================================
   INVOICE BUTTON EVENT
========================================= */

function initializeInvoiceButton(order) {
    const button =
        document.getElementById(
            "printInvoiceButton"
        );

    button?.addEventListener(
        "click",
        () => {
            printInvoice(order);
        }
    );
}
/* =========================================
   PRINT / SAVE INVOICE
========================================= */

function printInvoice(order) {

    const invoiceWindow =
        window.open(
            "",
            "_blank",
            "width=1000,height=800"
        );


    if (!invoiceWindow) {

        showAlert(
            "Pop-up blocked. Please allow pop-ups and try again.",
            "error"
        );

        return;
    }


    const orderId =
        String(
            order._id || ""
        );


    const orderNumber =
        order.orderNumber ||
        `#${orderId
            .slice(-8)
            .toUpperCase()}`;


    const customerName =
        order.customer?.name ||
        order.user?.name ||
        "Not available";


    const customerEmail =
        order.customer?.email ||
        order.user?.email ||
        "Not available";


    const customerPhone =
        order.customer?.phone ||
        "Not available";


    const items =
        Array.isArray(
            order.items
        )
            ? order.items
            : [];


    /* =========================================
       INVOICE PRODUCT ROWS
    ========================================= */

    const invoiceItemsHTML =
        items.length > 0

            ? items
                .map(
                    (
                        item,
                        index
                    ) => {

                        const name =
                            item.name ||
                            item.product?.name ||
                            "Product";


                        /*
                        =================================
                        NET CONTENT
                        =================================
                        */

                        const netContent =
                            item.netContent ||
                            item.product?.netContent ||
                            "";


                        const quantity =
                            Number(
                                item.quantity ||
                                1
                            );


                        const price =
                            Number(
                                item.price ||
                                item.appliedPrice ||
                                0
                            );


                        const total =
                            quantity *
                            price;


                        return `
                            <tr>

                                <td>
                                    ${index + 1}
                                </td>


                                <td class="product-name-cell">

                                    <strong>
                                        ${escapeHTML(name)}
                                    </strong>

                                </td>


                                <td class="net-content-cell">

                                    ${
                                        netContent
                                            ? escapeHTML(
                                                netContent
                                            )
                                            : "-"
                                    }

                                </td>


                                <td class="text-center">

                                    ${quantity}

                                </td>


                                <td class="text-right">

                                    ${formatCurrency(
                                        price
                                    )}

                                </td>


                                <td class="text-right">

                                    <strong>
                                        ${formatCurrency(
                                            total
                                        )}
                                    </strong>

                                </td>

                            </tr>
                        `;
                    }
                )
                .join("")

            : `
                <tr>

                    <td
                        colspan="6"
                        class="text-center"
                    >
                        No product information available.
                    </td>

                </tr>
            `;


    /* =========================================
       TOTALS
    ========================================= */

    const subtotal =
        Number(
            order.subtotal ||
            0
        );


    const deliveryFee =
        Number(
            order.deliveryFee ||
            0
        );


    const totalAmount =
        Number(
            order.totalAmount ||
            0
        );


    /* =========================================
       ORDER STATUS
    ========================================= */

    const orderStatus =
        formatStatus(
            order.orderStatus ||
            "pending"
        );


    const paymentStatus =
        formatStatus(
            order.paymentStatus ||
            "pending"
        );


    const paymentMethod =
        formatPaymentMethod(
            order.paymentMethod
        );


    const deliveryAddress =
        formatAddress(
            order.deliveryAddress
        );


    const invoiceDate =
        formatDate(
            order.createdAt
        );


    const printDate =
        new Date()
            .toLocaleString(
                "en-LK",
                {
                    year:
                        "numeric",

                    month:
                        "short",

                    day:
                        "numeric",

                    hour:
                        "2-digit",

                    minute:
                        "2-digit"
                }
            );


    /* =========================================
       INVOICE HTML
    ========================================= */

    const invoiceHTML = `
        <!DOCTYPE html>

        <html lang="en">

        <head>

            <meta charset="UTF-8">

            <meta
                name="viewport"
                content="width=device-width, initial-scale=1.0"
            >


            <title>
                Invoice ${escapeHTML(orderNumber)}
            </title>


            <style>

                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }


                body {
                    padding: 30px;

                    color: #1f2937;
                    background: #ffffff;

                    font-family:
                        Arial,
                        Helvetica,
                        sans-serif;
                }


                .invoice {
                    width: 100%;
                    max-width: 900px;

                    margin: 0 auto;
                }


                /* =================================
                   HEADER
                ================================= */

                .invoice-header {
                    padding-bottom: 22px;

                    display: flex;

                    align-items: flex-start;

                    justify-content:
                        space-between;

                    gap: 30px;

                    border-bottom:
                        3px solid #0f4c81;
                }


                .company {
                    display: flex;

                    align-items: center;

                    gap: 16px;
                }


                .company img {
                    width: 78px;
                    height: 78px;

                    object-fit: contain;
                }


                .company h1 {
                    margin-bottom: 7px;

                    color: #0f4c81;

                    font-size: 24px;
                }


                .company p {
                    margin-bottom: 4px;

                    color: #4b5563;

                    font-size: 13px;

                    line-height: 1.5;
                }


                .invoice-title {
                    text-align: right;
                }


                .invoice-title h2 {
                    margin-bottom: 10px;

                    color: #f59e0b;

                    font-size: 30px;

                    letter-spacing: 1px;
                }


                .invoice-title p {
                    margin-bottom: 6px;

                    color: #4b5563;

                    font-size: 13px;
                }


                /* =================================
                   SECTIONS
                ================================= */

                .invoice-section {
                    margin-top: 28px;
                }


                .section-title {
                    margin-bottom: 14px;

                    padding-bottom: 8px;

                    color: #0f4c81;

                    border-bottom:
                        1px solid #d1d5db;

                    font-size: 17px;
                }


                /* =================================
                   CUSTOMER DETAILS
                ================================= */

                .details-grid {
                    display: grid;

                    grid-template-columns:
                        repeat(
                            2,
                            minmax(0, 1fr)
                        );

                    gap: 15px;
                }


                .detail-box {
                    padding: 14px;

                    background: #f8fafc;

                    border:
                        1px solid #e5e7eb;

                    border-radius: 8px;
                }


                .detail-box span {
                    display: block;

                    margin-bottom: 6px;

                    color: #6b7280;

                    font-size: 11px;

                    font-weight: 700;

                    text-transform:
                        uppercase;
                }


                .detail-box strong {
                    color: #1f2937;

                    font-size: 13px;

                    line-height: 1.5;
                }


                /* =================================
                   PRODUCT TABLE
                ================================= */

                table {
                    width: 100%;

                    margin-top: 12px;

                    border-collapse:
                        collapse;
                }


                th {
                    padding: 12px 9px;

                    color: #ffffff;

                    background:
                        #0f4c81;

                    font-size: 12px;

                    text-align: left;

                    white-space: nowrap;
                }


                td {
                    padding: 12px 9px;

                    border-bottom:
                        1px solid #e5e7eb;

                    font-size: 12px;

                    vertical-align: middle;
                }


                tbody tr:nth-child(even) {
                    background: #f8fafc;
                }


                .product-name-cell {
                    color: #1f2937;
                }


                /*
                =================================
                NET CONTENT
                =================================
                */

                .net-content-cell {
                    color: #0f4c81;

                    font-weight: 700;

                    white-space: nowrap;
                }


                .text-center {
                    text-align: center;
                }


                .text-right {
                    text-align: right;
                }


                /* =================================
                   TOTALS
                ================================= */

                .totals-wrapper {
                    margin-top: 20px;

                    display: flex;

                    justify-content:
                        flex-end;
                }


                .totals {
                    width: 100%;

                    max-width: 360px;
                }


                .total-row {
                    padding: 10px 0;

                    display: flex;

                    align-items: center;

                    justify-content:
                        space-between;

                    gap: 20px;

                    border-bottom:
                        1px solid #e5e7eb;

                    font-size: 14px;
                }


                .total-row.grand-total {
                    padding-top: 14px;

                    color: #0f4c81;

                    border-bottom: none;

                    font-size: 18px;

                    font-weight: 800;
                }


                /* =================================
                   STATUS
                ================================= */

                .status-section {
                    margin-top: 25px;

                    display: grid;

                    grid-template-columns:
                        repeat(
                            3,
                            minmax(0, 1fr)
                        );

                    gap: 14px;
                }


                .status-box {
                    padding: 14px;

                    text-align: center;

                    background: #f8fafc;

                    border:
                        1px solid #e5e7eb;

                    border-radius: 8px;
                }


                .status-box span {
                    display: block;

                    margin-bottom: 6px;

                    color: #6b7280;

                    font-size: 11px;

                    font-weight: 700;

                    text-transform:
                        uppercase;
                }


                .status-box strong {
                    color: #0f4c81;

                    font-size: 13px;
                }


                /* =================================
                   NOTE
                ================================= */

                .invoice-note {
                    margin-top: 28px;

                    padding: 16px;

                    color: #4b5563;

                    background: #fff7ed;

                    border-left:
                        4px solid #f59e0b;

                    font-size: 13px;

                    line-height: 1.6;
                }


                /* =================================
                   FOOTER
                ================================= */

                .invoice-footer {
                    margin-top: 35px;

                    padding-top: 18px;

                    color: #6b7280;

                    text-align: center;

                    border-top:
                        1px solid #d1d5db;

                    font-size: 12px;

                    line-height: 1.6;
                }


                /* =================================
                   PRINT BUTTONS
                ================================= */

                .print-actions {
                    width: 100%;
                    max-width: 900px;

                    margin:
                        20px auto 0;

                    display: flex;

                    justify-content:
                        flex-end;

                    gap: 12px;
                }


                .print-actions button {
                    padding:
                        11px 18px;

                    color: #ffffff;

                    background: #0f4c81;

                    border: none;

                    border-radius: 7px;

                    cursor: pointer;

                    font-size: 13px;

                    font-weight: 700;
                }


                .print-actions button:hover {
                    background: #083354;
                }


                .print-actions .close-button {
                    color: #1f2937;

                    background: #e5e7eb;
                }


                .print-actions
                .close-button:hover {
                    background: #d1d5db;
                }


                /* =================================
                   PRINT / PDF
                ================================= */

                @media print {

                    @page {
                        size: A4;

                        margin: 15mm;
                    }


                    body {
                        padding: 0;
                    }


                    .print-actions {
                        display: none;
                    }


                    .invoice {
                        max-width: none;
                    }


                    .invoice-section,
                    table,
                    .detail-box,
                    .status-box {

                        break-inside:
                            avoid;
                    }
                }


                /* =================================
                   MOBILE
                ================================= */

                @media (
                    max-width: 650px
                ) {

                    body {
                        padding: 18px;
                    }


                    .invoice-header {
                        flex-direction:
                            column;
                    }


                    .invoice-title {
                        text-align: left;
                    }


                    .details-grid,
                    .status-section {

                        grid-template-columns:
                            1fr;
                    }


                    table {
                        min-width: 720px;
                    }


                    .invoice-section {
                        overflow-x: auto;
                    }
                }

            </style>

        </head>


        <body>


            <main class="invoice">


                <!-- =============================
                     INVOICE HEADER
                ============================== -->

                <header class="invoice-header">


                    <div class="company">


                        <img
                            src="../images/logo.png"
                            alt="ISM Logo"
                        >


                        <div>


                            <h1>
                                ISM ROYAL TRUST DISTRIBUTORS
                            </h1>


                            <p>
                                No. 29, Korakkovil Road,
                                Sammanthurai, Sri Lanka
                            </p>


                            <p>
                                Phone:
                                +94 75 769 3155
                            </p>


                            <p>
                                Email:
                                ismdistributors1030@gmail.com
                            </p>


                        </div>


                    </div>



                    <div class="invoice-title">


                        <h2>
                            INVOICE
                        </h2>


                        <p>

                            <strong>
                                Order:
                            </strong>

                            ${escapeHTML(
                                orderNumber
                            )}

                        </p>


                        <p>

                            <strong>
                                Order Date:
                            </strong>

                            ${escapeHTML(
                                invoiceDate
                            )}

                        </p>


                        <p>

                            <strong>
                                Printed:
                            </strong>

                            ${escapeHTML(
                                printDate
                            )}

                        </p>


                    </div>


                </header>



                <!-- =============================
                     CUSTOMER INFORMATION
                ============================== -->

                <section class="invoice-section">


                    <h3 class="section-title">
                        Customer Information
                    </h3>


                    <div class="details-grid">


                        <div class="detail-box">

                            <span>
                                Customer Name
                            </span>

                            <strong>
                                ${escapeHTML(
                                    customerName
                                )}
                            </strong>

                        </div>


                        <div class="detail-box">

                            <span>
                                Email Address
                            </span>

                            <strong>
                                ${escapeHTML(
                                    customerEmail
                                )}
                            </strong>

                        </div>


                        <div class="detail-box">

                            <span>
                                Phone Number
                            </span>

                            <strong>
                                ${escapeHTML(
                                    customerPhone
                                )}
                            </strong>

                        </div>


                        <div class="detail-box">

                            <span>
                                Delivery Address
                            </span>

                            <strong>
                                ${escapeHTML(
                                    deliveryAddress
                                )}
                            </strong>

                        </div>


                    </div>


                </section>



                <!-- =============================
                     PRODUCTS
                ============================== -->

                <section class="invoice-section">


                    <h3 class="section-title">
                        Ordered Products
                    </h3>


                    <table>


                        <thead>


                            <tr>


                                <th>
                                    #
                                </th>


                                <th>
                                    Product
                                </th>


                                <th>
                                    Net Content
                                </th>


                                <th class="text-center">
                                    Qty
                                </th>


                                <th class="text-right">
                                    Unit Price
                                </th>


                                <th class="text-right">
                                    Total
                                </th>


                            </tr>


                        </thead>


                        <tbody>

                            ${invoiceItemsHTML}

                        </tbody>


                    </table>



                    <!-- TOTALS -->

                    <div class="totals-wrapper">


                        <div class="totals">


                            <div class="total-row">

                                <span>
                                    Subtotal
                                </span>

                                <strong>
                                    ${formatCurrency(
                                        subtotal
                                    )}
                                </strong>

                            </div>


                            <div class="total-row">

                                <span>
                                    Delivery Fee
                                </span>

                                <strong>
                                    ${deliveryFee === 0
                                        ? "Free"
                                        : formatCurrency(
                                            deliveryFee
                                        )}
                                </strong>

                            </div>


                            <div
                                class="total-row grand-total"
                            >

                                <span>
                                    Total Amount
                                </span>

                                <strong>
                                    ${formatCurrency(
                                        totalAmount
                                    )}
                                </strong>

                            </div>


                        </div>


                    </div>


                </section>



                <!-- =============================
                     ORDER / PAYMENT STATUS
                ============================== -->

                <section class="status-section">


                    <div class="status-box">

                        <span>
                            Order Status
                        </span>

                        <strong>
                            ${escapeHTML(
                                orderStatus
                            )}
                        </strong>

                    </div>


                    <div class="status-box">

                        <span>
                            Payment Method
                        </span>

                        <strong>
                            ${escapeHTML(
                                paymentMethod
                            )}
                        </strong>

                    </div>


                    <div class="status-box">

                        <span>
                            Payment Status
                        </span>

                        <strong>
                            ${escapeHTML(
                                paymentStatus
                            )}
                        </strong>

                    </div>


                </section>



                <!-- =============================
                     NOTE
                ============================== -->

                <div class="invoice-note">

                    Thank you for choosing
                    ISM Royal Trust Distributors.

                    This invoice was generated
                    electronically and is valid
                    without a signature.

                </div>



                <!-- =============================
                     FOOTER
                ============================== -->

                <footer class="invoice-footer">


                    <p>
                        ISM ROYAL TRUST
                        DISTRIBUTORS (PVT) LTD
                    </p>


                    <p>
                        Quality Products ·
                        Reliable Distribution ·
                        Trusted Service
                    </p>


                </footer>


            </main>



            <!-- =============================
                 PRINT ACTIONS
            ============================== -->

            <div class="print-actions">


                <button
                    type="button"
                    class="close-button"
                    onclick="window.close()"
                >
                    Close
                </button>


                <button
                    type="button"
                    onclick="window.print()"
                >
                    Print / Save as PDF
                </button>


            </div>


        </body>


        </html>
    `;


    /* =========================================
       OPEN INVOICE
    ========================================= */

    invoiceWindow.document.open();


    invoiceWindow.document.write(
        invoiceHTML
    );


    invoiceWindow.document.close();


    invoiceWindow.focus();
}
/* =========================================
   LOADING STATES
========================================= */

function showOrdersLoading() {
    const tableBody =
        document.getElementById(
            "ordersTableBody"
        );

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = `
        <tr>
            <td
                colspan="6"
                class="admin-table-message"
            >
                <i class="fas fa-spinner fa-spin"></i>
                Loading orders...
            </td>
        </tr>
    `;
}

function showOrdersError(message) {
    const tableBody =
        document.getElementById(
            "ordersTableBody"
        );

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = `
        <tr>
            <td
                colspan="6"
                class="admin-table-message error"
            >
                <i class="fas fa-circle-exclamation"></i>
                ${escapeHTML(message)}
            </td>
        </tr>
    `;
}

function setRefreshLoading(loading) {
    const button =
        document.getElementById(
            "refreshOrdersButton"
        );

    if (!button) {
        return;
    }

    button.disabled = loading;

    button.innerHTML = loading
        ? `
            <i class="fas fa-spinner fa-spin"></i>
            Loading...
        `
        : `
            <i class="fas fa-rotate-right"></i>
            Refresh
        `;
}

/* =========================================
   ALERT MESSAGE
========================================= */

function showAlert(
    message,
    type
) {
    const alert =
        document.getElementById(
            "ordersAlert"
        );

    if (!alert) {
        return;
    }

    alert.textContent = message;

    alert.className =
        `admin-alert ${type} show`;

    window.clearTimeout(
        showAlert.timeoutId
    );

    showAlert.timeoutId =
        window.setTimeout(() => {
            alert.classList.remove(
                "show"
            );
        }, 4000);
}

/* =========================================
   RESPONSE HELPER
========================================= */

async function parseResponse(response) {
    const contentType =
        response.headers.get(
            "content-type"
        ) || "";

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

/* =========================================
   GENERAL DOM HELPER
========================================= */

function setText(
    id,
    value
) {
    const element =
        document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}

/* =========================================
   ORDER HELPERS
========================================= */

function getTotalItemQuantity(items) {
    if (!Array.isArray(items)) {
        return 0;
    }

    return items.reduce(
        (total, item) => {
            return (
                total +
                Number(
                    item.quantity || 0
                )
            );
        },
        0
    );
}

function getProductImage(item) {
    const image =
        item.image ||
        item.product?.image ||
        "../images/placeholder-product.png";

    if (
        image.startsWith("http://") ||
        image.startsWith("https://") ||
        image.startsWith("data:")
    ) {
        return image;
    }

    const cleanedImage =
        image.replace(/^\/+/, "");

    if (
        cleanedImage.startsWith(
            "images/"
        )
    ) {
        return `../${cleanedImage}`;
    }

    if (
        cleanedImage.startsWith(
            "../images/"
        )
    ) {
        return cleanedImage;
    }

    return `../images/${cleanedImage}`;
}

/* =========================================
   ADDRESS FORMAT
========================================= */

function formatAddress(address) {
    if (!address) {
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
        .join(", ") ||
        "Not available";
}

/* =========================================
   PAYMENT METHOD FORMAT
========================================= */

function formatPaymentMethod(value) {
    const method =
        String(value || "")
            .trim()
            .toLowerCase();

    const labels = {
        cash_on_delivery:
            "Cash on Delivery",

        bank_transfer:
            "Bank Transfer",

        card:
            "Card Payment",

        cash:
            "Cash on Delivery"
    };

    return (
        labels[method] ||
        formatStatus(
            method ||
            "Not available"
        )
    );
}

/* =========================================
   CURRENCY FORMAT
========================================= */

function formatCurrency(value) {
    return Number(
        value || 0
    ).toLocaleString(
        "en-LK",
        {
            style: "currency",
            currency: "LKR",
            minimumFractionDigits: 2
        }
    );
}

/* =========================================
   DATE FORMAT
========================================= */

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

/* =========================================
   STATUS FORMAT
========================================= */

function normalizeStatus(value) {
    return String(
        value || "pending"
    )
        .trim()
        .toLowerCase()
        .replace(
            /\s+/g,
            "-"
        );
}

function formatStatus(value) {
    return normalizeStatus(value)
        .split("-")
        .map((word) => {
            return (
                word
                    .charAt(0)
                    .toUpperCase() +
                word.slice(1)
            );
        })
        .join(" ");
}

/* =========================================
   SECURITY HELPER
========================================= */

function escapeHTML(value) {
    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}