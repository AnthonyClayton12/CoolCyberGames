import React, { useEffect, useRef } from 'react';

type Props = {
  opacity?: number; // 0..1
  color?: string; // hex color like '#00ff6a'
  columnWidth?: number; // px
  speed?: number; // multiplier
};

const DEFAULT_OPACITY = 0.9;
const DEFAULT_COLOR = '#00ff6a';
const DEFAULT_COLUMN_WIDTH = 14;
const DEFAULT_SPEED = 1.0;

// A small set of characters — feel free to expand
const CHARS = 'アァカサタナハマヤャラワン01２３４５６７８９ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/* helper: convert hex -> {h,s,l} */
function hexToHsl(hex: string) {
  const h = hex.replace('#', '');
  const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  const r = ((bigint >> 16) & 255) / 255;
  const g = ((bigint >> 8) & 255) / 255;
  const b = (bigint & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let hue = 0;
  let sat = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    sat = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: hue = (g - b) / d + (g < b ? 6 : 0); break;
      case g: hue = (b - r) / d + 2; break;
      case b: hue = (r - g) / d + 4; break;
    }
    hue = hue * 60;
  }

  return { h: Math.round(hue), s: Math.round(sat * 100), l: Math.round(l * 100) };
}
// precompute target hues for subtle shift (between cyan and green-blue)
const HSL_A = hexToHsl('#00fff0'); // cyan-ish
const HSL_B = hexToHsl('#52ffa8'); // green-ish

const MatrixRain: React.FC<Props> = ({
  opacity = DEFAULT_OPACITY,
  color = DEFAULT_COLOR,
  columnWidth = DEFAULT_COLUMN_WIDTH,
  speed = DEFAULT_SPEED,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const dropsRef = useRef<number[] | null>(null);
  const preferReducedMotion = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  useEffect(() => {
    const canvas = canvasRef.current!;
    if (!canvas || typeof window === 'undefined') return;

    const ctx = canvas.getContext('2d')!;
    if (!ctx) return;

    let dpr = Math.max(1, window.devicePixelRatio || 1);
    let width = 0;
    let height = 0;
    let columns = 0;
    let fontSize = 12;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(0, rect.width || window.innerWidth);
      height = Math.max(0, rect.height || window.innerHeight);

      dpr = Math.max(1, window.devicePixelRatio || 1);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // derive sensible fontSize from columnWidth
      fontSize = Math.max(10, Math.round(columnWidth * 0.9));
      ctx.font = `${fontSize}px "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", monospace`;
      ctx.textBaseline = 'top';

      columns = Math.ceil(width / columnWidth);
      // initialize drops if missing or column count changed
      const prev = dropsRef.current ?? [];
      const next = new Array(columns).fill(0).map((_, i) => {
        // if previous exists, keep position; else randomize start
        return prev[i] ?? Math.floor(Math.random() * (height / fontSize));
      });
      dropsRef.current = next;
    }

    // draw once (or animate)
    function drawFrame() {
      if (!ctx) return;

      // fade the canvas slightly to create trailing effect
      ctx.fillStyle = `rgba(0,0,0,${0.08 * Math.max(0.6, 1 - (speed - 1) * 0.1)})`;
      ctx.fillRect(0, 0, width, height);

      // pick a subtle random hue between the two targets for this frame
      const t = Math.random(); // random per frame for subtle variation
      const hue = Math.round(HSL_A.h + (HSL_B.h - HSL_A.h) * t);
      const sat = Math.round(HSL_A.s * (1 - t) + HSL_B.s * t);
      const lig = Math.round(HSL_A.l * (1 - t) + HSL_B.l * t);
      ctx.globalAlpha = Math.max(0.85, Math.min(1, opacity));

      const drops = dropsRef.current!;
      for (let i = 0; i < drops.length; i++) {
        const x = i * columnWidth;
        const y = drops[i] * fontSize;

        // pick a random character
        const glyph = CHARS.charAt(Math.floor(Math.random() * CHARS.length));

        // brighter head effect: draw head with full alpha then body with less alpha
        const jitter = (Math.random() - 0.5) * 6; // +/- degrees
        ctx.fillStyle = `hsl(${Math.max(0, hue + jitter)} ${sat}% ${lig}%)`;
        ctx.globalAlpha = 0.98;
        ctx.fillText(glyph, x, y);

        // advance drop
        const velocity = (1 + Math.random() * 0.6) * speed * (fontSize / 14);
        drops[i] = drops[i] + velocity;

        // reset occasionally
        if (drops[i] * fontSize > height + Math.random() * 1000) {
          drops[i] = 0;
        }
      }

      ctx.globalAlpha = 1;
    }

    // animation loop
    function loop() {
      drawFrame();
      rafRef.current = requestAnimationFrame(loop);
    }

    // initialize & start/respect reduced motion
    resize();
    window.addEventListener('resize', resize);

    // Pause animation when window loses focus, resume on focus
    const onBlur = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
    const onFocus = () => {
      if (!preferReducedMotion && !rafRef.current) {
        rafRef.current = requestAnimationFrame(loop);
      }
    };
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);

    if (!preferReducedMotion) {
      // clear once before animating
      ctx.clearRect(0, 0, width, height);
      // darker initial fill for contrast
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      rafRef.current = requestAnimationFrame(loop);
    } else {
      // draw a single subtle static frame for reduced-motion users
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      // draw sparse chars
      const drops = dropsRef.current!;
      for (let i = 0; i < drops.length; i += 6) {
        const x = i * columnWidth;
        const y = (drops[i] % Math.ceil(height / fontSize)) * fontSize;
        const glyph = CHARS.charAt(Math.floor(Math.random() * CHARS.length));
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.9;
        ctx.fillText(glyph, x, y);
      }
      ctx.globalAlpha = 1;
    }

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    // re-run when columnWidth, speed, color change
  }, [columnWidth, speed, color, preferReducedMotion]);

  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <canvas
        ref={canvasRef}
        className="h-full w-full mix-blend-screen"
        style={{ opacity }}
        aria-hidden
      />
    </div>
  );
};

export default MatrixRain;
