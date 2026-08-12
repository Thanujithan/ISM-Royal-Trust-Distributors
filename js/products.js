document.addEventListener(
    "DOMContentLoaded",
    () => {
        initializeProductsPage();
    }
);


function initializeProductsPage() {

    const API_URL =
        "http://localhost:5000/api/products";

    const BACKEND_URL =
        "http://localhost:5000";

    const DEFAULT_WHOLESALE_MINIMUM =
        20;


    /* ========================================
       ELEMENTS
    ======================================== */

    const productContainer =
        document.getElementById(
            "productContainer"
        ) ||
        document.getElementById(
            "productsContainer"
        ) ||
        document.getElementById(
            "productGrid"
        ) ||
        document.querySelector(
            ".product-grid"
        );


    const searchInput =
        document.getElementById(
            "productSearch"
        ) ||
        document.getElementById(
            "searchInput"
        );


    const categoryFilter =
        document.getElementById(
            "categoryFilter"
        );


    const cartCount =
        document.getElementById(
            "cartCount"
        );


    let allProducts = [];


    if (!productContainer) {
        console.error(
            "Product container not found."
        );

        return;
    }


    updateCartCount();

    loadProducts();


    searchInput?.addEventListener(
        "input",
        filterProducts
    );


    categoryFilter?.addEventListener(
        "change",
        filterProducts
    );


    /* ========================================
       LOAD PRODUCTS
    ======================================== */

    async function loadProducts() {

        showLoading();


        try {

            const response =
                await fetch(
                    API_URL
                );


            const result =
                await parseResponse(
                    response
                );


            if (!response.ok) {
                throw new Error(
                    result.message ||
                    "Unable to fetch products."
                );
            }


            if (
                !result.success ||
                !Array.isArray(
                    result.data
                )
            ) {
                throw new Error(
                    "Invalid product response."
                );
            }


            allProducts =
                result.data

                    .filter(
                        (product) => {
                            return (
                                product.status ===
                                    "active" &&
                                product
                                    .isAvailable !==
                                    false
                            );
                        }
                    )

                    .map(
                        normalizeProduct
                    );


            createCategoryOptions();


            displayProducts(
                allProducts
            );


        } catch (error) {

            console.error(
                "Product loading error:",
                error
            );


            showProductsError(
                error.message
            );
        }
    }


    /* ========================================
       NORMALIZE PRODUCT
    ======================================== */

    function normalizeProduct(product) {

        const retailPrice =
            getRetailPrice(
                product
            );


        const wholesalePrice =
            getWholesalePrice(
                product,
                retailPrice
            );


        const wholesaleMinimumQuantity =
            getWholesaleMinimumQuantity(
                product
            );


        return {
            ...product,

            retailPrice,

            wholesalePrice,

            wholesaleMinimumQuantity,

            /*
            Net Content
            */

            netContent:
                product.netContent
                    ? String(
                        product.netContent
                    ).trim()
                    : "",

            /*
            Legacy compatibility
            */

            price:
                retailPrice,

            image:
                getProductImageUrl(
                    product.image ||
                    product.imageUrl ||
                    product.imageURL ||
                    ""
                )
        };
    }


    function getRetailPrice(product) {

        const retailPrice =
            Number(
                product.retailPrice ??
                product.price ??
                0
            );


        return Number.isNaN(
            retailPrice
        )
            ? 0
            : retailPrice;
    }


    function getWholesalePrice(
        product,
        retailPrice
    ) {

        const wholesalePrice =
            Number(
                product.wholesalePrice ??
                retailPrice
            );


        return Number.isNaN(
            wholesalePrice
        )
            ? retailPrice
            : wholesalePrice;
    }


    function getWholesaleMinimumQuantity(
        product
    ) {

        const minimumQuantity =
            Number(
                product
                    .wholesaleMinimumQuantity ??
                DEFAULT_WHOLESALE_MINIMUM
            );


        return (
            Number.isInteger(
                minimumQuantity
            ) &&
            minimumQuantity >= 1
        )
            ? minimumQuantity
            : DEFAULT_WHOLESALE_MINIMUM;
    }


    function getProductImageUrl(image) {

        if (!image) {
            return (
                "images/products/" +
                "default-product.jpg"
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
            )
        ) {
            return image;
        }


        const normalizedPath =
            image.startsWith("/")
                ? image
                : `/${image}`;


        return (
            BACKEND_URL +
            normalizedPath
        );
    }


    /* ========================================
       PRODUCT PRICE HELPERS
    ======================================== */

    function getAppliedPrice(
        product,
        quantity
    ) {

        const numericQuantity =
            Number(
                quantity || 1
            );


        return numericQuantity >=
            product
                .wholesaleMinimumQuantity

            ? product.wholesalePrice

            : product.retailPrice;
    }


    function getPriceType(
        product,
        quantity
    ) {

        return Number(
            quantity || 1
        ) >=
            product
                .wholesaleMinimumQuantity

            ? "wholesale"

            : "retail";
    }


    /* ========================================
       DISPLAY PRODUCTS
    ======================================== */

    function displayProducts(products) {

        if (!products.length) {

            productContainer.innerHTML = `
                <div class="products-message">

                    <i class="fas fa-box-open"></i>

                    <h3>
                        No products found
                    </h3>

                    <p>
                        There are currently no matching products.
                    </p>

                </div>
            `;

            return;
        }


        productContainer.innerHTML =
            products

                .map(
                    createProductCard
                )

                .join("");


        initializeProductCardEvents();
    }


    /* ========================================
       CREATE PRODUCT CARD
    ======================================== */

    function createProductCard(product) {

        const productId =
            String(
                product._id ||
                product.id ||
                ""
            );


        const productName =
            escapeHTML(
                product.name ||
                "Unnamed Product"
            );


        /*
        ========================================
        NET CONTENT
        ========================================
        */

        const netContent =
            escapeHTML(
                product.netContent ||
                ""
            );


        const description =
            escapeHTML(
                product.description ||
                "No description available."
            );


        const category =
            escapeHTML(
                formatCategory(
                    product.category
                )
            );


        const brand =
            escapeHTML(
                product.brand ||
                "ISM"
            );


        const image =
            escapeAttribute(
                product.image
            );


        const stock =
            Number(
                product.stock ||
                0
            );


        const retailPrice =
            Number(
                product.retailPrice ||
                0
            );


        const wholesalePrice =
            Number(
                product.wholesalePrice ||
                retailPrice
            );


        const wholesaleMinimum =
            Number(
                product
                    .wholesaleMinimumQuantity ||
                DEFAULT_WHOLESALE_MINIMUM
            );


        const stockStatus =
            stock > 0

                ? `
                    <span class="in-stock">
                        In Stock: ${stock}
                    </span>
                  `

                : `
                    <span class="out-of-stock">
                        Out of Stock
                    </span>
                  `;


        return `
            <article
                class="product-card"
                data-product-id="${escapeAttribute(
                    productId
                )}"
            >

                <!-- PRODUCT IMAGE -->

                <div class="product-image-container">

                    <img
                        src="${image}"
                        alt="${productName}"
                        class="product-image"
                        loading="lazy"
                        onerror="
                            this.onerror=null;
                            this.src='images/products/default-product.jpg';
                        "
                    >


                    <span class="product-category">
                        ${category}
                    </span>

                </div>


                <!-- PRODUCT DETAILS -->

                <div class="product-details">


                    <p class="product-brand">
                        ${brand}
                    </p>


                    <!-- =================================
                         PRODUCT NAME + NET CONTENT
                    ================================== -->

                    <div class="product-name-row">

                        <h3 class="product-name">
                            ${productName}
                        </h3>


                        ${
                            netContent
                                ? `
                                    <span class="product-net-content">
                                        ${netContent}
                                    </span>
                                  `
                                : ""
                        }

                    </div>


                    <p class="product-description">
                        ${description}
                    </p>


                    <div class="product-stock">
                        ${stockStatus}
                    </div>


                    <!-- =================================
                         RETAIL / WHOLESALE PRICE
                    ================================== -->

                    <div class="product-pricing">


                        <div
                            class="price-row retail-price-row"
                        >

                            <span>
                                Retail Price
                            </span>

                            <strong>
                                LKR
                                ${formatPrice(
                                    retailPrice
                                )}
                            </strong>

                        </div>


                        <div
                            class="price-row wholesale-price-row"
                        >

                            <span>
                                Wholesale Price
                            </span>

                            <strong>
                                LKR
                                ${formatPrice(
                                    wholesalePrice
                                )}
                            </strong>

                        </div>


                        <p class="wholesale-note">

                            <i class="fas fa-boxes-stacked"></i>

                            Wholesale price from
                            ${wholesaleMinimum}
                            pieces

                        </p>

                    </div>


                    <!-- =================================
                         QUANTITY
                    ================================== -->

                    <div class="product-quantity-selector">


                        <button
                            type="button"
                            class="quantity-button decrease-quantity"
                            data-product-id="${escapeAttribute(
                                productId
                            )}"
                            ${
                                stock <= 0
                                    ? "disabled"
                                    : ""
                            }
                        >

                            <i class="fas fa-minus"></i>

                        </button>


                        <input
                            type="number"
                            class="product-quantity-input"
                            data-product-id="${escapeAttribute(
                                productId
                            )}"
                            value="1"
                            min="1"
                            max="${stock}"
                            ${
                                stock <= 0
                                    ? "disabled"
                                    : ""
                            }
                        >


                        <button
                            type="button"
                            class="quantity-button increase-quantity"
                            data-product-id="${escapeAttribute(
                                productId
                            )}"
                            ${
                                stock <= 0
                                    ? "disabled"
                                    : ""
                            }
                        >

                            <i class="fas fa-plus"></i>

                        </button>

                    </div>


                    <!-- =================================
                         CURRENT UNIT PRICE
                    ================================== -->

                    <div
                        class="selected-price-box"
                        id="selectedPrice-${escapeAttribute(
                            productId
                        )}"
                    >

                        <span>
                            Current Unit Price
                        </span>


                        <strong>
                            LKR
                            ${formatPrice(
                                retailPrice
                            )}
                        </strong>


                        <small class="retail-applied">
                            Retail price applied
                        </small>

                    </div>


                    <!-- =================================
                         ADD TO CART
                    ================================== -->

                    <button
                        type="button"
                        class="add-cart-button"
                        data-product-id="${escapeAttribute(
                            productId
                        )}"
                        ${
                            stock <= 0
                                ? "disabled"
                                : ""
                        }
                    >

                        ${
                            stock > 0

                                ? `
                                    <i class="fas fa-cart-plus"></i>
                                    Add to Cart
                                  `

                                : `
                                    <i class="fas fa-ban"></i>
                                    Out of Stock
                                  `
                        }

                    </button>

                </div>

            </article>
        `;
    }


    /* ========================================
       PRODUCT CARD EVENTS
    ======================================== */

    function initializeProductCardEvents() {

        const decreaseButtons =
            productContainer.querySelectorAll(
                ".decrease-quantity"
            );


        const increaseButtons =
            productContainer.querySelectorAll(
                ".increase-quantity"
            );


        const quantityInputs =
            productContainer.querySelectorAll(
                ".product-quantity-input"
            );


        const addCartButtons =
            productContainer.querySelectorAll(
                ".add-cart-button"
            );


        decreaseButtons.forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    () => {

                        changeProductQuantity(
                            button.dataset.productId,
                            -1
                        );
                    }
                );
            }
        );


        increaseButtons.forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    () => {

                        changeProductQuantity(
                            button.dataset.productId,
                            1
                        );
                    }
                );
            }
        );


        quantityInputs.forEach(
            (input) => {

                input.addEventListener(
                    "change",
                    () => {

                        validateProductQuantity(
                            input.dataset.productId
                        );
                    }
                );


                input.addEventListener(
                    "input",
                    () => {

                        updateSelectedPrice(
                            input.dataset.productId
                        );
                    }
                );
            }
        );


        addCartButtons.forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    () => {

                        addToCart(
                            button.dataset.productId,
                            button
                        );
                    }
                );
            }
        );
    }


    /* ========================================
       CHANGE PRODUCT QUANTITY
    ======================================== */

    function changeProductQuantity(
        productId,
        change
    ) {

        const product =
            findProductById(
                productId
            );


        const input =
            getQuantityInput(
                productId
            );


        if (
            !product ||
            !input
        ) {
            return;
        }


        const stock =
            Number(
                product.stock ||
                0
            );


        let quantity =
            Number(
                input.value ||
                1
            );


        quantity +=
            change;


        if (
            quantity < 1
        ) {
            quantity = 1;
        }


        if (
            stock > 0 &&
            quantity > stock
        ) {

            quantity =
                stock;


            showNotification(
                `Only ${stock} items are available.`,
                "error"
            );
        }


        input.value =
            quantity;


        updateSelectedPrice(
            productId
        );
    }


    /* ========================================
       VALIDATE PRODUCT QUANTITY
    ======================================== */

    function validateProductQuantity(
        productId
    ) {

        const product =
            findProductById(
                productId
            );


        const input =
            getQuantityInput(
                productId
            );


        if (
            !product ||
            !input
        ) {
            return;
        }


        const stock =
            Number(
                product.stock ||
                0
            );


        let quantity =
            Number(
                input.value
            );


        if (
            !Number.isInteger(
                quantity
            ) ||
            quantity < 1
        ) {
            quantity = 1;
        }


        if (
            stock > 0 &&
            quantity > stock
        ) {

            quantity =
                stock;


            showNotification(
                `Only ${stock} items are available.`,
                "error"
            );
        }


        input.value =
            quantity;


        updateSelectedPrice(
            productId
        );
    }


    /* ========================================
       UPDATE SELECTED PRICE
    ======================================== */

    function updateSelectedPrice(
        productId
    ) {

        const product =
            findProductById(
                productId
            );


        const input =
            getQuantityInput(
                productId
            );


        const priceBox =
            document.getElementById(
                `selectedPrice-${productId}`
            );


        if (
            !product ||
            !input ||
            !priceBox
        ) {
            return;
        }


        const quantity =
            Number(
                input.value ||
                1
            );


        const appliedPrice =
            getAppliedPrice(
                product,
                quantity
            );


        const priceType =
            getPriceType(
                product,
                quantity
            );


        const itemTotal =
            appliedPrice *
            quantity;


        priceBox.innerHTML = `

            <span>
                Current Unit Price
            </span>


            <strong>
                LKR
                ${formatPrice(
                    appliedPrice
                )}
            </strong>


            <small
                class="${
                    priceType ===
                    "wholesale"

                        ? "wholesale-applied"

                        : "retail-applied"
                }"
            >

                ${
                    priceType ===
                    "wholesale"

                        ? `Wholesale price applied · Total LKR ${formatPrice(
                            itemTotal
                        )}`

                        : `Retail price applied · Total LKR ${formatPrice(
                            itemTotal
                        )}`
                }

            </small>
        `;
    }


    function getQuantityInput(
        productId
    ) {

        return productContainer
            .querySelector(
                `.product-quantity-input[data-product-id="${cssEscape(
                    productId
                )}"]`
            );
    }


    function findProductById(
        productId
    ) {

        return allProducts.find(
            (product) =>
                String(
                    product._id ||
                    product.id
                ) ===
                String(
                    productId
                )
        );
    }


    /* ========================================
       ADD TO CART
    ======================================== */

    function addToCart(
        productId,
        button
    ) {

        const product =
            findProductById(
                productId
            );


        const quantityInput =
            getQuantityInput(
                productId
            );


        if (
            !product ||
            !quantityInput
        ) {

            showNotification(
                "Product could not be found.",
                "error"
            );

            return;
        }


        const stock =
            Number(
                product.stock ||
                0
            );


        const selectedQuantity =
            Number(
                quantityInput.value ||
                1
            );


        if (
            stock <= 0
        ) {

            showNotification(
                "This product is currently out of stock.",
                "error"
            );

            return;
        }


        if (
            !Number.isInteger(
                selectedQuantity
            ) ||
            selectedQuantity < 1
        ) {

            showNotification(
                "Please enter a valid quantity.",
                "error"
            );

            return;
        }


        if (
            selectedQuantity >
            stock
        ) {

            showNotification(
                `Only ${stock} items are available.`,
                "error"
            );

            return;
        }


        const cart =
            getCart();


        const existingProduct =
            cart.find(
                (item) =>
                    String(
                        item._id
                    ) ===
                    String(
                        product._id
                    )
            );


        /* ========================================
           EXISTING CART PRODUCT
        ======================================== */

        if (existingProduct) {

            const newQuantity =
                Number(
                    existingProduct.quantity ||
                    0
                ) +
                selectedQuantity;


            if (
                newQuantity >
                stock
            ) {

                showNotification(
                    "Maximum available stock has been reached.",
                    "error"
                );

                return;
            }


            existingProduct.quantity =
                newQuantity;


            /*
            Net Content always keep updated
            */

            existingProduct.netContent =
                product.netContent ||
                "";


            existingProduct.category =
                product.category;


            existingProduct.brand =
                product.brand;


            existingProduct.image =
                product.image;


            existingProduct.stock =
                stock;


            existingProduct.retailPrice =
                Number(
                    product.retailPrice
                );


            existingProduct.wholesalePrice =
                Number(
                    product.wholesalePrice
                );


            existingProduct.wholesaleMinimumQuantity =
                Number(
                    product
                        .wholesaleMinimumQuantity
                );


            updateCartItemPricing(
                existingProduct
            );

        } else {

            /* ========================================
               NEW CART ITEM
            ======================================== */

            const cartItem = {

                _id:
                    product._id,


                name:
                    product.name,


                /*
                NET CONTENT
                */

                netContent:
                    product.netContent ||
                    "",


                category:
                    product.category,


                brand:
                    product.brand,


                retailPrice:
                    Number(
                        product.retailPrice
                    ),


                wholesalePrice:
                    Number(
                        product.wholesalePrice
                    ),


                wholesaleMinimumQuantity:
                    Number(
                        product
                            .wholesaleMinimumQuantity
                    ),


                /*
                Existing cart code price
                field use செய்தாலும்
                current applied price கிடைக்கும்.
                */

                price:
                    getAppliedPrice(
                        product,
                        selectedQuantity
                    ),


                priceType:
                    getPriceType(
                        product,
                        selectedQuantity
                    ),


                stock,


                image:
                    product.image,


                quantity:
                    selectedQuantity
            };


            cart.push(
                cartItem
            );
        }


        localStorage.setItem(
            "ismCart",
            JSON.stringify(
                cart
            )
        );


        updateCartCount();


        showNotification(
            `${product.name} added to cart.`,
            "success"
        );


        showAddedButtonState(
            button
        );
    }


    /* ========================================
       UPDATE CART ITEM PRICING
    ======================================== */

    function updateCartItemPricing(
        cartItem
    ) {

        const minimumQuantity =
            Number(
                cartItem
                    .wholesaleMinimumQuantity ||
                DEFAULT_WHOLESALE_MINIMUM
            );


        const quantity =
            Number(
                cartItem.quantity ||
                1
            );


        const retailPrice =
            Number(
                cartItem.retailPrice ||
                cartItem.price ||
                0
            );


        const wholesalePrice =
            Number(
                cartItem.wholesalePrice ||
                retailPrice
            );


        const isWholesale =
            quantity >=
            minimumQuantity;


        cartItem.price =
            isWholesale
                ? wholesalePrice
                : retailPrice;


        cartItem.priceType =
            isWholesale
                ? "wholesale"
                : "retail";
    }


    /* ========================================
       CART HELPERS
    ======================================== */

    function getCart() {

        try {

            const savedCart =
                JSON.parse(
                    localStorage.getItem(
                        "ismCart"
                    )
                );


            if (
                !Array.isArray(
                    savedCart
                )
            ) {
                return [];
            }


            return savedCart.map(
                (item) => {

                    const normalizedItem = {

                        ...item,


                        /*
                        NET CONTENT
                        */

                        netContent:
                            item.netContent
                                ? String(
                                    item.netContent
                                ).trim()
                                : "",


                        retailPrice:
                            Number(
                                item.retailPrice ??
                                item.price ??
                                0
                            ),


                        wholesalePrice:
                            Number(
                                item.wholesalePrice ??
                                item.retailPrice ??
                                item.price ??
                                0
                            ),


                        wholesaleMinimumQuantity:
                            Number(
                                item
                                    .wholesaleMinimumQuantity ??
                                DEFAULT_WHOLESALE_MINIMUM
                            ),


                        quantity:
                            Number(
                                item.quantity ||
                                1
                            )
                    };


                    updateCartItemPricing(
                        normalizedItem
                    );


                    return normalizedItem;
                }
            );


        } catch (error) {

            console.error(
                "Unable to read shopping cart:",
                error
            );


            return [];
        }
    }


    function updateCartCount() {

        const cart =
            getCart();


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
       SEARCH & CATEGORY FILTER
    ======================================== */

    function filterProducts() {

        const searchText =
            (
                searchInput?.value ||
                ""
            )
                .trim()
                .toLowerCase();


        const selectedCategory =
            (
                categoryFilter?.value ||
                ""
            )
                .trim()
                .toLowerCase();


        const filteredProducts =
            allProducts.filter(
                (product) => {


                    const name =
                        String(
                            product.name ||
                            ""
                        )
                            .toLowerCase();


                    const category =
                        String(
                            product.category ||
                            ""
                        )
                            .toLowerCase();


                    const description =
                        String(
                            product.description ||
                            ""
                        )
                            .toLowerCase();


                    /*
                    Search Net Content too
                    */

                    const netContent =
                        String(
                            product.netContent ||
                            ""
                        )
                            .toLowerCase();


                    const matchesSearch =
                        name.includes(
                            searchText
                        ) ||

                        category.includes(
                            searchText
                        ) ||

                        description.includes(
                            searchText
                        ) ||

                        netContent.includes(
                            searchText
                        );


                    const matchesCategory =
                        !selectedCategory ||
                        category ===
                            selectedCategory;


                    return (
                        matchesSearch &&
                        matchesCategory
                    );
                }
            );


        displayProducts(
            filteredProducts
        );
    }


    /* ========================================
       CATEGORY OPTIONS
    ======================================== */

    function createCategoryOptions() {

        if (!categoryFilter) {
            return;
        }


        categoryFilter.innerHTML = `

            <option value="">
                All Categories
            </option>


            <option value="juice">
                Juice
            </option>


            <option value="sweets">
                Sweets
            </option>


            <option value="bites">
                Bites
            </option>


            <option value="bottled-water">
                Bottle Water
            </option>


            <option value="rice">
                Rice
            </option>
        `;
    }


    /* ========================================
       LOADING
    ======================================== */

    function showLoading() {

        productContainer.innerHTML = `
            <div class="products-message">

                <i class="fas fa-spinner fa-spin"></i>

                <h3>
                    Loading Products...
                </h3>

            </div>
        `;
    }


    /* ========================================
       ERROR
    ======================================== */

    function showProductsError(
        message
    ) {

        productContainer.innerHTML = `
            <div class="products-message error">

                <i class="fas fa-circle-exclamation"></i>

                <h3>
                    ${escapeHTML(message)}
                </h3>

            </div>
        `;
    }


    /* ========================================
       NOTIFICATION
    ======================================== */

    function showNotification(
        message,
        type = "success"
    ) {

        const notification =
            document.createElement(
                "div"
            );


        notification.className =
            `notification notification-${type}`;


        notification.innerHTML = `

            <i class="fas ${
                type === "success"
                    ? "fa-circle-check"
                    : "fa-circle-xmark"
            }"></i>

            <span>
                ${escapeHTML(message)}
            </span>
        `;


        document.body.appendChild(
            notification
        );


        requestAnimationFrame(
            () => {

                notification.classList.add(
                    "show"
                );
            }
        );


        setTimeout(
            () => {

                notification.classList.remove(
                    "show"
                );


                setTimeout(
                    () => {

                        notification.remove();

                    },
                    300
                );

            },
            2500
        );
    }


    /* ========================================
       ADDED BUTTON STATE
    ======================================== */

    function showAddedButtonState(
        button
    ) {

        if (!button) {
            return;
        }


        const originalHTML =
            button.innerHTML;


        button.disabled =
            true;


        button.innerHTML = `
            <i class="fas fa-check"></i>
            Added
        `;


        setTimeout(
            () => {

                button.disabled =
                    false;


                button.innerHTML =
                    originalHTML;

            },
            1500
        );
    }


    /* ========================================
       FORMAT CATEGORY
    ======================================== */

    function formatCategory(
        category
    ) {

        switch (
            String(
                category
            )
                .trim()
                .toLowerCase()
        ) {

            case "juice":
                return "Juices";


            case "sweets":
                return "Sweets";


            case "bites":
                return "Bites";


            case "bottled-water":
                return "Bottle Water";


            case "rice":
                return "Rice";


            default:
                return (
                    category ||
                    "General"
                );
        }
    }


    /* ========================================
       FORMAT PRICE
    ======================================== */

    function formatPrice(
        price
    ) {

        return Number(
            price ||
            0
        )
            .toLocaleString(
                "en-LK",
                {
                    minimumFractionDigits:
                        2,

                    maximumFractionDigits:
                        2
                }
            );
    }


    /* ========================================
       PARSE RESPONSE
    ======================================== */

    async function parseResponse(
        response
    ) {

        try {

            return await response.json();

        } catch {

            return {};
        }
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


    function escapeAttribute(
        value
    ) {

        return escapeHTML(
            value
        );
    }


    function cssEscape(
        value
    ) {

        if (
            window.CSS &&
            CSS.escape
        ) {

            return CSS.escape(
                String(
                    value
                )
            );
        }


        return String(
            value
        )
            .replaceAll(
                '"',
                '\\"'
            );
    }

}