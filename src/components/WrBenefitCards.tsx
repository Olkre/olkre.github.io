import { useEffect, useRef, useState } from "react";

type Benefit = {
  title: string;
  shortTitle: string;
  tone: string;
  accent: string;
  video: string;
};

const BENEFITS: Benefit[] = [
  {
    title: "Make it yours",
    shortTitle: "Personalize",
    tone: "#e7f9e4",
    accent: "#73b87a",
    video: "/images/benefits/render1.mp4",
  },
  {
    title: "Multi-functional",
    shortTitle: "Multi-functional",
    tone: "#fff9e1",
    accent: "#ff985e",
    video: "/images/benefits/fold.mp4",
  },
  {
    title: "High-quality",
    shortTitle: "High-quality",
    tone: "#eee5f8",
    accent: "#6e6892",
    video: "/images/benefits/render3-3.mp4",
  },
];

function BenefitVideo({ benefit, active }: { benefit: Benefit; active: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.pause();
    video.currentTime = 0;
  }, [benefit.video]);

  const play = () => {
    if (active) videoRef.current?.play().catch(() => {});
  };

  const pause = () => videoRef.current?.pause();

  return (
    <div
      className="wr-benefit-card group relative flex h-[202px] w-[186px] shrink-0 flex-col overflow-hidden rounded-[18px] pt-2 transition-transform duration-300 ease-out"
      style={{ backgroundColor: benefit.tone, color: benefit.accent }}
      onPointerEnter={play}
      onPointerLeave={pause}
    >
      <div className="relative z-10 flex h-[54px] items-center justify-center px-3 text-center">
        <h3 className="text-[20px] font-bold leading-[0.94] tracking-[-0.8px]">
          {benefit.title}
        </h3>
      </div>
      <video
        ref={videoRef}
        className="absolute inset-x-0 bottom-0 h-[158px] w-full object-cover"
        muted
        loop
        playsInline
        preload={active ? "metadata" : "none"}
        aria-label={`${benefit.title} product animation`}
      >
        <source src={benefit.video} type="video/mp4" />
      </video>
      <span className="wr-live-badge pointer-events-none absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full bg-white/65 px-2 py-1 text-[9px] font-medium leading-none tracking-tight text-black/70 opacity-0 backdrop-blur-md transition-[opacity,transform,background-color] duration-300 group-hover:scale-105 group-hover:opacity-100">
        <svg className="wr-live-icon" width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle className="wr-live-ring" cx="8" cy="8" r="5.6" stroke="currentColor" strokeWidth="1.1" strokeDasharray="1.2 2.2" />
          <circle className="wr-live-ring wr-live-ring--inner" cx="8" cy="8" r="3.5" stroke="currentColor" strokeWidth="1" strokeDasharray="0.8 1.7" />
          <circle cx="8" cy="8" r="1.55" fill="currentColor" />
        </svg>
        Hover to play
      </span>
    </div>
  );
}

export default function WrBenefitCards() {
  const [active, setActive] = useState(0);

  const previous = () =>
    setActive((index) => (index - 1 + BENEFITS.length) % BENEFITS.length);
  const next = () => setActive((index) => (index + 1) % BENEFITS.length);

  return (
    <div className="flex h-full w-full flex-col bg-white px-3 pb-2 pt-2.5 text-black">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[11px] font-medium leading-none tracking-tight text-black/55">
          3D Benefit cards
        </span>
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            className="inline-flex size-6 items-center justify-center rounded-full border border-black/10 text-[14px] leading-none text-[#155dfc] transition-transform hover:-translate-x-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#155dfc]"
            onClick={previous}
            aria-label="Previous benefit card"
          >
            ←
          </button>
          <button
            type="button"
            aria-label="Next benefit card"
            className="rounded-full border border-black/10 px-2 py-1 text-[10px] font-medium leading-none text-[#155dfc] transition-transform hover:translate-x-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#155dfc]"
            onClick={next}
          >
            Next slide →
          </button>
        </div>
      </div>

      <div className="relative mt-2 min-h-0 flex-1 overflow-hidden rounded-[18px]">
        <div
          className="flex h-full items-center gap-2 transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)]"
          style={{ transform: `translateX(calc(50% - ${active * 194 + 93}px))` }}
        >
          {BENEFITS.map((benefit, index) => (
            <BenefitVideo
              key={benefit.video}
              benefit={benefit}
              active={index === active}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-center gap-1.5 pt-1.5" role="tablist" aria-label="3D benefit cards">
        {BENEFITS.map((benefit, index) => (
          <button
            key={benefit.video}
            type="button"
            role="tab"
            aria-label={`Show ${benefit.shortTitle} card`}
            aria-selected={active === index}
            className={`h-1.5 rounded-full transition-all duration-300 ${active === index ? "w-8 bg-black/80" : "w-8 bg-black/10"}`}
            onClick={() => setActive(index)}
          />
        ))}
      </div>
    </div>
  );
}
