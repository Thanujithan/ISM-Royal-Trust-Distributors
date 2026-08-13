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


    /*
    ========================================
    CATEGORY BUTTONS
    ========================================
    */

    const categoryButtons =
        document.querySelectorAll(
            ".category-btn, .filter-btn, [data-category]"
        );


    let activeCategory = "";


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


    /* ========================================
       SEARCH EVENT
    ======================================== */

    searchInput?.addEventListener(
        "input",
        filterProducts
    );


    /* ========================================
       SELECT CATEGORY EVENT
    ======================================== */

    categoryFilter?.addEventListener(
        "change",
        () => {

            activeCategory =
                normalizeCategoryValue(
                    categoryFilter.value
                );

            filterProducts();
        }
    );


    /* ========================================
       CATEGORY BUTTON EVENTS
    ======================================== */

    categoryButtons.forEach(
        (button) => {

            button.addEventListener(
                "click",
                () => {

                    const buttonCategory =
                        button.dataset.category ||
                        button.dataset.filter ||
                        button.textContent ||
                        "";


                    activeCategory =
                        normalizeCategoryValue(
                            buttonCategory
                        );


                    categoryButtons.forEach(
                        (btn) => {

                            btn.classList.remove(
                                "active"
                            );
                        }
                    );


                    button.classList.add(
                        "active"
                    );


                    if (categoryFilter) {

                        categoryFilter.value =
                            activeCategory;
                    }


                    filterProducts();
                }
            );
        }
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

                    product.isAvailable !==
                        false
                );
            }
        )

        .map(
            normalizeProduct
        )

        .sort(
            (a, b) => {

                /*
                ========================================
                CATEGORY DISPLAY ORDER

                1. Juice
                2. Sweets
                3. Bottle Water
                4. Rice
                5. Bites
                ========================================
                */

                const categoryOrder = {

                    juice: 1,

                    sweets: 2,

                    "bottled-water": 3,

                    rice: 4,

                    bites: 5
                };


                const categoryA =
                    normalizeCategoryValue(
                        a.category
                    );


                const categoryB =
                    normalizeCategoryValue(
                        b.category
                    );


                const orderA =
                    categoryOrder[
                        categoryA
                    ] ?? 999;


                const orderB =
                    categoryOrder[
                        categoryB
                    ] ?? 999;


                /*
                Different categories:
                category priority use pannum
                */

                if (
                    orderA !== orderB
                ) {

                    return (
                        orderA - orderB
                    );
                }


                /*
                Same category-la
                latest added product first
                */

                const dateA =
                    new Date(
                        a.createdAt || 0
                    ).getTime();


                const dateB =
                    new Date(
                        b.createdAt || 0
                    ).getTime();


                return (
                    dateB - dateA
                );
            }
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
            ========================================
            NET CONTENT
            ========================================
            */

            netContent:
                product.netContent !==
                    undefined &&
                product.netContent !==
                    null

                    ? String(
                        product.netContent
                    ).trim()

                    : "",


            /*
            ========================================
            NORMALIZED CATEGORY
            ========================================
            */

            normalizedCategory:
                normalizeCategoryValue(
                    product.category
                ),


            /*
            ========================================
            LEGACY PRICE
            ========================================
            */

            price:
                retailPrice,


            /*
            ========================================
            PRODUCT IMAGE
            ========================================
            */

            image:
                getProductImageUrl(
                    product.image ||
                    product.imageUrl ||
                    product.imageURL ||
                    ""
                )
        };
    }


    /* ========================================
       RETAIL PRICE
    ======================================== */

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


    /* ========================================
       WHOLESALE PRICE
    ======================================== */

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


    /* ========================================
       WHOLESALE MINIMUM
    ======================================== */

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


    /* ========================================
       PRODUCT IMAGE URL
    ======================================== */

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


                    <!-- =========================
                         NAME + NET CONTENT
                    ========================== -->

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


                    <!-- =========================
                         PRICES
                    ========================== -->

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


                    <!-- =========================
                         QUANTITY
                    ========================== -->

                    <div class="product-quantity-selector">


                        <button
                            type="button"

                            class="
                                quantity-button
                                decrease-quantity
                            "

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

                            class="
                                quantity-button
                                increase-quantity
                            "

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


                    <!-- =========================
                         CURRENT UNIT PRICE
                    ========================== -->

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


                    <!-- =========================
                         ADD TO CART
                    ========================== -->

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


        /* ========================================
           DECREASE QUANTITY
        ======================================== */

        decreaseButtons.forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    () => {

                        const productId =
                            button.dataset.productId;


                        const product =
                            findProduct(
                                productId
                            );


                        if (!product) {
                            return;
                        }


                        const input =
                            getQuantityInput(
                                productId
                            );


                        if (!input) {
                            return;
                        }


                        let quantity =
                            Number(
                                input.value ||
                                1
                            );


                        quantity =
                            Math.max(
                                1,
                                quantity - 1
                            );


                        input.value =
                            quantity;


                        updateDisplayedPrice(
                            product,
                            quantity
                        );
                    }
                );
            }
        );


        /* ========================================
           INCREASE QUANTITY
        ======================================== */

        increaseButtons.forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    () => {

                        const productId =
                            button.dataset.productId;


                        const product =
                            findProduct(
                                productId
                            );


                        if (!product) {
                            return;
                        }


                        const input =
                            getQuantityInput(
                                productId
                            );


                        if (!input) {
                            return;
                        }


                        let quantity =
                            Number(
                                input.value ||
                                1
                            );


                        const stock =
                            Number(
                                product.stock ||
                                0
                            );


                        if (
                            quantity >= stock
                        ) {

                            showToast(
                                `Only ${stock} item(s) available in stock.`,
                                "error"
                            );

                            return;
                        }


                        quantity += 1;


                        input.value =
                            quantity;


                        updateDisplayedPrice(
                            product,
                            quantity
                        );
                    }
                );
            }
        );


        /* ========================================
           MANUAL QUANTITY INPUT
        ======================================== */

        quantityInputs.forEach(
            (input) => {

                input.addEventListener(
                    "input",
                    () => {

                        const productId =
                            input.dataset.productId;


                        const product =
                            findProduct(
                                productId
                            );


                        if (!product) {
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
                            quantity > stock
                        ) {

                            quantity =
                                stock;


                            showToast(
                                `Only ${stock} item(s) available in stock.`,
                                "error"
                            );
                        }


                        input.value =
                            quantity;


                        updateDisplayedPrice(
                            product,
                            quantity
                        );
                    }
                );


                input.addEventListener(
                    "blur",
                    () => {

                        if (
                            !input.value ||
                            Number(
                                input.value
                            ) < 1
                        ) {

                            input.value =
                                1;
                        }


                        const productId =
                            input.dataset.productId;


                        const product =
                            findProduct(
                                productId
                            );


                        if (product) {

                            updateDisplayedPrice(
                                product,
                                Number(
                                    input.value
                                )
                            );
                        }
                    }
                );
            }
        );


        /* ========================================
           ADD TO CART
        ======================================== */

        addCartButtons.forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    () => {

                        const productId =
                            button.dataset.productId;


                        addProductToCart(
                            productId
                        );
                    }
                );
            }
        );
    }


    /* ========================================
       FIND PRODUCT
    ======================================== */

    function findProduct(productId) {

        return allProducts.find(
            (product) => {

                return String(
                    product._id ||
                    product.id ||
                    ""
                ) ===
                String(
                    productId
                );
            }
        );
    }


    /* ========================================
       GET QUANTITY INPUT
    ======================================== */

    function getQuantityInput(
        productId
    ) {

        return productContainer.querySelector(
            `.product-quantity-input[data-product-id="${escapeSelector(
                productId
            )}"]`
        );
    }


    /* ========================================
       UPDATE CURRENT UNIT PRICE
    ======================================== */

    function updateDisplayedPrice(
        product,
        quantity
    ) {

        const priceBox =
            document.getElementById(
                `selectedPrice-${
                    product._id ||
                    product.id
                }`
            );


        if (!priceBox) {
            return;
        }


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


            ${
                priceType ===
                "wholesale"

                    ? `
                        <small class="wholesale-applied">

                            <i class="fas fa-boxes-stacked"></i>

                            Wholesale price applied

                        </small>
                      `

                    : `
                        <small class="retail-applied">

                            Retail price applied

                        </small>
                      `
            }
        `;
    }


    /* ========================================
       ADD PRODUCT TO CART
    ======================================== */

    function addProductToCart(
        productId
    ) {

        const product =
            findProduct(
                productId
            );


        if (!product) {

            showToast(
                "Product not found.",
                "error"
            );

            return;
        }


        const stock =
            Number(
                product.stock ||
                0
            );


        if (
            stock <= 0
        ) {

            showToast(
                "This product is out of stock.",
                "error"
            );

            return;
        }


        const quantityInput =
            getQuantityInput(
                productId
            );


        let quantity =
            Number(
                quantityInput?.value ||
                1
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
            quantity > stock
        ) {

            showToast(
                `Only ${stock} item(s) available in stock.`,
                "error"
            );

            return;
        }


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


        let cart =
            getCart();


        const existingIndex =
            cart.findIndex(
                (item) => {

                    return String(
                        item._id ||
                        item.id ||
                        item.productId ||
                        ""
                    ) ===
                    String(
                        productId
                    );
                }
            );


        /* ========================================
           PRODUCT ALREADY IN CART
        ======================================== */

        if (
            existingIndex !== -1
        ) {

            const existingItem =
                cart[
                    existingIndex
                ];


            const newQuantity =
                Number(
                    existingItem.quantity ||
                    0
                ) +
                quantity;


            if (
                newQuantity > stock
            ) {

                showToast(
                    `You cannot add more than ${stock} item(s).`,
                    "error"
                );

                return;
            }


            const newPrice =
                getAppliedPrice(
                    product,
                    newQuantity
                );


            const newPriceType =
                getPriceType(
                    product,
                    newQuantity
                );


            cart[
                existingIndex
            ] = {

                ...existingItem,


                _id:
                    product._id ||
                    product.id,


                id:
                    product.id ||
                    product._id,


                productId:
                    product._id ||
                    product.id,


                name:
                    product.name ||
                    "Product",


                /*
                ========================================
                IMPORTANT: NET CONTENT
                ========================================
                */

                netContent:
                    product.netContent ||
                    "",


                category:
                    product.category ||
                    "General",


                brand:
                    product.brand ||
                    "ISM Royal Trust",


                image:
                    product.image ||
                    "",


                description:
                    product.description ||
                    "",


                stock,


                retailPrice:
                    Number(
                        product.retailPrice ||
                        0
                    ),


                wholesalePrice:
                    Number(
                        product.wholesalePrice ??
                        product.retailPrice ??
                        0
                    ),


                wholesaleMinimumQuantity:
                    Number(
                        product
                            .wholesaleMinimumQuantity ||
                        DEFAULT_WHOLESALE_MINIMUM
                    ),


                quantity:
                    newQuantity,


                price:
                    newPrice,


                appliedPrice:
                    newPrice,


                priceType:
                    newPriceType
            };


        } else {

            /* ========================================
               NEW CART ITEM
            ======================================== */

            cart.push({

                _id:
                    product._id ||
                    product.id,


                id:
                    product.id ||
                    product._id,


                productId:
                    product._id ||
                    product.id,


                name:
                    product.name ||
                    "Product",


                /*
                ========================================
                IMPORTANT: NET CONTENT
                ========================================
                */

                netContent:
                    product.netContent ||
                    "",


                category:
                    product.category ||
                    "General",


                brand:
                    product.brand ||
                    "ISM Royal Trust",


                image:
                    product.image ||
                    "",


                description:
                    product.description ||
                    "",


                stock,


                retailPrice:
                    Number(
                        product.retailPrice ||
                        0
                    ),


                wholesalePrice:
                    Number(
                        product.wholesalePrice ??
                        product.retailPrice ??
                        0
                    ),


                wholesaleMinimumQuantity:
                    Number(
                        product
                            .wholesaleMinimumQuantity ||
                        DEFAULT_WHOLESALE_MINIMUM
                    ),


                quantity,


                price:
                    appliedPrice,


                appliedPrice,


                priceType
            });
        }


        /* ========================================
           SAVE CART
        ======================================== */

        saveCart(
            cart
        );


        updateCartCount();


        showToast(
            `${product.name} added to cart.`,
            "success"
        );


        /* Reset quantity */

        if (
            quantityInput
        ) {

            quantityInput.value =
                1;
        }


        updateDisplayedPrice(
            product,
            1
        );
    }


    /* ========================================
       GET CART
    ======================================== */

    function getCart() {

        const storageKeys = [
            "ismCart",
            "cart"
        ];


        for (
            const key of storageKeys
        ) {

            try {

                const stored =
                    localStorage.getItem(
                        key
                    );


                if (!stored) {
                    continue;
                }


                const parsed =
                    JSON.parse(
                        stored
                    );


                if (
                    Array.isArray(
                        parsed
                    )
                ) {

                    return parsed;
                }


            } catch (error) {

                console.error(
                    `Unable to read ${key}:`,
                    error
                );
            }
        }


        return [];
    }


    /* ========================================
       SAVE CART
    ======================================== */

    function saveCart(cart) {

        try {

            localStorage.setItem(
                "ismCart",
                JSON.stringify(
                    cart
                )
            );


            /*
            Keep legacy cart key synchronized
            if another page still uses "cart".
            */

            localStorage.setItem(
                "cart",
                JSON.stringify(
                    cart
                )
            );


        } catch (error) {

            console.error(
                "Unable to save cart:",
                error
            );


            showToast(
                "Unable to update your cart.",
                "error"
            );
        }
    }


    /* ========================================
       UPDATE CART COUNT
    ======================================== */

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


        if (
            cartCount
        ) {

            cartCount.textContent =
                totalQuantity;


            cartCount.style.display =
                totalQuantity > 0
                    ? "flex"
                    : "none";
        }


        /*
        Update any other cart badges
        used by the common navbar.
        */

        document
            .querySelectorAll(
                ".cart-count"
            )
            .forEach(
                (badge) => {

                    badge.textContent =
                        totalQuantity;


                    badge.style.display =
                        totalQuantity > 0
                            ? "flex"
                            : "none";
                }
            );
    }


    /* ========================================
       FILTER PRODUCTS
    ======================================== */

    function filterProducts() {

        const searchText =
            String(
                searchInput?.value ||
                ""
            )
                .trim()
                .toLowerCase();


        const selectCategory =
            normalizeCategoryValue(
                categoryFilter?.value ||
                ""
            );


        const selectedCategory =
            activeCategory ||
            selectCategory;


        const filteredProducts =
            allProducts.filter(
                (product) => {

                    const name =
                        String(
                            product.name ||
                            ""
                        )
                            .trim()
                            .toLowerCase();


                    const description =
                        String(
                            product.description ||
                            ""
                        )
                            .trim()
                            .toLowerCase();


                    const brand =
                        String(
                            product.brand ||
                            ""
                        )
                            .trim()
                            .toLowerCase();


                    const netContent =
                        String(
                            product.netContent ||
                            ""
                        )
                            .trim()
                            .toLowerCase();


                    const category =
                        normalizeCategoryValue(
                            product.category ||
                            ""
                        );


                    const categoryText =
                        String(
                            product.category ||
                            ""
                        )
                            .trim()
                            .toLowerCase();


                    const matchesSearch =
                        !searchText ||

                        name.includes(
                            searchText
                        ) ||

                        description.includes(
                            searchText
                        ) ||

                        brand.includes(
                            searchText
                        ) ||

                        netContent.includes(
                            searchText
                        ) ||

                        categoryText.includes(
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
       NORMALIZE CATEGORY

       Supports:
       Juice / Juices
       Sweet / Sweets
       Bite / Bites
       BottleWater / Bottle Water /
       Bottled Water / bottled-water
       Rice
    ======================================== */

    function normalizeCategoryValue(
        category
    ) {

        const value =
            String(
                category ||
                ""
            )
                .trim()
                .toLowerCase()
                .replaceAll(
                    "_",
                    "-"
                )
                .replace(
                    /\s+/g,
                    "-"
                );


        switch (value) {

            case "":
            case "all":
            case "all-product":
            case "all-products":
            case "all-category":
            case "all-categories":

                return "";


            case "juice":
            case "juices":

                return "juice";


            case "sweet":
            case "sweets":

                return "sweets";


            case "bite":
            case "bites":

                return "bites";


            case "bottlewater":
            case "bottle-water":
            case "bottledwater":
            case "bottled-water":
            case "water":

                return "bottled-water";


            case "rice":
            case "rices":

                return "rice";


            default:

                return value;
        }
    }
        /* ========================================
       CREATE CATEGORY OPTIONS
    ======================================== */

    function createCategoryOptions() {

        if (!categoryFilter) {
            return;
        }


        const previousValue =
            normalizeCategoryValue(
                categoryFilter.value ||
                activeCategory ||
                ""
            );


        categoryFilter.innerHTML = `

            <option value="">
                All Categories
            </option>


            <option value="juice">
                Juices
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


        categoryFilter.value =
            previousValue;
    }


    /* ========================================
       SHOW LOADING
    ======================================== */

    function showLoading() {

        productContainer.innerHTML = `
            <div class="products-message">

                <i class="fas fa-spinner fa-spin"></i>

                <h3>
                    Loading Products...
                </h3>

                <p>
                    Please wait while products are loading.
                </p>

            </div>
        `;
    }


    /* ========================================
       SHOW ERROR
    ======================================== */

    function showProductsError(
        message
    ) {

        productContainer.innerHTML = `
            <div class="products-message error">

                <i class="fas fa-circle-exclamation"></i>

                <h3>
                    Unable to Load Products
                </h3>

                <p>
                    ${escapeHTML(
                        message ||
                        "Please try again."
                    )}
                </p>

            </div>
        `;
    }


    /* ========================================
       TOAST / NOTIFICATION
    ======================================== */

    function showToast(
        message,
        type = "success"
    ) {

        const oldToast =
            document.querySelector(
                ".product-toast"
            );


        oldToast?.remove();


        const toast =
            document.createElement(
                "div"
            );


        toast.className =
            `product-toast product-toast-${type}`;


        toast.innerHTML = `

            <i
                class="fas ${
                    type === "success"
                        ? "fa-circle-check"
                        : "fa-circle-exclamation"
                }"
            ></i>

            <span>
                ${escapeHTML(message)}
            </span>
        `;


        document.body.appendChild(
            toast
        );


        requestAnimationFrame(
            () => {

                toast.classList.add(
                    "show"
                );
            }
        );


        window.setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );


                window.setTimeout(
                    () => {

                        toast.remove();

                    },
                    300
                );

            },
            2500
        );
    }


    /* ========================================
       FORMAT CATEGORY
    ======================================== */

    function formatCategory(
        category
    ) {

        const normalized =
            normalizeCategoryValue(
                category
            );


        const labels = {

            juice:
                "Juices",


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
                normalized
            ] ||
            category ||
            "General"
        );
    }


    /* ========================================
       FORMAT PRICE
    ======================================== */

    function formatPrice(
        price
    ) {

        const numericPrice =
            Number(
                price ||
                0
            );


        return numericPrice
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

            try {

                return await response.json();

            } catch {

                return {};
            }
        }


        const text =
            await response.text();


        return {
            success:
                response.ok,

            message:
                text ||
                `Server returned status ${response.status}.`
        };
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


    /* ========================================
       ESCAPE ATTRIBUTE
    ======================================== */

    function escapeAttribute(
        value
    ) {

        return escapeHTML(
            value
        );
    }


    /* ========================================
       ESCAPE CSS SELECTOR
    ======================================== */

    function escapeSelector(
        value
    ) {

        const stringValue =
            String(
                value ??
                ""
            );


        if (
            window.CSS &&
            typeof CSS.escape ===
                "function"
        ) {

            return CSS.escape(
                stringValue
            );
        }


        return stringValue
            .replaceAll(
                "\\",
                "\\\\"
            )
            .replaceAll(
                '"',
                '\\"'
            );
    }


    /* ========================================
       INITIAL CATEGORY BUTTON ACTIVE STATE
    ======================================== */

    function initializeCategoryButtonState() {

        if (
            !categoryButtons.length
        ) {
            return;
        }


        let activeButtonFound =
            false;


        categoryButtons.forEach(
            (button) => {

                const category =
                    normalizeCategoryValue(
                        button.dataset.category ||
                        button.dataset.filter ||
                        button.textContent ||
                        ""
                    );


                if (
                    !activeButtonFound &&
                    category === ""
                ) {

                    button.classList.add(
                        "active"
                    );


                    activeButtonFound =
                        true;

                } else {

                    button.classList.remove(
                        "active"
                    );
                }
            }
        );
    }


    initializeCategoryButtonState();

}