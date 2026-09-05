export default function CategoryChips({ categories, active, onChange, accent, accentText, className = "" }) {
  return (
    <div className={`flex gap-2 overflow-x-auto pb-1 ${className}`}>
      {categories.map((c) => {
        const isActive = active === c;
        return (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className="shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors"
            style={
              isActive
                ? { background: accent, color: accentText }
                : { background: "rgba(0,0,0,0.04)", color: "#57534E" }
            }
          >
            {c}
          </button>
        );
      })}
    </div>
  );
}