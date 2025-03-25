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
