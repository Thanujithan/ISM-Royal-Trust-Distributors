document.addEventListener(
    "DOMContentLoaded",
    () => {

        const CART_STORAGE_KEYS = [
            "ismCart",
            "cart"
        ];

        const DEFAULT_WHOLESALE_MINIMUM =
            20;

        const DELIVERY_FEE =
            0;


        const checkoutForm =
            document.getElementById(
                "checkoutForm"
            );

        const checkoutItems =
            document.getElementById(
                "checkoutItems"
            );

        const checkoutSubtotal =
            document.getElementById(
                "checkoutSubtotal"
            );

        const checkoutDeliveryFee =
            document.getElementById(
                "checkoutDeliveryFee"
            );

        const checkoutTotal =
            document.getElementById(
                "checkoutTotal"
            );

        const checkoutMessage =
            document.getElementById(
                "checkoutMessage"
            );

        const placeOrderButton =
            document.getElementById(
                "placeOrderButton"
            );

        const bankDetails =
            document.getElementById(
                "bankDetails"
            );

        const successModal =
            document.getElementById(
                "successModal"
            );

        const successOrderNumber =
            document.getElementById(
                "successOrderNumber"
            );

        const customerName =
            document.getElementById(
                "customerName"
            );

        const customerEmail =
            document.getElementById(
                "customerEmail"
            );

        const customerPhone =
            document.getElementById(
                "customerPhone"
            );

        const streetAddress =
            document.getElementById(
                "streetAddress"
            );

        const city =
            document.getElementById(
                "city"
            );

        const district =
            document.getElementById(
                "district"
            );

        const postalCode =
            document.getElementById(
                "postalCode"
            );

        const deliveryNote =
            document.getElementById(
                "deliveryNote"
            );


        let cart = [];


        initializeCheckout();


        /* ========================================
           INITIALIZE
        ======================================== */

        function initializeCheckout() {

            cart =
                getCart();


            if (!cart.length) {

                window.location.href =
                    "cart.html";

                return;
            }


            loadStoredUser();

            renderCheckoutItems();

            updateSummary();

            setupPaymentMethods();
        }


        /* ========================================
           GET CART
        ======================================== */

        function getCart() {

            for (
                const key of CART_STORAGE_KEYS
            ) {

                try {

                    const storedValue =
                        localStorage.getItem(
                            key
                        );


                    if (!storedValue) {
                        continue;
                    }


                    const storedCart =
                        JSON.parse(
                            storedValue
                        );


                    if (
                        Array.isArray(
                            storedCart
                        ) &&
                        storedCart.length
                    ) {

                        return storedCart.map(
                            normalizeCartItem
                        );
                    }

                } catch (error) {

                    console.error(
                        `Unable to read cart key ${key}:`,
                        error
                    );
                }
            }


            return [];
        }


        /* ========================================
           NORMALIZE CART ITEM
        ======================================== */

        function normalizeCartItem(
            item
        ) {

            const retailPrice =
                getValidNumber(
                    item.retailPrice ??
                    item.price ??
                    0,
                    0
                );


            const wholesalePrice =
                getValidNumber(
                    item.wholesalePrice ??
                    retailPrice,
                    retailPrice
                );


            const wholesaleMinimumQuantity =
                getValidInteger(
                    item.wholesaleMinimumQuantity ??
                    DEFAULT_WHOLESALE_MINIMUM,
                    DEFAULT_WHOLESALE_MINIMUM
                );


            const quantity =
                Math.max(
                    1,
                    getValidInteger(
                        item.quantity,
                        1
                    )
                );


            const isWholesale =
                quantity >=
                wholesaleMinimumQuantity;


            const appliedPrice =
                isWholesale
                    ? wholesalePrice
                    : retailPrice;


            return {

                ...item,


                _id:
                    item._id ||
                    item.id ||
                    item.productId,


                id:
                    item.id ||
                    item._id ||
                    item.productId,


                name:
                    item.name ||
                    item.productName ||
                    "Product",


                /* NET CONTENT */

                netContent:
                    item.netContent
                        ? String(
                            item.netContent
                        ).trim()
                        : "",


                category:
                    item.category ||
                    "General",


                image:
                    getProductImage(
                        item.image ||
                        item.imageUrl ||
                        ""
                    ),


                stock:
                    getValidInteger(
                        item.stock,
                        0
                    ),


                retailPrice,


                wholesalePrice,


                wholesaleMinimumQuantity,


                quantity,


                price:
                    appliedPrice,


                appliedPrice,


                priceType:
                    isWholesale
                        ? "wholesale"
                        : "retail"
            };
        }


        /* ========================================
           LOAD STORED USER
        ======================================== */

        function loadStoredUser() {

            const storedUser =
                localStorage.getItem(
                    "user"
                ) ||
                sessionStorage.getItem(
                    "user"
                );


            if (!storedUser) {
                return;
            }


            try {

                const user =
                    JSON.parse(
                        storedUser
                    );


                if (customerName) {
                    customerName.value =
                        user.name || "";
                }


                if (customerEmail) {
                    customerEmail.value =
                        user.email || "";
                }


                if (customerPhone) {
                    customerPhone.value =
                        user.phone || "";
                }

            } catch (error) {

                console.error(
                    "Unable to load stored user:",
                    error
                );
            }
        }
                /* ========================================
           RENDER CHECKOUT ITEMS
        ======================================== */

        function renderCheckoutItems() {

            if (!checkoutItems) {
                return;
            }


            checkoutItems.innerHTML =
                cart
                    .map(
                        (item) => {

                            const itemTotal =
                                Number(
                                    item.price
                                ) *
                                Number(
                                    item.quantity
                                );


                            const isWholesale =
                                item.priceType ===
                                "wholesale";


                            return `
                                <article class="checkout-item">


                                    <!-- PRODUCT IMAGE -->

                                    <div class="checkout-item-image">

                                        <img
                                            src="${escapeHTML(
                                                item.image
                                            )}"
                                            alt="${escapeHTML(
                                                item.name
                                            )}"
                                            onerror="
                                                this.onerror=null;
                                                this.src='images/product-placeholder.png';
                                            "
                                        >

                                    </div>


                                    <!-- PRODUCT DETAILS -->

                                    <div class="checkout-item-details">


                                        <!-- NAME + NET CONTENT -->

                                        <div class="checkout-product-title-row">

                                            <h3>
                                                ${escapeHTML(
                                                    item.name
                                                )}
                                            </h3>


                                            ${
                                                item.netContent

                                                    ? `
                                                        <span
                                                            class="checkout-net-content"
                                                        >
                                                            ${escapeHTML(
                                                                item.netContent
                                                            )}
                                                        </span>
                                                      `

                                                    : ""
                                            }

                                        </div>


                                        <!-- CATEGORY + QUANTITY -->

                                        <p class="checkout-item-meta">

                                            ${escapeHTML(
                                                formatCategory(
                                                    item.category
                                                )
                                            )}

                                            · Qty ${item.quantity}

                                        </p>


                                        <!-- RETAIL / WHOLESALE INFORMATION -->

                                        <div class="checkout-price-information">


                                            <small>

                                                Retail:

                                                ${formatPrice(
                                                    item.retailPrice
                                                )}

                                            </small>


                                            <small>

                                                Wholesale:

                                                ${formatPrice(
                                                    item.wholesalePrice
                                                )}

                                            </small>


                                            <small>

                                                Wholesale from

                                                ${item.wholesaleMinimumQuantity}

                                                pieces

                                            </small>

                                        </div>


                                        <!-- PRICE TYPE BADGE -->

                                        <span
                                            class="checkout-price-badge ${
                                                isWholesale
                                                    ? "wholesale"
                                                    : "retail"
                                            }"
                                        >

                                            <i
                                                class="fas ${
                                                    isWholesale
                                                        ? "fa-boxes-stacked"
                                                        : "fa-tag"
                                                }"
                                            ></i>


                                            ${
                                                isWholesale

                                                    ? "Wholesale price applied"

                                                    : "Retail price applied"
                                            }

                                        </span>


                                        <!-- UNIT PRICE -->

                                        <p class="checkout-unit-price">

                                            Unit Price:

                                            <strong>
                                                ${formatPrice(
                                                    item.price
                                                )}
                                            </strong>

                                        </p>

                                    </div>


                                    <!-- ITEM TOTAL -->

                                    <strong class="checkout-item-price">

                                        ${formatPrice(
                                            itemTotal
                                        )}

                                    </strong>

                                </article>
                            `;
                        }
                    )
                    .join("");
        }


        /* ========================================
           CHECKOUT SUMMARY
        ======================================== */

        function updateSummary() {

            const subtotal =
                cart.reduce(
                    (
                        total,
                        item
                    ) => {

                        return (
                            total +
                            Number(
                                item.price
                            ) *
                            Number(
                                item.quantity
                            )
                        );
                    },
                    0
                );


            const total =
                subtotal +
                DELIVERY_FEE;


            if (
                checkoutSubtotal
            ) {

                checkoutSubtotal.textContent =
                    formatPrice(
                        subtotal
                    );
            }


            if (
                checkoutDeliveryFee
            ) {

                checkoutDeliveryFee.textContent =
                    DELIVERY_FEE === 0

                        ? "Free"

                        : formatPrice(
                            DELIVERY_FEE
                        );
            }


            if (
                checkoutTotal
            ) {

                checkoutTotal.textContent =
                    formatPrice(
                        total
                    );
            }
        }


        /* ========================================
           PAYMENT METHODS
        ======================================== */

        function setupPaymentMethods() {

            document
                .querySelectorAll(
                    'input[name="paymentMethod"]'
                )
                .forEach(
                    (radio) => {

                        radio.addEventListener(
                            "change",
                            updateBankDetailsVisibility
                        );
                    }
                );


            updateBankDetailsVisibility();
        }


        function updateBankDetailsVisibility() {

            const selectedMethod =
                document.querySelector(
                    'input[name="paymentMethod"]:checked'
                )?.value;


            bankDetails?.classList.toggle(
                "show",
                selectedMethod ===
                    "bank_transfer"
            );
        }


        /* ========================================
           SUBMIT ORDER
        ======================================== */

        checkoutForm?.addEventListener(
            "submit",
            async (
                event
            ) => {

                event.preventDefault();


                clearErrors();


                cart =
                    getCart();


                if (
                    !cart.length
                ) {

                    showMessage(
                        "Your shopping cart is empty.",
                        "error"
                    );

                    return;
                }


                const formData =
                    collectCheckoutData();


                const valid =
                    validateCheckoutData(
                        formData
                    );


                if (!valid) {

                    showMessage(
                        "Please correct the highlighted fields.",
                        "error"
                    );

                    return;
                }


                const token =
                    getToken();


                if (!token) {

                    showMessage(
                        "Please login before placing your order.",
                        "error"
                    );


                    localStorage.setItem(
                        "redirectAfterLogin",
                        "checkout.html"
                    );


                    window.setTimeout(
                        () => {

                            window.location.href =
                                "login.html";

                        },
                        1200
                    );


                    return;
                }


                const orderData =
                    createOrderPayload(
                        formData
                    );


                setPlaceOrderLoading(
                    true
                );


                try {

                    const response =
                        await fetch(
                            "http://localhost:5000/api/orders",
                            {
                                method:
                                    "POST",


                                headers: {

                                    "Content-Type":
                                        "application/json",


                                    Authorization:
                                        `Bearer ${token}`
                                },


                                body:
                                    JSON.stringify(
                                        orderData
                                    )
                            }
                        );


                    const result =
                        await parseResponse(
                            response
                        );


                    if (
                        response.status ===
                            401 ||
                        response.status ===
                            403
                    ) {

                        throw new Error(
                            "Your login session has expired. Please login again."
                        );
                    }


                    if (
                        !response.ok
                    ) {

                        throw new Error(
                            result.message ||
                            "Unable to place order."
                        );
                    }


                    const order =
                        result.data;


                    if (
                        successOrderNumber
                    ) {

                        successOrderNumber.textContent =
                            order.orderNumber ||
                            order._id ||
                            generateTemporaryOrderNumber();
                    }


                    clearCartStorage();


                    successModal
                        ?.classList.add(
                            "show"
                        );


                } catch (error) {

                    console.error(
                        "Checkout error:",
                        error
                    );


                    showMessage(
                        error.message ||
                        "Unable to place order. Please try again.",
                        "error"
                    );


                } finally {

                    setPlaceOrderLoading(
                        false
                    );
                }
            }
        );
                /* ========================================
           COLLECT CHECKOUT DATA
        ======================================== */

        function collectCheckoutData() {

            const paymentMethod =
                document.querySelector(
                    'input[name="paymentMethod"]:checked'
                )?.value || "";


            return {

                customerName:
                    customerName?.value
                        .trim() || "",


                customerEmail:
                    customerEmail?.value
                        .trim()
                        .toLowerCase() || "",


                customerPhone:
                    customerPhone?.value
                        .trim() || "",


                streetAddress:
                    streetAddress?.value
                        .trim() || "",


                city:
                    city?.value
                        .trim() || "",


                district:
                    district?.value || "",


                postalCode:
                    postalCode?.value
                        .trim() || "",


                deliveryNote:
                    deliveryNote?.value
                        .trim() || "",


                paymentMethod
            };
        }


        /* ========================================
           VALIDATION
        ======================================== */

        function validateCheckoutData(
            data
        ) {

            let valid =
                true;


            if (
                !data.customerName
            ) {

                showError(
                    "customerName",
                    "Full name is required."
                );

                valid =
                    false;
            }


            if (
                !data.customerEmail
            ) {

                showError(
                    "customerEmail",
                    "Email address is required."
                );

                valid =
                    false;


            } else if (
                !validateEmail(
                    data.customerEmail
                )
            ) {

                showError(
                    "customerEmail",
                    "Enter a valid email address."
                );

                valid =
                    false;
            }


            if (
                !data.customerPhone
            ) {

                showError(
                    "customerPhone",
                    "Phone number is required."
                );

                valid =
                    false;


            } else if (
                !/^[0-9+\s-]{9,15}$/.test(
                    data.customerPhone
                )
            ) {

                showError(
                    "customerPhone",
                    "Enter a valid phone number."
                );

                valid =
                    false;
            }


            if (
                !data.streetAddress
            ) {

                showError(
                    "streetAddress",
                    "Street address is required."
                );

                valid =
                    false;
            }


            if (
                !data.city
            ) {

                showError(
                    "city",
                    "City is required."
                );

                valid =
                    false;
            }


            if (
                !data.district
            ) {

                showError(
                    "district",
                    "District is required."
                );

                valid =
                    false;
            }


            if (
                !data.postalCode
            ) {

                showError(
                    "postalCode",
                    "Postal code is required."
                );

                valid =
                    false;
            }


            if (
                !data.paymentMethod
            ) {

                showMessage(
                    "Please select a payment method.",
                    "error"
                );

                valid =
                    false;
            }


            return valid;
        }


        /* ========================================
           ORDER PAYLOAD

           Frontend final price அனுப்பாது.

           Product ID + quantity மட்டும்
           backend-க்கு அனுப்பும்.

           Backend database product-லிருந்து:
           - Net Content
           - Retail Price
           - Wholesale Price
           - Applied Price
           எல்லாம் snapshot save செய்யும்.
        ======================================== */

        function createOrderPayload(
            formData
        ) {

            return {

                customer: {

                    name:
                        formData
                            .customerName,


                    email:
                        formData
                            .customerEmail,


                    phone:
                        formData
                            .customerPhone
                },


                deliveryAddress: {

                    streetAddress:
                        formData
                            .streetAddress,


                    city:
                        formData
                            .city,


                    district:
                        formData
                            .district,


                    postalCode:
                        formData
                            .postalCode
                },


                deliveryNote:
                    formData.deliveryNote ||
                    "",


                paymentMethod:
                    formData
                        .paymentMethod,


                items:
                    cart.map(
                        (item) => ({

                            product:
                                item._id ||
                                item.id ||
                                item.productId,


                            quantity:
                                Number(
                                    item.quantity
                                )
                        })
                    )
            };
        }


        /* ========================================
           ERROR HELPER
        ======================================== */

        function showError(
            id,
            text
        ) {

            const input =
                document.getElementById(
                    id
                );


            const error =
                document.getElementById(
                    `${id}Error`
                );


            const inputBox =
                input?.closest(
                    ".input-box"
                );


            inputBox?.classList.add(
                "error"
            );


            if (error) {

                error.textContent =
                    text;
            }
        }


        /* ========================================
           CLEAR ERRORS
        ======================================== */

        function clearErrors() {

            document
                .querySelectorAll(
                    ".input-box"
                )
                .forEach(
                    (box) => {

                        box.classList.remove(
                            "error"
                        );
                    }
                );


            document
                .querySelectorAll(
                    ".error-message"
                )
                .forEach(
                    (error) => {

                        error.textContent =
                            "";
                    }
                );


            if (
                checkoutMessage
            ) {

                checkoutMessage.className =
                    "checkout-message";


                checkoutMessage.textContent =
                    "";
            }
        }


        /* ========================================
           SHOW MESSAGE
        ======================================== */

        function showMessage(
            text,
            type
        ) {

            if (
                !checkoutMessage
            ) {

                console.log(
                    `${type}: ${text}`
                );

                return;
            }


            checkoutMessage.textContent =
                text;


            checkoutMessage.className =
                `checkout-message ${type} show`;


            checkoutMessage.scrollIntoView({
                behavior:
                    "smooth",

                block:
                    "center"
            });
        }


        /* ========================================
           PLACE ORDER BUTTON LOADING
        ======================================== */

        function setPlaceOrderLoading(
            loading
        ) {

            if (
                !placeOrderButton
            ) {
                return;
            }


            placeOrderButton.disabled =
                loading;


            placeOrderButton.innerHTML =
                loading

                    ? `
                        <i class="fas fa-spinner fa-spin"></i>
                        Placing Order...
                      `

                    : `
                        <span>
                            Place Order
                        </span>

                        <i class="fas fa-check"></i>
                      `;
        }


        /* ========================================
           CLEAR CART STORAGE
        ======================================== */

        function clearCartStorage() {

            CART_STORAGE_KEYS.forEach(
                (key) => {

                    localStorage.removeItem(
                        key
                    );
                }
            );
        }


        /* ========================================
           GET TOKEN
        ======================================== */

        function getToken() {

            return (

                localStorage.getItem(
                    "token"
                ) ||

                sessionStorage.getItem(
                    "token"
                ) ||

                localStorage.getItem(
                    "adminToken"
                ) ||

                sessionStorage.getItem(
                    "adminToken"
                )
            );
        }
                /* ========================================
           PRODUCT IMAGE
        ======================================== */

        function getProductImage(
            image
        ) {

            if (!image) {

                return (
                    "images/" +
                    "product-placeholder.png"
                );
            }


            if (
                image.startsWith(
                    "http://"
                ) ||
                image.startsWith(
                    "https://"
                ) ||
                image.startsWith(
                    "data:"
                ) ||
                image.startsWith(
                    "images/"
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


            return image;
        }


        /* ========================================
           PARSE API RESPONSE
        ======================================== */

        async function parseResponse(
            response
        ) {

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


        /* ========================================
           TEMP ORDER NUMBER
        ======================================== */

        function generateTemporaryOrderNumber() {

            const timestamp =
                Date.now()
                    .toString()
                    .slice(
                        -8
                    );


            return (
                `ISM-${timestamp}`
            );
        }


        /* ========================================
           FORMAT PRICE
        ======================================== */

        function formatPrice(
            amount
        ) {

            return `LKR ${Number(
                amount ||
                0
            ).toLocaleString(
                "en-LK",
                {

                    minimumFractionDigits:
                        2,


                    maximumFractionDigits:
                        2
                }
            )}`;
        }


        /* ========================================
           FORMAT CATEGORY
        ======================================== */

        function formatCategory(
            category
        ) {

            const labels = {

                juice:
                    "Juice",


                sweets:
                    "Sweets",


                bites:
                    "Bites",


                "bottled-water":
                    "Bottle Water",


                rice:
                    "Rice"
            };


            return (

                labels[
                    String(
                        category ||
                        ""
                    )
                        .trim()
                        .toLowerCase()
                ] ||

                category ||

                "General"
            );
        }


        /* ========================================
           VALID NUMBER
        ======================================== */

        function getValidNumber(
            value,
            fallback
        ) {

            const number =
                Number(
                    value
                );


            return Number.isNaN(
                number
            )
                ? fallback
                : number;
        }


        /* ========================================
           VALID INTEGER
        ======================================== */

        function getValidInteger(
            value,
            fallback
        ) {

            const number =
                Number(
                    value
                );


            return Number.isInteger(
                number
            )
                ? number
                : fallback;
        }


        /* ========================================
           VALIDATE EMAIL
        ======================================== */

        function validateEmail(
            email
        ) {

            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                email
            );
        }


        /* ========================================
           ESCAPE HTML
        ======================================== */

        function escapeHTML(
            value
        ) {

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


    }
);