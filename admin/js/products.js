const PRODUCT_API_URL =
    "http://localhost:5000/api/products";

const BACKEND_URL =
    "http://localhost:5000";

let allProducts = [];
let productToDeleteId = null;

document.addEventListener(
    "DOMContentLoaded",
    () => {
        initializeProductPage();
    }
);

function initializeProductPage() {
    const openAddButton =
        document.getElementById(
            "openAddProductButton"
        );

    const closeModalButton =
        document.getElementById(
            "closeModalButton"
        );

    const cancelProductButton =
        document.getElementById(
            "cancelProductButton"
        );

    const cancelDeleteButton =
        document.getElementById(
            "cancelDeleteButton"
        );

    const confirmDeleteButton =
        document.getElementById(
            "confirmDeleteButton"
        );

    const productForm =
        document.getElementById(
            "productForm"
        );

    const productSearch =
        document.getElementById(
            "productSearch"
        );

    const categoryFilter =
        document.getElementById(
            "categoryFilter"
        );

    const productImage =
        document.getElementById(
            "productImage"
        );

    openAddButton?.addEventListener(
        "click",
        openAddModal
    );

    closeModalButton?.addEventListener(
        "click",
        closeProductModal
    );

    cancelProductButton?.addEventListener(
        "click",
        closeProductModal
    );

    cancelDeleteButton?.addEventListener(
        "click",
        closeDeleteModal
    );

    confirmDeleteButton?.addEventListener(
        "click",
        deleteProduct
    );

    productForm?.addEventListener(
        "submit",
        saveProduct
    );

    productSearch?.addEventListener(
        "input",
        filterProducts
    );

    categoryFilter?.addEventListener(
        "change",
        filterProducts
    );

    productImage?.addEventListener(
        "change",
        handleImagePreview
    );

    loadProducts();
}

/* ========================================
   AUTH HELPERS
======================================== */

function getAdminToken() {
    return (
        localStorage.getItem("token") ||
        sessionStorage.getItem("token") ||
        localStorage.getItem("adminToken") ||
        sessionStorage.getItem("adminToken")
    );
}

function getAuthorizationHeaders() {
    const token = getAdminToken();

    return token
        ? {
            Authorization:
                `Bearer ${token}`
        }
        : {};
}

/* ========================================
   LOAD PRODUCTS
======================================== */

async function loadProducts() {
    const tableBody =
        document.getElementById(
            "productTableBody"
        );

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = `
        <tr>
            <td
                colspan="7"
                class="table-message"
            >
                Loading products...
            </td>
        </tr>
    `;

    try {
        const response =
            await fetch(
                PRODUCT_API_URL
            );

        const result =
            await parseResponse(
                response
            );

        if (!response.ok) {
            throw new Error(
                result.message ||
                "Unable to load products."
            );
        }

        allProducts =
            extractProducts(result);

        updateProductCount(
            allProducts.length
        );

        populateCategoryFilter();
        renderProducts(allProducts);
    } catch (error) {
        console.error(
            "Load products error:",
            error
        );

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="table-message error-text"
                >
                    ${escapeHtml(
                        error.message
                    )}
                </td>
            </tr>
        `;
    }
}

function extractProducts(result) {
    if (Array.isArray(result)) {
        return result;
    }

    if (
        Array.isArray(
            result.data
        )
    ) {
        return result.data;
    }

    if (
        Array.isArray(
            result.products
        )
    ) {
        return result.products;
    }

    return [];
}

/* ========================================
   RENDER PRODUCTS
======================================== */

function renderProducts(products) {
    const tableBody =
        document.getElementById(
            "productTableBody"
        );

    if (!tableBody) {
        return;
    }

    if (!products.length) {
        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="table-message"
                >
                    No products found.
                </td>
            </tr>
        `;

        return;
    }

    tableBody.innerHTML =
        products
            .map((product) => {
                const productId =
                    product._id ||
                    product.id;

                const name =
                    product.name ||
                    product.productName ||
                    "Unnamed Product";

                const category =
                    product.category ||
                    "Uncategorized";

                const price =
                    formatCurrency(
                        product.price
                    );

                const stock =
                    Number(
                        product.stock ??
                        product.quantity ??
                        0
                    );

                const status =
                    product.status ||
                    (
                        stock > 0
                            ? "active"
                            : "inactive"
                    );

                const image =
                    getProductImageUrl(
                        product.image ||
                        product.imageUrl ||
                        product.imageURL ||
                        ""
                    );

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
                                                onerror="
                                                    this.style.display='none';
                                                    this.nextElementSibling.style.display='grid';
                                                "
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
                            <strong>
                                ${price}
                            </strong>
                        </td>


                        <td>
                            <span
                                class="${
                                    stock > 0
                                        ? "stock-available"
                                        : "stock-empty"
                                }"
                            >
                                ${stock}
                            </span>
                        </td>


                        <td>
                            <span
                                class="status-badge status-${escapeHtml(
                                    status
                                )}"
                            >
                                ${escapeHtml(status)}
                            </span>
                        </td>


                        <td>
                            <div class="table-actions">

                                <button
                                    class="action-button edit-button"
                                    type="button"
                                    title="Edit Product"
                                    onclick="openEditModal('${escapeHtml(
                                        productId
                                    )}')"
                                >
                                    <i class="fas fa-pen"></i>
                                </button>

                                <button
                                    class="action-button delete-button"
                                    type="button"
                                    title="Delete Product"
                                    onclick="openDeleteModal('${escapeHtml(
                                        productId
                                    )}')"
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

/* ========================================
   ADD PRODUCT MODAL
======================================== */

function openAddModal() {
    const form =
        document.getElementById(
            "productForm"
        );

    form?.reset();

    setInputValue(
        "productId",
        ""
    );

    setInputValue(
        "productStatus",
        "active"
    );

    setText(
        "modalTitle",
        "Add Product"
    );

    hideImagePreview();

    const saveButton =
        document.getElementById(
            "saveProductButton"
        );

    if (saveButton) {
        saveButton.innerHTML = `
            <i class="fas fa-save"></i>
            Save Product
        `;
    }

    document
        .getElementById(
            "productModal"
        )
        ?.classList.add("show");
}

/* ========================================
   EDIT PRODUCT MODAL
======================================== */

function openEditModal(productId) {
    const product =
        allProducts.find(
            (item) =>
                String(
                    item._id ||
                    item.id
                ) ===
                String(productId)
        );

    if (!product) {
        showPageMessage(
            "Product not found.",
            "error"
        );

        return;
    }

    setText(
        "modalTitle",
        "Edit Product"
    );

    setInputValue(
        "productId",
        productId
    );

    setInputValue(
        "productName",
        product.name ||
        product.productName ||
        ""
    );

    setInputValue(
        "productCategory",
        product.category || ""
    );

    setInputValue(
        "productPrice",
        product.price ?? ""
    );

    setInputValue(
        "productStock",
        product.stock ??
        product.quantity ??
        0
    );

    /*
       File input-க்கு existing image path set
       பண்ண முடியாது. அதனால் value clear-ஆ
       வைக்கிறோம்; preview மட்டும் காட்டப்படும்.
    */
    const imageInput =
        document.getElementById(
            "productImage"
        );

    if (imageInput) {
        imageInput.value = "";
    }

    setInputValue(
        "productStatus",
        product.status ||
        "active"
    );

    setInputValue(
        "productDescription",
        product.description ||
        ""
    );

    const existingImage =
        getProductImageUrl(
            product.image ||
            product.imageUrl ||
            product.imageURL ||
            ""
        );

    if (existingImage) {
        showImagePreview(
            existingImage
        );
    } else {
        hideImagePreview();
    }

    const saveButton =
        document.getElementById(
            "saveProductButton"
        );

    if (saveButton) {
        saveButton.innerHTML = `
            <i class="fas fa-pen"></i>
            Update Product
        `;
    }

    document
        .getElementById(
            "productModal"
        )
        ?.classList.add("show");
}

/* ========================================
   IMAGE PREVIEW
======================================== */

function handleImagePreview(event) {
    const file =
        event.target.files?.[0];

    if (!file) {
        hideImagePreview();
        return;
    }

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (
        !allowedTypes.includes(
            file.type
        )
    ) {
        event.target.value = "";

        hideImagePreview();

        showPageMessage(
            "Only JPG, PNG and WEBP images are allowed.",
            "error"
        );

        return;
    }

    const maximumSize =
        5 * 1024 * 1024;

    if (
        file.size > maximumSize
    ) {
        event.target.value = "";

        hideImagePreview();

        showPageMessage(
            "Image size must be 5 MB or less.",
            "error"
        );

        return;
    }

    const previewUrl =
        URL.createObjectURL(file);

    showImagePreview(
        previewUrl
    );
}

function showImagePreview(source) {
    const preview =
        document.getElementById(
            "imagePreview"
        );

    if (!preview) {
        return;
    }

    preview.src = source;
    preview.style.display =
        "block";
}

function hideImagePreview() {
    const preview =
        document.getElementById(
            "imagePreview"
        );

    if (!preview) {
        return;
    }

    preview.src = "";
    preview.style.display =
        "none";
}

/* ========================================
   SAVE PRODUCT
======================================== */

async function saveProduct(event) {
    event.preventDefault();

    const productId =
        getInputValue(
            "productId"
        ).trim();

    const name =
        getInputValue(
            "productName"
        ).trim();

    const category =
        getInputValue(
            "productCategory"
        ).trim();

    const price =
        Number(
            getInputValue(
                "productPrice"
            )
        );

    const stock =
        Number(
            getInputValue(
                "productStock"
            )
        );

    const status =
        getInputValue(
            "productStatus"
        );

    const description =
        getInputValue(
            "productDescription"
        ).trim();

    const imageInput =
        document.getElementById(
            "productImage"
        );

    const imageFile =
        imageInput?.files?.[0] ||
        null;

    if (
        !name ||
        !category ||
        Number.isNaN(price) ||
        price < 0 ||
        Number.isNaN(stock) ||
        stock < 0 ||
        !description
    ) {
        showPageMessage(
            "Please fill in all required fields correctly.",
            "error"
        );

        return;
    }

    /*
       Add product செய்யும்போது image required.
       Edit product செய்யும்போது புதிய image optional.
    */
    if (
        !productId &&
        !imageFile
    ) {
        showPageMessage(
            "Please select a product image.",
            "error"
        );

        return;
    }

    const formData =
        new FormData();

    formData.append(
        "name",
        name
    );

    formData.append(
        "category",
        category
    );

    formData.append(
        "price",
        String(price)
    );

    formData.append(
        "stock",
        String(stock)
    );

    formData.append(
        "status",
        status
    );

    formData.append(
        "description",
        description
    );

    formData.append(
        "isAvailable",
        String(
            status === "active"
        )
    );

    if (imageFile) {
        formData.append(
            "image",
            imageFile
        );
    }

    const saveButton =
        document.getElementById(
            "saveProductButton"
        );

    try {
        if (saveButton) {
            saveButton.disabled =
                true;

            saveButton.innerHTML = `
                <i class="fas fa-spinner fa-spin"></i>
                Saving...
            `;
        }

        const url =
            productId
                ? `${PRODUCT_API_URL}/${productId}`
                : PRODUCT_API_URL;

        const method =
            productId
                ? "PUT"
                : "POST";

        const response =
            await fetch(
                url,
                {
                    method,

                    headers:
                        getAuthorizationHeaders(),

                    body:
                        formData
                }
            );

        const result =
            await parseResponse(
                response
            );

        if (
            response.status === 401 ||
            response.status === 403
        ) {
            throw new Error(
                "Admin login expired. Please login again."
            );
        }

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
        console.error(
            "Save product error:",
            error
        );

        showPageMessage(
            error.message,
            "error"
        );
    } finally {
        if (saveButton) {
            saveButton.disabled =
                false;

            saveButton.innerHTML =
                productId
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
}

/* ========================================
   DELETE PRODUCT
======================================== */

function openDeleteModal(productId) {
    const product =
        allProducts.find(
            (item) =>
                String(
                    item._id ||
                    item.id
                ) ===
                String(productId)
        );

    if (!product) {
        showPageMessage(
            "Product not found.",
            "error"
        );

        return;
    }

    productToDeleteId =
        productId;

    setText(
        "deleteProductName",
        product.name ||
        product.productName ||
        "this product"
    );

    document
        .getElementById(
            "deleteModal"
        )
        ?.classList.add("show");
}

async function deleteProduct() {
    if (!productToDeleteId) {
        return;
    }

    const confirmButton =
        document.getElementById(
            "confirmDeleteButton"
        );

    try {
        if (confirmButton) {
            confirmButton.disabled =
                true;

            confirmButton.innerHTML = `
                <i class="fas fa-spinner fa-spin"></i>
                Deleting...
            `;
        }

        const response =
            await fetch(
                `${PRODUCT_API_URL}/${productToDeleteId}`,
                {
                    method:
                        "DELETE",

                    headers:
                        getAuthorizationHeaders()
                }
            );

        const result =
            await parseResponse(
                response
            );

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
        console.error(
            "Delete product error:",
            error
        );

        closeDeleteModal();

        showPageMessage(
            error.message,
            "error"
        );
    } finally {
        if (confirmButton) {
            confirmButton.disabled =
                false;

            confirmButton.innerHTML = `
                <i class="fas fa-trash"></i>
                Delete
            `;
        }
    }
}

/* ========================================
   SEARCH AND FILTER
======================================== */

function filterProducts() {
    const searchValue =
        getInputValue(
            "productSearch"
        )
            .trim()
            .toLowerCase();

    const selectedCategory =
        getInputValue(
            "categoryFilter"
        ).toLowerCase();

    const filteredProducts =
        allProducts.filter(
            (product) => {
                const name =
                    String(
                        product.name ||
                        product.productName ||
                        ""
                    ).toLowerCase();

                const category =
                    String(
                        product.category ||
                        ""
                    ).toLowerCase();

                const matchesSearch =
                    name.includes(
                        searchValue
                    ) ||
                    category.includes(
                        searchValue
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

    renderProducts(
        filteredProducts
    );
}

function populateCategoryFilter() {
    const categoryFilter =
        document.getElementById(
            "categoryFilter"
        );

    if (!categoryFilter) {
        return;
    }

    const currentValue =
        categoryFilter.value;

    const categories = [
        ...new Set(
            allProducts
                .map((product) =>
                    String(
                        product.category ||
                        ""
                    ).trim()
                )
                .filter(Boolean)
        )
    ].sort();

    categoryFilter.innerHTML = `
        <option value="">
            All Categories
        </option>

        ${categories
            .map(
                (category) => `
                    <option
                        value="${escapeHtml(category)}"
                    >
                        ${escapeHtml(category)}
                    </option>
                `
            )
            .join("")}
    `;

    categoryFilter.value =
        currentValue;
}

/* ========================================
   MODAL HELPERS
======================================== */

function closeProductModal() {
    document
        .getElementById(
            "productModal"
        )
        ?.classList.remove("show");

    document
        .getElementById(
            "productForm"
        )
        ?.reset();

    setInputValue(
        "productId",
        ""
    );

    hideImagePreview();
}

function closeDeleteModal() {
    document
        .getElementById(
            "deleteModal"
        )
        ?.classList.remove("show");

    productToDeleteId =
        null;
}

/* ========================================
   GENERAL HELPERS
======================================== */

function getProductImageUrl(image) {
    if (!image) {
        return "";
    }

    if (
        image.startsWith("http://") ||
        image.startsWith("https://") ||
        image.startsWith("data:") ||
        image.startsWith("blob:")
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

function updateProductCount(count) {
    setText(
        "productCount",
        String(count)
    );
}

function showPageMessage(
    message,
    type
) {
    const container =
        document.getElementById(
            "pageMessage"
        );

    if (!container) {
        return;
    }

    container.innerHTML = `
        <div
            class="page-alert page-alert-${escapeHtml(type)}"
        >
            ${escapeHtml(message)}
        </div>
    `;

    window.clearTimeout(
        showPageMessage.timeoutId
    );

    showPageMessage.timeoutId =
        window.setTimeout(() => {
            container.innerHTML =
                "";
        }, 4000);
}

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

function formatCurrency(value) {
    return Number(
        value || 0
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

function shortenText(
    text,
    length
) {
    const cleanText =
        String(text || "");

    if (
        cleanText.length <= length
    ) {
        return cleanText;
    }

    return (
        cleanText.substring(
            0,
            length
        ) + "..."
    );
}

function getInputValue(id) {
    return (
        document.getElementById(id)
            ?.value ?? ""
    );
}

function setInputValue(
    id,
    value
) {
    const element =
        document.getElementById(id);

    if (element) {
        element.value =
            value ?? "";
    }
}

function setText(
    id,
    value
) {
    const element =
        document.getElementById(id);

    if (element) {
        element.textContent =
            value ?? "";
    }
}

function escapeHtml(value) {
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

window.openEditModal =
    openEditModal;

window.openDeleteModal =
    openDeleteModal;