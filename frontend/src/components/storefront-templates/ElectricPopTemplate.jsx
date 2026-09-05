import { Plus } from "lucide-react";

export default function ElectricPopTemplate({ items, onAdd, theme }) {
  const accent = theme?.primaryColor || "#E0562B";

  return (
    <div
      style={{
        fontFamily: theme?.font,
        background: "#FBF8F0",
        backgroundImage: "radial-gradient(rgba(0,0,0,0.07) 1px, transparent 1px)",
        backgroundSize: "14px 14px",
      }}
      className="min-h-screen px-3 py-5"
    >
      <div className="mx-auto grid max-w-md grid-cols-2 gap-4">
        {items.map((item, i) => (
          <div
            key={item.id}
            className="relative rounded-2xl border-[3px] border-black bg-white"
            style={{
              boxShadow: "5px 5px 0 0 #000",
              transform: `rotate(${i % 2 === 0 ? "-1.2deg" : "1.2deg"})`,
            }}
          >
            {item.category && (
              <span
                className="absolute -top-2.5 left-3 rounded-full border-2 border-black px-2 py-0.5 text-[9px] font-bold uppercase"
                style={{ background: accent }}
              >
                {item.category}
              </span>
            )}

            <div className="flex h-24 items-center justify-center overflow-hidden rounded-t-[13px] border-b-[3px] border-black bg-gray-100">
              {item.image ? (
                <img src={item.image} className="h-full w-full object-cover" />
              ) : (
                <span className="text-3xl font-black opacity-10">?</span>
              )}
            </div>

            <div className="p-2.5">
              <p className="truncate text-sm font-extrabold uppercase leading-tight">
                {item.name}
              </p>
              <p className="text-base font-black">₹{item.price}</p>
            </div>

            <button
              onClick={() => onAdd(item)}
              className="absolute -right-2.5 -top-2.5 flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-black transition-transform active:scale-90"
              style={{ background: accent }}
            >
              <Plus className="h-4 w-4 text-white" strokeWidth={3} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}