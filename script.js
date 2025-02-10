document.addEventListener("DOMContentLoaded", () => {
    /* ========================= */
    /* FADE-IN ANIMATION */
    /* ========================= */
    const fadeElements = document.querySelectorAll(".fade-in");
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = 1;
                entry.target.style.transform = "translateY(0)";
            }
        });
    }, { threshold: 0.2 });

    fadeElements.forEach(el => observer.observe(el));

    /* ========================= */
    /* LOGO GLOW EFFECT */
    /* ========================= */
    setInterval(() => {
        const logo = document.querySelector(".logo");
        if (logo) {
            logo.classList.toggle("glow");
        }
    }, 1500);

    /* ========================= */
    /* DROPDOWN MENU TOGGLE */
    /* ========================= */
    const profileMenu = document.querySelector(".profile-menu");
    if (profileMenu) {
        profileMenu.addEventListener("click", () => {
            const dropdown = document.querySelector(".dropdown-menu");
            dropdown.classList.toggle("show");
        });
    }

    /* ========================= */
    /* TYPEWRITER TEXT EFFECT */
    /* ========================= */
    function typeWriterEffect(element, text, speed = 100) {
        let i = 0;
        function type() {
            if (i < text.length) {
                element.innerHTML += text.charAt(i);
                i++;
                setTimeout(type, speed);
            } else {
                element.classList.remove("border"); // Remove blinking cursor effect
            }
        }
        type();
    }

    const typewriter = document.querySelector(".typewriter-text");
    if (typewriter) {
        const text = typewriter.getAttribute("data-text");
        typewriter.innerHTML = ""; // Clear existing text
        typeWriterEffect(typewriter, text);
    }
});
