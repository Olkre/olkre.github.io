const emblaNode = document.querySelector(".embla");
const options = { loop: true };
const embla = EmblaCarousel(emblaNode, options);

const prevBtn = document.querySelector(".embla__button--prev");
const nextBtn = document.querySelector(".embla__button--next");
const dotsContainer = document.querySelector(".embla__dots");

const setupDots = () => {
  dotsContainer.innerHTML = "";
  embla.slideNodes().forEach((_, i) => {
    const dot = document.createElement("button");
    dot.classList.add("embla__dot");
    dot.addEventListener("click", () => embla.scrollTo(i));
    dotsContainer.appendChild(dot);
  });
};

const updateDots = () => {
  const allDots = dotsContainer.querySelectorAll(".embla__dot");
  allDots.forEach((dot) => dot.classList.remove("is-selected"));
  allDots[embla.selectedScrollSnap()].classList.add("is-selected");
};

prevBtn.addEventListener("click", embla.scrollPrev);
nextBtn.addEventListener("click", embla.scrollNext);

embla.on("select", updateDots);

setupDots();
updateDots();

// Second Embla carousel setup
const emblaNode2 = document.getElementById("myCustomCarousel");
const options2 = { loop: true };
const embla2 = EmblaCarousel(emblaNode2, options2);

const prevBtn2 = document.querySelector(".custom-embla__button--prev");
const nextBtn2 = document.querySelector(".custom-embla__button--next");

const prevBtn2a = document.querySelector(".custom-embla__button--prev2");
const nextBtn2a = document.querySelector(".custom-embla__button--next2");

const dotsContainer2 = document.querySelector(".custom-embla__dots");

const setupDots2 = () => {
  dotsContainer2.innerHTML = "";
  embla2.slideNodes().forEach((_, i) => {
    const dot = document.createElement("button");
    dot.classList.add("custom-embla__dot");
    dot.addEventListener("click", () => embla2.scrollTo(i));
    dotsContainer2.appendChild(dot);
  });
};

const updateDots2 = () => {
  const allDots = dotsContainer2.querySelectorAll(".custom-embla__dot");
  allDots.forEach((dot) => dot.classList.remove("is-selected"));
  allDots[embla2.selectedScrollSnap()].classList.add("is-selected");
};

prevBtn2.addEventListener("click", embla2.scrollPrev);
nextBtn2.addEventListener("click", embla2.scrollNext);
prevBtn2a.addEventListener("click", embla2.scrollPrev);
nextBtn2a.addEventListener("click", embla2.scrollNext);

embla2.on("select", updateDots2);

setupDots2();
updateDots2();

$(document).ready(function () {
  $(".video-hover-trigger").hover(
    function () {
      // on mouse enter
      var video = $(this).find("video")[0];
      if (!video) return;
      video.muted = true;
      video.playsInline = true;
      video.play().catch(function () {});
    },
    function () {
      // on mouse leave
      var video = $(this).find("video")[0];
      if (!video) return;
      video.pause();
    }
  );
});

// iOS Safari requires muted + playsinline and often ignores the HTML autoplay
// attribute alone — especially for carousel/offscreen videos. Force play.
(() => {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  if (reduceMotion) return;

  function prepare(video) {
    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute("muted", "");
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
  }

  function tryPlay(video) {
    if (!video) return;
    prepare(video);
    const promise = video.play();
    if (promise && typeof promise.catch === "function") {
      promise.catch(() => {});
    }
  }

  function autoplayVideos() {
    return Array.from(document.querySelectorAll("video[autoplay]"));
  }

  function kickAll() {
    autoplayVideos().forEach(tryPlay);
  }

  kickAll();

  document.addEventListener("DOMContentLoaded", kickAll);
  window.addEventListener("load", kickAll);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) kickAll();
  });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) tryPlay(entry.target);
        });
      },
      { threshold: 0.15 }
    );
    autoplayVideos().forEach((video) => {
      observer.observe(video);
      video.addEventListener("loadeddata", () => tryPlay(video));
      video.addEventListener("canplay", () => tryPlay(video));
    });
  }

  // Low Power Mode / strict autoplay: unlock on the first gesture.
  const unlock = () => kickAll();
  ["touchstart", "pointerdown", "click"].forEach((type) => {
    window.addEventListener(type, unlock, { once: true, passive: true });
  });
})();

// Bio-mark metal shimmer: play on load + hover; finish even after pointer leaves
(() => {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  if (reduceMotion) return;

  const canHover = window.matchMedia(
    "(hover: hover) and (pointer: fine)"
  ).matches;

  function playShimmer(mark) {
    if (!mark || mark.dataset.shimmerRunning === "1") return;
    mark.dataset.shimmerRunning = "1";
    let pending = mark.querySelectorAll(
      ".bio-mark-media, .bio-mark-label"
    ).length;

    const onEnd = (event) => {
      const name = event.animationName || "";
      if (!name.startsWith("bio-metal-shimmer")) return;
      pending -= 1;
      if (pending > 0) return;
      mark.classList.remove("is-shimmering");
      mark.dataset.shimmerRunning = "0";
      mark.removeEventListener("animationend", onEnd);
    };

    mark.addEventListener("animationend", onEnd);
    mark.classList.add("is-shimmering");
  }

  document.querySelectorAll(".bio-mark").forEach((mark) => {
    if (!canHover) return;
    mark.addEventListener("pointerenter", () => playShimmer(mark));
  });

  // Soon after load, during the name entrance
  window.setTimeout(() => {
    playShimmer(document.querySelector(".bio-mark--name"));
  }, 180);
})();
