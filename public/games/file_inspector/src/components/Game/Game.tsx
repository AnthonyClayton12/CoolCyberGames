import React from 'react';
import useGameStore from '../../store/useGameStore';
import TutorialModal from '../UI/TutorialModal';
import FileCard from './FileCard';

const Game: React.FC = () => {
  const level = useGameStore((s) => s.level);
  const files = level?.files ?? [];
  const picks = useGameStore((s) => s.picks);
  const choose = useGameStore((s) => s.choose);
  const finishRound = useGameStore((s) => s.finishRound);
  const reset = useGameStore((s) => s.reset);
  const showResults = useGameStore((s) => s.showResults);
  const correctCount = useGameStore((s) => s.correctCount());
  const totalCount = useGameStore((s) => s.totalCount());
  const score = useGameStore((s) => s.score);
  const closeResults = useGameStore((s) => s.closeResults);
  const answered = useGameStore((s) => s.answeredCount());
  const hasFinished = useGameStore((s) => s.hasFinished);
  const bestByLevel = useGameStore((s) => s.bestByLevel);

  const [showTutorial, setShowTutorial] = React.useState<boolean>(() => {
    try {
      return localStorage.getItem('mff_skip_intro') !== 'true';
    } catch {
      return true;
    }
  });

  const handleCloseTutorial = () => {
    try {
      localStorage.setItem('mff_skip_intro', 'true');
    } catch {
      // ignore
    }
    setShowTutorial(false);
  };

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (showResults || showTutorial) return; // 🔒 ignore while modal open

      const idx = files.findIndex((_, j) => !picks?.[j]);
      if (idx === -1) return;

      const key = e.key.toLowerCase();
      if (key === "s") choose(idx, "safe");
      if (key === "x") choose(idx, "suspicious");
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [files, picks, choose, showResults, showTutorial]); // include showTutorial

  if (!level) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center text-slate-600">No level loaded.</div>
      </div>
    );
  }

  return (
    <>
      {answered === 0 && !showResults && showTutorial && (
        <TutorialModal open={showTutorial} onClose={handleCloseTutorial} />
      )}

      <div className="relative z-10 mx-auto max-w-5xl px-6 pt-10 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content: files */}
          <section className="lg:col-span-2">
            <div className="mb-6">
              <h1 className="text-3xl font-bold tracking-tight text-white">{level.title}</h1>
              {level.intro && <p className="mt-2 text-sm text-slate-300">{level.intro}</p>}
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-2">
              {files.map((f, i) => {
                return (
                  <div key={i}>
                    <FileCard
                      index={i}
                      name={f.name}
                      size={f.sizeKB ?? f.size ?? 0}
                      type={f.type}
                      status={'clean'}
                      facts={f.facts}
                      revealWhy={hasFinished}
                    />
                  </div>
                );
              })}
            </div>
          </section>

          {/* Sidebar */}
          <aside className="bg-[#0e1a2b]/85 backdrop-blur-md text-slate-100 rounded-2xl p-4 shadow-lg ring-1 ring-cyan-500/15">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-300">Progress</div>
                <div className="mt-2 text-sm text-slate-600">
                  Best: {bestByLevel[level.id] ?? 0}
                </div>
                <div className="text-3xl font-bold tracking-tight text-white">{answered} / {totalCount}</div>
              </div>
            </div>

            <div className="mt-4">
              <button
                onClick={() => finishRound()}
                disabled={!answered || answered !== totalCount}
                className={`w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-400/60 ${
                  answered === totalCount
                    ? "bg-mff-blue text-white hover:bg-mff-blue/90"
                    : "bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600 cursor-not-allowed"
                }`}
              >
                {answered === totalCount ? "Finish Level" : "Finish (answer all files)"}
              </button>
            </div>

            <div className="mt-3 text-sm text-slate-600">
              <div>Current stored score: {score}</div>
              {level.tip && <div className="mt-2 font-medium">Tip: <span className="text-sm text-slate-700">{level.tip}</span></div>}
            </div>
          </aside>

          {/* Results modal */}
          {showResults && (
            <div
              role="dialog"
              aria-modal="true"
              className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[1200]"
            >
              <div className="bg-[#0e1a2b]/95 text-slate-100 rounded-2xl p-6 shadow-2xl ring-1 ring-cyan-500/15">
                <div className="text-center">
                  <h3 className="text-xl font-semibold">Results</h3>
                  <p className="mt-3 text-sm text-slate-300">
                    You got <span className="font-bold text-white">{correctCount}</span> of <span className="font-bold text-white">{totalCount}</span> correct.
                  </p>
                  {level.tip && <p className="mt-3 text-sm text-slate-400">{level.tip}</p>}

                  <div className="mt-6 flex items-center justify-center gap-3">
                    <button
                      onClick={() => reset()}
                      className="px-3 py-1.5 rounded-md bg-mff-blue text-white hover:bg-mff-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-300"
                    >
                      Play Again
                    </button>

                    <button
                      onClick={closeResults}
                      className="px-3 py-1.5 rounded-md bg-slate-700 text-slate-100 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-400/60"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Game;
