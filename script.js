gsap.registerPlugin(ScrollTrigger);

const canvas = document.getElementById("hero-canvas");
const ctx = canvas.getContext("2d");

const frameCount = 1135;
const CLOUDINARY =
    "https://res.cloudinary.com/cmvg7lgj/image/upload/";

const cache = new Map();
const loading = new Set();

let targetFrame = 0;
let currentFrame = -1;
let rafId = null;

function getFrameURL(index) {
    return `${CLOUDINARY}f_auto,q_auto,w_1280/frame_${index + 1}.jpg`;
}

/* CANVAS */

function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;

    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    drawFrame(currentFrame);
}

resizeCanvas();

/* LOAD ONE FRAME */

function loadFrame(index) {
    if (index < 0 || index >= frameCount) return;
    if (cache.has(index) || loading.has(index)) return;

    loading.add(index);

    const img = new Image();

    img.onload = () => {
        cache.set(index, img);
        loading.delete(index);

        if (index === currentFrame) {
            drawFrame(index);
        }
    };

    img.onerror = () => {
        loading.delete(index);
        console.error(`Failed frame ${index + 1}`);
    };

    img.src = getFrameURL(index);
}

/* PRELOAD ONLY SMALL NUMBER OF FRAMES */

function preloadFrames(center) {
    const ahead = 8;
    const behind = 3;

    for (let i = 1; i <= ahead; i++) {
        loadFrame(center + i);
    }

    for (let i = 1; i <= behind; i++) {
        loadFrame(center - i);
    }

    /* REMOVE OLD FRAMES */

    for (const index of cache.keys()) {
        if (index < center - 10 || index > center + 20) {
            cache.delete(index);
        }
    }
}

/* DRAW */

function drawFrame(index) {
    if (index < 0) return;

    const img = cache.get(index);

    if (!img || !img.complete || !img.naturalWidth) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    ctx.clearRect(0, 0, width, height);

    const scale = Math.max(
        width / img.naturalWidth,
        height / img.naturalHeight
    );

    const drawWidth = img.naturalWidth * scale;
    const drawHeight = img.naturalHeight * scale;

    const x = (width - drawWidth) / 2;
    const y = (height - drawHeight) / 2;

    ctx.drawImage(
        img,
        x,
        y,
        drawWidth,
        drawHeight
    );
}

/* UI */

const scenes = document.querySelectorAll(".scene");
const progressFill = document.getElementById("progress-fill");
const frameInfo = document.getElementById("frame-info");

function updateTypography(frame) {
    scenes.forEach((scene) => {
        const start = Number(scene.dataset.start);
        const end = Number(scene.dataset.end);

        if (frame < start || frame > end) {
            scene.style.opacity = 0;
            scene.style.visibility = "hidden";
            return;
        }

        scene.style.visibility = "visible";

        const progress = (frame - start) / (end - start);

        let opacity = 1;

        if (progress < 0.15) {
            opacity = progress / 0.15;
        } else if (progress > 0.85) {
            opacity = (1 - progress) / 0.15;
        }

        scene.style.opacity = Math.max(0, Math.min(1, opacity));
    });
}

/* RENDER ONLY WHEN FRAME CHANGES */

function render() {
    rafId = null;

    const frame = Math.round(targetFrame);

    if (frame === currentFrame) return;

    currentFrame = frame;

    loadFrame(frame);
    preloadFrames(frame);
    drawFrame(frame);

    updateTypography(frame);

    const percentage =
        (frame / (frameCount - 1)) * 100;

    progressFill.style.width = `${percentage}%`;

    frameInfo.textContent =
        `FRAME ${String(frame + 1).padStart(4, "0")}`;
}

/* REQUEST RENDER */

function requestRender() {
    if (!rafId) {
        rafId = requestAnimationFrame(render);
    }
}

/* GSAP SCROLL */

gsap.to(
    { frame: 0 },
    {
        frame: frameCount - 1,
        ease: "none",

        onUpdate() {
            targetFrame = Math.round(this.targets()[0].frame);
            requestRender();
        },

        scrollTrigger: {
            trigger: ".scroll-space",
            start: "top top",
            end: "bottom bottom",
            scrub: 0.4,
        },
    }
);

/* MUSIC */

const music = document.getElementById("bg-music");
const musicButton = document.getElementById("music-button");

music.volume = 0.35;

musicButton.addEventListener("click", () => {
    if (music.paused) {
        music.play();
        musicButton.textContent = "♫ SOUND ON";
        musicButton.classList.add("playing");
    } else {
        music.pause();
        musicButton.textContent = "♫ SOUND OFF";
        musicButton.classList.remove("playing");
    }
});

/* START */

loadFrame(0);
loadFrame(1);
loadFrame(2);
loadFrame(3);
loadFrame(4);

setTimeout(() => {
    currentFrame = 0;
    drawFrame(0);
    preloadFrames(0);
    updateTypography(0);
}, 300);

/* RESIZE */

window.addEventListener("resize", resizeCanvas);