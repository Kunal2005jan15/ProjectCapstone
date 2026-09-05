import { Plus } from "lucide-react";

export default function GridTemplate({ items, onAdd, theme }) {
  const accent = theme?.primaryColor || "#2563EB";

  return (
    <div style={{ fontFamily: theme?.font }} className="mx-auto max-w-lg px-3 py-5">
      <div className="columns-2 gap-3 [column-fill:_balance]">
        {items.map((item) => (
          <div
            key={item.id}
            className="relative mb-3 break-inside-avoid overflow-hidden rounded-xl bg-gray-900 shadow-sm"
          >
            <div className={item.description ? "aspect-[3/4]" : "aspect-square"}>
              {item.image ? (
                <img src={item.image} className="h-full w-full object-cover" />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center"
                  style={{ background: `linear-gradient(160deg, ${accent}55, #111)` }}
                >
                  <span className="text-xs text-white/50">No photo</span>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-2.5 pt-8">
                <p className="truncate text-sm font-semibold text-white">{item.name}</p>
                {item.description && (
                  <p className="mt-0.5 line-clamp-2 text-[11px] text-white/70">
                    {item.description}
                  </p>
                )}
              </div>
            </div>

            <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-bold text-gray-900">
              ₹{item.price}
            </span>

            <button
              onClick={() => onAdd(item)}
              className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full text-white shadow transition-transform active:scale-90"
              style={{ background: accent }}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}