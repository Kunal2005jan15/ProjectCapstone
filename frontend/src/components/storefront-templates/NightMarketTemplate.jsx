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

export default function NightMarketTemplate({ items, onAdd, theme }) {
  const accent = theme?.primaryColor || "#D85A30";
  const groups = groupByCategory(items);

  return (
    <div
      style={{ fontFamily: theme?.font, background: "#141319" }}
      className="min-h-screen py-5 text-white"
    >
      {groups.map(([category, categoryItems]) => (
        <div key={category} className="mb-7">
          <div className="flex items-baseline justify-between px-4">
            <h2 className="text-sm font-bold uppercase tracking-wide">{category}</h2>
            <span className="text-[11px] text-gray-500">{categoryItems.length} items</span>
          </div>

          <div className="mt-3 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
            {categoryItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onAdd(item)}
                className="group relative w-32 shrink-0 snap-start text-left"
              >
                <div
                  className="relative h-32 w-32 overflow-hidden rounded-xl"
                  style={{ background: `${accent}33` }}
                >
                  {item.image ? (
                    <img src={item.image} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-gray-500">
                      No photo
                    </div>
                  )}
                  {item.popular && (
                    <span
                      className="absolute left-1.5 top-1.5 flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                      style={{ background: accent }}
                    >
                      <Flame className="h-2.5 w-2.5" /> Hot
                    </span>
                  )}
                  <span
                    className="absolute bottom-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full transition-transform group-active:scale-90"
                    style={{ background: accent }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </span>
                </div>
                <p className="mt-1.5 truncate text-xs font-semibold">{item.name}</p>
                <p className="text-xs text-gray-400">₹{item.price}</p>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}