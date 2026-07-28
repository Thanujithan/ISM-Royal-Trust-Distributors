document.addEventListener("DOMContentLoaded", () => {

    const productGrid = document.getElementById("productGrid");
    const searchInput = document.getElementById("searchInput");
    const filterButtons =
        document.querySelectorAll(".filter-buttons button");

    let allProducts = [];
    let selectedCategory = "all";

    async function loadProducts() {
        try {
            productGrid.innerHTML =
                '<p class="loading-message">Loading products...</p>';

            const response = await fetch(
                "http://localhost:5000/api/products"
            );

            if (!response.ok) {
                throw new Error("Failed to load products");
            }

            allProducts = await response.json();

            displayProducts(allProducts);

        } catch (error) {
            console.error("Product loading error:", error);

            productGrid.innerHTML = `
                <p class="product-error">
                    Unable to load products. Please try again.
                </p>
            `;
        }
    }

    function displayProducts(products) {

        if (products.length === 0) {
            productGrid.innerHTML = `
                <p class="no-products">
                    No products found.
                </p>
            `;
            return;
        }

        productGrid.innerHTML = products.map(product => {

            const stockText =
                product.stock > 0 && product.isAvailable
                    ? "In Stock"
                    : "Out of Stock";

            const stockClass =
                product.stock > 0 && product.isAvailable
                    ? "in-stock"
                    : "out-of-stock";

            return `
                <div class="product-card">
                    <img
                        src="${product.image}"
                        alt="${product.name}"
                    >

                    <div class="product-info">

                        <span class="category">
                            ${product.category}
                        </span>

                        <h3>${product.name}</h3>

                        <p class="brand">
                            ${product.brand}
                        </p>

                        <div class="price">
                            Rs. ${Number(product.price).toLocaleString(
                                "en-LK",
                                {
                                    minimumFractionDigits: 2
                                }
                            )}
                        </div>

                        <div class="stock ${stockClass}">
                            <i class="fas fa-circle"></i>
                            ${stockText}
                        </div>

                        <div class="buttons">

                            <a
                                href="#"
                                class="btn-view"
                                data-id="${product._id}"
                            >
                                View Details
                            </a>

                            <button
                                class="btn-cart"
                                data-id="${product._id}"
                                ${stockText === "Out of Stock"
                                    ? "disabled"
                                    : ""}
                            >
                                <i class="fas fa-cart-plus"></i>
                            </button>

                        </div>
                    </div>
                </div>
            `;
        }).join("");

        addProductEvents();
        observeProductCards();
    }

    function filterProducts() {

        const searchValue =
            searchInput.value.trim().toLowerCase();

        const filteredProducts = allProducts.filter(product => {

            const matchesSearch =
                product.name.toLowerCase().includes(searchValue) ||
                product.brand.toLowerCase().includes(searchValue) ||
                product.category.toLowerCase().includes(searchValue);

            const matchesCategory =
                selectedCategory === "all" ||
                product.category.toLowerCase() === selectedCategory;

            return matchesSearch && matchesCategory;
        });

        displayProducts(filteredProducts);
    }

    searchInput.addEventListener("input", filterProducts);

    filterButtons.forEach(button => {

        button.addEventListener("click", () => {

            filterButtons.forEach(btn =>
                btn.classList.remove("active")
            );

            button.classList.add("active");

            selectedCategory =
                button.textContent.trim().toLowerCase();

            filterProducts();
        });
    });

    function addProductEvents() {

        document.querySelectorAll(".btn-cart").forEach(button => {

            button.addEventListener("click", () => {

                const productId = button.dataset.id;

                const product = allProducts.find(
                    item => item._id === productId
                );

                if (product) {
                    alert(
                        `${product.name} added to cart successfully.`
                    );
                }
            });
        });

        document.querySelectorAll(".btn-view").forEach(button => {

            button.addEventListener("click", event => {
                event.preventDefault();

                const productId = button.dataset.id;

                const product = allProducts.find(
                    item => item._id === productId
                );

                if (product) {
                    alert(
                        `${product.name}\n\n${product.description}`
                    );
                }
            });
        });
    }

    function observeProductCards() {

        const productCards =
            document.querySelectorAll(".product-card");

        const observer = new IntersectionObserver(entries => {

            entries.forEach(entry => {

                if (entry.isIntersecting) {
                    entry.target.style.opacity = "1";
                    entry.target.style.transform =
                        "translateY(0)";

                    observer.unobserve(entry.target);
                }
            });

        }, {
            threshold: 0.2
        });

        productCards.forEach(card => {

            card.style.opacity = "0";
            card.style.transform = "translateY(30px)";
            card.style.transition = ".6s";

            observer.observe(card);
        });
    }

    window.addEventListener("scroll", () => {

        const header = document.querySelector("header");

        if (window.scrollY > 50) {
            header.style.boxShadow =
                "0 5px 15px rgba(0,0,0,.2)";
        } else {
            header.style.boxShadow = "none";
        }
    });

    loadProducts();
});