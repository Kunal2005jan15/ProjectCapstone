// Tiny CSS-only wireframes hinting at each template's actual layout structure,
// so the picker shows *shape*, not just a color swatch.

export default function TemplateThumbnail({ id, accent, bg }) {
  const base = "h-full w-full p-2";

  if (id === "classic") {
    return (
      <div className={base} style={{ background: bg }}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="mb-1.5 flex items-center gap-1">
            <span className="h-1 w-6 rounded-full" style={{ background: accent, opacity: 0.7 }} />
            <span className="h-px flex-1 border-b border-dotted" style={{ borderColor: "#0003" }} />
            <span className="h-1 w-2.5 rounded-full bg-black/30" />
          </div>
        ))}
      </div>
    );
  }

  if (id === "night-market") {
    return (
      <div className={base} style={{ background: bg }}>
        <div className="mb-1 h-1 w-6 rounded-full bg-white/40" />
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-6 w-6 shrink-0 rounded-md" style={{ background: `${accent}77` }} />
          ))}
        </div>
        <div className="mb-1 mt-2 h-1 w-6 rounded-full bg-white/40" />
        <div className="flex gap-1">
          {[0, 1].map((i) => (
            <span key={i} className="h-6 w-6 shrink-0 rounded-md" style={{ background: `${accent}77` }} />
          ))}
        </div>
      </div>
    );
  }

  if (id === "electric-pop") {
    return (
      <div className={base} style={{ background: bg }}>
        <div className="grid grid-cols-2 gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-7 rounded-sm border"
              style={{ borderColor: "#000", background: "#fff" }}
            >
              <div className="h-3 rounded-t-sm" style={{ background: `${accent}66` }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (id === "grid") {
    return (
      <div className={base} style={{ background: bg }}>
        <div className="grid grid-cols-2 gap-1.5">
          <span className="h-12 rounded-md" style={{ background: `${accent}55` }} />
          <div className="flex flex-col gap-1.5">
            <span className="h-5 rounded-md" style={{ background: `${accent}55` }} />
            <span className="h-5 rounded-md" style={{ background: `${accent}88` }} />
          </div>
        </div>
      </div>
    );
  }

  if (id === "minimal") {
    return (
      <div className={base} style={{ background: bg }}>
        <div className="mb-1.5 flex gap-1">
          <span className="h-2 w-5 rounded-full border" style={{ borderColor: accent }} />
          <span className="h-2 w-5 rounded-full border" style={{ borderColor: accent, opacity: 0.4 }} />
        </div>
        {[0, 1, 2].map((i) => (
          <div key={i} className="mb-1 flex items-center justify-between border-b pb-1">
            <span className="h-1 w-8 rounded-full bg-black/30" />
            <span className="h-1 w-3 rounded-full" style={{ background: accent }} />
          </div>
        ))}
      </div>
    );
  }

  if (id === "vibrant") {
    return (
      <div className={base} style={{ background: bg }}>
        <div className="mb-1.5 flex gap-1">
          <span className="h-2 w-5 rounded-full" style={{ background: accent }} />
          <span className="h-2 w-5 rounded-full bg-white/20" />
        </div>
        {[0, 1].map((i) => (
          <div key={i} className="mb-1 flex items-center gap-1">
            <span className="h-4 w-4 rounded-full" style={{ background: `${accent}88` }} />
            <span className="h-1 flex-1 rounded-full bg-white/30" />
          </div>
        ))}
      </div>
    );
  }

  return <div className={base} style={{ background: bg }} />;
}