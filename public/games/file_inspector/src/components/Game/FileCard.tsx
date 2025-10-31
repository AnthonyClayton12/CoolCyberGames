import React from "react";
import { motion } from "framer-motion";
import { FileText, Image as ImageIcon, Video, FileArchive, ShieldAlert } from "lucide-react";
import useGameStore from "../../store/useGameStore";
import ExplainButton from "../UI/ExplainButton";

type Status = "clean" | "suspicious" | "bad";

interface FileCardProps {
  index: number;
  name: string;
  size: number; // KB
  type?: string;
  status: Status;
  facts?: string[];
  revealWhy?: boolean;
}

const FileCard: React.FC<FileCardProps> = ({ index, name, size, type = "", status, facts = [], revealWhy = false }) => {
  const picks = useGameStore((s) => s.picks);
  const choose = useGameStore((s) => s.choose);
  const toggleExplain = useGameStore((s) => s.toggleExplain);

  // derive extension and pick icon
  const ext = (name.split(".").pop() || "").toUpperCase();
  const isImage = /^(JPG|JPEG|PNG|GIF|WEBP|BMP)$/i.test(ext);
  const isVideo = /^(MP4|MOV|AVI|MKV)$/i.test(ext);
  const isArchive = /^(ZIP|RAR|7Z|TAR|GZ)$/i.test(ext);
  const isExecLike = /^(EXE|SCR|BAT|PS1|LNK)$/i.test(ext);
  const isMacro = /^(DOCM|XLSM)$/i.test(ext);

  const Icon =
    isImage ? <ImageIcon size={18} /> :
    isVideo ? <Video size={18} /> :
    isArchive ? <FileArchive size={18} /> :
    isExecLike ? <ShieldAlert size={18} /> :
    <FileText size={18} />;

  // extension badge / risk color classes
  const extBadgeClass = isExecLike
    ? "bg-red-500/15 text-red-300"
    : isMacro || isArchive
    ? "bg-amber-500/15 text-amber-300"
    : "bg-slate-500/15 text-slate-300";

  const { label: riskLabel, cls: riskLevelClass } = isExecLike
    ? { label: "HIGH", cls: "bg-red-500/15 text-red-300" }
    : isMacro || isArchive
    ? { label: "MED", cls: "bg-amber-500/15 text-amber-300" }
    : { label: "LOW", cls: "bg-emerald-500/15 text-emerald-300" };

  return (
    <motion.article
      data-testid={`file-card-${index}`}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: "spring", stiffness: 280, damping: 22, mass: 0.8 }}
      className="group relative rounded-2xl overflow-hidden
                 bg-[#0e1a2b]/90 backdrop-blur-md text-slate-100
                 ring-1 ring-cyan-500/15 shadow-lg
                 hover:ring-cyan-400/30 hover:shadow-cyan-500/10"
    >
      {/* hover glow */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300
                   bg-[radial-gradient(80%_80%_at_50%_-20%,rgba(0,255,240,.14),transparent_60%)]"
        aria-hidden
      />

      {/* content wrapper */}
      <div className="flex h-full min-h-[220px] flex-col text-left p-4 gap-3">
        {/* header: icon + name/meta (left) | ext + risk (right) */}
        <header className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="grid place-items-center w-9 h-9 rounded-md bg-cyan-500/10 text-cyan-300 ring-1 ring-cyan-500/20">
              {Icon}
            </div>

            <div className="min-w-0">
              <h3 className="font-semibold text-sm truncate">{name}</h3>
              <p className="text-xs text-slate-300">{type}{type ? " • " : ""}{size} KB</p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <span className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] ${extBadgeClass}`}>
              {ext || "FILE"}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-md ${riskLevelClass} mt-0`}>
              {riskLabel}
            </span>
          </div>
        </header>

        {/* body */}
        <section className="flex-1 text-sm text-slate-300">
          {!revealWhy ? (
            <div className="text-slate-400">Why? (finish to reveal)</div>
          ) : facts.length > 0 ? (
            <div className="leading-relaxed line-clamp-4">
              {facts[0]}
              {facts.length > 1 && <span className="text-slate-400"> • more…</span>}
            </div>
          ) : (
            // fallback: show ExplainButton to open global modal
            <div className="flex items-center gap-2">
              <div className="text-slate-400">No quick facts available.</div>
              <button
                onClick={() => toggleExplain(index)}
                className="ml-2 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-700 text-white hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
              >
                Explain
              </button>
            </div>
          )}
        </section>

        {/* divider */}
        <div className="h-px bg-white/5 rounded-full" />

        {/* footer */}
        <footer>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => choose(index, "safe")}
              className="inline-flex h-10 items-center justify-center px-4 rounded-md bg-emerald-600 text-white hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/60 active:scale-[0.98]"
              aria-pressed={picks?.[index] === "safe"}
            >
              Safe
            </button>

            <button
              onClick={() => choose(index, "suspicious")}
              className="inline-flex h-10 items-center justify-center px-4 rounded-md bg-red-600 text-white hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400/60 active:scale-[0.98]"
              aria-pressed={picks?.[index] === "suspicious"}
            >
              Suspicious
            </button>

            <ExplainButton index={index} ariaLabel={`Explain ${name}`} />
          </div>

          <div className="mt-2 text-[11px] text-slate-400 text-center">
            Tip: press <span className="font-medium">S</span> for Safe, <span className="font-medium">X</span> for Suspicious
          </div>
        </footer>
      </div>
    </motion.article>
  );
};

export default FileCard;
