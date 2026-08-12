document.addEventListener("DOMContentLoaded", () => {
    const CART_STORAGE_KEY = "ismCart";
    const DEFAULT_WHOLESALE_MINIMUM = 20;
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

    let notificationTimer = null;

    /* ========================================
       GET AND NORMALIZE CART
    ======================================== */

    function getCart() {
        try {
            const savedCart =
                localStorage.getItem(
                    CART_STORAGE_KEY
                );

            if (!savedCart) {
                return [];
            }

            const parsedCart =
                JSON.parse(savedCart);

            if (!Array.isArray(parsedCart)) {
                return [];
            }

            return parsedCart.map(
                normalizeCartItem
            );
        } catch (error) {
            console.error(
                "Error reading cart:",
                error
            );

            return [];
        }
    }

    function normalizeCartItem(item) {
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

        const minimumQuantity =
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

        const normalizedItem = {
            ...item,

            id:
                item.id ||
                item._id ||
                item.productId,

            _id:
                item._id ||
                item.id ||
                item.productId,

            name:
                item.name ||
                item.productName ||
                "Product",

            category:
                item.category ||
                "General",

            brand:
                item.brand ||
                "ISM",

            image:
                item.image ||
                item.imageUrl ||
                "images/product-placeholder.png",

            stock:
                getValidInteger(
                    item.stock,
                    100
                ),

            retailPrice,

            wholesalePrice,

            wholesaleMinimumQuantity:
                minimumQuantity,

            quantity
        };

        return updateCartItemPrice(
            normalizedItem
        );
    }

    /* ========================================
       AUTOMATIC RETAIL / WHOLESALE PRICE
    ======================================== */

    function updateCartItemPrice(item) {
        const quantity =
            Math.max(
                1,
                Number(item.quantity || 1)
            );

        const retailPrice =
            Number(
                item.retailPrice ??
                item.price ??
                0
            );

        const wholesalePrice =
            Number(
                item.wholesalePrice ??
                retailPrice
            );

        const minimumQuantity =
            Number(
                item.wholesaleMinimumQuantity ??
                DEFAULT_WHOLESALE_MINIMUM
            );

        const isWholesale =
            quantity >= minimumQuantity;

        item.quantity =
            quantity;

        item.retailPrice =
            retailPrice;

        item.wholesalePrice =
            wholesalePrice;

        item.wholesaleMinimumQuantity =
            minimumQuantity;

        item.price =
            isWholesale
                ? wholesalePrice
                : retailPrice;

        item.priceType =
            isWholesale
                ? "wholesale"
                : "retail";

        return item;
    }

    /* ========================================
       SAVE CART
    ======================================== */

    function saveCart(cart) {
        const normalizedCart =
            cart.map(
                normalizeCartItem
            );

        localStorage.setItem(
            CART_STORAGE_KEY,
            JSON.stringify(
                normalizedCart
            )
        );

        updateNavbarCartCount(
            normalizedCart
        );
    }

    /* ========================================
       RENDER CART
    ======================================== */

    function renderCart() {
        const cart =
            getCart();

        updateNavbarCartCount(cart);
        updateCartSummary(cart);

        if (!cartItemsContainer) {
            return;
        }

        if (cart.length === 0) {
            renderEmptyCart();
            return;
        }

        if (clearCartButton) {
            clearCartButton.disabled =
                false;
        }

        if (checkoutButton) {
            checkoutButton.disabled =
                false;
        }

        cartItemsContainer.innerHTML =
            cart
                .map(
                    createCartItemHTML
                )
                .join("");

        addCartEventListeners();
    }

    function createCartItemHTML(
        item,
        index
    ) {
        const itemSubtotal =
            Number(item.price) *
            Number(item.quantity);

        const productId =
            item.id ||
            item._id ||
            item.productId ||
            index;

        const isWholesale =
            item.priceType ===
            "wholesale";

        const pricingBadge =
            isWholesale
                ? `
                    <span class="cart-price-badge wholesale">
                        <i class="fas fa-boxes-stacked"></i>
                        Wholesale Price Applied
                    </span>
                  `
                : `
                    <span class="cart-price-badge retail">
                        <i class="fas fa-tag"></i>
                        Retail Price Applied
                    </span>
                  `;

        return `
            <article class="cart-item">

                <div class="cart-item-image">

                    <img
                        src="${escapeHTML(
                            getProductImage(
                                item.image
                            )
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


                <div class="cart-item-details">

                    <h3>
                        ${escapeHTML(
                            item.name
                        )}
                    </h3>

                    <p class="cart-item-meta">
                        Category:
                        ${escapeHTML(
                            formatCategory(
                                item.category
                            )
                        )}
                    </p>


                    <div class="cart-price-details">

                        <p>
                            Retail:
                            <strong>
                                ${formatPrice(
                                    item.retailPrice
                                )}
                            </strong>
                        </p>

                        <p>
                            Wholesale:
                            <strong>
                                ${formatPrice(
                                    item.wholesalePrice
                                )}
                            </strong>
                        </p>

                        <small>
                            Wholesale price from
                            ${item.wholesaleMinimumQuantity}
                            pieces
                        </small>

                    </div>


                    <p class="cart-item-price">

                        Unit Price:

                        <strong>
                            ${formatPrice(
                                item.price
                            )}
                        </strong>

                    </p>

                    ${pricingBadge}

                </div>


                <div class="cart-item-actions">

                    <div class="quantity-control">

                        <button
                            type="button"
                            class="quantity-button decrease-button"
                            data-id="${escapeHTML(
                                productId
                            )}"
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
                            data-id="${escapeHTML(
                                productId
                            )}"
                            aria-label="Increase quantity"
                        >
                            <i class="fas fa-plus"></i>
                        </button>

                    </div>


                    <p class="item-subtotal">

                        ${formatPrice(
                            itemSubtotal
                        )}

                    </p>


                    <button
                        type="button"
                        class="remove-item-button"
                        data-id="${escapeHTML(
                            productId
                        )}"
                    >
                        <i class="fas fa-trash"></i>
                        Remove
                    </button>

                </div>

            </article>
        `;
    }

    /* ========================================
       EMPTY CART
    ======================================== */

    function renderEmptyCart() {
        if (!cartItemsContainer) {
            return;
        }

        if (emptyCartTemplate) {
            cartItemsContainer.innerHTML =
                emptyCartTemplate.innerHTML;
        } else {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart">

                    <div class="empty-cart-icon">
                        <i class="fas fa-cart-shopping"></i>
                    </div>

                    <h2>
                        Your cart is empty
                    </h2>

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

        if (clearCartButton) {
            clearCartButton.disabled =
                true;
        }

        if (checkoutButton) {
            checkoutButton.disabled =
                true;
        }
    }

    /* ========================================
       CART SUMMARY
    ======================================== */

    function updateCartSummary(cart) {
        const totalQuantity =
            cart.reduce(
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

        const subtotal =
            cart.reduce(
                (
                    total,
                    item
                ) => {
                    const normalizedItem =
                        updateCartItemPrice(
                            item
                        );

                    return (
                        total +
                        Number(
                            normalizedItem.price
                        ) *
                        Number(
                            normalizedItem.quantity
                        )
                    );
                },
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

        if (cartItemsText) {
            cartItemsText.textContent =
                `${totalQuantity} ${
                    totalQuantity === 1
                        ? "item"
                        : "items"
                } in your cart`;
        }

        if (cartSubtotal) {
            cartSubtotal.textContent =
                formatPrice(subtotal);
        }

        if (deliveryFeeElement) {
            deliveryFeeElement.textContent =
                deliveryFee === 0
                    ? "Free"
                    : formatPrice(
                          deliveryFee
                      );
        }

        if (discountAmount) {
            discountAmount.textContent =
                `- ${formatPrice(
                    discount
                )}`;
        }

        if (cartTotal) {
            cartTotal.textContent =
                formatPrice(total);
        }
    }

    /* ========================================
       INCREASE QUANTITY
    ======================================== */

    function increaseQuantity(
        productId
    ) {
        const cart =
            getCart();

        const itemIndex =
            findCartItemIndex(
                cart,
                productId
            );

        if (itemIndex === -1) {
            showNotification(
                "Product not found in cart.",
                "error"
            );

            return;
        }

        const currentQuantity =
            Number(
                cart[itemIndex]
                    .quantity
            );

        const availableStock =
            Number(
                cart[itemIndex]
                    .stock
            ) || 100;

        if (
            currentQuantity >=
            availableStock
        ) {
            showNotification(
                "Maximum available stock reached.",
                "error"
            );

            return;
        }

        const oldPriceType =
            cart[itemIndex]
                .priceType;

        cart[itemIndex].quantity =
            currentQuantity + 1;

        updateCartItemPrice(
            cart[itemIndex]
        );

        saveCart(cart);
        renderCart();

        const newPriceType =
            cart[itemIndex]
                .priceType;

        if (
            oldPriceType !==
                newPriceType &&
            newPriceType ===
                "wholesale"
        ) {
            showNotification(
                "Wholesale price has been applied.",
                "success"
            );
        } else {
            showNotification(
                "Product quantity updated.",
                "success"
            );
        }
    }

    /* ========================================
       DECREASE QUANTITY
    ======================================== */

    function decreaseQuantity(
        productId
    ) {
        const cart =
            getCart();

        const itemIndex =
            findCartItemIndex(
                cart,
                productId
            );

        if (itemIndex === -1) {
            return;
        }

        const currentQuantity =
            Number(
                cart[itemIndex]
                    .quantity
            );

        if (currentQuantity <= 1) {
            removeCartItem(
                productId
            );

            return;
        }

        const oldPriceType =
            cart[itemIndex]
                .priceType;

        cart[itemIndex].quantity =
            currentQuantity - 1;

        updateCartItemPrice(
            cart[itemIndex]
        );

        saveCart(cart);
        renderCart();

        const newPriceType =
            cart[itemIndex]
                .priceType;

        if (
            oldPriceType !==
                newPriceType &&
            newPriceType ===
                "retail"
        ) {
            showNotification(
                "Retail price has been applied.",
                "success"
            );
        } else {
            showNotification(
                "Product quantity updated.",
                "success"
            );
        }
    }

    /* ========================================
       REMOVE CART ITEM
    ======================================== */

    function removeCartItem(
        productId
    ) {
        const cart =
            getCart();

        const updatedCart =
            cart.filter(
                (
                    item,
                    index
                ) => {
                    const itemId =
                        item.id ||
                        item._id ||
                        item.productId ||
                        index;

                    return (
                        String(itemId) !==
                        String(productId)
                    );
                }
            );

        saveCart(updatedCart);
        renderCart();

        showNotification(
            "Product removed from cart.",
            "success"
        );
    }

    /* ========================================
       FIND CART ITEM
    ======================================== */

    function findCartItemIndex(
        cart,
        productId
    ) {
        return cart.findIndex(
            (
                item,
                index
            ) => {
                const itemId =
                    item.id ||
                    item._id ||
                    item.productId ||
                    index;

                return (
                    String(itemId) ===
                    String(productId)
                );
            }
        );
    }

    /* ========================================
       CART BUTTON EVENTS
    ======================================== */

    function addCartEventListeners() {
        document
            .querySelectorAll(
                ".increase-button"
            )
            .forEach(
                (button) => {
                    button.addEventListener(
                        "click",
                        () => {
                            increaseQuantity(
                                button.dataset.id
                            );
                        }
                    );
                }
            );

        document
            .querySelectorAll(
                ".decrease-button"
            )
            .forEach(
                (button) => {
                    button.addEventListener(
                        "click",
                        () => {
                            decreaseQuantity(
                                button.dataset.id
                            );
                        }
                    );
                }
            );

        document
            .querySelectorAll(
                ".remove-item-button"
            )
            .forEach(
                (button) => {
                    button.addEventListener(
                        "click",
                        () => {
                            removeCartItem(
                                button.dataset.id
                            );
                        }
                    );
                }
            );
    }

    /* ========================================
       CLEAR CART
    ======================================== */

    clearCartButton?.addEventListener(
        "click",
        () => {
            const cart =
                getCart();

            if (
                cart.length === 0
            ) {
                return;
            }

            clearCartModal
                ?.classList.add(
                    "show"
                );
        }
    );

    cancelClearCart?.addEventListener(
        "click",
        () => {
            clearCartModal
                ?.classList.remove(
                    "show"
                );
        }
    );

    confirmClearCart?.addEventListener(
        "click",
        () => {
            localStorage.removeItem(
                CART_STORAGE_KEY
            );

            clearCartModal
                ?.classList.remove(
                    "show"
                );

            renderCart();

            showNotification(
                "Shopping cart cleared.",
                "success"
            );
        }
    );

    clearCartModal?.addEventListener(
        "click",
        (event) => {
            if (
                event.target ===
                clearCartModal
            ) {
                clearCartModal
                    .classList.remove(
                        "show"
                    );
            }
        }
    );

    /* ========================================
       CHECKOUT
    ======================================== */

    checkoutButton?.addEventListener(
        "click",
        () => {
            const cart =
                getCart();

            if (
                cart.length === 0
            ) {
                showNotification(
                    "Your cart is empty.",
                    "error"
                );

                return;
            }

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
                    "checkout.html"
                );

                showNotification(
                    "Please login before checkout.",
                    "error"
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

            saveCart(cart);

            window.location.href =
                "checkout.html";
        }
    );

    /* ========================================
       NAVBAR CART COUNT
    ======================================== */

    function updateNavbarCartCount(
        cart
    ) {
        const totalQuantity =
            cart.reduce(
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

        if (cartCount) {
            cartCount.textContent =
                totalQuantity;
        }

        document
            .querySelectorAll(
                ".cart-count"
            )
            .forEach(
                (element) => {
                    element.textContent =
                        totalQuantity;

                    element.style.display =
                        totalQuantity > 0
                            ? "inline-flex"
                            : "none";
                }
            );
    }

    /* ========================================
       IMAGE HELPER
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
       NOTIFICATION
    ======================================== */

    function showNotification(
        message,
        type
    ) {
        window.clearTimeout(
            notificationTimer
        );

        if (
            !cartNotification ||
            !notificationText ||
            !notificationIcon
        ) {
            console.log(
                `${type}: ${message}`
            );

            return;
        }

        cartNotification.className =
            `cart-notification ${type} show`;

        notificationText.textContent =
            message;

        notificationIcon.className =
            type === "success"
                ? "fas fa-circle-check"
                : "fas fa-circle-exclamation";

        notificationTimer =
            window.setTimeout(
                () => {
                    cartNotification
                        .classList.remove(
                            "show"
                        );
                },
                2500
            );
    }

    /* ========================================
       FORMATTERS
    ======================================== */

    function formatPrice(
        amount
    ) {
        return `LKR ${Number(
            amount || 0
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

    function formatCategory(
        category
    ) {
        const labels = {
            juice:
                "Juice Items",

            bites:
                "Bites Items",

            "bottled-water":
                "Bottled Water",

            sweets:
                "Sweet Items"
        };

        return (
            labels[
                String(
                    category || ""
                ).toLowerCase()
            ] ||
            category ||
            "General"
        );
    }

    function getValidNumber(
        value,
        fallback
    ) {
        const number =
            Number(value);

        return Number.isNaN(
            number
        )
            ? fallback
            : number;
    }

    function getValidInteger(
        value,
        fallback
    ) {
        const number =
            Number(value);

        return Number.isInteger(
            number
        )
            ? number
            : fallback;
    }

    function escapeHTML(
        value
    ) {
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

    /* ========================================
       KEYBOARD EVENT
    ======================================== */

    document.addEventListener(
        "keydown",
        (event) => {
            if (
                event.key ===
                    "Escape" &&
                clearCartModal
                    ?.classList.contains(
                        "show"
                    )
            ) {
                clearCartModal
                    .classList.remove(
                        "show"
                    );
            }
        }
    );

    /* ========================================
       INITIAL RENDER
    ======================================== */

    renderCart();
});
