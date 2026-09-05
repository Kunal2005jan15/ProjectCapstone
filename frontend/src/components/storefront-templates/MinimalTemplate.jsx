import { useState } from "react";
import { Check, Plus } from "lucide-react";

function groupByCategory(items) {
  const map = new Map();
  items.forEach((item) => {
    const key = item.category || "Menu";
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  });
  return Array.from(map.entries());
}

const slug = (s) => "cat-" + s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

export default function MinimalTemplate({ items, onAdd, theme }) {
  const accent = theme?.primaryColor || "#111827";
  const groups = groupByCategory(items);
  const [justAdded, setJustAdded] = useState(null);

  const handleAdd = (item) => {
    onAdd(item);
    setJustAdded(item.id);
    setTimeout(() => setJustAdded((cur) => (cur === item.id ? null : cur)), 900);
  };

  const scrollTo = (category) => {
    document.getElementById(slug(category))?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div style={{ fontFamily: theme?.font }} className="mx-auto max-w-sm">
      <div className="sticky top-0 z-10 flex gap-1.5 overflow-x-auto border-b bg-background/95 px-4 py-2 backdrop-blur">
        {groups.map(([category]) => (
          <button
            key={category}
            onClick={() => scrollTo(category)}
            className="shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium"
            style={{ borderColor: accent, color: accent }}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="px-4">
        {groups.map(([category, categoryItems]) => (
          <div key={category} id={slug(category)} className="scroll-mt-32 pt-5">
            <h2 className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
              {category}
            </h2>
            {categoryItems.map((item) => {
              const added = justAdded === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleAdd(item)}
                  className="flex w-full items-center justify-between border-b py-2.5 text-left"
                >
                  <span className="text-sm">{item.name}</span>
                  <span className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-medium" style={{ color: accent }}>
                      ₹{item.price}
                    </span>
                    <span
                      className="flex h-5 w-5 items-center justify-center rounded-full border transition-colors"
                      style={{
                        borderColor: accent,
                        background: added ? accent : "transparent",
                      }}
                    >
                      {added ? (
                        <Check className="h-3 w-3 text-white" />
                      ) : (
                        <Plus className="h-3 w-3" style={{ color: accent }} />
                      )}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}