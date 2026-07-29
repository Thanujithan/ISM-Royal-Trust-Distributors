const API_URL = "http://localhost:5000/api/contact";

const messagesTableBody =
    document.getElementById("messagesTableBody");

const messageCount =
    document.getElementById("messageCount");

const searchInput =
    document.getElementById("searchInput");

const messageModal =
    document.getElementById("messageModal");

const closeModalBtn =
    document.getElementById("closeModalBtn");

const modalName =
    document.getElementById("modalName");

const modalEmail =
    document.getElementById("modalEmail");

const modalPhone =
    document.getElementById("modalPhone");

const modalSubject =
    document.getElementById("modalSubject");

const modalDate =
    document.getElementById("modalDate");

const modalStatus =
    document.getElementById("modalStatus");

const modalMessage =
    document.getElementById("modalMessage");

let allMessages = [];

document.addEventListener("DOMContentLoaded", () => {
    loadMessages();
});

async function loadMessages() {
    try {
        messagesTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="table-message">
                    Loading messages...
                </td>
            </tr>
        `;

        const response = await fetch(API_URL);

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message || "Unable to load messages"
            );
        }

        allMessages = result.data || [];

        displayMessages(allMessages);
        updateMessageCount();

    } catch (error) {
        console.error("Load messages error:", error);

        messagesTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="table-message error-text">
                    ${escapeHTML(error.message)}
                </td>
            </tr>
        `;
    }
}

function displayMessages(messages) {
    if (!messages.length) {
        messagesTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="table-message">
                    No messages found
                </td>
            </tr>
        `;

        return;
    }

    messagesTableBody.innerHTML = messages
        .map((message) => {
            const date = formatDate(message.createdAt);

            const status =
                message.status || "unread";

            const statusClass =
                status === "read"
                    ? "read"
                    : "unread";

            const rowClass =
                status === "unread"
                    ? "unread-message-row"
                    : "";

            return `
                <tr class="${rowClass}">

                    <td>
                        ${escapeHTML(message.name || "-")}
                    </td>

                    <td>
                        ${escapeHTML(message.email || "-")}
                    </td>

                    <td>
                        ${escapeHTML(
                            message.subject || "General Inquiry"
                        )}
                    </td>

                    <td>
                        ${date}
                    </td>

                    <td>
                        <span class="message-status ${statusClass}">
                            ${escapeHTML(status)}
                        </span>
                    </td>

                    <td>
                        <div class="message-action-buttons">

                            <button
                                class="message-view-button"
                                type="button"
                                title="View Message"
                                onclick="viewMessage('${message._id}')"
                            >
                                <i class="fas fa-eye"></i>
                            </button>

                            <button
                                class="message-delete-button"
                                type="button"
                                title="Delete Message"
                                onclick="deleteMessage('${message._id}')"
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

async function viewMessage(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`);

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message || "Unable to load message"
            );
        }

        const message = result.data;

        modalName.textContent =
            message.name || "-";

        modalEmail.textContent =
            message.email || "-";

        modalPhone.textContent =
            message.phone || "-";

        modalSubject.textContent =
            message.subject || "General Inquiry";

        modalDate.textContent =
            formatDate(message.createdAt);

        modalStatus.textContent =
            message.status || "read";

        modalMessage.textContent =
            message.message || "-";

        messageModal.classList.add("active");

        const messageIndex =
            allMessages.findIndex(
                (item) => item._id === id
            );

        if (messageIndex !== -1) {
            allMessages[messageIndex].status = "read";
        }

        displayMessages(getFilteredMessages());

    } catch (error) {
        console.error("View message error:", error);
        alert(error.message);
    }
}

async function deleteMessage(id) {
    const confirmation = confirm(
        "Are you sure you want to delete this message?"
    );

    if (!confirmation) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message || "Unable to delete message"
            );
        }

        allMessages = allMessages.filter(
            (message) => message._id !== id
        );

        displayMessages(getFilteredMessages());
        updateMessageCount();

        alert("Message deleted successfully");

    } catch (error) {
        console.error("Delete message error:", error);
        alert(error.message);
    }
}

function getFilteredMessages() {
    const searchValue = searchInput.value
        .trim()
        .toLowerCase();

    if (!searchValue) {
        return allMessages;
    }

    return allMessages.filter((message) => {
        const name =
            message.name?.toLowerCase() || "";

        const email =
            message.email?.toLowerCase() || "";

        const subject =
            message.subject?.toLowerCase() || "";

        return (
            name.includes(searchValue) ||
            email.includes(searchValue) ||
            subject.includes(searchValue)
        );
    });
}

searchInput.addEventListener("input", () => {
    displayMessages(getFilteredMessages());
});

function updateMessageCount() {
    messageCount.textContent = allMessages.length;
}

function formatDate(dateValue) {
    if (!dateValue) {
        return "-";
    }

    return new Date(dateValue).toLocaleString();
}

function escapeHTML(value) {
    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function closeModal() {
    messageModal.classList.remove("active");
}

closeModalBtn.addEventListener(
    "click",
    closeModal
);

messageModal.addEventListener(
    "click",
    (event) => {
        if (event.target === messageModal) {
            closeModal();
        }
    }
);

document.addEventListener(
    "keydown",
    (event) => {
        if (event.key === "Escape") {
            closeModal();
        }
    }
);