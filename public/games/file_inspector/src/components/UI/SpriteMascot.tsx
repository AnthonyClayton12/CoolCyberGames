import React from "react";

type SpriteMascotProps = {
  size?: number;
  accent?: string;
  wink?: boolean;
  className?: string;
};

const SpriteMascot: React.FC<SpriteMascotProps> = ({
  size = 96,
  accent = "#00fff0",
  wink = false,
  className,
}) => {
  const eyeLineClass = wink ? "wink-line" : "";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="File detective mascot"
      className={className}
    >
      <title>File Detective</title>

      <style>{`
        .wink-line {
          stroke: ${accent};
          stroke-linecap: round;
          animation: wink-anim 500ms ease-in-out forwards;
        }
        @keyframes wink-anim {
          0% { stroke-width: 0; opacity: 0; }
          30% { stroke-width: 2.2; opacity: 1; }
          70% { stroke-width: 2.2; opacity: 1; }
          100% { stroke-width: 0; opacity: 0; }
        }
      `}</style>

      {/* Trench coat (file-tab pocket on left) */}
      <g transform="translate(12,44)">
        <rect x="0" y="0" width="72" height="34" rx="6" fill="#081226" />
        <rect x="4" y="4" width="64" height="26" rx="5" fill="#0b1324" />
        {/* pocket with file-tab silhouette */}
        <g transform="translate(8,8)">
          <rect x="0" y="0" width="18" height="10" rx="1.5" fill="#0f1722" />
          <path d="M14 0v4a2 2 0 0 1-2 2H6V0h8z" fill="#0b2a3a" />
        </g>
      </g>

      {/* Head + fedora */}
      <g transform="translate(12,6)">
        {/* fedora brim */}
        <ellipse cx="36" cy="18" rx="34" ry="9" fill="#071824" />
        <path d="M6 18c6-9 60-12 64 0l-8 6c-8-6-44-6-56-6z" fill="#0b1f2a" />
        {/* head */}
        <circle cx="36" cy="34" r="14" fill="#0f1a22" />
        <circle cx="36" cy="34" r="12" fill="#11202a" />
        {/* eyes */}
        <circle cx="30" cy="34" r="1.6" fill="#cfeef0" />
        {wink ? (
          <line
            className={eyeLineClass}
            x1="40"
            y1="34"
            x2="46"
            y2="34"
          />
        ) : (
          <circle cx="44" cy="34" r="1.6" fill="#cfeef0" />
        )}
        {/* mouth */}
        <path d="M32 40c2 1 8 1 10 0" stroke="#1f2f39" strokeWidth="1" strokeLinecap="round" />
      </g>

      {/* Magnifying glass (neon accent) */}
      <g transform="translate(56,56)">
        <circle cx="14" cy="8" r="8" stroke={accent} strokeWidth="2" fill="none" />
        <rect x="20" y="16" width="10" height="3" rx="1" transform="rotate(40 20 16)" fill="#0b1324" />
        <circle cx="14" cy="8" r="2" fill={accent} opacity="0.16" />
      </g>
    </svg>
  );
};

export default SpriteMascot;