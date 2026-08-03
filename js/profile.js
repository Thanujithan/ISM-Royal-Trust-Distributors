const API_BASE_URL = "http://localhost:5000/api";

const token =
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");

const storedUser =
    JSON.parse(
        localStorage.getItem("user") ||
        sessionStorage.getItem("user")
    );

document.addEventListener(
    "DOMContentLoaded",
    initializeProfile
);

async function initializeProfile() {

    if (!token || !storedUser) {

        window.location.href = "login.html";
        return;
    }

    setupPasswordToggle();

    await loadProfile();

    await loadOrders();
}

/* ==========================
   LOAD PROFILE
========================== */

async function loadProfile() {

    try {

        const response = await fetch(
            `${API_BASE_URL}/auth/profile`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message);
        }

        const user = result.user;

        document.getElementById(
            "sidebarUserName"
        ).textContent = user.name;

        document.getElementById(
            "sidebarUserEmail"
        ).textContent = user.email;

        document.getElementById(
            "sidebarUserRole"
        ).textContent = user.role;

        document.getElementById(
            "profileName"
        ).value = user.name;

        document.getElementById(
            "profileEmail"
        ).value = user.email;

        document.getElementById(
            "profileRole"
        ).value =
            user.role.charAt(0).toUpperCase() +
            user.role.slice(1);

        document.getElementById(
            "profileJoinedDate"
        ).value =
            new Date(
                user.createdAt
            ).toLocaleDateString();

        document.getElementById(
            "profileInitial"
        ).textContent =
            user.name.charAt(0).toUpperCase();

    } catch (error) {

        showAlert(
            error.message,
            "error"
        );
    }
}

/* ==========================
   LOAD ORDERS
========================== */

async function loadOrders() {

    try {

        const response = await fetch(
            `${API_BASE_URL}/orders/my-orders`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message);
        }

        const orders =
            result.data || [];

        loadStatistics(orders);

        loadRecentOrders(orders);

    } catch (error) {

        document.getElementById(
            "recentOrdersList"
        ).innerHTML = `

        <div class="error-orders">

            <i class="fas fa-circle-exclamation"></i>

            <p>${error.message}</p>

        </div>

        `;
    }
}

/* ==========================
   STATISTICS
========================== */

function loadStatistics(
    orders
) {

    document.getElementById(
        "totalOrders"
    ).textContent =
        orders.length;

    const delivered =
        orders.filter(
            order =>
                order.orderStatus ===
                "delivered"
        );

    document.getElementById(
        "deliveredOrders"
    ).textContent =
        delivered.length;

    const totalSpent =
        delivered.reduce(
            (sum, order) =>
                sum +
                order.totalAmount,
            0
        );

    document.getElementById(
        "totalSpent"
    ).textContent =
        formatPrice(totalSpent);
}

/* ==========================
   RECENT ORDERS
========================== */

function loadRecentOrders(
    orders
) {

    const container =
        document.getElementById(
            "recentOrdersList"
        );

    if (!orders.length) {

        container.innerHTML = `

        <div class="empty-orders">

            <i class="fas fa-box-open"></i>

            <p>No orders found.</p>

        </div>

        `;

        return;
    }

    container.innerHTML =
        orders
            .slice(0,5)
            .map(order=>`

    <div class="recent-order-item">

    <div class="order-main-info">

    <h3>${order.orderNumber}</h3>

    <p>
    ${new Date(order.createdAt).toLocaleDateString()}
    </p>

    </div>

    <span class="order-status ${order.orderStatus}">
    ${order.orderStatus}
    </span>

    <strong class="order-amount">
    ${formatPrice(order.totalAmount)}
    </strong>

    </div>

    `).join("");
    }

    /* ==========================
    HELPERS
    ========================== */

    function formatPrice(
        value
    ){

    return Number(value)
    .toLocaleString(
    "en-LK",
    {
    style:"currency",
    currency:"LKR"
    }
    );

    }

    function showAlert(
    text,
    type
    ){

    const alert=
    document.getElementById(
    "profileAlert"
    );

    alert.textContent=text;

    alert.className=
    `profile-alert ${type} show`;

    setTimeout(()=>{

    alert.classList.remove(
    "show"
    );

    },3000);

    }

    function setupPasswordToggle(){

    document
    .querySelectorAll(
    ".password-toggle"
    )
    .forEach(button=>{

    button.addEventListener(
    "click",
    ()=>{

    const input=
    document.getElementById(
    button.dataset.target
    );

    const icon=
    button.querySelector("i");

    if(
    input.type==="password"
    ){

    input.type="text";

    icon.classList.replace(
    "fa-eye",
    "fa-eye-slash"
    );

    }else{

    input.type="password";

    icon.classList.replace(
    "fa-eye-slash",
    "fa-eye"
    );

    }

    });

    });

    }
    /* ==========================
   EDIT PROFILE
========================== */

const editBtn = document.getElementById("editProfileButton");
const cancelBtn = document.getElementById("cancelEditButton");
const profileForm = document.getElementById("profileForm");
const profileActions = document.getElementById("profileFormActions");

editBtn.addEventListener("click", enableEdit);
cancelBtn.addEventListener("click", disableEdit);

function enableEdit() {
    document.getElementById("profileName").disabled = false;
    document.getElementById("profileEmail").disabled = false;

    profileActions.classList.add("show");
    editBtn.style.display = "none";
}

function disableEdit() {
    document.getElementById("profileName").disabled = true;
    document.getElementById("profileEmail").disabled = true;

    profileActions.classList.remove("show");
    editBtn.style.display = "inline-flex";

    loadProfile();
}

/* ==========================
   UPDATE PROFILE
========================== */

profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const saveBtn = document.getElementById("saveProfileButton");

    saveBtn.disabled = true;
    saveBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Saving...';

    try {
        const response = await fetch(`${API_BASE_URL}/users/profile`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                name: document.getElementById("profileName").value.trim(),
                email: document.getElementById("profileEmail").value.trim()
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message);
        }

        localStorage.setItem("user", JSON.stringify(result.user));

        showAlert("Profile updated successfully.", "success");

        disableEdit();

        loadProfile();

    } catch (error) {
        showAlert(error.message, "error");
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML =
            '<i class="fas fa-check"></i> Save Changes';
    }
});

/* ==========================
   LOGOUT
========================== */

document
    .getElementById("profileLogoutButton")
    .addEventListener("click", () => {

        if (!confirm("Are you sure you want to logout?")) {
            return;
        }

        localStorage.clear();
        sessionStorage.clear();

        window.location.href = "login.html";
    });
    /* ==========================
   CHANGE PASSWORD
========================== */

const changePasswordForm = document.getElementById("changePasswordForm");
const changePasswordBtn = document.getElementById("changePasswordButton");

changePasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearPasswordErrors();

    const currentPassword = document.getElementById("currentPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    let valid = true;

    if (!currentPassword) {
        showPasswordError("currentPassword", "Current password is required.");
        valid = false;
    }

    if (!newPassword) {
        showPasswordError("newPassword", "New password is required.");
        valid = false;
    } else if (newPassword.length < 6) {
        showPasswordError("newPassword", "Password must contain at least 6 characters.");
        valid = false;
    } else if (newPassword === currentPassword) {
        showPasswordError("newPassword", "New password must be different.");
        valid = false;
    }

    if (!confirmPassword) {
        showPasswordError("confirmPassword", "Please confirm your new password.");
        valid = false;
    } else if (newPassword !== confirmPassword) {
        showPasswordError("confirmPassword", "Passwords do not match.");
        valid = false;
    }

    if (!valid) return;

    changePasswordBtn.disabled = true;
    changePasswordBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Updating...';

    try {
        const response = await fetch(`${API_BASE_URL}/users/change-password`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                currentPassword,
                newPassword
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Unable to change password.");
        }

        changePasswordForm.reset();

        showAlert("Password updated successfully.", "success");
    } catch (error) {
        showAlert(error.message, "error");
    } finally {
        changePasswordBtn.disabled = false;
        changePasswordBtn.innerHTML =
            '<i class="fas fa-lock"></i> Update Password';
    }
});

/* ==========================
   PASSWORD ERRORS
========================== */

function showPasswordError(id, text) {
    const input = document.getElementById(id);
    const error = document.getElementById(`${id}Error`);

    input.closest(".input-box")?.classList.add("error");

    if (error) {
        error.textContent = text;
    }
}

function clearPasswordErrors() {
    changePasswordForm
        .querySelectorAll(".input-box")
        .forEach((box) => box.classList.remove("error"));

    changePasswordForm
        .querySelectorAll(".error-message")
        .forEach((error) => error.textContent = "");
}