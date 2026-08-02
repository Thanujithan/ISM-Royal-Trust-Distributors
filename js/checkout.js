document.addEventListener("DOMContentLoaded", () => {
    const CART_STORAGE_KEYS = ["ismCart", "cart"];

    const checkoutForm =
        document.getElementById("checkoutForm");

    const checkoutItems =
        document.getElementById("checkoutItems");

    const checkoutSubtotal =
        document.getElementById("checkoutSubtotal");

    const checkoutDeliveryFee =
        document.getElementById("checkoutDeliveryFee");

    const checkoutTotal =
        document.getElementById("checkoutTotal");

    const checkoutMessage =
        document.getElementById("checkoutMessage");

    const placeOrderButton =
        document.getElementById("placeOrderButton");

    const bankDetails =
        document.getElementById("bankDetails");

    const successModal =
        document.getElementById("successModal");

    const successOrderNumber =
        document.getElementById("successOrderNumber");

    const customerName =
        document.getElementById("customerName");

    const customerEmail =
        document.getElementById("customerEmail");

    const customerPhone =
        document.getElementById("customerPhone");

    const streetAddress =
        document.getElementById("streetAddress");

    const city =
        document.getElementById("city");

    const district =
        document.getElementById("district");

    const postalCode =
        document.getElementById("postalCode");

    const deliveryNote =
        document.getElementById("deliveryNote");

    const DELIVERY_FEE = 0;

    let cart = [];

    initializeCheckout();

    function initializeCheckout() {
        cart = getCart();

        if (!cart.length) {
            window.location.href = "cart.html";
            return;
        }

        loadStoredUser();
        renderCheckoutItems();
        updateSummary();
        setupPaymentMethods();
    }

    function getCart() {
        for (const key of CART_STORAGE_KEYS) {
            try {
                const storedCart =
                    JSON.parse(localStorage.getItem(key));

                if (
                    Array.isArray(storedCart) &&
                    storedCart.length
                ) {
                    return storedCart.map((item) => ({
                        _id:
                            item._id ||
                            item.id ||
                            item.productId,

                        name:
                            item.name ||
                            item.productName ||
                            "Product",

                        price:
                            Number(item.price) || 0,

                        quantity:
                            Math.max(
                                1,
                                Number(item.quantity) || 1
                            ),

                        image:
                            item.image ||
                            item.imageUrl ||
                            "images/logo.png",

                        category:
                            item.category ||
                            "General",

                        stock:
                            Number(item.stock) || 0
                    }));
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

    function loadStoredUser() {
        const storedUser =
            localStorage.getItem("user") ||
            sessionStorage.getItem("user");

        if (!storedUser) {
            return;
        }

        try {
            const user = JSON.parse(storedUser);

            customerName.value =
                user.name || "";

            customerEmail.value =
                user.email || "";

            customerPhone.value =
                user.phone || "";
        } catch (error) {
            console.error(
                "Unable to load stored user:",
                error
            );
        }
    }

    function renderCheckoutItems() {
        checkoutItems.innerHTML = cart
            .map((item) => {
                const itemTotal =
                    item.price * item.quantity;

                return `
                    <article class="checkout-item">

                        <div class="checkout-item-image">
                            <img
                                src="${escapeHTML(item.image)}"
                                alt="${escapeHTML(item.name)}"
                                onerror="
                                    this.onerror=null;
                                    this.src='images/logo.png';
                                "
                            >
                        </div>

                        <div class="checkout-item-details">
                            <h3>
                                ${escapeHTML(item.name)}
                            </h3>

                            <p>
                                ${escapeHTML(item.category)}
                                · Qty ${item.quantity}
                            </p>
                        </div>

                        <strong class="checkout-item-price">
                            ${formatPrice(itemTotal)}
                        </strong>

                    </article>
                `;
            })
            .join("");
    }

    function updateSummary() {
        const subtotal = cart.reduce(
            (total, item) =>
                total +
                item.price * item.quantity,
            0
        );

        const total =
            subtotal + DELIVERY_FEE;

        checkoutSubtotal.textContent =
            formatPrice(subtotal);

        checkoutDeliveryFee.textContent =
            DELIVERY_FEE === 0
                ? "Free"
                : formatPrice(DELIVERY_FEE);

        checkoutTotal.textContent =
            formatPrice(total);
    }

    function setupPaymentMethods() {
        document
            .querySelectorAll(
                'input[name="paymentMethod"]'
            )
            .forEach((radio) => {
                radio.addEventListener("change", () => {
                    bankDetails.classList.toggle(
                        "show",
                        radio.value === "bank_transfer" &&
                        radio.checked
                    );
                });
            });
    }

    checkoutForm.addEventListener(
        "submit",
        async (event) => {
            event.preventDefault();

            clearErrors();

            const formData =
                collectCheckoutData();

            const valid =
                validateCheckoutData(formData);

            if (!valid) {
                showMessage(
                    "Please correct the highlighted fields.",
                    "error"
                );

                return;
            }

            const orderData =
                createOrderPayload(formData);

            placeOrderButton.disabled = true;

            placeOrderButton.innerHTML = `
                <i class="fas fa-spinner fa-spin"></i>
                Placing Order...
            `;

            try {
                console.log(
                    "Prepared order data:",
                    orderData
                );

                /*
                Backend API next step:

                const response = await fetch(
                    "http://localhost:5000/api/orders",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${getToken()}`
                        },
                        body: JSON.stringify(orderData)
                    }
                );
                */

                await new Promise((resolve) => {
                    setTimeout(resolve, 900);
                });

                const temporaryOrderNumber =
                    generateTemporaryOrderNumber();

                successOrderNumber.textContent =
                    temporaryOrderNumber;

                clearCartStorage();

                successModal.classList.add("show");

            } catch (error) {
                console.error(
                    "Checkout error:",
                    error
                );

                showMessage(
                    error.message ||
                    "Unable to place order.",
                    "error"
                );

            } finally {
                placeOrderButton.disabled = false;

                placeOrderButton.innerHTML = `
                    <span>Place Order</span>
                    <i class="fas fa-check"></i>
                `;
            }
        }
    );

    function collectCheckoutData() {
        const paymentMethod =
            document.querySelector(
                'input[name="paymentMethod"]:checked'
            )?.value || "";

        return {
            customerName:
                customerName.value.trim(),

            customerEmail:
                customerEmail.value
                    .trim()
                    .toLowerCase(),

            customerPhone:
                customerPhone.value.trim(),

            streetAddress:
                streetAddress.value.trim(),

            city:
                city.value.trim(),

            district:
                district.value,

            postalCode:
                postalCode.value.trim(),

            deliveryNote:
                deliveryNote.value.trim(),

            paymentMethod
        };
    }

    function validateCheckoutData(data) {
        let valid = true;

        if (!data.customerName) {
            showError(
                "customerName",
                "Full name is required."
            );

            valid = false;
        }

        if (!data.customerEmail) {
            showError(
                "customerEmail",
                "Email address is required."
            );

            valid = false;

        } else if (
            !validateEmail(data.customerEmail)
        ) {
            showError(
                "customerEmail",
                "Enter a valid email address."
            );

            valid = false;
        }

        if (!data.customerPhone) {
            showError(
                "customerPhone",
                "Phone number is required."
            );

            valid = false;

        } else if (
            !/^[0-9+\s-]{9,15}$/.test(
                data.customerPhone
            )
        ) {
            showError(
                "customerPhone",
                "Enter a valid phone number."
            );

            valid = false;
        }

        if (!data.streetAddress) {
            showError(
                "streetAddress",
                "Street address is required."
            );

            valid = false;
        }

        if (!data.city) {
            showError(
                "city",
                "City is required."
            );

            valid = false;
        }

        if (!data.district) {
            showError(
                "district",
                "District is required."
            );

            valid = false;
        }

        if (!data.postalCode) {
            showError(
                "postalCode",
                "Postal code is required."
            );

            valid = false;
        }

        if (!data.paymentMethod) {
            showMessage(
                "Please select a payment method.",
                "error"
            );

            valid = false;
        }

        return valid;
    }

    function createOrderPayload(formData) {
        const subtotal = cart.reduce(
            (total, item) =>
                total +
                item.price * item.quantity,
            0
        );

        return {
            customer: {
                name: formData.customerName,
                email: formData.customerEmail,
                phone: formData.customerPhone
            },

            deliveryAddress: {
                streetAddress:
                    formData.streetAddress,

                city:
                    formData.city,

                district:
                    formData.district,

                postalCode:
                    formData.postalCode
            },

            deliveryNote:
                formData.deliveryNote,

            paymentMethod:
                formData.paymentMethod,

            items: cart.map((item) => ({
                product:
                    item._id,

                name:
                    item.name,

                price:
                    item.price,

                quantity:
                    item.quantity,

                image:
                    item.image
            })),

            subtotal,
            deliveryFee:
                DELIVERY_FEE,

            totalAmount:
                subtotal + DELIVERY_FEE
        };
    }

    function showError(id, text) {
        const input =
            document.getElementById(id);

        const error =
            document.getElementById(
                `${id}Error`
            );

        if (input) {
            const inputBox =
                input.closest(".input-box");

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

        checkoutMessage.className =
            "checkout-message";

        checkoutMessage.textContent = "";
    }

    function showMessage(text, type) {
        checkoutMessage.textContent = text;

        checkoutMessage.className =
            `checkout-message ${type} show`;

        checkoutMessage.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }

    function clearCartStorage() {
        CART_STORAGE_KEYS.forEach((key) => {
            localStorage.removeItem(key);
        });
    }

    function generateTemporaryOrderNumber() {
        const timestamp =
            Date.now()
                .toString()
                .slice(-8);

        return `ISM-${timestamp}`;
    }

    function getToken() {
        return (
            localStorage.getItem("token") ||
            sessionStorage.getItem("token")
        );
    }

    function formatPrice(amount) {
        return `LKR ${Number(amount).toLocaleString(
            "en-LK",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        )}`;
    }

    function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            email
        );
    }

    function escapeHTML(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }
});