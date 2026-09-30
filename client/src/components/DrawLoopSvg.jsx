export default function DrawLoopSvg({ className = '', loop = false }) {
  return (
    <svg
      className={`draw-loop-svg ${className} ${loop ? 'is-looping' : ''}`}
      width="1422"
      height="650"
      viewBox="0 0 1422 650"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Reusable Sparkle Star */}
        <g id="mop-sparkle-star">
          <path
            d="M0 -22 C1 -6 6 -1 22 0 C6 1 1 6 0 22 C-1 6 -6 1 -22 0 C-6 -1 -1 -6 0 -22 Z"
            fill="#00C2CB"
          />
          <circle cx="0" cy="0" r="3.5" fill="#ffffff" />
        </g>

        {/* Shiny gleam sweep gradient */}
        <linearGradient id="mopSheenGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

${maskBlock}

      {/* Main Inscription revealed through the mask as mop wipes */}
      <g mask="url(#mask0_2011_30)" className="mop-clean-stage">
        <rect
          className="mop-revealed-text"
          x="0"
          y="0"
          width="1422"
          height="650"
          fill="var(--ink, #14395F)"
        />
        {/* Polish sheen gleam */}
        <rect
          className="mop-clean-sheen"
          x="0"
          y="0"
          width="260"
          height="650"
          fill="url(#mopSheenGrad)"
        />
      </g>

      {/* Sparkles on the cleaned lettering */}
      <g className="mop-sparkles">
        <use href="#mop-sparkle-star" x="240" y="220" transform="scale(0.85)" />
        <use href="#mop-sparkle-star" x="430" y="90" transform="scale(1.2)" />
        <use href="#mop-sparkle-star" x="726" y="150" transform="scale(1.1)" />
        <use href="#mop-sparkle-star" x="880" y="320" transform="scale(0.9)" />
        <use href="#mop-sparkle-star" x="1040" y="240" transform="scale(1.05)" />
        <use href="#mop-sparkle-star" x="1320" y="390" transform="scale(1.25)" />
      </g>

      {/* Animated Mop Actor: scrubs across the canvas */}
      <g className="mop-actor-group" aria-hidden="true">
        {/* Soap foam / bubbles around the mop pad */}
        <g className="mop-foam">
          <circle cx="-35" cy="46" r="16" fill="rgba(0, 194, 203, 0.35)" />
          <circle cx="-10" cy="56" r="22" fill="rgba(255, 255, 255, 0.88)" stroke="#00C2CB" strokeWidth="2.5" />
          <circle cx="26" cy="52" r="18" fill="rgba(0, 194, 203, 0.45)" />
          <circle cx="52" cy="42" r="14" fill="rgba(255, 255, 255, 0.82)" stroke="#00C2CB" strokeWidth="2" />
          <circle cx="-2" cy="38" r="9" fill="#ffffff" />
          <circle cx="16" cy="34" r="6" fill="#00C2CB" />
        </g>

        {/* Mop Base Head & Handle */}
        <g id="mop-head-structure">
          {/* Contact shadow */}
          <ellipse cx="0" cy="48" rx="72" ry="12" fill="rgba(20, 57, 95, 0.18)" />
          {/* Microfiber cleaning pad */}
          <rect x="-65" y="28" width="130" height="24" rx="10" fill="#00C2CB" />
          <rect x="-60" y="44" width="120" height="8" rx="4" fill="#009ea6" />
          {/* Swivel joint mount */}
          <path d="M-22 28 L-14 12 L14 12 L22 28 Z" fill="#14395F" />
          <circle cx="0" cy="14" r="7" fill="#ffffff" />
          {/* Sleek metallic handle extending up & left */}
          <line x1="0" y1="14" x2="-140" y2="-260" stroke="#14395F" strokeWidth="14" strokeLinecap="round" />
          <line x1="-3" y1="14" x2="-143" y2="-260" stroke="#38bdf8" strokeWidth="5" strokeLinecap="round" />
          {/* Ergonomic grip */}
          <line x1="-90" y1="-165" x2="-140" y2="-260" stroke="#00C2CB" strokeWidth="18" strokeLinecap="round" />
          <line x1="-120" y1="-222" x2="-140" y2="-260" stroke="#14395F" strokeWidth="20" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
}
