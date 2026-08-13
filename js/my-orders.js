const API_URL =
    "http://localhost:5000/api/orders";


let orders = [];

let filteredOrders = [];


/* =========================================
   PAGE LOAD
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        checkLogin();

        initializeEvents();

        /*
        =====================================
        IMPORTANT:
        ORDER MODAL CLOSE EVENTS
        =====================================
        */

        initializeModalEvents();

        loadOrders();

    }
);


/* =========================================
   LOGIN CHECK
========================================= */

function checkLogin() {

    const token =
        localStorage.getItem(
            "token"
        ) ||
        sessionStorage.getItem(
            "token"
        );


    if (!token) {

        localStorage.setItem(
            "redirectAfterLogin",
            "my-orders.html"
        );


        window.location.href =
            "login.html";
    }
}


/* =========================================
   PAGE EVENTS
========================================= */

function initializeEvents() {

    const searchInput =
        document.getElementById(
            "orderSearchInput"
        );


    const statusFilter =
        document.getElementById(
            "orderStatusFilter"
        );


    searchInput?.addEventListener(
        "input",
        filterOrders
    );


    statusFilter?.addEventListener(
        "change",
        filterOrders
    );
}


/* =========================================
   LOAD CUSTOMER ORDERS
========================================= */

async function loadOrders() {

    showLoading();


    try {

        const token =
            localStorage.getItem(
                "token"
            ) ||
            sessionStorage.getItem(
                "token"
            );


        const response =
            await fetch(
                `${API_URL}/my-orders`,
                {
                    headers: {

                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );


        const data =
            await parseResponse(
                response
            );


        if (
            response.status === 401
        ) {

            clearAuthData();


            localStorage.setItem(
                "redirectAfterLogin",
                "my-orders.html"
            );


            window.location.href =
                "login.html";


            return;
        }


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


        filteredOrders = [
            ...orders
        ];


        updateSummary();


        renderOrders();


    } catch (error) {

        console.error(
            "Load orders error:",
            error
        );


        showError(
            error.message ||
            "Unable to load orders."
        );
    }
}


/* =========================================
   ORDER SUMMARY
========================================= */

function updateSummary() {

    const totalOrders =
        orders.length;


    const pendingOrders =
        orders.filter(
            (order) => {

                return normalizeStatus(
                    order.orderStatus ||
                    ""
                ) === "pending";
            }
        ).length;


    const deliveredOrders =
        orders.filter(
            (order) => {

                return normalizeStatus(
                    order.orderStatus ||
                    ""
                ) === "delivered";
            }
        ).length;


    const totalValue =
        orders.reduce(
            (
                total,
                order
            ) => {

                return (
                    total +
                    Number(
                        order.totalAmount ||
                        0
                    )
                );
            },
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


/* =========================================
   FILTER ORDERS
========================================= */

function filterOrders() {

    const searchInput =
        document.getElementById(
            "orderSearchInput"
        );


    const statusFilter =
        document.getElementById(
            "orderStatusFilter"
        );


    const keyword =
        String(
            searchInput?.value ||
            ""
        )
            .trim()
            .toLowerCase();


    const selectedStatus =
        String(
            statusFilter?.value ||
            "all"
        )
            .trim()
            .toLowerCase();


    filteredOrders =
        orders.filter(
            (order) => {

                const orderNumber =
                    String(
                        order.orderNumber ||
                        order._id ||
                        ""
                    )
                        .toLowerCase();


                const orderStatus =
                    normalizeStatus(
                        order.orderStatus ||
                        ""
                    );


                const matchesSearch =
                    !keyword ||
                    orderNumber.includes(
                        keyword
                    );


                const matchesStatus =
                    selectedStatus ===
                        "all" ||

                    !selectedStatus ||

                    orderStatus ===
                        selectedStatus;


                return (
                    matchesSearch &&
                    matchesStatus
                );
            }
        );


    renderOrders();
}


/* =========================================
   RENDER ORDERS
========================================= */

function renderOrders() {

    const container =
        document.getElementById(
            "ordersList"
        );


    if (!container) {
        return;
    }


    if (
        !filteredOrders.length
    ) {

        showEmpty();

        return;
    }


    const sortedOrders = [
        ...filteredOrders
    ].sort(
        (
            first,
            second
        ) => {

            return (
                new Date(
                    second.createdAt
                ).getTime() -

                new Date(
                    first.createdAt
                ).getTime()
            );
        }
    );


    container.innerHTML =
        sortedOrders
            .map(
                createOrderCard
            )
            .join("");


    initializeOrderCardEvents();
}


/* =========================================
   CREATE ORDER CARD
========================================= */

function createOrderCard(order) {

    const orderId =
        String(
            order._id ||
            ""
        );


    const orderNumber =
        order.orderNumber ||
        `#${orderId
            .slice(-8)
            .toUpperCase()}`;


    const status =
        normalizeStatus(
            order.orderStatus ||
            "pending"
        );


    const items =
        Array.isArray(
            order.items
        )
            ? order.items
            : [];


    const previewItems =
        items.slice(
            0,
            2
        );


    const remainingItems =
        items.length >
            previewItems.length

            ? items.length -
                previewItems.length

            : 0;


    const canCancel =
        status === "pending" ||
        status === "confirmed";


    return `
        <article class="order-card">


            <div class="order-card-header">


                <div class="order-number">

                    <h3>
                        ${escapeHTML(
                            orderNumber
                        )}
                    </h3>


                    <p>
                        Placed on
                        ${escapeHTML(
                            formatDate(
                                order.createdAt
                            )
                        )}
                    </p>

                </div>


                <span
                    class="order-status ${escapeHTML(
                        status
                    )}"
                >
                    ${escapeHTML(
                        formatStatus(
                            status
                        )
                    )}
                </span>


                <strong class="order-total">

                    ${formatCurrency(
                        order.totalAmount
                    )}

                </strong>


            </div>


            <div class="order-card-body">


                <div class="order-items-preview">

                    ${
                        previewItems.length

                            ? previewItems
                                .map(
                                    createPreviewItem
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

                                    +${remainingItems}
                                    more item${
                                        remainingItems > 1
                                            ? "s"
                                            : ""
                                    }

                                </p>
                              `

                            : ""
                    }

                </div>


                <div class="order-meta">


                    <div class="order-meta-item">

                        <span>
                            Payment
                        </span>

                        <strong>

                            ${escapeHTML(
                                formatPaymentMethod(
                                    order.paymentMethod
                                )
                            )}

                        </strong>

                    </div>


                    <div class="order-meta-item">

                        <span>
                            Items
                        </span>

                        <strong>

                            ${getTotalItemQuantity(
                                items
                            )}

                        </strong>

                    </div>


                    <div class="order-meta-item">

                        <span>
                            Delivery City
                        </span>

                        <strong>

                            ${escapeHTML(
                                order
                                    .deliveryAddress
                                    ?.city ||

                                order
                                    .customer
                                    ?.city ||

                                "Not available"
                            )}

                        </strong>

                    </div>


                    <div class="order-meta-item">

                        <span>
                            Order Status
                        </span>

                        <strong>

                            ${escapeHTML(
                                formatStatus(
                                    status
                                )
                            )}

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
                                data-order-id="${escapeHTML(
                                    orderId
                                )}"
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
                    data-order-id="${escapeHTML(
                        orderId
                    )}"
                >

                    <i class="fas fa-eye"></i>

                    View Details

                </button>


            </div>


        </article>
    `;
}


/* =========================================
   ORDER PREVIEW ITEM
========================================= */

function createPreviewItem(item) {

    const image =
        getProductImage(
            item
        );


    const name =
        item.name ||
        item.product?.name ||
        "Product";


    const netContent =
        item.netContent ||
        item.product?.netContent ||
        "";


    const quantity =
        Number(
            item.quantity ||
            1
        );


    return `
        <div class="order-preview-item">


            <img
                src="${escapeHTML(
                    image
                )}"

                alt="${escapeHTML(
                    name
                )}"

                onerror="
                    this.onerror=null;
                    this.src='images/placeholder-product.png';
                "
            >


            <div>


                <div class="order-preview-title">

                    <h4>
                        ${escapeHTML(
                            name
                        )}
                    </h4>


                    ${
                        netContent
                            ? `
                                <span class="order-net-content">

                                    ${escapeHTML(
                                        netContent
                                    )}

                                </span>
                              `

                            : ""
                    }

                </div>


                <p>
                    Quantity:
                    ${quantity}
                </p>


            </div>


        </div>
    `;
}


/* =========================================
   ORDER CARD EVENTS
========================================= */

function initializeOrderCardEvents() {

    document
        .querySelectorAll(
            ".view-order-button"
        )
        .forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    () => {

                        openOrderDetails(
                            button.dataset.orderId
                        );
                    }
                );
            }
        );


    document
        .querySelectorAll(
            ".cancel-order-button"
        )
        .forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    () => {

                        cancelOrder(
                            button.dataset.orderId
                        );
                    }
                );
            }
        );
}


/* =========================================
   OPEN ORDER DETAILS
========================================= */

function openOrderDetails(
    orderId
) {

    const order =
        orders.find(
            (item) => {

                return (
                    String(
                        item._id
                    ) ===
                    String(
                        orderId
                    )
                );
            }
        );


    if (!order) {

        showAlert(
            "Order details were not found.",
            "error"
        );

        return;
    }


    const modal =
        document.getElementById(
            "orderDetailsModal"
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

        `#${String(
            order._id ||
            ""
        )
            .slice(-8)
            .toUpperCase()}`;


    modalTitle.textContent =
        orderNumber;


    modalBody.innerHTML =
        createOrderModalContent(
            order
        );


    /* =====================================
       RECEIPT BUTTON EVENT
    ===================================== */

    const receiptButton =
        document.getElementById(
            "downloadReceiptButton"
        );


    receiptButton?.addEventListener(
        "click",
        () => {

            generateCustomerReceipt(
                order
            );
        }
    );


    modal.classList.add(
        "show"
    );


    modal.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.style.overflow =
        "hidden";
}
/* =========================================
   ORDER DETAILS CONTENT
========================================= */

function createOrderModalContent(
    order
) {

    const status =
        normalizeStatus(
            order.orderStatus ||
            "pending"
        );


    const items =
        Array.isArray(
            order.items
        )
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


    const address =
        formatAddress(
            order.deliveryAddress
        );


    return `
        <section class="modal-section">

            <h3>
                Order Information
            </h3>


            <div class="modal-info-grid">


                <div class="modal-info-item">

                    <span>
                        Status
                    </span>

                    <strong>
                        ${escapeHTML(
                            formatStatus(
                                status
                            )
                        )}
                    </strong>

                </div>


                <div class="modal-info-item">

                    <span>
                        Placed Date
                    </span>

                    <strong>
                        ${escapeHTML(
                            formatDate(
                                order.createdAt
                            )
                        )}
                    </strong>

                </div>


                <div class="modal-info-item">

                    <span>
                        Payment Method
                    </span>

                    <strong>
                        ${escapeHTML(
                            formatPaymentMethod(
                                order.paymentMethod
                            )
                        )}
                    </strong>

                </div>


                <div class="modal-info-item">

                    <span>
                        Payment Status
                    </span>

                    <strong>
                        ${escapeHTML(
                            formatStatus(
                                order.paymentStatus ||
                                "pending"
                            )
                        )}
                    </strong>

                </div>


            </div>

        </section>


        <section class="modal-section">

            <h3>
                Delivery Information
            </h3>


            <div class="modal-info-grid">


                <div class="modal-info-item">

                    <span>
                        Customer Name
                    </span>

                    <strong>
                        ${escapeHTML(
                            customerName
                        )}
                    </strong>

                </div>


                <div class="modal-info-item">

                    <span>
                        Phone Number
                    </span>

                    <strong>
                        ${escapeHTML(
                            customerPhone
                        )}
                    </strong>

                </div>


                <div class="modal-info-item">

                    <span>
                        Delivery Address
                    </span>

                    <strong>
                        ${escapeHTML(
                            address
                        )}
                    </strong>

                </div>


                <div class="modal-info-item">

                    <span>
                        Delivery Note
                    </span>

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

            <h3>
                Products
            </h3>


            <div>

                ${
                    items.length

                        ? items
                            .map(
                                createModalItem
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

            <h3>
                Payment Summary
            </h3>


            <div class="modal-totals">


                <div class="modal-total-row">

                    <span>
                        Subtotal
                    </span>

                    <strong>
                        ${formatCurrency(
                            order.subtotal
                        )}
                    </strong>

                </div>


                <div class="modal-total-row">

                    <span>
                        Delivery Fee
                    </span>

                    <strong>
                        ${
                            Number(
                                order.deliveryFee ||
                                0
                            ) === 0

                                ? "Free"

                                : formatCurrency(
                                    order.deliveryFee
                                )
                        }
                    </strong>

                </div>


                <div
                    class="modal-total-row grand-total"
                >

                    <span>
                        Total Amount
                    </span>

                    <strong>
                        ${formatCurrency(
                            order.totalAmount
                        )}
                    </strong>

                </div>


            </div>

        </section>


        ${
            status === "confirmed"

                ? `
                    <section
                        class="modal-section receipt-section"
                    >

                        <button
                            type="button"

                            class="download-receipt-button"

                            onclick="downloadCustomerReceipt('${escapeHTML(
                                String(
                                    order._id ||
                                    ""
                                )
                            )}')"
                        >

                            <i class="fas fa-file-pdf"></i>

                            Download Receipt / Save PDF

                        </button>

                            <i class="fas fa-file-pdf"></i>

                            Download Receipt / Save PDF

                        </button>

                    </section>
                  `

                : ""
        }
    `;
}


/* =========================================
   MODAL PRODUCT ITEM
========================================= */

function createModalItem(item) {

    const name =
        item.name ||
        item.product?.name ||
        "Product";


    const netContent =
        item.netContent ||
        item.product?.netContent ||
        "";


    const price =
        Number(
            item.price ||
            item.appliedPrice ||
            0
        );


    const quantity =
        Number(
            item.quantity ||
            1
        );


    const total =
        price *
        quantity;


    const image =
        getProductImage(
            item
        );


    return `
        <div class="modal-item">


            <img
                src="${escapeHTML(
                    image
                )}"

                alt="${escapeHTML(
                    name
                )}"

                onerror="
                    this.onerror=null;
                    this.src='images/placeholder-product.png';
                "
            >


            <div class="modal-item-details">


                <div class="modal-product-title-row">


                    <h4>
                        ${escapeHTML(
                            name
                        )}
                    </h4>


                    ${
                        netContent
                            ? `
                                <span class="modal-net-content">

                                    ${escapeHTML(
                                        netContent
                                    )}

                                </span>
                              `

                            : ""
                    }


                </div>


                <p>

                    ${quantity}

                    ×

                    ${formatCurrency(
                        price
                    )}

                </p>


            </div>


            <strong>

                ${formatCurrency(
                    total
                )}

            </strong>


        </div>
    `;
}


/* =========================================
   MODAL EVENTS
========================================= */

function initializeModalEvents() {

    const modal =
        document.getElementById(
            "orderDetailsModal"
        );


    const closeButton =
        document.getElementById(
            "closeOrderModalButton"
        );


    closeButton?.addEventListener(
        "click",
        closeOrderDetails
    );


    modal
        ?.querySelectorAll(
            "[data-close-modal]"
        )
        .forEach(
            (element) => {

                element.addEventListener(
                    "click",
                    closeOrderDetails
                );
            }
        );


    /*
    Click outside modal content
    */

    modal?.addEventListener(
        "click",
        (event) => {

            if (
                event.target ===
                modal
            ) {

                closeOrderDetails();
            }
        }
    );


    /*
    ESC key
    */

    document.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key ===
                "Escape"
            ) {

                closeOrderDetails();
            }
        }
    );
}


/* =========================================
   CLOSE ORDER DETAILS
========================================= */

function closeOrderDetails() {

    const modal =
        document.getElementById(
            "orderDetailsModal"
        );


    if (!modal) {
        return;
    }


    modal.classList.remove(
        "show"
    );


    modal.setAttribute(
        "aria-hidden",
        "true"
    );


    document.body.style.overflow =
        "";
}


/* =========================================
   CANCEL ORDER
========================================= */

async function cancelOrder(
    orderId
) {

    const order =
        orders.find(
            (item) => {

                return (
                    String(
                        item._id
                    ) ===
                    String(
                        orderId
                    )
                );
            }
        );


    if (!order) {

        showAlert(
            "Order was not found.",
            "error"
        );

        return;
    }


    const status =
        normalizeStatus(
            order.orderStatus ||
            "pending"
        );


    if (
        ![
            "pending",
            "confirmed"
        ].includes(
            status
        )
    ) {

        showAlert(
            "This order can no longer be cancelled.",
            "error"
        );

        return;
    }


    const confirmed =
        window.confirm(
            "Are you sure you want to cancel this order?"
        );


    if (!confirmed) {
        return;
    }


    let button =
        null;


    try {

        if (
            window.CSS &&
            typeof CSS.escape ===
                "function"
        ) {

            button =
                document.querySelector(
                    `.cancel-order-button[data-order-id="${CSS.escape(
                        String(
                            orderId
                        )
                    )}"]`
                );

        } else {

            button =
                document.querySelector(
                    `.cancel-order-button[data-order-id="${String(
                        orderId
                    )}"]`
                );
        }


        setCancelButtonLoading(
            button,
            true
        );


        const token =
            localStorage.getItem(
                "token"
            ) ||
            sessionStorage.getItem(
                "token"
            );


        const response =
            await fetch(
                `${API_URL}/${orderId}/cancel`,
                {
                    method:
                        "PUT",

                    headers: {

                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );


        const data =
            await parseResponse(
                response
            );


        if (
            response.status === 401
        ) {

            clearAuthData();


            localStorage.setItem(
                "redirectAfterLogin",
                "my-orders.html"
            );


            window.location.href =
                "login.html";


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
                orderStatus:
                    "cancelled"
            };


        updateOrderInMemory(
            updatedOrder
        );


        updateSummary();


        filterOrders();


        showAlert(
            data.message ||
            "Order cancelled successfully.",
            "success"
        );


    } catch (error) {

        console.error(
            "Cancel order error:",
            error
        );


        showAlert(
            error.message ||
            "Unable to cancel the order.",
            "error"
        );


    } finally {

        setCancelButtonLoading(
            button,
            false
        );
    }
}


/* =========================================
   UPDATE ORDER IN MEMORY
========================================= */

function updateOrderInMemory(
    updatedOrder
) {

    const updatedId =
        String(
            updatedOrder._id ||
            ""
        );


    orders =
        orders.map(
            (order) => {

                if (
                    String(
                        order._id
                    ) !==
                    updatedId
                ) {

                    return order;
                }


                return {
                    ...order,
                    ...updatedOrder
                };
            }
        );


    filteredOrders =
        filteredOrders.map(
            (order) => {

                if (
                    String(
                        order._id
                    ) !==
                    updatedId
                ) {

                    return order;
                }


                return {
                    ...order,
                    ...updatedOrder
                };
            }
        );
}


/* =========================================
   CANCEL BUTTON LOADING
========================================= */

function setCancelButtonLoading(
    button,
    loading
) {

    if (!button) {
        return;
    }


    button.disabled =
        loading;


    button.innerHTML =
        loading

            ? `
                <i class="fas fa-spinner fa-spin"></i>
                Cancelling...
              `

            : `
                <i class="fas fa-ban"></i>
                Cancel Order
              `;
}
/* =========================================
   ORDER DETAILS CONTENT
========================================= */

function createOrderModalContent(
    order
) {

    const status =
        normalizeStatus(
            order.orderStatus ||
            "pending"
        );


    const items =
        Array.isArray(
            order.items
        )
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


    const address =
        formatAddress(
            order.deliveryAddress
        );


    return `
        <section class="modal-section">

            <h3>
                Order Information
            </h3>


            <div class="modal-info-grid">


                <div class="modal-info-item">

                    <span>
                        Status
                    </span>

                    <strong>
                        ${escapeHTML(
                            formatStatus(
                                status
                            )
                        )}
                    </strong>

                </div>


                <div class="modal-info-item">

                    <span>
                        Placed Date
                    </span>

                    <strong>
                        ${escapeHTML(
                            formatDate(
                                order.createdAt
                            )
                        )}
                    </strong>

                </div>


                <div class="modal-info-item">

                    <span>
                        Payment Method
                    </span>

                    <strong>
                        ${escapeHTML(
                            formatPaymentMethod(
                                order.paymentMethod
                            )
                        )}
                    </strong>

                </div>


                <div class="modal-info-item">

                    <span>
                        Payment Status
                    </span>

                    <strong>
                        ${escapeHTML(
                            formatStatus(
                                order.paymentStatus ||
                                "pending"
                            )
                        )}
                    </strong>

                </div>


            </div>

        </section>


        <section class="modal-section">

            <h3>
                Delivery Information
            </h3>


            <div class="modal-info-grid">


                <div class="modal-info-item">

                    <span>
                        Customer Name
                    </span>

                    <strong>
                        ${escapeHTML(
                            customerName
                        )}
                    </strong>

                </div>


                <div class="modal-info-item">

                    <span>
                        Phone Number
                    </span>

                    <strong>
                        ${escapeHTML(
                            customerPhone
                        )}
                    </strong>

                </div>


                <div class="modal-info-item">

                    <span>
                        Delivery Address
                    </span>

                    <strong>
                        ${escapeHTML(
                            address
                        )}
                    </strong>

                </div>


                <div class="modal-info-item">

                    <span>
                        Delivery Note
                    </span>

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

            <h3>
                Products
            </h3>


            <div>

                ${
                    items.length

                        ? items
                            .map(
                                createModalItem
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

            <h3>
                Payment Summary
            </h3>


            <div class="modal-totals">


                <div class="modal-total-row">

                    <span>
                        Subtotal
                    </span>

                    <strong>
                        ${formatCurrency(
                            order.subtotal
                        )}
                    </strong>

                </div>


                <div class="modal-total-row">

                    <span>
                        Delivery Fee
                    </span>

                    <strong>
                        ${
                            Number(
                                order.deliveryFee ||
                                0
                            ) === 0

                                ? "Free"

                                : formatCurrency(
                                    order.deliveryFee
                                )
                        }
                    </strong>

                </div>


                <div
                    class="modal-total-row grand-total"
                >

                    <span>
                        Total Amount
                    </span>

                    <strong>
                        ${formatCurrency(
                            order.totalAmount
                        )}
                    </strong>

                </div>


            </div>

        </section>


        ${
            status === "confirmed"

                ? `
                    <section
                        class="modal-section receipt-section"
                    >

                        <button
                            type="button"
                            class="download-receipt-button"
                            id="downloadReceiptButton"
                            data-order-id="${escapeHTML(
                                String(
                                    order._id ||
                                    ""
                                )
                            )}"
                        >

                            <i class="fas fa-file-pdf"></i>

                            Download Receipt / Save PDF

                        </button>

                    </section>
                  `

                : ""
        }
    `;
}


/* =========================================
   MODAL PRODUCT ITEM
========================================= */

function createModalItem(item) {

    const name =
        item.name ||
        item.product?.name ||
        "Product";


    const netContent =
        item.netContent ||
        item.product?.netContent ||
        "";


    const price =
        Number(
            item.price ||
            item.appliedPrice ||
            0
        );


    const quantity =
        Number(
            item.quantity ||
            1
        );


    const total =
        price *
        quantity;


    const image =
        getProductImage(
            item
        );


    return `
        <div class="modal-item">


            <img
                src="${escapeHTML(
                    image
                )}"

                alt="${escapeHTML(
                    name
                )}"

                onerror="
                    this.onerror=null;
                    this.src='images/placeholder-product.png';
                "
            >


            <div class="modal-item-details">


                <div class="modal-product-title-row">


                    <h4>
                        ${escapeHTML(
                            name
                        )}
                    </h4>


                    ${
                        netContent
                            ? `
                                <span class="modal-net-content">

                                    ${escapeHTML(
                                        netContent
                                    )}

                                </span>
                              `

                            : ""
                    }


                </div>


                <p>

                    ${quantity}

                    ×

                    ${formatCurrency(
                        price
                    )}

                </p>


            </div>


            <strong>

                ${formatCurrency(
                    total
                )}

            </strong>


        </div>
    `;
}


/* =========================================
   MODAL EVENTS
========================================= */

function initializeModalEvents() {

    const modal =
        document.getElementById(
            "orderDetailsModal"
        );


    const closeButton =
        document.getElementById(
            "closeOrderModalButton"
        );


    closeButton?.addEventListener(
        "click",
        closeOrderDetails
    );


    modal
        ?.querySelectorAll(
            "[data-close-modal]"
        )
        .forEach(
            (element) => {

                element.addEventListener(
                    "click",
                    closeOrderDetails
                );
            }
        );


    /*
    Click outside modal content
    */

    modal?.addEventListener(
        "click",
        (event) => {

            if (
                event.target ===
                modal
            ) {

                closeOrderDetails();
            }
        }
    );


    /*
    ESC key
    */

    document.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key ===
                "Escape"
            ) {

                closeOrderDetails();
            }
        }
    );
}


/* =========================================
   CLOSE ORDER DETAILS
========================================= */

function closeOrderDetails() {

    const modal =
        document.getElementById(
            "orderDetailsModal"
        );


    if (!modal) {
        return;
    }


    modal.classList.remove(
        "show"
    );


    modal.setAttribute(
        "aria-hidden",
        "true"
    );


    document.body.style.overflow =
        "";
}


/* =========================================
   CANCEL ORDER
========================================= */

async function cancelOrder(
    orderId
) {

    const order =
        orders.find(
            (item) => {

                return (
                    String(
                        item._id
                    ) ===
                    String(
                        orderId
                    )
                );
            }
        );


    if (!order) {

        showAlert(
            "Order was not found.",
            "error"
        );

        return;
    }


    const status =
        normalizeStatus(
            order.orderStatus ||
            "pending"
        );


    if (
        ![
            "pending",
            "confirmed"
        ].includes(
            status
        )
    ) {

        showAlert(
            "This order can no longer be cancelled.",
            "error"
        );

        return;
    }


    const confirmed =
        window.confirm(
            "Are you sure you want to cancel this order?"
        );


    if (!confirmed) {
        return;
    }


    let button =
        null;


    try {

        if (
            window.CSS &&
            typeof CSS.escape ===
                "function"
        ) {

            button =
                document.querySelector(
                    `.cancel-order-button[data-order-id="${CSS.escape(
                        String(
                            orderId
                        )
                    )}"]`
                );

        } else {

            button =
                document.querySelector(
                    `.cancel-order-button[data-order-id="${String(
                        orderId
                    )}"]`
                );
        }


        setCancelButtonLoading(
            button,
            true
        );


        const token =
            localStorage.getItem(
                "token"
            ) ||
            sessionStorage.getItem(
                "token"
            );


        const response =
            await fetch(
                `${API_URL}/${orderId}/cancel`,
                {
                    method:
                        "PUT",

                    headers: {

                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );


        const data =
            await parseResponse(
                response
            );


        if (
            response.status === 401
        ) {

            clearAuthData();


            localStorage.setItem(
                "redirectAfterLogin",
                "my-orders.html"
            );


            window.location.href =
                "login.html";


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
                orderStatus:
                    "cancelled"
            };


        updateOrderInMemory(
            updatedOrder
        );


        updateSummary();


        filterOrders();


        showAlert(
            data.message ||
            "Order cancelled successfully.",
            "success"
        );


    } catch (error) {

        console.error(
            "Cancel order error:",
            error
        );


        showAlert(
            error.message ||
            "Unable to cancel the order.",
            "error"
        );


    } finally {

        setCancelButtonLoading(
            button,
            false
        );
    }
}


/* =========================================
   UPDATE ORDER IN MEMORY
========================================= */

function updateOrderInMemory(
    updatedOrder
) {

    const updatedId =
        String(
            updatedOrder._id ||
            ""
        );


    orders =
        orders.map(
            (order) => {

                if (
                    String(
                        order._id
                    ) !==
                    updatedId
                ) {

                    return order;
                }


                return {
                    ...order,
                    ...updatedOrder
                };
            }
        );


    filteredOrders =
        filteredOrders.map(
            (order) => {

                if (
                    String(
                        order._id
                    ) !==
                    updatedId
                ) {

                    return order;
                }


                return {
                    ...order,
                    ...updatedOrder
                };
            }
        );
}


/* =========================================
   CANCEL BUTTON LOADING
========================================= */

function setCancelButtonLoading(
    button,
    loading
) {

    if (!button) {
        return;
    }


    button.disabled =
        loading;


    button.innerHTML =
        loading

            ? `
                <i class="fas fa-spinner fa-spin"></i>
                Cancelling...
              `

            : `
                <i class="fas fa-ban"></i>
                Cancel Order
              `;
}
/* =========================================
   LOADING
========================================= */

function showLoading() {

    const container =
        document.getElementById(
            "ordersList"
        );

    if (!container) {
        return;
    }

    container.innerHTML = `
        <div class="orders-loading">

            <i class="fas fa-spinner fa-spin"></i>

            <p>
                Loading your orders...
            </p>

        </div>
    `;
}
/* =========================================
   SHOW ERROR
========================================= */

function showError(message) {

    const container =
        document.getElementById(
            "ordersList"
        );

    if (!container) {
        return;
    }

    container.innerHTML = `
        <div class="orders-error">

            <i class="fas fa-circle-exclamation"></i>

            <h3>
                Unable to Load Orders
            </h3>

            <p>
                ${escapeHTML(
                    message
                )}
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
        .getElementById(
            "retryOrdersButton"
        )
        ?.addEventListener(
            "click",
            loadOrders
        );
}


/* =========================================
   PARSE RESPONSE
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

        try {
            return await response.json();
        } catch {
            return {};
        }
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
   MISSING HELPER FUNCTIONS
========================================= */

function normalizeStatus(value) {

    return String(
        value ||
        "pending"
    )
        .trim()
        .toLowerCase()
        .replace(
            /\s+/g,
            "-"
        );
}


function formatStatus(value) {

    return normalizeStatus(
        value
    )
        .split("-")
        .map(
            (word) => {

                return (
                    word
                        .charAt(0)
                        .toUpperCase() +

                    word.slice(1)
                );
            }
        )
        .join(" ");
}


function formatPaymentMethod(value) {

    const method =
        String(
            value ||
            ""
        )
            .trim()
            .toLowerCase();


    const labels = {

        cod:
            "Cash on Delivery",

        "cash-on-delivery":
            "Cash on Delivery",

        cash:
            "Cash on Delivery",

        cash_on_delivery:
            "Cash on Delivery",

        card:
            "Card Payment",

        bank:
            "Bank Transfer",

        bank_transfer:
            "Bank Transfer",

        "bank-transfer":
            "Bank Transfer"
    };


    return (
        labels[
            method
        ] ||

        formatStatus(
            method ||
            "Not available"
        )
    );
}


function formatCurrency(value) {

    return Number(
        value ||
        0
    ).toLocaleString(
        "en-LK",
        {

            style:
                "currency",

            currency:
                "LKR",

            minimumFractionDigits:
                2
        }
    );
}


function formatDate(value) {

    if (!value) {

        return "Not available";
    }


    const date =
        new Date(
            value
        );


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

            year:
                "numeric",

            month:
                "short",

            day:
                "numeric"
        }
    );
}


function getTotalItemQuantity(items) {

    if (
        !Array.isArray(
            items
        )
    ) {

        return 0;
    }


    return items.reduce(
        (
            total,
            item
        ) => {

            return (
                total +
                Number(
                    item.quantity ||
                    0
                )
            );
        },
        0
    );
}


function formatAddress(address) {

    if (
        !address ||
        typeof address !==
            "object"
    ) {

        return "Not available";
    }


    return [

        address.streetAddress,

        address.addressLine1,

        address.city,

        address.district,

        address.postalCode

    ]
        .filter(
            Boolean
        )
        .join(", ") ||

        "Not available";
}


function getProductImage(item) {

    const image =
        item.image ||
        item.product?.image ||
        "images/placeholder-product.png";


    if (
        image.startsWith(
            "http://"
        ) ||

        image.startsWith(
            "https://"
        ) ||

        image.startsWith(
            "data:"
        )
    ) {

        return image;
    }


    if (
        image.startsWith(
            "/uploads/"
        )
    ) {

        return (
            "http://localhost:5000" +
            image
        );
    }


    if (
        image.startsWith(
            "uploads/"
        )
    ) {

        return (
            "http://localhost:5000/" +
            image
        );
    }


    return image.replace(
        /^\/+/,
        ""
    );
}


function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value;
    }
}


function escapeHTML(value) {

    return String(
        value ??
        ""
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


function clearAuthData() {

    const keys = [

        "token",

        "user",

        "adminToken",

        "adminUser",

        "redirectAfterLogin"
    ];


    keys.forEach(
        (key) => {

            localStorage.removeItem(
                key
            );

            sessionStorage.removeItem(
                key
            );
        }
    );
}


function showAlert(
    message,
    type
) {

    const alert =
        document.getElementById(
            "ordersAlert"
        );


    if (!alert) {

        console.log(
            `${type}: ${message}`
        );

        return;
    }


    alert.textContent =
        message;


    alert.className =
        `orders-alert ${type} show`;


    window.clearTimeout(
        showAlert.timeoutId
    );


    showAlert.timeoutId =
        window.setTimeout(
            () => {

                alert.classList.remove(
                    "show"
                );

            },
            4000
        );
}
/* =========================================
   DOWNLOAD CUSTOMER RECEIPT
========================================= */

function downloadCustomerReceipt(
    orderId
) {

    const order =
        orders.find(
            (item) => {

                return (
                    String(
                        item._id
                    ) ===
                    String(
                        orderId
                    )
                );
            }
        );


    if (!order) {

        showAlert(
            "Order details were not found.",
            "error"
        );

        return;
    }


    const status =
        normalizeStatus(
            order.orderStatus ||
            "pending"
        );


    if (
        status !==
        "confirmed"
    ) {

        showAlert(
            "Receipt is available only for confirmed orders.",
            "error"
        );

        return;
    }


    if (
        typeof generateCustomerReceipt !==
        "function"
    ) {

        console.error(
            "generateCustomerReceipt function is missing."
        );


        showAlert(
            "Receipt generator is not available.",
            "error"
        );

        return;
    }


    generateCustomerReceipt(
        order
    );
}


/* Make function available for onclick */

window.downloadCustomerReceipt =
    downloadCustomerReceipt;

/* =========================================
   CUSTOMER RECEIPT GENERATOR
========================================= */

function generateCustomerReceipt(order) {

    const status =
        normalizeStatus(
            order.orderStatus ||
            "pending"
        );


    if (
        status !== "confirmed"
    ) {

        showAlert(
            "Receipt is available only for confirmed orders.",
            "error"
        );

        return;
    }


    const receiptWindow =
        window.open(
            "",
            "_blank",
            "width=1000,height=800"
        );


    if (!receiptWindow) {

        showAlert(
            "Pop-up blocked. Please allow pop-ups and try again.",
            "error"
        );

        return;
    }


    const orderId =
        String(
            order._id ||
            ""
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
        order.phone ||
        "Not available";


    const deliveryAddress =
        formatAddress(
            order.deliveryAddress
        );


    const paymentMethod =
        formatPaymentMethod(
            order.paymentMethod
        );


    const paymentStatus =
        formatStatus(
            order.paymentStatus ||
            "pending"
        );


    const orderDate =
        formatDate(
            order.createdAt
        );


    const items =
        Array.isArray(
            order.items
        )
            ? order.items
            : [];


    const itemsHTML =
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

                                <td>
                                    <strong>
                                        ${escapeHTML(name)}
                                    </strong>
                                </td>

                                <td>
                                    ${
                                        netContent
                                            ? escapeHTML(netContent)
                                            : "-"
                                    }
                                </td>

                                <td class="center">
                                    ${quantity}
                                </td>

                                <td class="right">
                                    ${formatCurrency(price)}
                                </td>

                                <td class="right">
                                    <strong>
                                        ${formatCurrency(total)}
                                    </strong>
                                </td>

                            </tr>
                        `;
                    }
                )
                .join("")

            : `
                <tr>
                    <td colspan="6" class="center">
                        No product information available.
                    </td>
                </tr>
            `;


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


    const receiptHTML = `
        <!DOCTYPE html>

        <html lang="en">

        <head>

            <meta charset="UTF-8">

            <meta
                name="viewport"
                content="width=device-width, initial-scale=1.0"
            >

            <title>
                Receipt ${escapeHTML(orderNumber)}
            </title>

            <style>

                * {
                    box-sizing: border-box;
                    margin: 0;
                    padding: 0;
                }

                body {
                    padding: 30px;
                    font-family: Arial, Helvetica, sans-serif;
                    color: #1f2937;
                    background: #ffffff;
                }

                .receipt {
                    width: 100%;
                    max-width: 900px;
                    margin: 0 auto;
                }

                .receipt-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 30px;
                    padding-bottom: 22px;
                    border-bottom: 3px solid #123f84;
                }

                .company {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }

                .company img {
                    width: 75px;
                    height: 75px;
                    object-fit: contain;
                }

                .company h1 {
                    margin-bottom: 7px;
                    color: #123f84;
                    font-size: 23px;
                }

                .company p {
                    margin-bottom: 4px;
                    color: #555;
                    font-size: 12px;
                }

                .receipt-title {
                    text-align: right;
                }

                .receipt-title h2 {
                    margin-bottom: 10px;
                    color: #ff9800;
                    font-size: 30px;
                }

                .receipt-title p {
                    margin-bottom: 6px;
                    font-size: 13px;
                }

                .confirmed-badge {
                    display: inline-block;
                    margin-top: 5px;
                    padding: 6px 11px;
                    color: #166534;
                    background: #dcfce7;
                    border-radius: 20px;
                    font-size: 11px;
                    font-weight: 700;
                }

                .section {
                    margin-top: 26px;
                }

                .section-title {
                    margin-bottom: 14px;
                    padding-bottom: 8px;
                    color: #123f84;
                    border-bottom: 1px solid #dddddd;
                    font-size: 17px;
                }

                .customer-grid {
                    display: grid;
                    grid-template-columns:
                        repeat(2, minmax(0, 1fr));
                    gap: 14px;
                }

                .info-box {
                    padding: 13px;
                    background: #f7f9fc;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                }

                .info-box span {
                    display: block;
                    margin-bottom: 5px;
                    color: #6b7280;
                    font-size: 10px;
                    font-weight: 700;
                    text-transform: uppercase;
                }

                .info-box strong {
                    font-size: 13px;
                    line-height: 1.5;
                }

                table {
                    width: 100%;
                    margin-top: 10px;
                    border-collapse: collapse;
                }

                th {
                    padding: 11px 9px;
                    color: #ffffff;
                    background: #123f84;
                    font-size: 11px;
                    text-align: left;
                }

                td {
                    padding: 11px 9px;
                    border-bottom: 1px solid #e5e7eb;
                    font-size: 12px;
                }

                tbody tr:nth-child(even) {
                    background: #f8fafc;
                }

                .center {
                    text-align: center;
                }

                .right {
                    text-align: right;
                }

                .totals-wrapper {
                    display: flex;
                    justify-content: flex-end;
                    margin-top: 20px;
                }

                .totals {
                    width: 100%;
                    max-width: 350px;
                }

                .total-row {
                    display: flex;
                    justify-content: space-between;
                    gap: 20px;
                    padding: 10px 0;
                    border-bottom: 1px solid #dddddd;
                    font-size: 13px;
                }

                .grand-total {
                    color: #123f84;
                    border-bottom: none;
                    font-size: 18px;
                    font-weight: 800;
                }

                .thank-you {
                    margin-top: 28px;
                    padding: 15px;
                    color: #555;
                    background: #fff7ed;
                    border-left: 4px solid #ff9800;
                    font-size: 13px;
                    line-height: 1.6;
                }

                .footer {
                    margin-top: 30px;
                    padding-top: 15px;
                    color: #6b7280;
                    text-align: center;
                    border-top: 1px solid #dddddd;
                    font-size: 11px;
                    line-height: 1.6;
                }

                .actions {
                    width: 100%;
                    max-width: 900px;
                    margin: 20px auto 0;
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                }

                .actions button {
                    padding: 11px 18px;
                    border: none;
                    border-radius: 7px;
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 700;
                }

                .close-btn {
                    color: #222;
                    background: #e5e7eb;
                }

                .pdf-btn {
                    color: #ffffff;
                    background: #ff9800;
                }

                @media print {

                    @page {
                        size: A4;
                        margin: 15mm;
                    }

                    body {
                        padding: 0;
                    }

                    .actions {
                        display: none;
                    }

                    .receipt {
                        max-width: none;
                    }
                }

            </style>

        </head>

        <body>

            <main class="receipt">

                <header class="receipt-header">

                    <div class="company">

                        <img
                            src="images/logo.png"
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
                                Phone: +94 75 769 3155
                            </p>

                            <p>
                                Email:
                                ismdistributors1030@gmail.com
                            </p>

                        </div>

                    </div>

                    <div class="receipt-title">

                        <h2>
                            RECEIPT
                        </h2>

                        <p>
                            <strong>Order:</strong>
                            ${escapeHTML(orderNumber)}
                        </p>

                        <p>
                            <strong>Date:</strong>
                            ${escapeHTML(orderDate)}
                        </p>

                        <span class="confirmed-badge">
                            CONFIRMED ORDER
                        </span>

                    </div>

                </header>


                <section class="section">

                    <h3 class="section-title">
                        Customer Information
                    </h3>

                    <div class="customer-grid">

                        <div class="info-box">
                            <span>Customer Name</span>
                            <strong>
                                ${escapeHTML(customerName)}
                            </strong>
                        </div>

                        <div class="info-box">
                            <span>Email</span>
                            <strong>
                                ${escapeHTML(customerEmail)}
                            </strong>
                        </div>

                        <div class="info-box">
                            <span>Phone</span>
                            <strong>
                                ${escapeHTML(customerPhone)}
                            </strong>
                        </div>

                        <div class="info-box">
                            <span>Delivery Address</span>
                            <strong>
                                ${escapeHTML(deliveryAddress)}
                            </strong>
                        </div>

                        <div class="info-box">
                            <span>Payment Method</span>
                            <strong>
                                ${escapeHTML(paymentMethod)}
                            </strong>
                        </div>

                        <div class="info-box">
                            <span>Payment Status</span>
                            <strong>
                                ${escapeHTML(paymentStatus)}
                            </strong>
                        </div>

                    </div>

                </section>


                <section class="section">

                    <h3 class="section-title">
                        Ordered Products
                    </h3>

                    <table>

                        <thead>

                            <tr>
                                <th>#</th>
                                <th>Product</th>
                                <th>Net Content</th>
                                <th class="center">Qty</th>
                                <th class="right">Unit Price</th>
                                <th class="right">Total</th>
                            </tr>

                        </thead>

                        <tbody>
                            ${itemsHTML}
                        </tbody>

                    </table>

                    <div class="totals-wrapper">

                        <div class="totals">

                            <div class="total-row">

                                <span>Subtotal</span>

                                <strong>
                                    ${formatCurrency(subtotal)}
                                </strong>

                            </div>

                            <div class="total-row">

                                <span>Delivery Fee</span>

                                <strong>
                                    ${
                                        deliveryFee === 0
                                            ? "Free"
                                            : formatCurrency(deliveryFee)
                                    }
                                </strong>

                            </div>

                            <div class="total-row grand-total">

                                <span>Total Amount</span>

                                <strong>
                                    ${formatCurrency(totalAmount)}
                                </strong>

                            </div>

                        </div>

                    </div>

                </section>


                <div class="thank-you">

                    Thank you for your order with
                    ISM Royal Trust Distributors.

                    Your order has been confirmed.

                    Please keep this receipt for
                    your reference.

                </div>


                <footer class="footer">

                    <p>
                        ISM ROYAL TRUST DISTRIBUTORS (PVT) LTD
                    </p>

                    <p>
                        Quality Products · Reliable Distribution · Trusted Service
                    </p>

                </footer>

            </main>


            <div class="actions">

                <button
                    type="button"
                    class="close-btn"
                    onclick="window.close()"
                >
                    Close
                </button>

                <button
                    type="button"
                    class="pdf-btn"
                    onclick="window.print()"
                >
                    Print / Save as PDF
                </button>

            </div>

        </body>

        </html>
    `;


    receiptWindow.document.open();

    receiptWindow.document.write(
        receiptHTML
    );

    receiptWindow.document.close();

    receiptWindow.focus();
}


/* Make available globally */

window.generateCustomerReceipt =
    generateCustomerReceipt;