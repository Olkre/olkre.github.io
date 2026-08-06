import { motion, useReducedMotion } from "motion/react";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import xsRaw from "../assets/wr/scaling/xs.svg?raw";
import sRaw from "../assets/wr/scaling/s.svg?raw";
import mdRaw from "../assets/wr/scaling/md.svg?raw";
import lRaw from "../assets/wr/scaling/l.svg?raw";
import {
  createMorph,
  fitTransform,
  parseSvgShape,
  ringsFromPoints,
  ringsFromShape,
  ringsToPathD,
  type Morph,
  type Ring,
} from "../lib/svgMorph";

const MIN = 28;
const MAX = 150;
/** Odd count so S, M and L land on exact quarter ticks. */
const TICKS = 45;
const LAST = TICKS - 1;
const LABELS: Record<number, string> = {
  [LAST / 4]: "S",
  [LAST / 2]: "M",
  [(3 * LAST) / 4]: "L",
};
const MORPH_MS = 340;
const MORPH_BLUR = 1.6;
/** Matches the ruler's horizontal padding so ticks map to pointer position. */
const RULER_PAD = 24;

const LEVELS = [
  { shape: parseSvgShape(xsRaw), label: "XS detail" },
  { shape: parseSvgShape(sRaw), label: "S detail" },
  { shape: parseSvgShape(mdRaw), label: "M detail" },
  { shape: parseSvgShape(lRaw), label: "L detail" },
] as const;

const INITIAL_SIZE = 88;

type Palette = {
  id: string;
  fg: string;
  bg: string;
  label: string;
};

const PALETTES: Palette[] = [
  { id: "ink", fg: "#000000", bg: "#FFFFFF", label: "Ink" },
  { id: "wood", fg: "#E5BB8F", bg: "#4C2D23", label: "Wood" },
  { id: "moss", fg: "#DCE8D7", bg: "#29483B", label: "Moss" },
];

function levelForSize(size: number) {
  const t = (size - MIN) / (MAX - MIN);
  return Math.min(LEVELS.length - 1, Math.max(0, Math.floor(t * LEVELS.length)));
}

function isLightColor(hex: string) {
  const value = hex.replace("#", "");
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  return red * 0.299 + green * 0.587 + blue * 0.114 > 210;
}

const INITIAL_LEVEL = levelForSize(INITIAL_SIZE);
const INITIAL_SHAPE = LEVELS[INITIAL_LEVEL]!.shape;

const ringsCache = new Map<number, Ring[]>();
const morphCache = new Map<string, Morph>();

function ringsForLevel(index: number) {
  let rings = ringsCache.get(index);
  if (!rings) {
    rings = ringsFromShape(LEVELS[index]!.shape);
    ringsCache.set(index, rings);
  }
  return rings;
}

function easeInOut(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export default function WrScalingCard() {
  const reduceMotion = useReducedMotion();
  const [size, setSize] = useState(INITIAL_SIZE);
  const [paletteId, setPaletteId] = useState<string>("ink");
  const [swapped, setSwapped] = useState(false);
  const [label, setLabel] = useState(LEVELS[INITIAL_LEVEL]!.label);

  const pathRef = useRef<SVGPathElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  /** Interpolated subpaths of an in-flight morph, so retargets start from them. */
  const liveRings = useRef<Float64Array[] | null>(null);
  const renderedLevel = useRef(INITIAL_LEVEL);
  const frame = useRef<number | null>(null);

  const palette = PALETTES.find((p) => p.id === paletteId) ?? PALETTES[0]!;
  const fg = swapped ? palette.bg : palette.fg;
  const bg = swapped ? palette.fg : palette.bg;
  const level = levelForSize(size);
  const currentTick = Math.min(
    LAST,
    Math.max(0, Math.round(((size - MIN) / (MAX - MIN)) * LAST)),
  );

  useEffect(() => {
    if (renderedLevel.current === level) return;

    const path = pathRef.current;
    const svg = svgRef.current;
    if (!path) return;

    const settle = (index: number) => {
      const shape = LEVELS[index]!.shape;
      path.setAttribute("d", shape.d);
      const transform = fitTransform(shape.fit);
      if (transform) path.setAttribute("transform", transform);
      else path.removeAttribute("transform");
      if (svg) svg.style.filter = "";
      liveRings.current = null;
      renderedLevel.current = index;
      setLabel(LEVELS[index]!.label);
    };

    if (reduceMotion) {
      settle(level);
      return;
    }

    const from = liveRings.current
      ? ringsFromPoints(liveRings.current.map((pts) => pts.slice()))
      : ringsForLevel(renderedLevel.current);

    let morph: Morph;
    if (liveRings.current) {
      morph = createMorph(from, ringsForLevel(level));
    } else {
      const key = `${renderedLevel.current}->${level}`;
      const cached = morphCache.get(key);
      morph = cached ?? createMorph(from, ringsForLevel(level));
      if (!cached) morphCache.set(key, morph);
    }

    // Morphed points live in the shared 128 box, so the per-shape fit is dropped.
    path.removeAttribute("transform");

    const target = level;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / MORPH_MS);
      const rings = morph(easeInOut(t));
      path.setAttribute("d", ringsToPathD(rings));
      liveRings.current = rings;
      if (svg) {
        svg.style.filter = `blur(${(Math.sin(Math.PI * t) * MORPH_BLUR).toFixed(2)}px)`;
      }

      if (t < 1) {
        frame.current = requestAnimationFrame(tick);
      } else {
        frame.current = null;
        settle(target);
      }
    };

    frame.current = requestAnimationFrame(tick);

    return () => {
      if (frame.current != null) {
        cancelAnimationFrame(frame.current);
        frame.current = null;
      }
    };
  }, [level, reduceMotion]);

  useEffect(() => {
    const warm = () => LEVELS.forEach((_, index) => ringsForLevel(index));
    const idle = window.requestIdleCallback;
    if (typeof idle === "function") {
      const handle = idle(warm);
      return () => window.cancelIdleCallback?.(handle);
    }
    const timer = window.setTimeout(warm, 400);
    return () => window.clearTimeout(timer);
  }, []);

  const markStyle: CSSProperties = {
    width: size,
    height: size,
    transform: "translateY(10px)",
    transition: reduceMotion
      ? undefined
      : "width 160ms ease-out, height 160ms ease-out, transform 160ms ease-out",
  };

  function sizeForTick(index: number) {
    return MIN + ((MAX - MIN) * index) / LAST;
  }

  /** Whole strip is the hit area: the tick column under the pointer wins. */
  function onScrub(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const usable = Math.max(1, rect.width - RULER_PAD * 2);
    const x = Math.min(Math.max(event.clientX - rect.left - RULER_PAD, 0), usable);
    const index = Math.min(LAST, Math.max(0, Math.floor((x / usable) * TICKS)));
    setSize(sizeForTick(index));
  }

  return (
    <div
      className="flex h-full w-full flex-col items-stretch gap-1 px-3 pb-2.5 pt-2.5 transition-colors duration-200 ease-out"
      style={{ backgroundColor: bg, color: fg }}
    >
      <div className="flex items-center justify-center">
        <div
          className="flex items-center gap-2 rounded-full bg-transparent p-1.5"
          role="radiogroup"
          aria-label="Logo color"
        >
          {PALETTES.map((p) => {
            const on = p.id === paletteId;
            const isSwapped = on && swapped;
            const activeBackground = isSwapped ? p.fg : p.bg;
            return (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-label={p.label}
                aria-checked={on}
                title={p.label}
                style={
                  on && isLightColor(activeBackground)
                    ? { border: "1px solid rgba(0, 0, 0, 0.2)" }
                    : undefined
                }
                className="relative flex size-6 items-center justify-center rounded-full transition-transform duration-150 ease-out hover:scale-110 active:scale-[0.96] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
                onClick={() => {
                  if (p.id === paletteId) {
                    setSwapped((v) => !v);
                    return;
                  }
                  setPaletteId(p.id);
                  setSwapped(false);
                }}
              >
                {on ? (
                  <motion.span
                    layoutId={reduceMotion ? undefined : "wr-palette-ring"}
                    className="wr-liquid-glass pointer-events-none absolute -inset-[3px] z-10 overflow-hidden rounded-full"
                    transition={{ type: "spring", stiffness: 500, damping: 38 }}
                  >
                    <span className="wr-liquid-glass__window" aria-hidden="true">
                      <span className="wr-liquid-glass__liquid wr-liquid-glass__liquid--one" />
                      <span className="wr-liquid-glass__liquid wr-liquid-glass__liquid--two" />
                    </span>
                    <span className="wr-liquid-glass__shine" aria-hidden="true" />
                    <svg className="wr-liquid-glass__filters" aria-hidden="true" focusable="false">
                      <defs>
                        <filter id="wr-liquid-refraction">
                          <feTurbulence
                            type="fractalNoise"
                            baseFrequency="0.035"
                            numOctaves="1"
                            seed="8"
                            result="noise"
                          />
                          <feDisplacementMap
                            in="SourceGraphic"
                            in2="noise"
                            scale="5"
                            xChannelSelector="R"
                            yChannelSelector="G"
                          />
                        </filter>
                      </defs>
                    </svg>
                  </motion.span>
                ) : null}
                {/* Each swatch previews the pair as nested circles; swapping reverses their scale. */}
                <motion.span
                  className="relative flex size-full items-center justify-center rounded-full"
                  animate={{ backgroundColor: isSwapped ? p.fg : p.bg }}
                  whileHover={reduceMotion ? undefined : { scale: 1.04 }}
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { duration: 0.22, ease: "easeInOut" }
                  }
                >
                  <motion.span
                    className="size-[52%] rounded-full"
                    animate={{
                      scale: isSwapped ? 1.22 : 1,
                      backgroundColor: isSwapped ? p.bg : p.fg,
                    }}
                    whileHover={reduceMotion ? undefined : { scale: isSwapped ? 1.34 : 1.2 }}
                    whileTap={reduceMotion ? undefined : { scale: 0.94 }}
                    transition={
                      reduceMotion
                        ? { duration: 0 }
                        : {
                            type: "spring",
                            stiffness: 430,
                            damping: 24,
                            backgroundColor: { duration: 0.22, ease: "easeInOut" },
                          }
                    }
                  />
                </motion.span>
              </button>
            );
          })}
          <span
            aria-hidden="true"
            className="h-3.5 w-px"
            style={{
              backgroundColor:
                "color-mix(in srgb, currentColor 22%, transparent)",
            }}
          />
          <button
            type="button"
            aria-label="Swap foreground and background"
            aria-pressed={swapped}
            title="Swap colors"
            className="inline-flex size-6 items-center justify-center rounded-full opacity-70 transition-[opacity,transform] duration-150 ease-out hover:scale-110 active:scale-[0.96] hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
            onClick={() => setSwapped((v) => !v)}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              style={{
                transform: swapped ? "rotate(180deg)" : undefined,
                transition: reduceMotion
                  ? undefined
                  : "transform 300ms cubic-bezier(0.34, 1.4, 0.64, 1)",
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
        <svg
          ref={svgRef}
          viewBox="0 0 128 128"
          role="img"
          aria-label={`Wood&Room mark at ${Math.round(size)}px, ${label}`}
          className="shrink-0 overflow-visible will-change-[filter]"
          style={markStyle}
        >
          <path
            ref={pathRef}
            d={INITIAL_SHAPE.d}
            transform={fitTransform(INITIAL_SHAPE.fit)}
            fillRule="evenodd"
            fill={fg}
            style={
              reduceMotion
                ? undefined
                : { transition: "fill 200ms ease-out" }
            }
          />
        </svg>
      </div>

      <div
        className="relative -mx-3 -mb-2.5 cursor-ew-resize touch-none select-none px-6 pb-2.5 pt-3"
        role="slider"
        aria-label="Logo size"
        aria-valuemin={MIN}
        aria-valuemax={MAX}
        aria-valuenow={Math.round(size)}
        tabIndex={0}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          onScrub(e);
        }}
        onPointerMove={onScrub}
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
        <div
          className="pointer-events-none flex h-6 items-end justify-between gap-px"
          aria-hidden="true"
        >
          {Array.from({ length: TICKS }, (_, i) => {
            const isCurrent = i === currentTick;
            const isNear = Math.abs(currentTick - i) === 1;
            const isPassed = i < currentTick;

            let height = 7;
            if (isCurrent) height = 18;
            else if (isNear) height = 12;
            else if (isPassed) height = 9;

            let opacity = 0.22;
            if (isCurrent) opacity = 1;
            else if (isNear) opacity = 0.7;
            else if (isPassed) opacity = 0.5;

            return (
              <span
                key={i}
                className="flex flex-1 justify-center"
                style={{ height: 18, alignItems: "flex-end" }}
              >
                <span
                  className="w-0.5 rounded-full transition-[height,opacity] duration-150 ease-out"
                  style={{ height, backgroundColor: fg, opacity }}
                />
              </span>
            );
          })}
        </div>
        <div className="pointer-events-none relative mt-2 h-4 pt-1" aria-hidden="true">
          {Object.entries(LABELS).map(([index, tickLabel]) => {
            const i = Number(index);
            const left = `${((i + 0.5) / TICKS) * 100}%`;
            const isCurrent = i === currentTick;
            return (
              <span
                key={tickLabel}
                className="absolute top-0 -translate-x-1/2 text-[9px] font-medium leading-none tracking-[0.16em] transition-opacity duration-150 ease-out"
                style={{ left, color: fg, opacity: isCurrent ? 1 : 0.4 }}
              >
                {tickLabel}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
