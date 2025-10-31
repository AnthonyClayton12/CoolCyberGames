import { create } from 'zustand';
import { BEGINNER_LEVEL } from '../lib/levels';

type PickLabel = 'safe' | 'suspicious';

type GameFile = {
  name: string;
  sizeKB: number;
  correct: PickLabel;
  facts: string[];
  explanation?: string;
  note?: string;
  type?: string;
  size?: number;
};

type Level = {
  id: string;
  title: string;
  intro?: string;
  tip?: string;
  files: GameFile[];
};

type GameState = {
  level: Level | null;
  files: GameFile[];
  picks: Record<number, PickLabel | null>;
  score: number;
  bestByLevel: Record<string, number>;
  showExplainFor: number | null;
  showResults: boolean;

  // new API
  hasFinished: boolean;
  answeredCount: () => number;
  totalCount: () => number;
  progressPercent: () => number;

  loadLevel: (level: Level) => void;
  choose: (index: number, label: PickLabel) => void;
  toggleExplain: (index: number | null) => void;
  finish: () => void;

  // new round helpers
  finishRound: () => void;
  resetRound: () => void;

  correctCount: () => number;

  reset: () => void;
  closeResults: () => void;
};

const useGameStore = create<GameState>((set, get) => ({
  level: null,
  files: [],
  picks: {},
  score: 0,
  bestByLevel: {},
  showExplainFor: null,
  showResults: false,
  hasFinished: false,

  // counts & progress
  answeredCount() {
    const s = get();
    if (!s.picks) return 0;
    return Object.values(s.picks).filter(Boolean).length;
  },
  totalCount() {
    return get().files.length;
  },
  progressPercent() {
    const total = get().totalCount();
    if (!total) return 0;
    return Math.round((get().answeredCount() / total) * 100);
  },

  loadLevel(level) {
    const picks: Record<number, PickLabel | null> = {};
    level.files.forEach((_, i) => (picks[i] = null));
    const bestKey = `mff_best:${level.id}`;
    const bestValRaw = typeof localStorage !== 'undefined' ? localStorage.getItem(bestKey) : null;
    const bestVal = bestValRaw ? parseInt(bestValRaw, 10) : undefined;
    set((s) => ({
      level,
      files: level.files,
      picks,
      score: 0,
      showExplainFor: null,
      showResults: false,
      hasFinished: false,
      bestByLevel: { ...(s.bestByLevel || {}), ...(Number.isFinite(bestVal as number) ? { [level.id]: bestVal as number } : {}) },
    }));
  },

  choose(index, label) {
    set((s) => ({ picks: { ...(s.picks || {}), [index]: label } }));
  },

  toggleExplain(index) {
    set(() => ({ showExplainFor: index }));
  },

  // new finishRound that marks round finished and shows results
  finishRound() {
    const state = get();
    if (!state.level) {
      set(() => ({ score: 0, showResults: true, hasFinished: true }));
      return;
    }
    const score = get().correctCount();
    const levelId = state.level.id;
    const key = `mff_best:${levelId}`;
    const prevBestRaw = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    const prevBest = prevBestRaw ? parseInt(prevBestRaw, 10) : 0;
    if (score > prevBest) {
      try { localStorage.setItem(key, String(score)); } catch {}
    }
    set((s) => ({
      score,
      bestByLevel: { ...(s.bestByLevel || {}), [levelId]: Math.max(prevBest, score) },
      showResults: true,
      hasFinished: true,
    }));
  },

  // resetRound resets picks and finished state but keeps level loaded
  resetRound() {
    const s = get();
    if (!s.level) return;
    const picks: Record<number, PickLabel | null> = {};
    s.level.files.forEach((_, i) => (picks[i] = null));
    set(() => ({ picks, score: 0, showResults: false, hasFinished: false, showExplainFor: null }));
  },

  reset() {
    const s = get();
    if (s.level) s.loadLevel(s.level);
  },
  closeResults() {
    set({ showResults: false });
  },

  correctCount() {
    const s = get();
    if (!s.files || !s.picks) return 0;
    return s.files.reduce((acc, f, i) => {
      const pick = s.picks[i];
      if (!pick) return acc;
      return acc + (pick === f.correct ? 1 : 0);
    }, 0);
  },

  // totalCount already defined above

  // placeholders for methods already declared (to satisfy TS)
  finish: () => { get().finishRound(); },
}));

export default useGameStore;

// auto-load beginner level on startup
if (typeof window !== "undefined") {
  const st = useGameStore.getState();
  st.loadLevel(BEGINNER_LEVEL as any);
}

