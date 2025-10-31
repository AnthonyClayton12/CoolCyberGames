import React from "react";
import { motion } from "framer-motion";

type Props = {
  open: boolean;
  duration?: number; // milliseconds
  onEnd?: () => void;
};

export default function BootFlash({ open, duration = 700, onEnd }: Props) {
  if (!open) return null;

  const calledRef = React.useRef(false);
  const timeoutRef = React.useRef<number | null>(null);

  const handleComplete = React.useCallback(() => {
    if (calledRef.current) return;
    calledRef.current = true;
    onEnd?.();
  }, [onEnd]);

  React.useEffect(() => {
    calledRef.current = false;
    // safety fallback in case animationcomplete doesn't fire
    timeoutRef.current = window.setTimeout(() => handleComplete(), duration + 80);
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [duration, handleComplete]);

  const secs = duration / 1000;

  return (
    <motion.div
      aria-hidden
      className="fixed inset-0 z-[1400] pointer-events-none"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
    >
      {/* backdrop fade (black -> transparent) */}
      <motion.div
        className="absolute inset-0 bg-black"
        initial={{ opacity: 0.8 }}
        animate={{ opacity: 0 }}
        transition={{ duration: secs, ease: "easeOut" }}
      />

      {/* sweeping white bar */}
      <motion.div
        className="absolute left-0 w-full h-[18%] bg-white shadow-[0_0_80px_rgba(255,255,255,0.8)] opacity-90"
        style={{ top: "-18%" }}
        initial={{ y: "-100%" }}
        animate={{ y: "100%" }}
        transition={{ duration: secs, ease: "linear" }}
        onAnimationComplete={handleComplete}
      />
    </motion.div>
  );
}