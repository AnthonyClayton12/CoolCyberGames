import React, { useEffect, useRef } from 'react';
import useGameStore from '../../store/useGameStore';
import { Volume2, X } from 'lucide-react';


const focusableSelector =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

const ExplainModal: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { showExplainFor, files, toggleExplain } = useGameStore();

  const open = showExplainFor !== null;
  const file = open ? files[showExplainFor as number] : null;

  useEffect(() => {
    if (!open) return;

    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        toggleExplain(null);
      }
      if (ev.key === 'Tab') {
        const el = containerRef.current;
        if (!el) return;
        const focusable = Array.from(el.querySelectorAll<HTMLElement>(focusableSelector));
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (ev.shiftKey && document.activeElement === first) {
          ev.preventDefault();
          last.focus();
        } else if (!ev.shiftKey && document.activeElement === last) {
          ev.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', onKey);
    // autofocus first focusable inside modal
    setTimeout(() => {
      const el = containerRef.current;
      if (!el) return;
      const focusable = Array.from(el.querySelectorAll<HTMLElement>(focusableSelector));
      if (focusable.length) focusable[0].focus();
    }, 0);

    return () => document.removeEventListener('keydown', onKey);
  }, [open, toggleExplain]);

  function doSpeak(text: string) {
    if (!text) return;
    try {
      const synth = window.speechSynthesis;
      if (!synth) return;
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      synth.speak(u);
    } catch {
      // ignore
    }
  }

  if (!open || !file) return null;

  const heuristics = Array.isArray((file as any).facts) ? (file as any).facts.join(' • ') : '';
  const details = [file.explanation ?? '', heuristics, (file as any).note ?? ''].filter(Boolean).join('\n\n');

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-[1200]"
      onClick={() => toggleExplain(null)}
    >
      <div
        ref={containerRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0b1324]/95 text-slate-100 rounded-2xl p-6 shadow-2xl ring-1 ring-cyan-500/10 max-w-3xl w-[92%] outline-none transition-transform duration-200 animate-[modal-pop_0.25s_ease-out]"
      >
        <header className="flex justify-between items-center gap-3">
          <div>
            <div className="font-semibold text-base">{file.name}</div>
            <div className="text-sm text-slate-400">
              {file.type ?? ''} {file.size ? ` • ${file.size} KB` : ''}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => doSpeak(details)}
              aria-label="Listen to explanation"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-mff-blue text-white hover:bg-mff-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-400/60"
            >
              <Volume2 size={16} /> Listen
            </button>

            <button
              onClick={() => toggleExplain(null)}
              aria-label="Close explanation"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 hover:bg-slate-300 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-400/60"
            >
              <X size={16} /> Close
            </button>
          </div>
        </header>

        <section className="mt-4 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
          {details || 'No additional explanation available.'}
        </section>
      </div>
    </div>
  );
};

export default ExplainModal;