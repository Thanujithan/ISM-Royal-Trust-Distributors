// Mobile Menu
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

if (menuToggle) {
    menuToggle.addEventListener("click", () => {
        navLinks.classList.toggle("show");
    });
}

// Close menu after clicking a link (Mobile)
const navItems = document.querySelectorAll(".nav-links a");

navItems.forEach(link => {
    link.addEventListener("click", () => {
        if (navLinks.classList.contains("show")) {
            navLinks.classList.remove("show");
        }
    });
});

// Header Shadow on Scroll
const header = document.querySelector("header");

window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
        header.style.boxShadow = "0 8px 20px rgba(0,0,0,0.15)";
    } else {
        header.style.boxShadow = "0 2px 12px rgba(0,0,0,0.08)";
    }
});

// Scroll Animation
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add("show");
        }
    });
}, {
    threshold: 0.2
});

document.querySelectorAll(
    ".category-card, .service-card, .testimonial-card, .brand-card, .hero-card"
).forEach(card => {
    card.classList.add("hidden");
    observer.observe(card);
});

// Counter Animation
const counters = document.querySelectorAll(".stat-box h2");

counters.forEach(counter => {
    const target = parseInt(counter.innerText);

    let count = 0;

    const updateCounter = () => {
        const increment = target / 80;

        if (count < target) {
            count += increment;
            counter.innerText = Math.ceil(count) + "+";
            requestAnimationFrame(updateCounter);
        } else {
            counter.innerText = target + "+";
        }
    };

    updateCounter();
});

// Smooth Scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", function(e) {
        e.preventDefault();

        const target = document.querySelector(this.getAttribute("href"));

        if (target) {
            target.scrollIntoView({
                behavior: "smooth"
            });
        }
    });
});

// Button Hover Effect
const buttons = document.querySelectorAll(
    ".btn-primary, .btn-secondary, .btn-light"
);

buttons.forEach(button => {
    button.addEventListener("mouseenter", () => {
        button.style.transform = "translateY(-3px)";
    });

    button.addEventListener("mouseleave", () => {
        button.style.transform = "translateY(0)";
    });
});

document.addEventListener("DOMContentLoaded",()=>{

const loginNavItem=document.getElementById("loginNavItem");
const userNavItem=document.getElementById("userNavItem");
const logoutNavItem=document.getElementById("logoutNavItem");
const navUserName=document.getElementById("navUserName");
const logoutBtn=document.getElementById("logoutBtn");

const token=
    localStorage.getItem("token")||
    sessionStorage.getItem("token");

const userData=
    localStorage.getItem("user")||
    sessionStorage.getItem("user");

if(token&&userData){
    try{
        const user=JSON.parse(userData);

        loginNavItem.style.display="none";
        userNavItem.style.display="block";
        logoutNavItem.style.display="block";

        navUserName.textContent=user.name||"User";
    }catch(error){
        console.error("Invalid user data:",error);
        clearLoginData();
    }
}else{
    loginNavItem.style.display="block";
    userNavItem.style.display="none";
    logoutNavItem.style.display="none";
}

logoutBtn.addEventListener("click",()=>{
    clearLoginData();
    window.location.href="login.html";
});

function clearLoginData(){
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
}

});