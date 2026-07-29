const PRODUCT_API_URL = "http://localhost:5000/api/products";

let allProducts = [];
let productToDeleteId = null;

document.addEventListener("DOMContentLoaded", () => {
    initializeProductPage();
});

function initializeProductPage() {
    const openAddButton = document.getElementById(
        "openAddProductButton"
    );

    const closeModalButton = document.getElementById(
        "closeModalButton"
    );

    const cancelProductButton = document.getElementById(
        "cancelProductButton"
    );

    const cancelDeleteButton = document.getElementById(
        "cancelDeleteButton"
    );

    const confirmDeleteButton = document.getElementById(
        "confirmDeleteButton"
    );

    const productForm = document.getElementById(
        "productForm"
    );

    const productSearch = document.getElementById(
        "productSearch"
    );

    const categoryFilter = document.getElementById(
        "categoryFilter"
    );

    openAddButton.addEventListener("click", openAddModal);

    closeModalButton.addEventListener(
        "click",
        closeProductModal
    );

    cancelProductButton.addEventListener(
        "click",
        closeProductModal
    );

    cancelDeleteButton.addEventListener(
        "click",
        closeDeleteModal
    );

    confirmDeleteButton.addEventListener(
        "click",
        deleteProduct
    );

    productForm.addEventListener(
        "submit",
        saveProduct
    );

    productSearch.addEventListener(
        "input",
        filterProducts
    );

    categoryFilter.addEventListener(
        "change",
        filterProducts
    );

    loadProducts();
}

async function loadProducts() {
    const tableBody = document.getElementById(
        "productTableBody"
    );

    tableBody.innerHTML = `
        <tr>
            <td colspan="7" class="table-message">
                Loading products...
            </td>
        </tr>
    `;

    try {
        const response = await fetch(PRODUCT_API_URL);

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message || "Unable to load products."
            );
        }

        allProducts = extractProducts(result);

        updateProductCount(allProducts.length);
        populateCategoryFilter();
        renderProducts(allProducts);
    } catch (error) {
        console.error("Load products error:", error);

        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="table-message error-text">
                    ${escapeHtml(error.message)}
                </td>
            </tr>
        `;
    }
}

function extractProducts(result) {
    if (Array.isArray(result)) {
        return result;
    }

    if (Array.isArray(result.data)) {
        return result.data;
    }

    if (Array.isArray(result.products)) {
        return result.products;
    }

    return [];
}

function renderProducts(products) {
    const tableBody = document.getElementById(
        "productTableBody"
    );

    if (!products.length) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="table-message">
                    No products found.
                </td>
            </tr>
        `;

        return;
    }

    tableBody.innerHTML = products
        .map((product) => {
            const productId = product._id || product.id;

            const name =
                product.name ||
                product.productName ||
                "Unnamed Product";

            const category =
                product.category ||
                "Uncategorized";

            const price = Number(
                product.price || 0
            ).toLocaleString("en-LK", {
                style: "currency",
                currency: "LKR"
            });

            const stock = Number(
                product.stock ??
                product.quantity ??
                0
            );

            const status =
                product.status ||
                (stock > 0 ? "active" : "inactive");

            const image =
                product.image ||
                product.imageUrl ||
                product.imageURL ||
                "";

            return `
                <tr>

                    <td>
                        <div class="product-table-image">
                            ${
                                image
                                    ? `
                                        <img
                                            src="${escapeHtml(image)}"
                                            alt="${escapeHtml(name)}"
                                            onerror="this.style.display='none'; this.nextElementSibling.style.display='grid';"
                                        >

                                        <div
                                            class="image-placeholder"
                                            style="display:none;"
                                        >
                                            <i class="fas fa-box"></i>
                                        </div>
                                    `
                                    : `
                                        <div class="image-placeholder">
                                            <i class="fas fa-box"></i>
                                        </div>
                                    `
                            }
                        </div>
                    </td>

                    <td>
                        <strong>
                            ${escapeHtml(name)}
                        </strong>

                        <small class="table-description">
                            ${escapeHtml(
                                shortenText(
                                    product.description || "",
                                    45
                                )
                            )}
                        </small>
                    </td>

                    <td>
                        ${escapeHtml(category)}
                    </td>

                    <td>
                        <strong>${price}</strong>
                    </td>

                    <td>
                        <span class="${
                            stock > 0
                                ? "stock-available"
                                : "stock-empty"
                        }">
                            ${stock}
                        </span>
                    </td>

                    <td>
                        <span class="status-badge status-${escapeHtml(status)}">
                            ${escapeHtml(status)}
                        </span>
                    </td>

                    <td>
                        <div class="table-actions">

                            <button
                                class="action-button edit-button"
                                type="button"
                                title="Edit Product"
                                onclick="openEditModal('${productId}')"
                            >
                                <i class="fas fa-pen"></i>
                            </button>

                            <button
                                class="action-button delete-button"
                                type="button"
                                title="Delete Product"
                                onclick="openDeleteModal('${productId}')"
                            >
                                <i class="fas fa-trash"></i>
                            </button>

                        </div>
                    </td>

                </tr>
            `;
        })
        .join("");
}

function openAddModal() {
    document.getElementById("modalTitle").textContent =
        "Add Product";

    document.getElementById("productForm").reset();

    document.getElementById("productId").value = "";

    document.getElementById("productStatus").value =
        "active";

    document.getElementById("saveProductButton").innerHTML = `
        <i class="fas fa-save"></i>
        Save Product
    `;

    document
        .getElementById("productModal")
        .classList.add("show");
}

function openEditModal(productId) {
    const product = allProducts.find(
        (item) =>
            String(item._id || item.id) === String(productId)
    );

    if (!product) {
        showPageMessage(
            "Product not found.",
            "error"
        );

        return;
    }

    document.getElementById("modalTitle").textContent =
        "Edit Product";

    document.getElementById("productId").value =
        productId;

    document.getElementById("productName").value =
        product.name ||
        product.productName ||
        "";

    document.getElementById("productCategory").value =
        product.category ||
        "";

    document.getElementById("productPrice").value =
        product.price ??
        "";

    document.getElementById("productStock").value =
        product.stock ??
        product.quantity ??
        0;

    document.getElementById("productImage").value =
        product.image ||
        product.imageUrl ||
        product.imageURL ||
        "";

    document.getElementById("productStatus").value =
        product.status ||
        "active";

    document.getElementById(
        "productDescription"
    ).value = product.description || "";

    document.getElementById(
        "saveProductButton"
    ).innerHTML = `
        <i class="fas fa-pen"></i>
        Update Product
    `;

    document
        .getElementById("productModal")
        .classList.add("show");
}

async function saveProduct(event) {
    event.preventDefault();

    const productId = document
        .getElementById("productId")
        .value
        .trim();

    const name = document
        .getElementById("productName")
        .value
        .trim();

    const category = document
        .getElementById("productCategory")
        .value
        .trim();

    const price = Number(
        document.getElementById("productPrice").value
    );

    const stock = Number(
        document.getElementById("productStock").value
    );

    const image = document
        .getElementById("productImage")
        .value
        .trim();

    const status = document
        .getElementById("productStatus")
        .value;

    const description = document
        .getElementById("productDescription")
        .value
        .trim();

    if (
        !name ||
        !category ||
        Number.isNaN(price) ||
        Number.isNaN(stock) ||
        !description
    ) {
        showPageMessage(
            "Please fill in all required fields.",
            "error"
        );

        return;
    }

    const productData = {
        name,
        category,
        price,
        stock,
        image,
        status,
        description
    };

    const saveButton = document.getElementById(
        "saveProductButton"
    );

    try {
        saveButton.disabled = true;

        saveButton.innerHTML = `
            <i class="fas fa-spinner fa-spin"></i>
            Saving...
        `;

        const token = localStorage.getItem("token");

        const url = productId
            ? `${PRODUCT_API_URL}/${productId}`
            : PRODUCT_API_URL;

        const method = productId
            ? "PUT"
            : "POST";

        const response = await fetch(url, {
            method,

            headers: {
                "Content-Type": "application/json",

                ...(token
                    ? {
                        Authorization: `Bearer ${token}`
                    }
                    : {})
            },

            body: JSON.stringify(productData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message ||
                "Unable to save product."
            );
        }

        closeProductModal();

        showPageMessage(
            productId
                ? "Product updated successfully."
                : "Product added successfully.",
            "success"
        );

        await loadProducts();
    } catch (error) {
        console.error("Save product error:", error);

        showPageMessage(
            error.message,
            "error"
        );
    } finally {
        saveButton.disabled = false;

        saveButton.innerHTML = productId
            ? `
                <i class="fas fa-pen"></i>
                Update Product
            `
            : `
                <i class="fas fa-save"></i>
                Save Product
            `;
    }
}

function openDeleteModal(productId) {
    const product = allProducts.find(
        (item) =>
            String(item._id || item.id) === String(productId)
    );

    if (!product) {
        showPageMessage(
            "Product not found.",
            "error"
        );

        return;
    }

    productToDeleteId = productId;

    document.getElementById(
        "deleteProductName"
    ).textContent =
        product.name ||
        product.productName ||
        "this product";

    document
        .getElementById("deleteModal")
        .classList.add("show");
}

async function deleteProduct() {
    if (!productToDeleteId) {
        return;
    }

    const confirmButton = document.getElementById(
        "confirmDeleteButton"
    );

    try {
        confirmButton.disabled = true;

        confirmButton.innerHTML = `
            <i class="fas fa-spinner fa-spin"></i>
            Deleting...
        `;

        const token = localStorage.getItem("token");

        const response = await fetch(
            `${PRODUCT_API_URL}/${productToDeleteId}`,
            {
                method: "DELETE",

                headers: token
                    ? {
                        Authorization: `Bearer ${token}`
                    }
                    : {}
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message ||
                "Unable to delete product."
            );
        }

        closeDeleteModal();

        showPageMessage(
            "Product deleted successfully.",
            "success"
        );

        await loadProducts();
    } catch (error) {
        console.error("Delete product error:", error);

        closeDeleteModal();

        showPageMessage(
            error.message,
            "error"
        );
    } finally {
        confirmButton.disabled = false;

        confirmButton.innerHTML = `
            <i class="fas fa-trash"></i>
            Delete
        `;
    }
}

function filterProducts() {
    const searchValue = document
        .getElementById("productSearch")
        .value
        .trim()
        .toLowerCase();

    const selectedCategory = document
        .getElementById("categoryFilter")
        .value
        .toLowerCase();

    const filteredProducts = allProducts.filter(
        (product) => {
            const name = String(
                product.name ||
                product.productName ||
                ""
            ).toLowerCase();

            const category = String(
                product.category ||
                ""
            ).toLowerCase();

            const matchesSearch =
                name.includes(searchValue) ||
                category.includes(searchValue);

            const matchesCategory =
                !selectedCategory ||
                category === selectedCategory;

            return matchesSearch && matchesCategory;
        }
    );

    renderProducts(filteredProducts);
}

function populateCategoryFilter() {
    const categoryFilter = document.getElementById(
        "categoryFilter"
    );

    const currentValue = categoryFilter.value;

    const categories = [
        ...new Set(
            allProducts
                .map((product) =>
                    String(
                        product.category || ""
                    ).trim()
                )
                .filter(Boolean)
        )
    ].sort();

    categoryFilter.innerHTML = `
        <option value="">All Categories</option>

        ${categories
            .map(
                (category) => `
                    <option value="${escapeHtml(category)}">
                        ${escapeHtml(category)}
                    </option>
                `
            )
            .join("")}
    `;

    categoryFilter.value = currentValue;
}

function updateProductCount(count) {
    document.getElementById(
        "productCount"
    ).textContent = count;
}

function closeProductModal() {
    document
        .getElementById("productModal")
        .classList.remove("show");

    document.getElementById("productForm").reset();
    document.getElementById("productId").value = "";
}

function closeDeleteModal() {
    document
        .getElementById("deleteModal")
        .classList.remove("show");

    productToDeleteId = null;
}

function showPageMessage(message, type) {
    const container = document.getElementById(
        "pageMessage"
    );

    container.innerHTML = `
        <div class="page-alert page-alert-${type}">
            ${escapeHtml(message)}
        </div>
    `;

    setTimeout(() => {
        container.innerHTML = "";
    }, 4000);
}

function shortenText(text, length) {
    const cleanText = String(text || "");

    if (cleanText.length <= length) {
        return cleanText;
    }

    return cleanText.substring(0, length) + "...";
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

window.openEditModal = openEditModal;
window.openDeleteModal = openDeleteModal;