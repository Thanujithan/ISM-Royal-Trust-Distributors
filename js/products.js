document.addEventListener("DOMContentLoaded", () => {
    const API_URL = "http://localhost:5000/api/products";

    const productContainer =
        document.getElementById("productContainer") ||
        document.getElementById("productsContainer") ||
        document.getElementById("productGrid") ||
        document.querySelector(".product-grid");

    const searchInput =
        document.getElementById("productSearch") ||
        document.getElementById("searchInput");

    const categoryFilter =
        document.getElementById("categoryFilter");

    const cartCount =
        document.getElementById("cartCount");

    let allProducts = [];

    if (!productContainer) {
        console.error(
            "Product container not found. Add id='productContainer' to the HTML."
        );

        return;
    }

    updateCartCount();
    loadProducts();

    if (searchInput) {
        searchInput.addEventListener("input", filterProducts);
    }

    if (categoryFilter) {
        categoryFilter.addEventListener("change", filterProducts);
    }

    async function loadProducts() {
        showLoading();

        try {
            const response = await fetch(API_URL);

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "Unable to fetch products."
                );
            }

            /*
             API response:

             {
                 success: true,
                 count: 1,
                 data: [...]
             }
            */

            if (!result.success || !Array.isArray(result.data)) {
                throw new Error("Invalid product response.");
            }

            allProducts = result.data.filter((product) => {
                return (
                    product.status === "active" &&
                    product.isAvailable !== false
                );
            });

            createCategoryOptions();
            displayProducts(allProducts);
        } catch (error) {
            console.error("Product loading error:", error);

            productContainer.innerHTML = `
                <div class="products-message error-message">
                    <i class="fas fa-exclamation-circle"></i>

                    <h3>Unable to load products</h3>

                    <p>
                        Please make sure the backend server is running
                        and try again.
                    </p>

                    <button
                        type="button"
                        class="retry-button"
                        id="retryProductsButton"
                    >
                        <i class="fas fa-rotate-right"></i>
                        Try Again
                    </button>
                </div>
            `;

            const retryButton = document.getElementById(
                "retryProductsButton"
            );

            if (retryButton) {
                retryButton.addEventListener(
                    "click",
                    loadProducts
                );
            }
        }
    }

    function displayProducts(products) {
        if (!products.length) {
            productContainer.innerHTML = `
                <div class="products-message">
                    <i class="fas fa-box-open"></i>

                    <h3>No products found</h3>

                    <p>
                        There are currently no matching products.
                    </p>
                </div>
            `;

            return;
        }

        productContainer.innerHTML = products
            .map((product) => {
                const productId = product._id;

                const productName = escapeHTML(
                    product.name || "Unnamed Product"
                );

                const description = escapeHTML(
                    product.description ||
                    "No description available."
                );

                const category = escapeHTML(
                    product.category || "General"
                );

                const brand = escapeHTML(
                    product.brand || "ISM"
                );

                const image =
                    product.image ||
                    "images/products/default-product.jpg";

                const price = Number(
                    product.price || 0
                );

                const stock = Number(
                    product.stock || 0
                );

                const stockStatus =
                    stock > 0
                        ? `<span class="in-stock">
                               In Stock: ${stock}
                           </span>`
                        : `<span class="out-of-stock">
                               Out of Stock
                           </span>`;

                const buttonContent =
                    stock > 0
                        ? `
                            <i class="fas fa-cart-plus"></i>
                            Add to Cart
                          `
                        : `
                            <i class="fas fa-ban"></i>
                            Out of Stock
                          `;

                return `
                    <article
                        class="product-card"
                        data-product-id="${productId}"
                    >
                        <div class="product-image-container">
                            <img
                                src="${escapeAttribute(image)}"
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

                        <div class="product-details">
                            <p class="product-brand">
                                ${brand}
                            </p>

                            <h3 class="product-name">
                                ${productName}
                            </h3>

                            <p class="product-description">
                                ${description}
                            </p>

                            <div class="product-stock">
                                ${stockStatus}
                            </div>

                            <div class="product-bottom">
                                <div class="product-price">
                                    <span class="currency">
                                        LKR
                                    </span>

                                    <span class="price-value">
                                        ${formatPrice(price)}
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    class="add-cart-button"
                                    data-product-id="${productId}"
                                    ${stock <= 0 ? "disabled" : ""}
                                >
                                    ${buttonContent}
                                </button>
                            </div>
                        </div>
                    </article>
                `;
            })
            .join("");

        addCartButtonEvents();
    }

    function addCartButtonEvents() {
        const buttons = productContainer.querySelectorAll(
            ".add-cart-button"
        );

        buttons.forEach((button) => {
            button.addEventListener("click", () => {
                const productId =
                    button.dataset.productId;

                addToCart(productId, button);
            });
        });
    }

    function addToCart(productId, button) {
        const product = allProducts.find(
            (item) => item._id === productId
        );

        if (!product) {
            showNotification(
                "Product could not be found.",
                "error"
            );

            return;
        }

        if (Number(product.stock) <= 0) {
            showNotification(
                "This product is currently out of stock.",
                "error"
            );

            return;
        }

        const cart = getCart();

        const existingProduct = cart.find(
            (item) => item._id === product._id
        );

        if (existingProduct) {
            if (
                existingProduct.quantity >=
                Number(product.stock)
            ) {
                showNotification(
                    "Maximum available stock has been added.",
                    "error"
                );

                return;
            }

            existingProduct.quantity += 1;
        } else {
            cart.push({
                _id: product._id,
                name: product.name,
                category: product.category,
                brand: product.brand,
                price: Number(product.price),
                stock: Number(product.stock),
                image: product.image,
                quantity: 1
            });
        }

        localStorage.setItem(
            "ismCart",
            JSON.stringify(cart)
        );

        updateCartCount();
        showNotification(
            `${product.name} added to cart.`,
            "success"
        );

        showAddedButtonState(button);
    }

    function getCart() {
        try {
            const savedCart = JSON.parse(
                localStorage.getItem("ismCart")
            );

            return Array.isArray(savedCart)
                ? savedCart
                : [];
        } catch (error) {
            console.error(
                "Unable to read shopping cart:",
                error
            );

            return [];
        }
    }

    function updateCartCount() {
        const cart = getCart();

        const totalQuantity = cart.reduce(
            (total, item) => {
                return total + Number(item.quantity || 0);
            },
            0
        );

        if (cartCount) {
            cartCount.textContent = totalQuantity;
        }

        document
            .querySelectorAll(".cart-count")
            .forEach((element) => {
                element.textContent = totalQuantity;
            });
    }

    function filterProducts() {
        const searchValue = searchInput
            ? searchInput.value.trim().toLowerCase()
            : "";

        const selectedCategory = categoryFilter
            ? categoryFilter.value.toLowerCase()
            : "all";

        const filteredProducts = allProducts.filter(
            (product) => {
                const name = String(
                    product.name || ""
                ).toLowerCase();

                const description = String(
                    product.description || ""
                ).toLowerCase();

                const brand = String(
                    product.brand || ""
                ).toLowerCase();

                const category = String(
                    product.category || ""
                ).toLowerCase();

                const matchesSearch =
                    name.includes(searchValue) ||
                    description.includes(searchValue) ||
                    brand.includes(searchValue) ||
                    category.includes(searchValue);

                const matchesCategory =
                    selectedCategory === "all" ||
                    category === selectedCategory;

                return (
                    matchesSearch &&
                    matchesCategory
                );
            }
        );

        displayProducts(filteredProducts);
    }

    function createCategoryOptions() {
        if (!categoryFilter) {
            return;
        }

        const categories = [
            ...new Set(
                allProducts
                    .map((product) => product.category)
                    .filter(Boolean)
            )
        ];

        categoryFilter.innerHTML = `
            <option value="all">
                All Categories
            </option>

            ${categories
                .map((category) => {
                    return `
                        <option
                            value="${escapeAttribute(
                                category.toLowerCase()
                            )}"
                        >
                            ${escapeHTML(category)}
                        </option>
                    `;
                })
                .join("")}
        `;
    }

    function showLoading() {
        productContainer.innerHTML = `
            <div class="products-loading">
                <i class="fas fa-spinner fa-spin"></i>

                <p>Loading products...</p>
            </div>
        `;
    }

    function showAddedButtonState(button) {
        if (!button) {
            return;
        }

        const originalContent = button.innerHTML;

        button.disabled = true;

        button.innerHTML = `
            <i class="fas fa-check"></i>
            Added
        `;

        button.classList.add("added");

        window.setTimeout(() => {
            button.disabled = false;
            button.innerHTML = originalContent;
            button.classList.remove("added");
        }, 1000);
    }

    function showNotification(text, type) {
        const oldNotification =
            document.querySelector(".product-notification");

        if (oldNotification) {
            oldNotification.remove();
        }

        const notification =
            document.createElement("div");

        notification.className =
            `product-notification ${type}`;

        notification.innerHTML = `
            <i class="${
                type === "success"
                    ? "fas fa-circle-check"
                    : "fas fa-circle-exclamation"
            }"></i>

            <span>${escapeHTML(text)}</span>
        `;

        document.body.appendChild(notification);

        window.setTimeout(() => {
            notification.classList.add("show");
        }, 50);

        window.setTimeout(() => {
            notification.classList.remove("show");

            window.setTimeout(() => {
                notification.remove();
            }, 300);
        }, 2500);
    }

    function formatPrice(price) {
        return Number(price).toLocaleString(
            "en-LK",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );
    }

    function escapeHTML(value) {
        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function escapeAttribute(value) {
        return escapeHTML(value);
    }
});