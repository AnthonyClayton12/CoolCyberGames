import React from "react";
import Header from "./components/Layout/Header";
import Game from "./components/Game/Game";
import ExplainModal from "./components/UI/ExplainModal";
import MatrixRain from "./components/Background/MatrixRain";
import IntroScreen from "./components/UI/IntroScreen";
import BootFlash from "./components/UI/BootFlash";
import "./styles/globals.css";

const App: React.FC = () => {
  // show intro immediately on load
  const [showIntro, setShowIntro] = React.useState<boolean>(true);
  const [showBootFlash, setShowBootFlash] = React.useState<boolean>(false);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020617]/95 text-slate-200">
      {/* decorative gradient layers (behind MatrixRain) */}
      <div
        className="absolute inset-0 -z-10 pointer-events-none
        [background:
          radial-gradient(700px_700px_at_20%_15%,rgba(0,255,255,.12),transparent_40%),
          radial-gradient(600px_600px_at_80%_10%,rgba(11,95,255,.12),transparent_45%),
          radial-gradient(900px_900px_at_50%_100%,rgba(0,0,0,.5),transparent_55%)
        ]"
      />

      <div className="absolute inset-0 -z-10 pointer-events-none
        [background-size:48px_48px]
        [background-image:
          linear-gradient(to_right,rgba(0,255,255,.06)_1px,transparent_1px),
          linear-gradient(to_bottom,rgba(0,255,255,.06)_1px,transparent_1px)
        ]"
      />

      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -z-10 pointer-events-none
        w-[600px] h-[600px] rounded-full bg-cyan-500/10 blur-[160px]"
      />

      {/* subtle radial gradient overlay to add depth (above decorative layers, behind MatrixRain) */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#020617]/60 to-[#020617]/95 -z-10 pointer-events-none" />

      {/* Matrix rain (above decorative layers, behind content) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <MatrixRain opacity={0.2} color="#00fff0" columnWidth={16} speed={1.1} />
      </div>

      {/* Intro overlay shown first when showIntro is true */}
      {showIntro && (
        <IntroScreen
          open={showIntro}
          onStart={() => {
            try {
              localStorage.setItem("mff_seen_intro", "1");
            } catch {
              // ignore
            }
            setShowIntro(false);

            // show a short boot flash after hiding intro, then auto-hide it
            setShowBootFlash(true);
            setTimeout(() => setShowBootFlash(false), 320);
          }}
        />
      )}

      {/* Boot flash overlays the first game frame */}
      <BootFlash open={showBootFlash} duration={320} onEnd={() => setShowBootFlash(false)} />

      {/* main content wrapper (only visible once intro dismissed) */}
      <div className="relative z-10 mx-auto max-w-5xl p-6">
        {!showIntro && (
          <div className="relative z-10">
            <Header />
            <main className="relative z-10">
              <Game />
            </main>
          </div>
        )}
      </div>

      {/* global explain modal (mounted once) */}
      <ExplainModal />
    </div>
  );
};

export default App;
