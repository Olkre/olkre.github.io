import { useEffect, useRef, useState } from "react";

const EMAIL = "oleksandr.kre@gmail.com";
const TEXT_SWAP_MS = 150;

const PRESS_SCALE = 0.97;
const SPRING = { stiffness: 720, damping: 28, mass: 0.55 };
const REST_EPS = 0.0004;
const VELOCITY_EPS = 0.02;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export default function CopyEmail({ email = EMAIL }: { email?: string }) {
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [showReveal, setShowReveal] = useState(false);
  const [pressed, setPressed] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLSpanElement>(null);
  const shownRef = useRef(false);
  const animating = useRef(false);
  const queueRef = useRef<boolean | null>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scaleRef = useRef(1);
  const velocityRef = useRef(0);
  const targetRef = useRef(1);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const pointerIdRef = useRef<number | null>(null);

  const wantReveal = hovered || copied;

  function applyScale(scale: number) {
    const el = buttonRef.current;
    if (!el) return;
    scaleRef.current = scale;
    if (scale === 1) {
      el.style.removeProperty("transform");
    } else {
      el.style.transform = `scale(${scale})`;
    }
  }

  function stopSpring() {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    lastTimeRef.current = null;
  }

  function tick(now: number) {
    const last = lastTimeRef.current ?? now;
    lastTimeRef.current = now;
    const dt = Math.min((now - last) / 1000, 0.032);

    const { stiffness, damping, mass } = SPRING;
    const x = scaleRef.current;
    const v = velocityRef.current;
    const target = targetRef.current;
    const force = -stiffness * (x - target) - damping * v;
    const nextV = v + (force / mass) * dt;
    const nextX = x + nextV * dt;

    velocityRef.current = nextV;
    applyScale(nextX);

    const settled =
      Math.abs(nextX - target) < REST_EPS && Math.abs(nextV) < VELOCITY_EPS;

    if (settled) {
      velocityRef.current = 0;
      applyScale(target);
      stopSpring();
      return;
    }

    rafRef.current = requestAnimationFrame(tick);
  }

  function springTo(target: number) {
    targetRef.current = target;

    if (prefersReducedMotion()) {
      stopSpring();
      velocityRef.current = 0;
      applyScale(target);
      return;
    }

    if (rafRef.current === null) {
      lastTimeRef.current = null;
      rafRef.current = requestAnimationFrame(tick);
    }
  }

  function setPress(next: boolean) {
    setPressed(next);
    springTo(next ? PRESS_SCALE : 1);
  }

  function releasePointer(el: HTMLButtonElement) {
    if (pointerIdRef.current !== null) {
      try {
        el.releasePointerCapture(pointerIdRef.current);
      } catch {
        /* already released */
      }
      pointerIdRef.current = null;
    }
  }

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
      stopSpring();
    };
  }, []);

  useEffect(() => {
    if (wantReveal === shownRef.current) return;

    const swapTo = (target: boolean) => {
      const el = contentRef.current;
      const reduced = prefersReducedMotion();

      if (!el || reduced) {
        shownRef.current = target;
        setShowReveal(target);
        animating.current = false;
        return;
      }

      animating.current = true;
      el.classList.add("is-exit");

      window.setTimeout(() => {
        shownRef.current = target;
        setShowReveal(target);
        el.classList.remove("is-exit");
        el.classList.add("is-enter-start");
        void el.offsetHeight;
        el.classList.remove("is-enter-start");
        animating.current = false;

        if (queueRef.current !== null && queueRef.current !== shownRef.current) {
          const next = queueRef.current;
          queueRef.current = null;
          swapTo(next);
        } else {
          queueRef.current = null;
        }
      }, TEXT_SWAP_MS);
    };

    if (animating.current) {
      queueRef.current = wantReveal;
      return;
    }

    swapTo(wantReveal);
  }, [wantReveal]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      const input = document.createElement("input");
      input.value = email;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }

    setCopied(true);
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={handleCopy}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => {
        setHovered(false);
        setPress(false);
      }}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        const el = buttonRef.current;
        if (!el) return;
        pointerIdRef.current = e.pointerId;
        el.setPointerCapture(e.pointerId);
        setPress(true);
      }}
      onPointerUp={() => {
        const el = buttonRef.current;
        if (el) releasePointer(el);
        setPress(false);
      }}
      onPointerCancel={() => {
        const el = buttonRef.current;
        if (el) releasePointer(el);
        setPress(false);
      }}
      onLostPointerCapture={() => {
        pointerIdRef.current = null;
        setPress(false);
      }}
      onKeyDown={(e) => {
        if (e.key !== " " && e.key !== "Enter") return;
        if (e.repeat) return;
        setPress(true);
      }}
      onKeyUp={(e) => {
        if (e.key !== " " && e.key !== "Enter") return;
        setPress(false);
      }}
      className={`contact-link group${pressed ? " is-pressed" : ""}`}
      aria-label={copied ? "Email copied" : `Copy ${email} to clipboard`}
    >
      <div className="contact-inner">
        <div className="contact-button">
          <span className="contact-cluster">
            <span className="contact-cluster-sizer" aria-hidden="true">
              <span className="contact-content-row">
                <span className="contact-email">{email}</span>
                <span className="contact-icon-slot" />
              </span>
            </span>

            <span
              ref={contentRef}
              className="t-text-swap contact-cluster-content"
            >
              {showReveal ? (
                <span className="contact-content-row">
                  <span className="contact-email">{email}</span>
                  <span
                    className={`t-icon-swap contact-icon${copied ? " is-success" : ""}`}
                    data-state={copied ? "b" : "a"}
                    aria-hidden="true"
                  >
                    <span className="t-icon" data-icon="a">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <rect
                          x="9"
                          y="9"
                          width="11"
                          height="11"
                          rx="2"
                          stroke="currentColor"
                          strokeWidth="1.75"
                        />
                        <path
                          d="M7 15H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v1"
                          stroke="currentColor"
                          strokeWidth="1.75"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>
                    <span className="t-icon" data-icon="b">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M5 13l4 4L19 7"
                          stroke="currentColor"
                          strokeWidth="2.25"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </span>
                </span>
              ) : (
                <span className="contact-content-row">
                  <span className="contact-icon" aria-hidden="true">
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect
                        x="3"
                        y="5"
                        width="18"
                        height="14"
                        rx="2"
                        stroke="currentColor"
                        strokeWidth="1.75"
                      />
                      <path
                        d="M4 7l8 6 8-6"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span>Email</span>
                </span>
              )}
            </span>
          </span>
        </div>
      </div>
    </button>
  );
}
