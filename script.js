// Wait for page to load
document.addEventListener("DOMContentLoaded", function () {
    applyFadeInAnimations();
    startMatrixEffect();
});

// =========================
// FADE-IN ANIMATIONS
// =========================
function applyFadeInAnimations() {
    const elements = document.querySelectorAll(".fade-in");
    elements.forEach((el, index) => {
        setTimeout(() => {
            el.style.opacity = "1";
            el.style.transform = "translateY(0px)";
        }, 200 * index);
    });
}

// =========================
// LOGO GLOW ANIMATION
// =========================
const logo = document.querySelector(".logo");
setInterval(() => {
    logo.classList.toggle("glow");
}, 1500);

// =========================
// MATRIX-STYLE BACKGROUND
// =========================
const canvas = document.createElement("canvas");
document.body.appendChild(canvas);
canvas.style.position = "fixed";
canvas.style.top = "0";
canvas.style.left = "0";
canvas.style.width = "100vw";
canvas.style.height = "100vh";
canvas.style.pointerEvents = "none";
const ctx = canvas.getContext("2d");

const matrixChars = "01abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ123456789@#$%^&*()*&^%+-/~{[|`]}";
const fontSize = 16;
const columns = canvas.width / fontSize;
const drops = Array(Math.floor(columns)).fill(1);

function startMatrixEffect() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#00D8FF"; // Neon Blue
    ctx.font = fontSize + "px monospace";

    drops.forEach((y, i) => {
        const text = matrixChars[Math.floor(Math.random() * matrixChars.length)];
        ctx.fillText(text, i * fontSize, y * fontSize);
        if (y * fontSize > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
        }
        drops[i]++;
    });

    requestAnimationFrame(startMatrixEffect);
}

// =========================
// PROFILE DROPDOWN ANIMATION
// =========================
const profileMenu = document.querySelector(".profile-menu");
const dropdownMenu = document.querySelector(".dropdown-menu");

profileMenu.addEventListener("mouseenter", () => {
    dropdownMenu.style.opacity = "1";
    dropdownMenu.style.transform = "translateY(5px)";
});

profileMenu.addEventListener("mouseleave", () => {
    dropdownMenu.style.opacity = "0";
    dropdownMenu.style.transform = "translateY(-5px)";
});

// =========================
// BUTTON HOVER ANIMATION
// =========================
const buttons = document.querySelectorAll("button, .play-button");
buttons.forEach((button) => {
    button.addEventListener("mouseover", () => {
        button.style.transform = "scale(1.1)";
        button.style.boxShadow = "0px 0px 10px #ff3131";
    });

    button.addEventListener("mouseout", () => {
        button.style.transform = "scale(1)";
        button.style.boxShadow = "none";
    });
});

