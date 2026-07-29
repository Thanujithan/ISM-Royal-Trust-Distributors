const USERS_API_URL = "http://localhost:5000/api/users";

const usersTableBody = document.getElementById("usersTableBody");
const userSearchInput = document.getElementById("userSearchInput");

const totalUsersElement = document.getElementById("totalUsers");
const totalCustomersElement = document.getElementById("totalCustomers");
const totalAdminsElement = document.getElementById("totalAdmins");

const userAlert = document.getElementById("userAlert");

const deleteUserModal = document.getElementById("deleteUserModal");
const deleteUserName = document.getElementById("deleteUserName");
const closeDeleteModal = document.getElementById("closeDeleteModal");
const cancelDeleteButton = document.getElementById("cancelDeleteButton");
const confirmDeleteButton = document.getElementById(
    "confirmDeleteButton"
);

let allUsers = [];
let selectedUserId = null;

/*
    Change this localStorage key only when your login page
    stores the JWT token using another name.
*/
const getAdminToken = () => {
    return (
        localStorage.getItem("token") ||
        localStorage.getItem("adminToken")
    );
};

const getLoggedInUser = () => {
    const storedUser =
        localStorage.getItem("user") ||
        localStorage.getItem("adminUser");

    if (!storedUser) {
        return null;
    }

    try {
        return JSON.parse(storedUser);
    } catch (error) {
        console.error("Unable to read logged-in user:", error);
        return null;
    }
};

const getLoggedInUserId = () => {
    const loggedInUser = getLoggedInUser();

    return loggedInUser?.id || loggedInUser?._id || null;
};

const escapeHTML = (value) => {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
};

const formatDate = (dateValue) => {
    if (!dateValue) {
        return "Not available";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "Not available";
    }

    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
};

const showAlert = (message, type = "success") => {
    userAlert.textContent = message;
    userAlert.className = `user-alert ${type} show`;

    window.setTimeout(() => {
        userAlert.classList.remove("show");
    }, 3500);
};

const updateUserStatistics = () => {
    const customerCount = allUsers.filter(
        (user) => user.role === "customer"
    ).length;

    const adminCount = allUsers.filter(
        (user) => user.role === "admin"
    ).length;

    totalUsersElement.textContent = allUsers.length;
    totalCustomersElement.textContent = customerCount;
    totalAdminsElement.textContent = adminCount;
};

const renderUsers = (users) => {
    if (!users.length) {
        usersTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-message">
                    No users found.
                </td>
            </tr>
        `;

        return;
    }

    const loggedInUserId = getLoggedInUserId();

    usersTableBody.innerHTML = users
        .map((user) => {
            const userId = user._id || user.id;
            const isCurrentAdmin =
                loggedInUserId &&
                String(userId) === String(loggedInUserId);

            const userInitial = user.name
                ? user.name.charAt(0).toUpperCase()
                : "U";

            return `
                <tr>
                    <td>
                        <div class="user-information">
                            <div class="user-avatar">
                                ${escapeHTML(userInitial)}
                            </div>

                            <div>
                                <strong>
                                    ${escapeHTML(user.name)}
                                </strong>

                                ${
                                    isCurrentAdmin
                                        ? `
                                            <small class="current-user-label">
                                                You
                                            </small>
                                        `
                                        : ""
                                }
                            </div>
                        </div>
                    </td>

                    <td>
                        ${escapeHTML(user.email)}
                    </td>

                    <td>
                        <select
                            class="user-role-select"
                            data-user-id="${escapeHTML(userId)}"
                            data-current-role="${escapeHTML(user.role)}"
                            ${isCurrentAdmin ? "disabled" : ""}
                        >
                            <option
                                value="customer"
                                ${
                                    user.role === "customer"
                                        ? "selected"
                                        : ""
                                }
                            >
                                Customer
                            </option>

                            <option
                                value="admin"
                                ${
                                    user.role === "admin"
                                        ? "selected"
                                        : ""
                                }
                            >
                                Admin
                            </option>
                        </select>
                    </td>

                    <td>
                        ${formatDate(user.createdAt)}
                    </td>

                    <td>
                        <div class="table-actions">
                            <button
                                type="button"
                                class="action-button delete-button user-delete-button"
                                data-user-id="${escapeHTML(userId)}"
                                data-user-name="${escapeHTML(user.name)}"
                                ${isCurrentAdmin ? "disabled" : ""}
                                title="${
                                    isCurrentAdmin
                                        ? "You cannot delete your own account"
                                        : "Delete user"
                                }"
                            >
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        })
        .join("");

    attachRoleChangeEvents();
    attachDeleteEvents();
};

const loadUsers = async () => {
    const token = getAdminToken();

    if (!token) {
        window.location.href = "../login.html";
        return;
    }

    usersTableBody.innerHTML = `
        <tr>
            <td colspan="5" class="empty-message">
                Loading users...
            </td>
        </tr>
    `;

    try {
        const response = await fetch(USERS_API_URL, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message || "Unable to load users"
            );
        }

        allUsers = result.data || result.users || [];

        updateUserStatistics();
        renderUsers(allUsers);
    } catch (error) {
        console.error("Load users error:", error);

        usersTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-message">
                    ${escapeHTML(error.message)}
                </td>
            </tr>
        `;

        showAlert(error.message, "error");
    }
};

const updateUserRole = async (userId, newRole, selectElement) => {
    const token = getAdminToken();
    const previousRole = selectElement.dataset.currentRole;

    selectElement.disabled = true;

    try {
        const response = await fetch(
            `${USERS_API_URL}/${userId}/role`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    role: newRole
                })
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message || "Unable to update user role"
            );
        }

        const userIndex = allUsers.findIndex(
            (user) =>
                String(user._id || user.id) === String(userId)
        );

        if (userIndex !== -1) {
            allUsers[userIndex].role = newRole;
        }

        selectElement.dataset.currentRole = newRole;

        updateUserStatistics();

        showAlert("User role updated successfully.");
    } catch (error) {
        console.error("Update role error:", error);

        selectElement.value = previousRole;

        showAlert(error.message, "error");
    } finally {
        selectElement.disabled = false;
    }
};

const attachRoleChangeEvents = () => {
    const roleSelects = document.querySelectorAll(
        ".user-role-select"
    );

    roleSelects.forEach((selectElement) => {
        selectElement.addEventListener("change", () => {
            const userId = selectElement.dataset.userId;
            const newRole = selectElement.value;

            updateUserRole(
                userId,
                newRole,
                selectElement
            );
        });
    });
};

const openDeleteModal = (userId, userName) => {
    selectedUserId = userId;
    deleteUserName.textContent = userName;
    deleteUserModal.classList.add("show");
};

const closeUserDeleteModal = () => {
    selectedUserId = null;
    deleteUserModal.classList.remove("show");
};

const attachDeleteEvents = () => {
    const deleteButtons = document.querySelectorAll(
        ".user-delete-button"
    );

    deleteButtons.forEach((button) => {
        button.addEventListener("click", () => {
            if (button.disabled) {
                return;
            }

            const userId = button.dataset.userId;
            const userName = button.dataset.userName;

            openDeleteModal(userId, userName);
        });
    });
};

const deleteSelectedUser = async () => {
    if (!selectedUserId) {
        return;
    }

    const token = getAdminToken();

    confirmDeleteButton.disabled = true;

    confirmDeleteButton.innerHTML = `
        <i class="fas fa-spinner fa-spin"></i>
        Deleting...
    `;

    try {
        const response = await fetch(
            `${USERS_API_URL}/${selectedUserId}`,
            {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message || "Unable to delete user"
            );
        }

        allUsers = allUsers.filter(
            (user) =>
                String(user._id || user.id) !==
                String(selectedUserId)
        );

        updateUserStatistics();

        const currentSearchValue =
            userSearchInput.value.trim().toLowerCase();

        if (currentSearchValue) {
            const filteredUsers = allUsers.filter((user) => {
                return (
                    user.name
                        .toLowerCase()
                        .includes(currentSearchValue) ||
                    user.email
                        .toLowerCase()
                        .includes(currentSearchValue) ||
                    user.role
                        .toLowerCase()
                        .includes(currentSearchValue)
                );
            });

            renderUsers(filteredUsers);
        } else {
            renderUsers(allUsers);
        }

        closeUserDeleteModal();

        showAlert("User deleted successfully.");
    } catch (error) {
        console.error("Delete user error:", error);

        showAlert(error.message, "error");
    } finally {
        confirmDeleteButton.disabled = false;

        confirmDeleteButton.innerHTML = `
            <i class="fas fa-trash"></i>
            Delete
        `;
    }
};

userSearchInput.addEventListener("input", () => {
    const searchValue =
        userSearchInput.value.trim().toLowerCase();

    if (!searchValue) {
        renderUsers(allUsers);
        return;
    }

    const filteredUsers = allUsers.filter((user) => {
        const name = user.name?.toLowerCase() || "";
        const email = user.email?.toLowerCase() || "";
        const role = user.role?.toLowerCase() || "";

        return (
            name.includes(searchValue) ||
            email.includes(searchValue) ||
            role.includes(searchValue)
        );
    });

    renderUsers(filteredUsers);
});

closeDeleteModal.addEventListener(
    "click",
    closeUserDeleteModal
);

cancelDeleteButton.addEventListener(
    "click",
    closeUserDeleteModal
);

confirmDeleteButton.addEventListener(
    "click",
    deleteSelectedUser
);

deleteUserModal.addEventListener("click", (event) => {
    if (event.target === deleteUserModal) {
        closeUserDeleteModal();
    }
});

document.addEventListener("keydown", (event) => {
    if (
        event.key === "Escape" &&
        deleteUserModal.classList.contains("show")
    ) {
        closeUserDeleteModal();
    }
});

document.addEventListener("DOMContentLoaded", loadUsers);