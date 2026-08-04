import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import {
  newBenefitImageSize,
  newBenefitMetalImages,
  newBenefitSilhouetteImages,
} from "../assets/new_benefit";
import {
  LiquidMetal,
  type LiquidMetalProps,
} from "@paper-design/shaders-react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";

const CARD_HEIGHT = 120;

/** Hover / press scale — metal mask + LiquidMetal move together; silhouette scales less */
const HOVER_METAL_SCALE = 1.07;
const HOVER_SIL_SCALE = 1.035;
const PRESS_METAL_SCALE = 0.91;
const PRESS_SIL_SCALE = 0.95;
const RELEASE_OVERSHOOT_METAL = 1.22;
const RELEASE_OVERSHOOT_SIL = 1.1;
/** Only swap to static metal after a deliberate hold — skips flash on quick taps */
const LIQUID_FADE_DELAY_MS = 120;
const RELEASE_OVERSHOOT_MS = 90;
const PRESS_IN_SPRING = {
  type: "spring" as const,
  stiffness: 620,
  damping: 32,
  mass: 0.38,
};
/** Low damping so release overshoots past rest — the “jump out” */
const RELEASE_SPRING = {
  type: "spring" as const,
  stiffness: 220,
  damping: 10,
  mass: 0.2,
};

/** Cursor parallax — metal layers follow the pointer more than the silhouette */
const PARALLAX_METAL_MAX = { x: 6, y: 4 };
const PARALLAX_SIL_MAX = { x: 2, y: 1.4 };
const PARALLAX_SPRING = { stiffness: 140, damping: 22, mass: 0.35 };

const clampUnit = (v: number) => Math.max(-1, Math.min(1, v));

export type BenefitIcon = keyof typeof newBenefitMetalImages;

function cardWidth(variant: BenefitIcon) {
  const { width, height } = newBenefitImageSize[variant];
  return Math.round(CARD_HEIGHT * (width / height));
}

function metalTintMaskStyle(metalSrc: string, tint: string): CSSProperties {
  return {
    backgroundColor: `color-mix(in srgb, ${tint} 40%, transparent)`,
    WebkitMaskImage: `url("${metalSrc}")`,
    maskImage: `url("${metalSrc}")`,
    WebkitMaskSize: "contain",
    maskSize: "contain",
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
    maskPosition: "center",
  };
}

const ICON_TINT: Record<BenefitIcon, string> = {
  bolt: "#6E9CFF",
  timer: "#46BA6C",
  friends: "#A18CF7",
};

type LiquidMetalSettings = Pick<
  LiquidMetalProps,
  | "speed"
  | "softness"
  | "repetition"
  | "shiftRed"
  | "shiftBlue"
  | "distortion"
  | "contour"
  | "scale"
  | "rotation"
  | "shape"
  | "angle"
>;

const LIQUID_METAL_DEFAULTS: LiquidMetalSettings = {
  speed: 1.36,
  softness: 0.92,
  repetition: 3.98,
  shiftRed: 1,
  shiftBlue: 1,
  distortion: 0.38,
  contour: 0.84,
  scale: 1,
  rotation: 0,
  shape: "diamond",
  angle: 0,
};

const LIQUID_METAL_BY_VARIANT: Partial<
  Record<BenefitIcon, Partial<LiquidMetalSettings>>
> = {
  bolt: {
    speed: 1,
    softness: 0.1,
    repetition: 2,
    shiftRed: 0.3,
    shiftBlue: 0.3,
    distortion: 0.07,
    contour: 1,
    scale: 1,
    rotation: 0,
    shape: "diamond",
    angle: 70,
  },
  friends: { angle: 0 },
  timer: { angle: 230 },
};

type Props = {
  variant: BenefitIcon;
  className?: string;
  colorTint?: string;
};

/** Single benefit mark — silhouette + liquid metal. */
export default function BoltCard({
  variant,
  className = "",
  colorTint,
}: Props) {
  const tint = colorTint ?? ICON_TINT[variant];
  const metalSrc = newBenefitMetalImages[variant];
  const silhouetteSrc = newBenefitSilhouetteImages[variant];
  const width = cardWidth(variant);
  const liquidMetal = {
    ...LIQUID_METAL_DEFAULTS,
    ...LIQUID_METAL_BY_VARIANT[variant],
  };
  const [pressed, setPressed] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [liquidHidden, setLiquidHidden] = useState(false);
  const [hovered, setHovered] = useState(false);
  const parallaxZoneRef = useRef<HTMLDivElement>(null);
  const pressedRef = useRef(false);
  const liquidFadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const releaseOvershootTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const shouldReduceMotion = useReducedMotion();

  const mouseNormX = useMotionValue(0);
  const mouseNormY = useMotionValue(0);
  const smoothNormX = useSpring(mouseNormX, PARALLAX_SPRING);
  const smoothNormY = useSpring(mouseNormY, PARALLAX_SPRING);

  const metalParallaxX = useTransform(
    smoothNormX,
    (n) => n * PARALLAX_METAL_MAX.x,
  );
  const metalParallaxY = useTransform(
    smoothNormY,
    (n) => n * PARALLAX_METAL_MAX.y,
  );
  const silParallaxX = useTransform(smoothNormX, (n) => n * PARALLAX_SIL_MAX.x);
  const silParallaxY = useTransform(smoothNormY, (n) => n * PARALLAX_SIL_MAX.y);

  const clearLiquidFadeTimer = () => {
    if (liquidFadeTimerRef.current === null) return;
    clearTimeout(liquidFadeTimerRef.current);
    liquidFadeTimerRef.current = null;
  };

  const startPress = () => {
    pressedRef.current = true;
    setPressed(true);
    if (shouldReduceMotion) return;
    clearLiquidFadeTimer();
    liquidFadeTimerRef.current = setTimeout(() => {
      liquidFadeTimerRef.current = null;
      setLiquidHidden(true);
    }, LIQUID_FADE_DELAY_MS);
  };

  const clearReleaseOvershootTimer = () => {
    if (releaseOvershootTimerRef.current === null) return;
    clearTimeout(releaseOvershootTimerRef.current);
    releaseOvershootTimerRef.current = null;
  };

  const releasePress = () => {
    const wasPressed = pressedRef.current;
    pressedRef.current = false;
    setPressed(false);
    clearLiquidFadeTimer();
    setLiquidHidden(false);
    clearReleaseOvershootTimer();
    if (!wasPressed || shouldReduceMotion) {
      setReleasing(false);
      return;
    }
    setReleasing(true);
    releaseOvershootTimerRef.current = setTimeout(() => {
      releaseOvershootTimerRef.current = null;
      setReleasing(false);
    }, RELEASE_OVERSHOOT_MS);
  };

  const resetParallax = () => {
    mouseNormX.set(0);
    mouseNormY.set(0);
  };

  const updateParallaxFromPointer = (e: PointerEvent<HTMLDivElement>) => {
    if (shouldReduceMotion) return;
    const zone = parallaxZoneRef.current;
    if (!zone) return;
    const rect = zone.getBoundingClientRect();
    const halfW = rect.width / 2;
    const halfH = rect.height / 2;
    if (halfW < 1 || halfH < 1) return;
    const nx = clampUnit((e.clientX - rect.left - halfW) / halfW);
    const ny = clampUnit((e.clientY - rect.top - halfH) / halfH);
    mouseNormX.set(nx);
    mouseNormY.set(ny);
  };

  useEffect(() => {
    if (!shouldReduceMotion) return;
    mouseNormX.set(0);
    mouseNormY.set(0);
  }, [shouldReduceMotion, mouseNormX, mouseNormY]);

  useEffect(
    () => () => {
      clearLiquidFadeTimer();
      clearReleaseOvershootTimer();
    },
    [],
  );

  const metalScale = shouldReduceMotion
    ? 1
    : pressed
      ? PRESS_METAL_SCALE
      : releasing
        ? RELEASE_OVERSHOOT_METAL
        : hovered
          ? HOVER_METAL_SCALE
          : 1;
  const silScale = shouldReduceMotion
    ? 1
    : pressed
      ? PRESS_SIL_SCALE
      : releasing
        ? RELEASE_OVERSHOOT_SIL
        : hovered
          ? HOVER_SIL_SCALE
          : 1;
  return (
    <div
      className={`relative flex w-max max-w-full shrink-0 select-none items-center justify-center antialiased [-webkit-touch-callout:none] [font-synthesis:none] [&_*]:select-none ${className}`}
      onCopy={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      <div
        ref={parallaxZoneRef}
        className="relative flex cursor-pointer touch-manipulation items-center justify-center"
        style={{ width, height: CARD_HEIGHT }}
        onPointerEnter={(e) => {
          if (e.pointerType !== "touch") setHovered(true);
        }}
        onPointerMove={updateParallaxFromPointer}
        onPointerLeave={() => {
          releasePress();
          setHovered(false);
          resetParallax();
        }}
        onPointerDown={startPress}
        onPointerUp={releasePress}
        onPointerCancel={releasePress}
      >
        <motion.div
          className="pointer-events-none absolute inset-0 m-auto h-full w-full origin-center will-change-transform"
          style={{ x: silParallaxX, y: silParallaxY }}
          animate={{ scale: silScale }}
          transition={pressed ? PRESS_IN_SPRING : RELEASE_SPRING}
        >
          <img
            src={silhouetteSrc}
            width={width}
            height={CARD_HEIGHT}
            alt=""
            className="block h-full w-full object-contain"
            draggable={false}
            aria-hidden
          />
        </motion.div>
        <motion.div
          className="pointer-events-none absolute inset-0 z-[1] m-auto h-full w-full origin-center will-change-transform"
          style={{ x: metalParallaxX, y: metalParallaxY }}
          animate={{ scale: metalScale }}
          transition={pressed ? PRESS_IN_SPRING : RELEASE_SPRING}
        >
          <div
            aria-hidden
            className="metal-plain absolute inset-0 m-auto h-full w-full"
            style={metalTintMaskStyle(metalSrc, tint)}
          />
          <div
            className="relative z-10 block h-full w-full bg-transparent transition-opacity duration-150 ease-out"
            style={{ opacity: liquidHidden ? 0 : 1 }}
          >
            <LiquidMetal
              {...liquidMetal}
              image={metalSrc}
              frame={650683.6850000786}
              colorBack="#00000000"
              colorTint={tint}
              width={width}
              height={CARD_HEIGHT}
              className="block size-full select-none bg-transparent"
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
