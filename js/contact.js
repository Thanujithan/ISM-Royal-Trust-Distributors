document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("contactForm");
    const formMessage = document.getElementById("formMessage");
    const submitButton = form.querySelector('button[type="submit"]');

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const fullName = document
            .getElementById("fullName")
            .value
            .trim();

        const email = document
            .getElementById("email")
            .value
            .trim();

        const phone = document
            .getElementById("phone")
            .value
            .trim();

        const subject = document
            .getElementById("subject")
            .value;

        const message = document
            .getElementById("message")
            .value
            .trim();

        if (!fullName || !email || !phone || !subject || !message) {
            showFormMessage(
                "Please fill in all required fields.",
                "error"
            );

            return;
        }

        const contactData = {
            fullName,
            email,
            phone,
            subject,
            message
        };

        try {
            submitButton.disabled = true;
            submitButton.innerHTML =
                'Sending... <i class="fas fa-spinner fa-spin"></i>';

            formMessage.textContent = "";

            const response = await fetch(
                "http://localhost:5000/api/contact",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(contactData)
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "Unable to send the message."
                );
            }

            showFormMessage(
                result.message || "Your message has been sent successfully.",
                "success"
            );

            form.reset();
        } catch (error) {
            console.error("Contact form error:", error);

            showFormMessage(
                error.message ||
                    "Server connection failed. Please try again.",
                "error"
            );
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML =
                'Send Message <i class="fas fa-paper-plane"></i>';
        }
    });

    function showFormMessage(text, type) {
        formMessage.textContent = text;

        if (type === "success") {
            formMessage.style.color = "#15803d";
        } else {
            formMessage.style.color = "#dc2626";
        }

        formMessage.style.marginTop = "15px";
        formMessage.style.fontWeight = "600";
    }

    // FAQ
    const questions = document.querySelectorAll(".faq-question");

    questions.forEach((question) => {
        question.addEventListener("click", () => {
            const item = question.parentElement;

            document.querySelectorAll(".faq-item").forEach((faq) => {
                if (faq !== item) {
                    faq.classList.remove("active");

                    faq.querySelector(
                        ".faq-answer"
                    ).style.maxHeight = null;
                }
            });

            item.classList.toggle("active");

            const answer = item.querySelector(".faq-answer");

            if (item.classList.contains("active")) {
                answer.style.maxHeight =
                    answer.scrollHeight + "px";
            } else {
                answer.style.maxHeight = null;
            }
        });
    });

    // Animation observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("show");
            }
        });
    });

    document
        .querySelectorAll(
            ".info-card, .contact-content, .contact-form-box, .faq-item, .contact-cta"
        )
        .forEach((element) => {
            element.classList.add("hidden");
            observer.observe(element);
        });

    // Header shadow
    window.addEventListener("scroll", () => {
        const header = document.querySelector("header");

        if (window.scrollY > 50) {
            header.style.boxShadow =
                "0 6px 18px rgba(0, 0, 0, 0.2)";
        } else {
            header.style.boxShadow =
                "0 3px 10px rgba(0, 0, 0, 0.15)";
        }
    });
});