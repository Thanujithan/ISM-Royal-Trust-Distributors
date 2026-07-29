document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    /*
      Admin protection-ஐ testing முடிந்த பிறகு enable செய்வோம்.

      if (!token) {
          window.location.href = "../login.html";
          return;
      }
    */

    let user = null;

    try {
        user = storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
        console.error("Unable to read user data:", error);
    }

    const adminName = document.getElementById("adminName");
    const adminEmail = document.getElementById("adminEmail");

    if (user) {
        if (adminName) {
            adminName.textContent =
                user.name ||
                user.fullName ||
                "Admin";
        }

        if (adminEmail) {
            adminEmail.textContent =
                user.email ||
                "Administrator";
        }
    }

    const logoutButton = document.getElementById("logoutButton");

    if (logoutButton) {
        logoutButton.addEventListener("click", () => {
            localStorage.removeItem("token");
            localStorage.removeItem("user");

            window.location.href = "../login.html";
        });
    }

    const menuButton = document.getElementById("menuButton");
    const sidebar = document.getElementById("sidebar");

    if (menuButton && sidebar) {
        menuButton.addEventListener("click", () => {
            sidebar.classList.toggle("open");
        });
    }
});