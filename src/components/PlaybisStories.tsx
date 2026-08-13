import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import "./PlaybisStories.css";

const slides = [
  { video: "7_1", screen: "screen1" },
  { video: "7_2", screen: "screen2" },
  { video: "7_3", screen: "screen3" },
  { video: "bg", screen: "screen4" },
  { video: "bg", screen: "screen5" },
] as const;

export default function PlaybisStories() {
  const [isIos, setIsIos] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef<number | null>(null);
  const currentDragOffset = useRef(0);
  const activePointer = useRef<number | null>(null);

  useEffect(() => {
    setIsIos(
      /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1),
    );
  }, []);

  const showPrevious = () => {
    setActiveSlide((current) => (current - 1 + slides.length) % slides.length);
  };

  const showNext = () => {
    setActiveSlide((current) => (current + 1) % slides.length);
  };

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    activePointer.current = event.pointerId;
    dragStartX.current = event.clientX;
    currentDragOffset.current = 0;
    setDragOffset(0);
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const updateDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (activePointer.current !== event.pointerId || dragStartX.current === null) return;

    let nextOffset = event.clientX - dragStartX.current;
    const draggingPastFirst = activeSlide === 0 && nextOffset > 0;
    const draggingPastLast = activeSlide === slides.length - 1 && nextOffset < 0;

    if (draggingPastFirst || draggingPastLast) nextOffset *= 0.25;

    currentDragOffset.current = nextOffset;
    setDragOffset(nextOffset);
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (activePointer.current !== event.pointerId) return;

    const viewportWidth = viewportRef.current?.clientWidth ?? 0;
    const switchThreshold = Math.min(80, viewportWidth * 0.14);
    const finalOffset = currentDragOffset.current;

    if (finalOffset <= -switchThreshold && activeSlide < slides.length - 1) {
      setActiveSlide((current) => current + 1);
    } else if (finalOffset >= switchThreshold && activeSlide > 0) {
      setActiveSlide((current) => current - 1);
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    activePointer.current = null;
    dragStartX.current = null;
    currentDragOffset.current = 0;
    setDragOffset(0);
    setIsDragging(false);
  };

  const cancelDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (activePointer.current !== event.pointerId) return;

    activePointer.current = null;
    dragStartX.current = null;
    currentDragOffset.current = 0;
    setDragOffset(0);
    setIsDragging(false);
  };

  return (
    <section
      id="case1"
      className={`case-container duration-700 gap-2 md:flex hidden flex-col max-w-4xl lg:w-full overflow-hidden !rounded-none !border-0 !bg-transparent !p-0${isIos ? " is-ios" : ""}`}
      aria-labelledby="playbis-stories-title"
    >
      <div className="case-header w-full pb-1 flex justify-between items-center p-3">
        <h4 id="playbis-stories-title">Playbis 3D stories</h4>
        <div className="flex inline-flex">
          <button
            type="button"
            className="next-btn1 playbis-stories__previous group w-fit flex-none transition-all duration-300 overflow-visible p-0 rounded-full"
            onClick={showPrevious}
            aria-label="Show previous Playbis story"
          >
            <span className="next-btn-container w-full h-full p-0.5 rounded-full duration-300 bg-white border border-gray-100">
              <span
                className="case-link next-btn-content border-0 w-full h-full text-sm justify-center text-[#101010] bg-white items-center font-medium inline-flex overflow-hidden px-2 py-0 rounded-full"
                style={{ border: 0 }}
                aria-hidden="true"
              >
                <span>←</span>
              </span>
            </span>
          </button>
          <button
            type="button"
            className="next-btn1 group w-fit transition-all duration-300 overflow-visible p-0 rounded-full"
            onClick={showNext}
            aria-label="Show next Playbis story"
          >
            <span className="next-btn-container transition-all w-full h-full p-0.5 rounded-full duration-300 bg-white border border-gray-100">
              <span
                className="case-link cl-level-3 transition-all next-btn-content border-0 w-full h-full text-sm justify-center text-[#101010] bg-white items-center font-medium inline-flex overflow-hidden px-2 py-0 rounded-full"
                style={{ border: 0 }}
              >
                Next slide <span className="ms-1" aria-hidden="true">→</span>
              </span>
            </span>
          </button>
        </div>
      </div>

      <div className="case-card overflow-hidden rounded-4xl bg-white px-2">
        <div
          className="embla__dots playbis-stories__dots w-xl lg:w-md pe-4 hidden md:flex"
          style={{ paddingRight: 20 }}
          aria-label="Choose a Playbis story"
        >
          {slides.map((slide, index) => (
            <button
              key={slide.screen}
              type="button"
              className={`embla__dot${activeSlide === index ? " is-selected" : ""}`}
              onClick={() => setActiveSlide(index)}
              aria-label={`Show story ${index + 1}`}
              aria-current={activeSlide === index ? "true" : undefined}
            />
          ))}
        </div>

        <img
          className="bezel absolute hidden lg:block"
          src="/images/case7/bezel.webp"
          alt=""
          aria-hidden="true"
          draggable={false}
          style={{
            marginTop: -13.5,
            marginLeft: -8,
            transform: "scale(0.92)",
            userSelect: "none",
            pointerEvents: "none",
            clipPath: "inset(0 0 22% 0)",
          }}
        />

        <div
          ref={viewportRef}
          className={`embla playbis-stories__viewport${isDragging ? " is-dragging" : ""}`}
          onPointerDown={startDrag}
          onPointerMove={updateDrag}
          onPointerUp={endDrag}
          onPointerCancel={cancelDrag}
          aria-roledescription="carousel"
          aria-label="Playbis stories"
        >
          <div
            className="embla__container playbis-stories__track"
            data-dragging={isDragging ? "true" : "false"}
            style={{
              transform: `translate3d(calc(-${activeSlide * 100}% + ${dragOffset}px), 0, 0)`,
            }}
          >
            {slides.map((slide, index) => (
              <div
                className="embla__slide"
                key={slide.screen}
                aria-hidden={activeSlide !== index}
              >
                <div className="slide-content" style={{ marginTop: -30 }}>
                  <video className="playbis-video" autoPlay muted loop playsInline width="600" draggable={false}>
                    <source src={`/images/case7/${slide.video}.webm`} type="video/webm" />
                    <source src={`/images/case7/${slide.video}.mp4`} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                  <img
                    className="playbis-gif"
                    src={`/images/case7/${slide.video}.gif`}
                    width="600"
                    alt=""
                    aria-hidden="true"
                    draggable={false}
                  />
                  <img className="bezel" src="/images/case7/bezel.webp" alt="" aria-hidden="true" draggable={false} />
                  <img
                    src={`/images/case7/${slide.screen}.webp`}
                    className="case7-screen"
                    alt={`Playbis mobile story screen ${index + 1}`}
                    draggable={false}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
