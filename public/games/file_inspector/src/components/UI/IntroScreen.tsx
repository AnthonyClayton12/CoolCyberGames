import React from "react";
import { motion } from "framer-motion";
import SpriteMascot from "./SpriteMascot";
import MatrixRain from "../Background/MatrixRain";

export const BOOT_FADE_MS = 320;

type Props = {
  open: boolean;
  onStart: () => void;
  onQuit?: () => void;
};

const MENU = ["START SCAN", "OPTIONS", "EXIT TERMINAL"] as const;

export default function IntroScreen({ open, onStart, onQuit }: Props) {
  // hide when parent says closed
  if (!open) return null;

  const startedRef = React.useRef(false);
  const cardRef = React.useRef<HTMLDivElement | null>(null);
  const [selected, setSelected] = React.useState<number>(0);
  const [bootFading, setBootFading] = React.useState(false);

  const callStartThenFade = React.useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    // trigger local fade for ambience (parent will hide after fade)
    setBootFading(true);

    // call parent onStart after the fade completes for a smoother transition
    setTimeout(onStart, BOOT_FADE_MS);
  }, [onStart]);

  React.useEffect(() => {
    // focus card for keyboard nav
    setTimeout(() => cardRef.current?.focus(), 0);

    // optional boot chime (may be blocked by browser autoplay policies)
    const playBootTone = () => {
      try {
        const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(480, now);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.frequency.exponentialRampToValueAtTime(720, now + 0.12);
        osc.stop(now + 0.24);
        setTimeout(() => {
          try { ctx.close?.(); } catch {}
        }, 600);
      } catch {}
    };

    // lock scroll while intro is visible
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // small delay to allow paint before audio attempt
    setTimeout(playBootTone, 40);

    function onKey(e: KeyboardEvent) {
      if (e.repeat) return;

      // Ensure Enter respects current menu selection even if card never received focus
      if (e.key === "Enter") {
        e.preventDefault();
        if (MENU[selected] === "START SCAN") {
          callStartThenFade();
          return;
        }
        if (MENU[selected] === "EXIT TERMINAL") {
          onQuit?.();
          return;
        }
        // otherwise, fall through (OPTIONS is a no-op for now)
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        onQuit?.();
        return;
      }
      if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        e.preventDefault();
        setSelected((s) => (s + 1) % MENU.length);
      }
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        e.preventDefault();
        setSelected((s) => (s - 1 + MENU.length) % MENU.length);
      }
      if (e.key === " ") {
        // space acts like Enter when navigating menu
        e.preventDefault();
        const choice = MENU[selected];
        if (choice === "START SCAN") callStartThenFade();
        if (choice === "EXIT TERMINAL") onQuit?.();
      }
    }

    function onClick() {
      callStartThenFade();
    }

    window.addEventListener("keydown", onKey);
    window.addEventListener("click", onClick);

    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("click", onClick);
      document.body.style.overflow = prevOverflow ?? "";
    };
  }, [callStartThenFade, onQuit, selected]);

  // card keyboard handler (keeps focus handling local)
  const onCardKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
      e.preventDefault();
      setSelected((s) => (s + 1) % MENU.length);
    } else if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
      e.preventDefault();
      setSelected((s) => (s - 1 + MENU.length) % MENU.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const choice = MENU[selected];
      if (choice === "START SCAN") callStartThenFade();
      else if (choice === "EXIT TERMINAL") onQuit?.();
    }
  };

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Intro"
      initial={{ opacity: 0 }}
      animate={bootFading ? { opacity: 0 } : { opacity: 1 }}
      transition={{ duration: bootFading ? BOOT_FADE_MS / 1000 : 0.28 }}
      className="fixed inset-0 z-[1300] bg-[#02060d] text-[#00fff0] overflow-hidden"
      onClick={callStartThenFade}
    >
      {/* MatrixRain behind the intro card */}
      <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden>
        <MatrixRain
          opacity={0.25}
          color="#00fff0"
          columnWidth={16}
          speed={1.0}
        />
      </div>

      {/* floating hex chars */}
      <div aria-hidden className="absolute inset-0 -z-9 pointer-events-none overflow-hidden">
        {Array.from({ length: 18 }).map((_, i) => {
          const left = `${(i / 18) * 100}%`;
          const delay = `${(i % 6) * 0.9}s`;
          const size = 10 + (i % 4) * 2;
          const color = "rgba(0,255,240," + (i % 2 === 0 ? "0.06" : "0.05") + ")";
          const text = "0123456789ABCDEF".repeat(6);
          return (
            <div
              key={i}
              aria-hidden
              style={{
                position: "absolute",
                left,
                top: "-20%",
                whiteSpace: "nowrap",
                fontFamily: "monospace",
                fontSize: `${size}px`,
                color,
                animation: "matrix-rain 20s linear infinite",
                animationDelay: delay,
                transform: "translateY(-120%)",
                pointerEvents: "none",
              }}
            >
              {text}
            </div>
          );
        })}
      </div>

      {/* scanlines overlay (non-interactive) */}
      <div aria-hidden className="scanlines absolute inset-0 mix-blend-overlay opacity-30 pointer-events-none -z-5" />

      {/* small soft vignette behind card for contrast */}
      <div
        aria-hidden
        className="absolute inset-0 -z-6 pointer-events-none"
        style={{
          background:
            "radial-gradient(600px 360px at 50% 36%, rgba(0,255,240,0.06), transparent 28%)",
        }}
      />

      <style>{`
        @keyframes intro-matrix-move {
          0% { background-position: 0 0, 0 0; }
          100% { background-position: 0 100%, 0 100%; }
        }
        @keyframes matrix-rain {
          0% { transform: translateY(-120%); opacity: 0.0; }
          6% { opacity: 0.08; }
          50% { opacity: 0.06; }
          100% { transform: translateY(120%); opacity: 0.0; }
        }
        .font-pixel { font-family: "Press Start 2P", "Share Tech Mono", "Courier New", monospace; }
        .intro-card:focus { outline: 3px solid rgba(0,255,240,0.12); outline-offset: 4px; }

        .title-line1 {
          color: #00fff0; font-size: 0.75rem; letter-spacing: 1px; text-shadow: 0 0 6px rgba(0,255,240,0.18);
        }
        .title-line2 {
          color: #00fff0; font-weight: 800; font-size: 1.8rem; line-height: 1;
          text-shadow: 0 0 8px #00fff0, 0 0 16px #00fff0; animation: flicker 3s linear infinite;
        }
        @keyframes flicker {
          0% { opacity: 1; } 6% { opacity: 0.92; } 8% { opacity: 0.98; } 10% { opacity: 0.9; } 12% { opacity: 1; } 50% { opacity: 0.97; } 100% { opacity: 1; }
        }

        .menu-item { transition: all 160ms ease; display:block; width:100%; text-align:left; }
        .menu-item.selected { color: #00fff0; background: rgba(0,255,240,0.06); box-shadow: 0 6px 24px rgba(0,255,240,0.06), 0 0 18px rgba(0,255,240,0.06); animation: pulse-glow 1.6s ease-in-out infinite; }
        .menu-item.selected::before { content: '>_'; margin-right: 0.5rem; color: #00fff0; opacity: 0.98; }
        @keyframes pulse-glow { 0% { box-shadow: 0 0 0px rgba(0,255,240,0.06); } 50% { box-shadow: 0 0 12px rgba(0,255,240,0.12); } 100% { box-shadow: 0 0 0px rgba(0,255,240,0.06); } }

        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes bootFade { to { opacity: 0; transform: translateY(-10px); } }
        .boot-blink { animation: blink 1s step-end infinite; }
        .boot-fade { animation: bootFade ${BOOT_FADE_MS}ms ease-in-out forwards; }
      `}</style>

      <motion.div
        ref={cardRef}
        tabIndex={-1}
        initial={{ opacity: 0, scale: 0.98, y: 6 }}
        animate={bootFading ? { opacity: 0, y: -10, scale: 0.98 } : { opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="intro-card relative z-10 mx-auto max-w-xl w-[92%] rounded-2xl bg-[#071022]/80 ring-1 ring-cyan-500/12 p-8 text-center font-pixel"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onCardKeyDown}
      >
        <div className="mb-4">
          <div>
            <div className="title-line1">FILE</div>
            <div className="title-line2">DETECTIVE</div>
            <p className="mt-2 text-xs text-[#00fff0]">Learn to spot dangerous files before they learn you.</p>
          </div>
        </div>

        <div className="my-6 flex items-center justify-center">
          <SpriteMascot size={84} accent="#00fff0" className="drop-shadow-[0_0_12px_rgba(0,255,240,0.12)]" />
        </div>

        <nav aria-label="Intro menu" className="mt-4">
          <ul className="flex flex-col items-center gap-3">
            {MENU.map((label, i) => {
              const isSel = i === selected;
              return (
                <li key={label} className="w-full max-w-[280px]">
                  <button
                    type="button"
                    aria-pressed={isSel}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelected(i);
                      if (label === "START SCAN") callStartThenFade();
                      else if (label === "EXIT TERMINAL") onQuit?.();
                    }}
                    className={`px-4 py-3 rounded-md menu-item ${isSel ? "selected text-[#00fff0]" : "text-[#00fff0]/80"}`}
                  >
                    <span className="inline-block align-middle">{label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }} className="mt-6">
          <div className="text-sm text-[#00fff0] mb-3">Use ↑/↓ or W/S to navigate — Enter to select</div>
          <div className="inline-block px-4 py-2 rounded-md bg-[#071422] text-[#00fff0] ring-1 ring-cyan-500/20 animate-[pulse_1.6s_ease-in-out_infinite]">
            <span className="font-semibold" style={{ color: "#00fff0" }}>Start</span>
          </div>
        </motion.div>

        {/* boot prompt */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-4">
          {!bootFading ? (
            <div className="boot-blink text-xs text-[#00fff0] opacity-90">PRESS ENTER TO BOOT</div>
          ) : (
            <div className="text-xs text-[#00fff0] opacity-90 boot-fade">PRESS ENTER TO BOOT</div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}