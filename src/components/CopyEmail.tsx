import { useEffect, useRef, useState, type CSSProperties } from "react";

const EMAIL = "oleksandr.kre@gmail.com";
const TEXT_SWAP_MS = 150;

const PRESS_SCALE = 0.99;
const SPRING = { stiffness: 720, damping: 28, mass: 0.55 };
const REST_EPS = 0.0004;
const VELOCITY_EPS = 0.02;
const CONFETTI = [
  { x: -11, y: -8, delay: 0, size: 0.9, rotate: -22 },
  { x: -8, y: 8, delay: 24, size: 0.75, rotate: 28 },
  { x: -3, y: -12, delay: 12, size: 0.8, rotate: 8 },
  { x: 4, y: -10, delay: 32, size: 0.7, rotate: -34 },
  { x: 10, y: -5, delay: 18, size: 0.9, rotate: 42 },
  { x: 11, y: 6, delay: 38, size: 0.75, rotate: -12 },
  { x: 5, y: 11, delay: 28, size: 0.8, rotate: 24 },
  { x: -10, y: 2, delay: 44, size: 0.65, rotate: -48 },
];

function EmailText({ email, animate }: { email: string; animate?: boolean }) {
  return (
    <span
      className={`contact-email${animate ? " is-copying" : ""}`}
      aria-hidden={animate ? true : undefined}
    >
      {Array.from(email).map((character, index) => (
        <span
          key={`${character}-${index}`}
          style={{ "--letter-index": index } as CSSProperties}
        >
          {character}
        </span>
      ))}
    </span>
  );
}

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
                <span>Reach out via email</span>
              </span>
              <span className="contact-content-row">
                <EmailText email={email} />
                <span className="contact-icon-slot" />
              </span>
            </span>

            <span ref={contentRef} className="t-text-swap contact-cluster-content">
              {showReveal ? (
                <span className="contact-content-row">
                  <EmailText email={email} animate={copied} />
                  <span
                    className={`t-icon-swap contact-icon${copied ? " is-success" : ""}`}
                    data-state={copied ? "b" : "a"}
                    aria-hidden="true"
                  >
                    <span className="t-icon" data-icon="a">
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 11 11"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M9.53857 2.55717C9.88503 2.90387 10.0797 3.3739 10.0799 3.86404V8.2317C10.0799 8.72187 9.88515 9.19196 9.53855 9.53855C9.19195 9.88515 8.72187 10.0799 8.2317 10.0799H3.86404C3.37387 10.0799 2.90378 9.88515 2.55719 9.53855C2.21059 9.19196 2.01587 8.72187 2.01587 8.2317V3.86404C2.01587 3.84623 2.01671 3.82909 2.01839 3.81263C2.03088 3.33157 2.23086 2.87444 2.57567 2.53876C2.92048 2.20309 3.38282 2.01544 3.86404 2.01587H8.2317C8.72209 2.01587 9.19182 2.21041 9.53857 2.55717Z"
                          fill="black"
                        />
                        <path
                          d="M7.7485 0.763056C7.78066 0.820903 7.80112 0.884519 7.8087 0.950272C7.81628 1.01602 7.81084 1.08263 7.79268 1.14628C7.77452 1.20992 7.744 1.26937 7.70287 1.32123C7.66173 1.37308 7.61079 1.41633 7.55294 1.4485C7.4951 1.48066 7.43148 1.50112 7.36573 1.5087C7.29997 1.51628 7.23337 1.51084 7.16972 1.49268C7.10607 1.47452 7.04662 1.444 6.99477 1.40287C6.94292 1.36174 6.89967 1.31079 6.8675 1.25294C6.75612 1.05235 6.69514 1.008 6.552 1.008H1.512C1.23581 1.008 1.008 1.23581 1.008 1.512V6.55099C1.008 6.73243 1.10578 6.89976 1.26353 6.98947C1.32104 7.02223 1.37154 7.066 1.41214 7.11828C1.45274 7.17056 1.48265 7.23032 1.50015 7.29416C1.51766 7.358 1.52241 7.42466 1.51416 7.49033C1.5059 7.55601 1.48479 7.61941 1.45202 7.67693C1.41926 7.73444 1.37549 7.78494 1.32321 7.82554C1.27093 7.86614 1.21117 7.89605 1.14733 7.91355C1.0835 7.93106 1.01684 7.93581 0.951165 7.92756C0.885489 7.9193 0.822084 7.89819 0.764568 7.86542C0.532532 7.73347 0.339565 7.54244 0.205275 7.31175C0.0709861 7.08106 0.000161724 6.81893 0 6.552V1.512C0 0.679392 0.679392 0 1.512 0H6.552C7.10338 0 7.47331 0.268632 7.7485 0.763056Z"
                          fill="black"
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
                    <span
                      className={`contact-confetti${copied ? " is-bursting" : ""}`}
                      aria-hidden="true"
                    >
                      {CONFETTI.map((particle, index) => (
                        <i
                          key={index}
                          style={
                            {
                              "--px": `${particle.x}px`,
                              "--py": `${particle.y}px`,
                              "--pdelay": `${particle.delay}ms`,
                              "--psize": particle.size,
                              "--protate": `${particle.rotate}deg`,
                            } as CSSProperties
                          }
                        />
                      ))}
                    </span>
                  </span>
                </span>
              ) : (
                <span className="contact-content-row">
                  <span>Reach out via email</span>
                </span>
              )}
            </span>
          </span>
        </div>
      </div>
    </button>
  );
}
