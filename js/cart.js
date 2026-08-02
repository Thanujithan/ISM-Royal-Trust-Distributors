document.addEventListener("DOMContentLoaded", () => {
    const CART_STORAGE_KEY = "ismCart";
    const DELIVERY_FEE = 0;
    const DISCOUNT = 0;

    const cartItemsContainer =
        document.getElementById("cartItemsContainer");

    const cartItemsText =
        document.getElementById("cartItemsText");

    const cartSubtotal =
        document.getElementById("cartSubtotal");

    const deliveryFeeElement =
        document.getElementById("deliveryFee");

    const discountAmount =
        document.getElementById("discountAmount");

    const cartTotal =
        document.getElementById("cartTotal");

    const cartCount =
        document.getElementById("cartCount");

    const clearCartButton =
        document.getElementById("clearCartButton");

    const checkoutButton =
        document.getElementById("checkoutButton");

    const clearCartModal =
        document.getElementById("clearCartModal");

    const cancelClearCart =
        document.getElementById("cancelClearCart");

    const confirmClearCart =
        document.getElementById("confirmClearCart");

    const emptyCartTemplate =
        document.getElementById("emptyCartTemplate");

    const cartNotification =
        document.getElementById("cartNotification");

    const notificationIcon =
        document.getElementById("notificationIcon");

    const notificationText =
        document.getElementById("notificationText");


    /* ================================
       GET CART FROM LOCAL STORAGE
    ================================ */

    function getCart() {
        try {
            const savedCart =
                localStorage.getItem(CART_STORAGE_KEY);

            if (!savedCart) {
                return [];
            }

            const parsedCart = JSON.parse(savedCart);

            if (!Array.isArray(parsedCart)) {
                return [];
            }

            return parsedCart.map((item) => ({
                ...item,

                id:
                    item.id ||
                    item._id ||
                    item.productId,

                name:
                    item.name ||
                    item.productName ||
                    "Product",

                price: Number(item.price) || 0,

                quantity:
                    Math.max(
                        1,
                        Number(item.quantity) || 1
                    ),

                image:
                    item.image ||
                    item.imageUrl ||
                    "images/product-placeholder.png",

                category:
                    item.category ||
                    "General",

                stock:
                    Number(item.stock) || 100
            }));
        } catch (error) {
            console.error(
                "Error reading cart:",
                error
            );

            return [];
        }
    }


    /* ================================
       SAVE CART
    ================================ */

    function saveCart(cart) {
        localStorage.setItem(
            CART_STORAGE_KEY,
            JSON.stringify(cart)
        );

        updateNavbarCartCount(cart);
    }


    /* ================================
       FORMAT PRICE
    ================================ */

    function formatPrice(amount) {
        return `LKR ${Number(amount).toLocaleString(
            "en-US",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        )}`;
    }


    /* ================================
       ESCAPE HTML
    ================================ */

    function escapeHTML(value) {
        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }


    /* ================================
       PRODUCT IMAGE PATH
    ================================ */

    function getProductImage(image) {
        if (!image) {
            return "images/product-placeholder.png";
        }

        if (
            image.startsWith("http://") ||
            image.startsWith("https://") ||
            image.startsWith("data:") ||
            image.startsWith("images/")
        ) {
            return image;
        }

        if (image.startsWith("/uploads/")) {
            return `http://localhost:5000${image}`;
        }

        if (image.startsWith("uploads/")) {
            return `http://localhost:5000/${image}`;
        }

        return image;
    }


    /* ================================
       RENDER CART
    ================================ */

    function renderCart() {
        const cart = getCart();

        updateNavbarCartCount(cart);
        updateCartSummary(cart);

        if (cart.length === 0) {
            renderEmptyCart();
            return;
        }

        clearCartButton.disabled = false;
        checkoutButton.disabled = false;

        cartItemsContainer.innerHTML =
            cart.map((item, index) => {
                const itemSubtotal =
                    item.price * item.quantity;

                const productId =
                    item.id || index;

                return `
                    <article class="cart-item">

                        <div class="cart-item-image">
                            <img
                                src="${escapeHTML(
                                    getProductImage(item.image)
                                )}"
                                alt="${escapeHTML(item.name)}"
                                onerror="
                                    this.onerror=null;
                                    this.src='images/product-placeholder.png';
                                "
                            >
                        </div>

                        <div class="cart-item-details">

                            <h3>
                                ${escapeHTML(item.name)}
                            </h3>

                            <p class="cart-item-meta">
                                Category:
                                ${escapeHTML(item.category)}
                            </p>

                            <p class="cart-item-price">
                                ${formatPrice(item.price)}
                            </p>

                        </div>

                        <div class="cart-item-actions">

                            <div class="quantity-control">

                                <button
                                    type="button"
                                    class="quantity-button decrease-button"
                                    data-id="${escapeHTML(productId)}"
                                    aria-label="Decrease quantity"
                                >
                                    <i class="fas fa-minus"></i>
                                </button>

                                <span class="quantity-value">
                                    ${item.quantity}
                                </span>

                                <button
                                    type="button"
                                    class="quantity-button increase-button"
                                    data-id="${escapeHTML(productId)}"
                                    aria-label="Increase quantity"
                                >
                                    <i class="fas fa-plus"></i>
                                </button>

                            </div>

                            <p class="item-subtotal">
                                ${formatPrice(itemSubtotal)}
                            </p>

                            <button
                                type="button"
                                class="remove-item-button"
                                data-id="${escapeHTML(productId)}"
                            >
                                <i class="fas fa-trash"></i>
                                Remove
                            </button>

                        </div>

                    </article>
                `;
            }).join("");

        addCartEventListeners();
    }


    /* ================================
       EMPTY CART
    ================================ */

    function renderEmptyCart() {
        if (emptyCartTemplate) {
            cartItemsContainer.innerHTML =
                emptyCartTemplate.innerHTML;
        } else {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart">
                    <div class="empty-cart-icon">
                        <i class="fas fa-cart-shopping"></i>
                    </div>

                    <h2>Your cart is empty</h2>

                    <p>
                        You have not added any products yet.
                    </p>

                    <a
                        href="products.html"
                        class="shop-now-button"
                    >
                        Shop Now
                    </a>
                </div>
            `;
        }

        clearCartButton.disabled = true;
        checkoutButton.disabled = true;
    }


    /* ================================
       UPDATE SUMMARY
    ================================ */

    function updateCartSummary(cart) {
        const totalQuantity =
            cart.reduce(
                (total, item) =>
                    total + Number(item.quantity),
                0
            );

        const subtotal =
            cart.reduce(
                (total, item) =>
                    total +
                    Number(item.price) *
                    Number(item.quantity),
                0
            );

        const deliveryFee =
            cart.length > 0
                ? DELIVERY_FEE
                : 0;

        const discount =
            cart.length > 0
                ? DISCOUNT
                : 0;

        const total =
            Math.max(
                0,
                subtotal +
                deliveryFee -
                discount
            );

        cartItemsText.textContent =
            `${totalQuantity} ${
                totalQuantity === 1
                    ? "item"
                    : "items"
            } in your cart`;

        cartSubtotal.textContent =
            formatPrice(subtotal);

        deliveryFeeElement.textContent =
            deliveryFee === 0
                ? "Free"
                : formatPrice(deliveryFee);

        discountAmount.textContent =
            `- ${formatPrice(discount)}`;

        cartTotal.textContent =
            formatPrice(total);
    }


    /* ================================
       NAVBAR CART COUNT
    ================================ */

    function updateNavbarCartCount(cart) {
        if (!cartCount) {
            return;
        }

        const totalQuantity =
            cart.reduce(
                (total, item) =>
                    total + Number(item.quantity),
                0
            );

        cartCount.textContent = totalQuantity;
    }


    /* ================================
       FIND PRODUCT INDEX
    ================================ */

    function findCartItemIndex(cart, productId) {
        return cart.findIndex((item, index) => {
            const itemId =
                item.id ||
                item._id ||
                item.productId ||
                index;

            return String(itemId) ===
                String(productId);
        });
    }


    /* ================================
       INCREASE QUANTITY
    ================================ */

    function increaseQuantity(productId) {
        const cart = getCart();

        const itemIndex =
            findCartItemIndex(cart, productId);

        if (itemIndex === -1) {
            showNotification(
                "Product not found in cart.",
                "error"
            );

            return;
        }

        const currentQuantity =
            Number(cart[itemIndex].quantity);

        const availableStock =
            Number(cart[itemIndex].stock) || 100;

        if (currentQuantity >= availableStock) {
            showNotification(
                "Maximum available stock reached.",
                "error"
            );

            return;
        }

        cart[itemIndex].quantity =
            currentQuantity + 1;

        saveCart(cart);
        renderCart();

        showNotification(
            "Product quantity updated.",
            "success"
        );
    }


    /* ================================
       DECREASE QUANTITY
    ================================ */

    function decreaseQuantity(productId) {
        const cart = getCart();

        const itemIndex =
            findCartItemIndex(cart, productId);

        if (itemIndex === -1) {
            return;
        }

        const currentQuantity =
            Number(cart[itemIndex].quantity);

        if (currentQuantity <= 1) {
            removeCartItem(productId);
            return;
        }

        cart[itemIndex].quantity =
            currentQuantity - 1;

        saveCart(cart);
        renderCart();

        showNotification(
            "Product quantity updated.",
            "success"
        );
    }


    /* ================================
       REMOVE PRODUCT
    ================================ */

    function removeCartItem(productId) {
        const cart = getCart();

        const updatedCart =
            cart.filter((item, index) => {
                const itemId =
                    item.id ||
                    item._id ||
                    item.productId ||
                    index;

                return String(itemId) !==
                    String(productId);
            });

        saveCart(updatedCart);
        renderCart();

        showNotification(
            "Product removed from cart.",
            "success"
        );
    }


    /* ================================
       CART BUTTON EVENTS
    ================================ */

    function addCartEventListeners() {
        const increaseButtons =
            document.querySelectorAll(
                ".increase-button"
            );

        const decreaseButtons =
            document.querySelectorAll(
                ".decrease-button"
            );

        const removeButtons =
            document.querySelectorAll(
                ".remove-item-button"
            );

        increaseButtons.forEach((button) => {
            button.addEventListener("click", () => {
                increaseQuantity(button.dataset.id);
            });
        });

        decreaseButtons.forEach((button) => {
            button.addEventListener("click", () => {
                decreaseQuantity(button.dataset.id);
            });
        });

        removeButtons.forEach((button) => {
            button.addEventListener("click", () => {
                removeCartItem(button.dataset.id);
            });
        });
    }


    /* ================================
       CLEAR CART MODAL
    ================================ */

    clearCartButton.addEventListener("click", () => {
        const cart = getCart();

        if (cart.length === 0) {
            return;
        }

        clearCartModal.classList.add("show");
    });


    cancelClearCart.addEventListener("click", () => {
        clearCartModal.classList.remove("show");
    });


    confirmClearCart.addEventListener("click", () => {
        localStorage.removeItem(CART_STORAGE_KEY);

        clearCartModal.classList.remove("show");

        renderCart();

        showNotification(
            "Shopping cart cleared.",
            "success"
        );
    });


    clearCartModal.addEventListener(
        "click",
        (event) => {
            if (event.target === clearCartModal) {
                clearCartModal.classList.remove(
                    "show"
                );
            }
        }
    );


    /* ================================
       CHECKOUT BUTTON
    ================================ */

    checkoutButton.addEventListener("click", () => {
        const cart = getCart();

        if (cart.length === 0) {
            showNotification(
                "Your cart is empty.",
                "error"
            );

            return;
        }

        const token =
            localStorage.getItem("token") ||
            sessionStorage.getItem("token");

        if (!token) {
            localStorage.setItem(
                "redirectAfterLogin",
                "checkout.html"
            );

            showNotification(
                "Please login before checkout.",
                "error"
            );

            setTimeout(() => {
                window.location.href = "login.html";
            }, 1200);

            return;
        }

        window.location.href = "checkout.html";
    });


    /* ================================
       NOTIFICATION
    ================================ */

    let notificationTimer;

    function showNotification(message, type) {
        clearTimeout(notificationTimer);

        cartNotification.className =
            `cart-notification ${type} show`;

        notificationText.textContent =
            message;

        notificationIcon.className =
            type === "success"
                ? "fas fa-circle-check"
                : "fas fa-circle-exclamation";

        notificationTimer = setTimeout(() => {
            cartNotification.classList.remove(
                "show"
            );
        }, 2500);
    }


    /* ================================
       KEYBOARD EVENT
    ================================ */

    document.addEventListener(
        "keydown",
        (event) => {
            if (
                event.key === "Escape" &&
                clearCartModal.classList.contains(
                    "show"
                )
            ) {
                clearCartModal.classList.remove(
                    "show"
                );
            }
        }
    );


    /* ================================
       INITIAL RENDER
    ================================ */

    renderCart();
});