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
      var text = $(this).find(".hover-play-text")[0];
      video.play(); // Start playing the video
    },
    function () {
      // on mouse leave
      var video = $(this).find("video")[0];
      video.pause(); // Pause the video
    }
  );
});
