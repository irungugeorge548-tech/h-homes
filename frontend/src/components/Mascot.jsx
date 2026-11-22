// H-Homes mascot: a cheerful house with a golden key. `ride` makes it bounce along with speed lines,
// like the H-Fleet car, while the key swings from the door.
export default function Mascot({ size = 220, ride = false, className = '' }) {
  return (
    <svg viewBox="0 0 270 190" width={size} height={(size * 190) / 270} className={`hh ${ride ? 'hh-ride' : ''} ${className}`} role="img" aria-label="H-Homes house and key">
      <g className="speed" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".6">
        {[70, 100, 130].map((y, i) => <path key={i} d={`M${4 + (i % 2) * 10} ${y} H${38 + (i % 2) * 10}`} />)}
      </g>
      <ellipse cx="150" cy="176" rx="92" ry="5" fill="#000" opacity=".18" className="hh-shadow" />
      <g className="hh-house">
        {/* chimney */}
        <rect x="186" y="42" width="16" height="30" rx="2" fill="#e6efe9" />
        {/* body */}
        <rect x="80" y="86" width="140" height="84" rx="8" fill="#fff" />
        {/* roof */}
        <path d="M66 92 L150 28 L234 92 C238 96 236 102 230 102 H70 C64 102 62 96 66 92z" fill="#0f7a4a" />
        <path d="M150 28 L234 92 C238 96 236 102 230 102 H150z" fill="#0b6a3f" />
        {/* window */}
        <rect x="100" y="114" width="34" height="30" rx="4" fill="#bfe9d4" />
        <path d="M117 114V144M100 129H134" stroke="#fff" strokeWidth="3" />
        {/* door */}
        <rect x="168" y="112" width="36" height="58" rx="6" fill="#32BB78" />
        <circle cx="196" cy="142" r="2.800" fill="#fff" />
        {/* eyes + smile on the roof gable */}
        <circle cx="136" cy="68" r="4.500" fill="#fff" /><circle cx="164" cy="68" r="4.500" fill="#fff" />
        <circle cx="137.500" cy="69" r="2" fill="#0a0a0a" /><circle cx="165.500" cy="69" r="2" fill="#0a0a0a" />
        <path d="M140 80 Q150 88 160 80" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />
      </g>
      {/* the key, hanging from the door */}
      <g className="hh-key">
        <circle cx="186" cy="150" r="6" fill="none" stroke="#e8c35a" strokeWidth="2.500" />
        <g transform="translate(186 156)">
          <circle cx="0" cy="8" r="9" fill="#f2c94c" /><circle cx="0" cy="8" r="3.500" fill="#fff" />
          <rect x="-3" y="15" width="6" height="22" rx="2" fill="#f2c94c" />
          <rect x="3" y="26" width="8" height="4" fill="#f2c94c" /><rect x="3" y="33" width="6" height="4" fill="#f2c94c" />
        </g>
      </g>
    </svg>
  )
}
