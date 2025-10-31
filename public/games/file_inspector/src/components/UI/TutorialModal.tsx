import { motion } from "framer-motion";
import React, { useEffect, useState } from 'react';

export type TutorialModalProps = {
  open?: boolean;
  onClose?: () => void;
};

// centralized storage key used everywhere in this module
const STORAGE_KEY = 'mff_skip_intro';

const SLIDES = [
  {
    title: 'Recognize extensions',
    content: (
      <>
        <p className="mt-2 text-sm text-slate-800">
          File extensions (like .pdf, .jpg, .exe) tell you what the file is. Prefer images (.jpg/.png) and plain text (.txt) when unsure.
        </p>
      </>
    ),
  },
  {
    title: 'Watch for double extensions',
    content: (
      <>
        <p className="mt-2 text-sm text-slate-800">
          Double extensions (e.g., "invoice.pdf.exe") often hide executables. Treat anything ending with .exe/.bat/.scr/.ps1 as executable.
        </p>
      </>
    ),
  },
  {
    title: 'Macro docs & archives',
    content: (
      <>
        <p className="mt-2 text-sm text-slate-800">
          Macro-enabled Office files (.docm/.xlsm) and archives (.zip, .rar) can contain code or scripts. Scan and be cautious before opening.
        </p>
      </>
    ),
  },
];

export default function TutorialModal({ open: openProp, onClose }: TutorialModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = typeof openProp === 'boolean' ? openProp : internalOpen;
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(STORAGE_KEY);
      if (!seen) setInternalOpen(true);
    } catch {
      setInternalOpen(true);
    }
  }, []);

  const closeAndPersist = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // ignore storage errors
    }
    setInternalOpen(false);
    onClose?.();
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tutorial"
      tabIndex={-1}
      onKeyDown={(e) => e.key === "Escape" && closeAndPersist()}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1300] p-4"
      onClick={closeAndPersist}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white text-slate-900 rounded-2xl shadow-2xl p-6 w-full max-w-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-center mb-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-mff-blue">🧠 Malicious File Finder</h2>
            <p className="text-sm text-mff-muted mt-1">Learn to spot dangerous files before they learn you.</p>
          </div>
        </header>

        <header className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">{SLIDES[idx].title}</h3>
            <div className="mt-1 text-sm text-slate-500">{`${idx + 1} of ${SLIDES.length}`}</div>
          </div>
          <button
            onClick={closeAndPersist}
            aria-label="Close tutorial"
            className="ml-4 px-3 py-1.5 rounded-md bg-mff-blue/10 text-slate-800 hover:bg-slate-300 focus:outline-none"
          >
            Let me play
          </button>
        </header>

        <main className="mt-4">
          <div className="text-sm text-slate-800">{SLIDES[idx].content}</div>

          <div className="mt-6 flex items-center justify-center gap-2">
            {SLIDES.map((_, i) => (
              <span
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  i === idx ? 'bg-mff-blue' : 'bg-mff-blue/10'
                }`}
                aria-hidden
              />
            ))}
          </div>
        </main>

        <footer className="mt-6 flex items-center justify-between">
          <div>
            <button
              onClick={() => setIdx((s) => Math.max(0, s - 1))}
              disabled={idx === 0}
              className="px-3 py-1.5 rounded-md bg-mff-blue/10 text-slate-800 hover:bg-slate-300 disabled:opacity-50 focus:outline-none"
            >
              Back
            </button>
          </div>

          <div className="flex items-center gap-3">
            {idx < SLIDES.length - 1 ? (
              <button
                onClick={() => setIdx((s) => Math.min(SLIDES.length - 1, s + 1))}
                className="px-3 py-1.5 rounded-md bg-mff-blue text-white hover:bg-mff-blue/90 focus:outline-none"
              >
                Next
              </button>
            ) : (
              <button
                onClick={closeAndPersist}
                className="px-4 py-2 rounded-md bg-mff-blue text-white font-semibold shadow-sm
                            hover:bg-mff-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mff-blue"
              >
                🚀 Start Scanning
              </button>
            )}
          </div>
        </footer>
      </motion.div>
    </div>
  );
};
