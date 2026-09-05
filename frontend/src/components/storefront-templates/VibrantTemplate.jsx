import { Flame, Plus } from "lucide-react";

function groupByCategory(items) {
  const map = new Map();
  items.forEach((item) => {
    const key = item.category || "Menu";
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  });
  return Array.from(map.entries());
}

const slug = (s) => "vcat-" + s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

export default function VibrantTemplate({ items, onAdd, theme }) {
  const accent = theme?.primaryColor || "#FA4616";
  const groups = groupByCategory(items);

  const scrollTo = (category) => {
    document.getElementById(slug(category))?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div
      style={{ fontFamily: theme?.font, background: "#1C1917" }}
      className="min-h-screen text-white"
    >
      <div className="sticky top-0 z-10 flex gap-2 overflow-x-auto bg-[#1C1917]/95 px-4 py-3 backdrop-blur-md">
        {groups.map(([category]) => (
          <button
            key={category}
            onClick={() => scrollTo(category)}
            className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold"
            style={{ background: "#292524", color: accent }}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="px-4 pb-6">
        {groups.map(([category, categoryItems]) => (
          <div key={category} id={slug(category)} className="scroll-mt-16 pt-3">
            <h2 className="mb-2 text-sm font-bold" style={{ color: accent }}>
              {category}
            </h2>
            <div className="space-y-2">
              {categoryItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-xl p-2.5"
                  style={{ backgroundColor: "#292524" }}
                >
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full"
                    style={{ backgroundColor: `${accent}33` }}
                  >
                    {item.image ? (
                      <img src={item.image} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-base font-bold" style={{ color: accent }}>
                        {item.name?.[0]}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      {item.popular && <Flame className="h-3.5 w-3.5" style={{ color: accent }} />}
                      <p className="truncate font-semibold">{item.name}</p>
                    </div>
                    <p className="text-xs text-gray-400">₹{item.price}</p>
                  </div>
                  <button
                    onClick={() => onAdd(item)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform active:scale-90"
                    style={{ backgroundColor: accent }}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}