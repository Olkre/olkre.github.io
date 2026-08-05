import { useReducedMotion } from "motion/react";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import xsSvg from "../assets/wr/scaling/xs.svg?url";
import sSvg from "../assets/wr/scaling/s.svg?url";
import mdSvg from "../assets/wr/scaling/md.svg?url";
import lSvg from "../assets/wr/scaling/l.svg?url";

const MIN = 28;
const MAX = 150;
const TICKS = 44;
const LAST = TICKS - 1;
/** Mirror S and L so margins from each end match. */
const LABELS: Record<number, string> = {
  [Math.round(LAST / 4)]: "S",
  [Math.round(LAST / 2)]: "M",
  [Math.round((3 * LAST) / 4)]: "L",
};
const MORPH_MS = 150;

const LEVELS = [
  { src: xsSvg, label: "XS detail" },
  { src: sSvg, label: "S detail" },
  { src: mdSvg, label: "M detail" },
  { src: lSvg, label: "L detail" },
] as const;

type Palette = {
  id: string;
  fg: string;
  bg: string;
  swatch: string;
  label: string;
};

const PALETTES: Palette[] = [
  { id: "ink", fg: "#fff", bg: "#282828", swatch: "#111", label: "Ink" },
  { id: "wood", fg: "#fff", bg: "#845743", swatch: "#845743", label: "Wood" },
  { id: "paper", fg: "#282828", bg: "#F4F1EA", swatch: "#F4F1EA", label: "Paper" },
];

function levelForSize(size: number) {
  const t = (size - MIN) / (MAX - MIN);
  return Math.min(LEVELS.length - 1, Math.max(0, Math.floor(t * LEVELS.length)));
}

function preloadMask(src: string) {
  const img = new Image();
  img.decoding = "async";
  img.src = src;
  return img.decode().catch(() => undefined);
}

export default function WrScalingCard() {
  const reduceMotion = useReducedMotion();
  const [size, setSize] = useState(88);
  const [activeTick, setActiveTick] = useState<number | null>(null);
  const [paletteId, setPaletteId] = useState<string>("ink");
  const [swapped, setSwapped] = useState(false);
  const [masksReady, setMasksReady] = useState(false);

  const palette = PALETTES.find((p) => p.id === paletteId) ?? {
    id: "ink",
    fg: "#fff",
    bg: "#282828",
    swatch: "#111",
    label: "Ink",
  };
  const fg = swapped ? palette.bg : palette.fg;
  const bg = swapped ? palette.fg : palette.bg;
  const level = levelForSize(size);
  const mark = LEVELS[level] ?? LEVELS[0]!;

  const [renderSrc, setRenderSrc] = useState(mark.src);
  const [renderLabel, setRenderLabel] = useState(mark.label);
  const [morphing, setMorphing] = useState(false);
  const morphGen = useRef(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all(LEVELS.map((l) => preloadMask(l.src))).then(() => {
      if (!cancelled) setMasksReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (mark.src === renderSrc) return;

    if (reduceMotion) {
      void preloadMask(mark.src).then(() => {
        setRenderSrc(mark.src);
        setRenderLabel(mark.label);
        setMorphing(false);
      });
      return;
    }

    const gen = ++morphGen.current;
    setMorphing(true);

    const timer = window.setTimeout(() => {
      void preloadMask(mark.src).then(() => {
        if (gen !== morphGen.current) return;
        setRenderSrc(mark.src);
        setRenderLabel(mark.label);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (gen === morphGen.current) setMorphing(false);
          });
        });
      });
    }, MORPH_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [mark.label, mark.src, reduceMotion, renderSrc]);

  const markStyle: CSSProperties = {
    width: size,
    height: size,
    backgroundColor: fg,
    WebkitMaskImage: masksReady ? `url("${renderSrc}")` : "none",
    maskImage: masksReady ? `url("${renderSrc}")` : "none",
    WebkitMaskSize: "contain",
    maskSize: "contain",
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
    maskPosition: "center",
    // Solid square while masks decode so the card never looks empty.
    opacity: masksReady ? 1 : 0.22,
    transition: reduceMotion
      ? undefined
      : "width 160ms ease-out, height 160ms ease-out, background-color 200ms ease-out, opacity 180ms ease-out",
  };

  const morphWrapStyle: CSSProperties = {
    filter: morphing ? "blur(7px)" : "blur(0px)",
    opacity: morphing ? 0.55 : 1,
    transform: morphing ? "scale(0.94)" : "scale(1)",
    transition: reduceMotion
      ? undefined
      : [
          `filter ${MORPH_MS}ms ease-in-out`,
          `opacity ${MORPH_MS}ms ease-in-out`,
          `transform ${MORPH_MS}ms ease-in-out`,
        ].join(", "),
  };

  function sizeForTick(index: number) {
    return MIN + ((MAX - MIN) * index) / LAST;
  }

  function onTickEnter(index: number) {
    setActiveTick(index);
    setSize(sizeForTick(index));
  }

  function onTickLeave() {
    setActiveTick(null);
  }

  function onPress(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.min(Math.max(event.clientX - rect.left, 0), rect.width);
    const index = Math.round((x / rect.width) * LAST);
    setActiveTick(index);
    setSize(sizeForTick(index));
  }

  return (
    <div
      className="flex h-full w-full flex-col items-stretch gap-1 px-3 pb-2.5 pt-2.5 transition-colors duration-200 ease-out"
      style={{ backgroundColor: bg, color: fg }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium leading-none tracking-tight opacity-55">
          {renderLabel}
        </span>
        <div
          className="flex items-center gap-1 rounded-full border border-black/10 p-0.5"
          style={{
            backgroundColor: "color-mix(in srgb, #fff 18%, transparent)",
          }}
          role="group"
          aria-label="Logo color"
        >
          {PALETTES.map((p) => {
            const on = p.id === paletteId;
            return (
              <button
                key={p.id}
                type="button"
                aria-label={p.label}
                aria-pressed={on}
                title={p.label}
                className="size-5 rounded-full border border-black/15 transition-transform duration-150 ease-out hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#155dfc]"
                style={{
                  backgroundColor: p.swatch,
                  boxShadow: on ? `0 0 0 1.5px ${fg}` : undefined,
                  transform: on ? "scale(1.08)" : undefined,
                }}
                onClick={() => {
                  setPaletteId(p.id);
                  setSwapped(false);
                }}
              />
            );
          })}
          <button
            type="button"
            aria-label="Swap foreground and background"
            title="Swap colors"
            className="ms-0.5 inline-flex size-5 items-center justify-center rounded-full border border-black/10 bg-white text-black transition-transform duration-150 ease-out hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#155dfc]"
            onClick={() => setSwapped((v) => !v)}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              style={{
                transform: swapped ? "rotate(180deg)" : undefined,
                transition: reduceMotion
                  ? undefined
                  : "transform 200ms ease-out",
              }}
            >
              <path
                d="M13.684 5.25h.03a.75.75 0 0 1 0 1.5c-1.292 0-2.275 0-3.058.063-.785.063-1.283.183-1.636.371a3.75 3.75 0 0 0-1.677 1.764c-.19.394-.304.88-.363 1.638-.06.764-.06 1.738-.06 3.094v.11l1.12-1.12a.75.75 0 1 1 1.06 1.06l-2.4 2.4a.75.75 0 0 1-1.086-.053l-2.17-2.4a.75.75 0 1 1 1.112-.997l.865.957V13.65c0-1.317 0-2.35.065-3.179.066-.844.202-1.542.509-2.176a4.5 4.5 0 0 1 2.319-2.431c.625-.335 1.37-.476 2.224-.544.85-.068 1.891-.068 3.147-.068Z"
                fill="currentColor"
              />
              <path
                opacity="0.5"
                d="M17.847 7.65a.75.75 0 0 1 1.054.247l2.171 2.4a.75.75 0 1 1-1.112.997l-.866-.956v.005c0 1.317 0 2.35-.064 3.179-.066.844-.202 1.542-.509 2.176a4.5 4.5 0 0 1-2.319 2.431c-.625.335-1.37.476-2.224.544-.85.068-1.891.068-3.147.068h-.03a.75.75 0 0 1 0-1.5c1.292 0 2.275 0 3.058-.063.784-.063 1.283-.183 1.636-.371a3.75 3.75 0 0 0 1.677-1.763c.19-.394.304-.88.363-1.638.059-.765.06-1.74.06-3.095v-.11l-1.12 1.12a.75.75 0 1 1-1.06-1.06l2.4-2.4a.75.75 0 0 1 .262-.191Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center">
        <div
          className="will-change-[filter,opacity,transform]"
          style={morphWrapStyle}
        >
          <div
            role="img"
            aria-label={`Wood&Room mark at ${Math.round(size)}px, ${renderLabel}`}
            className="shrink-0"
            style={markStyle}
          />
        </div>
      </div>

      <div
        className="relative h-14 w-full cursor-ew-resize touch-none px-0.5"
        role="slider"
        aria-label="Logo size"
        aria-valuemin={MIN}
        aria-valuemax={MAX}
        aria-valuenow={Math.round(size)}
        tabIndex={0}
        onPointerDown={onPress}
        onPointerMove={(e) => {
          if (e.buttons === 1) onPress(e);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowUp") {
            e.preventDefault();
            setSize((s) => Math.min(MAX, s + 4));
          } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
            e.preventDefault();
            setSize((s) => Math.max(MIN, s - 4));
          }
        }}
      >
        {/* Tall tick columns — full height is the hover/press hit target */}
        <div className="absolute inset-x-0.5 inset-y-0 flex items-end justify-between gap-px pb-4">
          {Array.from({ length: TICKS }, (_, i) => {
            const isActive = activeTick === i;
            const isNear = activeTick != null && Math.abs(activeTick - i) === 1;
            let height = 7;
            if (isActive) height = 18;
            else if (isNear) height = 12;

            return (
              <button
                key={i}
                type="button"
                tabIndex={-1}
                aria-label={`Size ${Math.round(sizeForTick(i))}px`}
                className="relative flex h-full flex-1 flex-col items-center justify-end border-0 bg-transparent p-0"
                onPointerEnter={() => onTickEnter(i)}
                onPointerLeave={onTickLeave}
              >
                <span
                  className="w-0.5 rounded-full transition-[height,opacity] duration-150 ease-out"
                  style={{
                    height,
                    backgroundColor: fg,
                    opacity: isActive ? 1 : isNear ? 0.7 : 0.28,
                  }}
                />
              </button>
            );
          })}
        </div>
        <div
          className="pointer-events-none absolute inset-x-0.5 bottom-0 h-3"
          aria-hidden="true"
        >
          {Object.entries(LABELS).map(([index, label]) => {
            const i = Number(index);
            const left = `${(i / LAST) * 100}%`;
            return (
              <span
                key={label}
                className="absolute top-0 -translate-x-1/2 text-[9px] font-medium leading-none opacity-40"
                style={{ left, color: fg }}
              >
                {label}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
