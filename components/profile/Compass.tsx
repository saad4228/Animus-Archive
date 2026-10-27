/** Engraved compass card. Captioned with a place when one is given, bare otherwise. */
export function Compass({ name, coords, className = "" }: { name?: string; coords?: string; className?: string }) {
  return (
    <figure className={`text-parchment-muted ${className}`}>
      <svg viewBox="0 0 120 120" fill="none" stroke="currentColor" aria-hidden className="w-full">
        <circle cx="60" cy="60" r="54" strokeWidth=".8" />
        <circle cx="60" cy="60" r="47" strokeWidth=".5" strokeDasharray="1 3" />
        <circle cx="60" cy="60" r="30" strokeWidth=".5" />
        {Array.from({ length: 32 }, (_, i) => {
          const a = (i * Math.PI) / 16;
          const r1 = i % 4 === 0 ? 47 : 51;
          return (
            <line
              key={i}
              x1={60 + Math.cos(a) * r1}
              y1={60 + Math.sin(a) * r1}
              x2={60 + Math.cos(a) * 54}
              y2={60 + Math.sin(a) * 54}
              strokeWidth=".6"
            />
          );
        })}
        <path d="M60 10 66 54 60 60 54 54Z M60 110 54 66 60 60 66 66Z" strokeWidth=".8" />
        <path d="M60 10 60 60 66 54Z" fill="currentColor" fillOpacity=".55" stroke="none" />
        <path d="M10 60 54 54 60 60 54 66Z M110 60 66 66 60 60 66 54Z" strokeWidth=".6" />
        <path d="M25 25 57 57M95 25 63 57M25 95 57 63M95 95 63 63" strokeWidth=".4" />
        <text x="60" y="7" textAnchor="middle" fontSize="6" fill="currentColor" stroke="none" fontFamily="serif">N</text>
        <circle cx="60" cy="60" r="2.2" fill="var(--crimson)" stroke="none" />
      </svg>
      {name && (
        <figcaption className="mt-2 text-center">
          <span className="block font-display text-[0.8rem] uppercase tracking-[0.3em] text-parchment-ink">{name}</span>
          {coords && <span className="block font-sans text-[0.62rem] tracking-[0.12em]">{coords}</span>}
        </figcaption>
      )}
    </figure>
  );
}
