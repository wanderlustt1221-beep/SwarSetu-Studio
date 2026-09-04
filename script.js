/* ============================================================
   Configuration — edit these values per client
   ============================================================ */
const CONFIG = {
    brandName: "SwarSetu Studio",
    whatsappNumber: "", // e.g. "9198XXXXXXXX" — leave empty to hide the button
    pricing: "₹1,699",
};

/* ============================================================
   Track data
   ============================================================ */
const TRACKS = [
    {
        index: "01",
        title: "Campaign Voice — Version 01",
        desc: "पहला वर्शन",
        src: "assets/audio-ad-script-01.mp3",
    },
    {
        index: "02",
        title: "Campaign Voice — Version 02",
        desc: "दूसरा वर्शन",
        src: "assets/audio-ad-script-02.mp3",
    },
    {
        index: "03",
        title: "Campaign Voice — Version 03",
        desc: "तीसरा वर्शन",
        src: "assets/audio-ad-script-03.mp3",
    },
];

/* ============================================================
   Helpers
   ============================================================ */
function formatTime(seconds) {
    if (!isFinite(seconds) || seconds < 0) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function createIconPlay() {
    return `<svg class="icon-play" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M6.5 4.8v10.4c0 .7.77 1.13 1.36.75l8.1-5.2a.9.9 0 0 0 0-1.5l-8.1-5.2c-.59-.38-1.36.05-1.36.75Z" fill="currentColor"/>
  </svg>`;
}

function createIconPause() {
    return `<svg class="icon-pause" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <rect x="5.5" y="4.5" width="3.2" height="11" rx="1" fill="currentColor"/>
    <rect x="11.3" y="4.5" width="3.2" height="11" rx="1" fill="currentColor"/>
  </svg>`;
}

/* ============================================================
   Build player cards
   ============================================================ */
const listEl = document.getElementById("playerList");
const players = []; // { audio, card, elements, duration }

TRACKS.forEach((track, i) => {
    const card = document.createElement("article");
    card.className = "player-card";
    card.dataset.index = i;

    card.innerHTML = `
    <div class="player-top">
      <button class="player-play" type="button" aria-label="Play ${track.title}">
        ${createIconPlay()}
        ${createIconPause()}
      </button>
      <div class="player-meta">
        <p class="player-index">AUDIO ${track.index}</p>
        <h3 class="player-title">${track.title}</h3>
        <p class="player-desc">${track.desc}</p>
      </div>
      <div class="player-status">
        <div class="player-eq" aria-hidden="true">
          <span></span><span></span><span></span><span></span>
        </div>
      </div>
    </div>
    <div class="player-progress-row">
      <span class="player-time player-time--start">00:00</span>
      <div class="player-track" role="slider" tabindex="0"
           aria-label="Seek ${track.title}"
           aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
        <div class="player-track-bg">
          <div class="player-track-fill"></div>
        </div>
        <div class="player-track-thumb"></div>
      </div>
      <span class="player-time player-time--end">00:00</span>
    </div>
    <p class="player-error">ऑडियो उपलब्ध नहीं है — कृपया स्टूडियो से संपर्क करें।</p>
  `;

    listEl.appendChild(card);

    const audio = new Audio();
    audio.preload = "metadata";
    audio.src = track.src;

    const playBtn = card.querySelector(".player-play");
    const track_el = card.querySelector(".player-track");
    const fillEl = card.querySelector(".player-track-fill");
    const thumbEl = card.querySelector(".player-track-thumb");
    const timeStart = card.querySelector(".player-time--start");
    const timeEnd = card.querySelector(".player-time--end");

    const state = { audio, card, playBtn, track_el, fillEl, thumbEl, timeStart, timeEnd, duration: 0 };
    players.push(state);

    /* -------- events -------- */
    audio.addEventListener("loadedmetadata", () => {
        state.duration = audio.duration;
        timeEnd.textContent = formatTime(audio.duration);
    });

    audio.addEventListener("timeupdate", () => {
        if (!state.duration) return;
        const pct = (audio.currentTime / state.duration) * 100;
        fillEl.style.width = `${pct}%`;
        thumbEl.style.left = `${pct}%`;
        timeStart.textContent = formatTime(audio.currentTime);
        track_el.setAttribute("aria-valuenow", Math.round(pct));
    });

    audio.addEventListener("play", () => {
        pauseAllExcept(state);
        card.classList.add("is-active", "is-playing");
        playBtn.setAttribute("aria-label", `Pause ${track.title}`);
    });

    audio.addEventListener("pause", () => {
        card.classList.remove("is-playing");
        playBtn.setAttribute("aria-label", `Play ${track.title}`);
    });

    audio.addEventListener("ended", () => {
        card.classList.remove("is-playing");
        fillEl.style.width = "0%";
        thumbEl.style.left = "0%";
        timeStart.textContent = "00:00";
        audio.currentTime = 0;
    });

    audio.addEventListener("error", () => {
        card.classList.add("has-error");
        playBtn.disabled = true;
    });

    /* -------- controls -------- */
    playBtn.addEventListener("click", () => {
        if (card.classList.contains("has-error")) return;
        if (audio.paused) {
            audio.play().catch(() => card.classList.add("has-error"));
        } else {
            audio.pause();
        }
    });

    function seekFromClientX(clientX) {
        const rect = track_el.getBoundingClientRect();
        let pct = (clientX - rect.left) / rect.width;
        pct = Math.min(1, Math.max(0, pct));
        if (state.duration) {
            audio.currentTime = pct * state.duration;
        }
    }

    track_el.addEventListener("pointerdown", (e) => {
        if (card.classList.contains("has-error")) return;
        seekFromClientX(e.clientX);
        const onMove = (ev) => seekFromClientX(ev.clientX);
        const onUp = () => {
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
        };
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
    });

    track_el.addEventListener("keydown", (e) => {
        if (!state.duration) return;
        const step = state.duration * 0.05;
        if (e.key === "ArrowRight") {
            audio.currentTime = Math.min(state.duration, audio.currentTime + step);
        } else if (e.key === "ArrowLeft") {
            audio.currentTime = Math.max(0, audio.currentTime - step);
        }
    });

    /* -------- casual-download deterrents -------- */
    card.addEventListener("contextmenu", (e) => e.preventDefault());
    card.querySelectorAll("*").forEach((el) => {
        el.addEventListener("dragstart", (e) => e.preventDefault());
    });
});

function pauseAllExcept(current) {
    players.forEach((p) => {
        if (p !== current && !p.audio.paused) {
            p.audio.pause();
        }
    });
}

/* ============================================================
   Reveal on scroll
   ============================================================ */
const revealTargets = document.querySelectorAll(".player-card, .pricing-card");
if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-revealed");
                    io.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.15 }
    );
    revealTargets.forEach((el) => io.observe(el));
} else {
    revealTargets.forEach((el) => el.classList.add("is-revealed"));
}

/* ============================================================
   Smooth scroll CTA
   ============================================================ */
document.querySelectorAll("[data-scroll]").forEach((link) => {
    link.addEventListener("click", (e) => {
        const targetId = link.getAttribute("href");
        if (!targetId || !targetId.startsWith("#")) return;
        const target = document.querySelector(targetId);
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    });
});

/* ============================================================
   WhatsApp / contact CTA
   ============================================================ */
const ctaBtn = document.getElementById("ctaWhatsapp");
if (ctaBtn) {
    if (CONFIG.whatsappNumber) {
        ctaBtn.addEventListener("click", () => {
            const message = encodeURIComponent(
                `Hi ${CONFIG.brandName}, I'd like to discuss my campaign audio order.`
            );
            window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${message}`, "_blank", "noopener");
        });
    } else {
        ctaBtn.disabled = true;
    }
}