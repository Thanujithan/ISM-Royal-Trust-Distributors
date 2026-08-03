document.addEventListener("DOMContentLoaded", () => {
    initializeHeaderShadow();
    initializeScrollAnimations();
    initializeCounters();
    initializeSmoothScroll();
    initializeButtonEffects();
});

/* ================================
   HEADER SHADOW
================================ */

function initializeHeaderShadow() {
    const header = document.querySelector("header");

    if (!header) return;

    const updateShadow = () => {
        header.style.boxShadow =
            window.scrollY > 50
                ? "0 8px 20px rgba(0, 0, 0, 0.15)"
                : "0 2px 12px rgba(0, 0, 0, 0.08)";
    };

    updateShadow();
    window.addEventListener("scroll", updateShadow);
}

/* ================================
   SCROLL ANIMATIONS
================================ */

function initializeScrollAnimations() {
    const elements = document.querySelectorAll(
        ".category-card, .service-card, .testimonial-card, .brand-card, .hero-card"
    );

    if (!elements.length) return;

    if (!("IntersectionObserver" in window)) {
        elements.forEach((element) => {
            element.classList.add("show");
        });
        return;
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("show");
                    observer.unobserve(entry.target);
                }
            });
        },
        {
            threshold: 0.2
        }
    );

    elements.forEach((element) => {
        element.classList.add("hidden");
        observer.observe(element);
    });
}

/* ================================
   COUNTER ANIMATION
================================ */

function initializeCounters() {
    const counters = document.querySelectorAll(".stat-box h2");

    counters.forEach((counter) => {
        const target = Number.parseInt(
            counter.textContent.replace(/\D/g, ""),
            10
        );

        if (!Number.isFinite(target)) return;

        let current = 0;
        const increment = Math.max(target / 80, 1);

        const updateCounter = () => {
            current += increment;

            if (current < target) {
                counter.textContent = `${Math.ceil(current)}+`;
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = `${target}+`;
            }
        };

        updateCounter();
    });
}

/* ================================
   SMOOTH SCROLL
================================ */

function initializeSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener("click", (event) => {
            const href = anchor.getAttribute("href");

            if (!href || href === "#") return;

            const target = document.querySelector(href);

            if (!target) return;

            event.preventDefault();

            target.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        });
    });
}

/* ================================
   BUTTON EFFECTS
================================ */

function initializeButtonEffects() {
    const buttons = document.querySelectorAll(
        ".btn-primary, .btn-secondary, .btn-light"
    );

    buttons.forEach((button) => {
        button.addEventListener("mouseenter", () => {
            button.style.transform = "translateY(-3px)";
        });

        button.addEventListener("mouseleave", () => {
            button.style.transform = "translateY(0)";
        });
    });
}