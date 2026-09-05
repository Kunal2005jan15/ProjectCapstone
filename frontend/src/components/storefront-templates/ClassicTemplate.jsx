import { Plus } from "lucide-react";

function groupByCategory(items) {
  const map = new Map();
  items.forEach((item) => {
    const key = item.category || "Menu";
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  });
  return Array.from(map.entries());
}

export default function ClassicTemplate({ items, onAdd, theme }) {
  const accent = theme?.primaryColor || "#B45309";
  const groups = groupByCategory(items);

  return (
    <div
      style={{ fontFamily: theme?.font || "Georgia, serif" }}
      className="mx-auto max-w-md px-5 py-6"
    >
      {groups.map(([category, categoryItems], gi) => (
        <div key={category} className={gi > 0 ? "mt-8" : ""}>
          <div className="flex items-center gap-3">
            <span className="h-px flex-1" style={{ backgroundColor: accent, opacity: 0.4 }} />
            <h2
              className="shrink-0 text-xs font-semibold uppercase tracking-[0.2em]"
              style={{ color: accent }}
            >
              {category}
            </h2>
            <span className="h-px flex-1" style={{ backgroundColor: accent, opacity: 0.4 }} />
          </div>

          <div className="mt-4 space-y-5">
            {categoryItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onAdd(item)}
                className="group block w-full text-left"
              >
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold">{item.name}</span>
                  <span
                    className="min-w-0 flex-1 border-b border-dotted"
                    style={{ borderColor: "currentColor", opacity: 0.35 }}
                  />
                  <span className="shrink-0 font-semibold" style={{ color: accent }}>
                    ₹{item.price}
                  </span>
                  <Plus
                    className="h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                    style={{ color: accent }}
                  />
                </div>
                {item.description && (
                  <p className="mt-0.5 text-sm italic text-gray-500">
                    {item.description}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}