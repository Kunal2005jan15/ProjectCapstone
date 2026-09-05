import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import mlApi, { mlApiError } from "@/lib/mlApi";
import { useStore } from "@/context/StoreContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, Loader2, Sparkles, AlertTriangle, CircleCheck, CircleX } from "lucide-react";

// Explains each of the ml-service's three forecasting tiers (see
// ml-service/app/inference/live_predict.py) — shown next to the result so
// it's obvious *why* a given item got a Prophet prediction vs a rougher
// fallback, instead of just showing a number with no context.
const METHOD_INFO = {
  prophet: {
    label: "Prophet model",
    className: "bg-green-100 text-green-700",
    blurb: "This item has 60+ days of steady sales history — a real trained forecasting model is being used.",
  },
  moving_average_fallback: {
    label: "Moving average",
    className: "bg-amber-100 text-amber-700",
    blurb: "This item has some sales history, but not enough yet for a full Prophet model — using a recent-average estimate instead.",
  },
  popularity_fallback: {
    label: "Popularity estimate",
    className: "bg-slate-200 text-slate-700",
    blurb: "This item has little or no sales history yet (e.g. a brand-new menu item) — estimating from how similar items in this shop sell.",
  },
};

export default function DemandForecast() {
  const { shop } = useStore();
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [nDays, setNDays] = useState(7);
  const [results, setResults] = useState(null);
  const [running, setRunning] = useState(false);
  const [mlStatus, setMlStatus] = useState("checking"); // checking | online | offline

  useEffect(() => {
    api
      .get("/menu")
      .then((res) => {
        setItems(res.data);
        if (res.data.length > 0) setSelectedItemId(res.data[0].id);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load menu items");
      })
      .finally(() => setItemsLoading(false));

    mlApi
      .get("/health")
      .then(() => setMlStatus("online"))
      .catch(() => setMlStatus("offline"));
  }, []);

  const runForecast = async () => {
    if (!shop?.id) {
      toast.error("Shop not loaded yet — try again in a moment");
      return;
    }
    if (!selectedItemId) {
      toast.error("Pick a menu item first");
      return;
    }
    setRunning(true);
    setResults(null);
    try {
      const res = await mlApi.post("/forecast/live", {
        shop_id: shop.id,
        item_id: selectedItemId,
        n_days: Number(nDays),
      });
      setResults(res.data);
    } catch (err) {
      toast.error(mlApiError(err));
    } finally {
      setRunning(false);
    }
  };

  const selectedItemName = items.find((i) => i.id === selectedItemId)?.name;
  const method = results?.[0]?.method;
  const methodInfo = method ? METHOD_INFO[method] : null;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-xl font-heading font-bold">
          <TrendingUp className="h-5 w-5" /> Demand Forecast
        </h1>

        <span
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
            mlStatus === "online"
              ? "bg-green-100 text-green-700"
              : mlStatus === "offline"
              ? "bg-red-100 text-red-700"
              : "bg-secondary text-muted-foreground"
          }`}
        >
          {mlStatus === "online" ? (
            <CircleCheck className="h-3.5 w-3.5" />
          ) : mlStatus === "offline" ? (
            <CircleX className="h-3.5 w-3.5" />
          ) : (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          )}
          ML service {mlStatus === "checking" ? "checking..." : mlStatus}
        </span>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        Test the live forecasting pipeline — pick one of your real menu items and see what the ML service predicts for it, using your shop&apos;s actual order history.
      </p>

      {mlStatus === "offline" && (
        <div className="mb-6 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            Can&apos;t reach the ML service. Check that it&apos;s deployed/running and that{" "}
            <code className="rounded bg-red-100 px-1 py-0.5 text-xs">VITE_ML_SERVICE_URL</code> points to it —
            see <code className="rounded bg-red-100 px-1 py-0.5 text-xs">ML_SERVICE_RENDER_SETUP.txt</code>.
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-end gap-4 rounded-lg border bg-card p-4">
        <div className="min-w-[220px]">
          <Label>Menu item</Label>
          {itemsLoading ? (
            <p className="mt-2 text-sm text-muted-foreground">Loading items...</p>
          ) : (
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="mt-1 h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            >
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="w-28">
          <Label>Days ahead</Label>
          <Input
            type="number"
            min={1}
            max={30}
            value={nDays}
            onChange={(e) => setNDays(e.target.value)}
            className="mt-1"
          />
        </div>

        <Button onClick={runForecast} disabled={running || itemsLoading || !items.length}>
          {running ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1.5 h-4 w-4" />}
          {running ? "Running..." : "Run forecast"}
        </Button>
      </div>

      {results && (
        <div className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="font-heading text-base font-semibold">
              {selectedItemName} — next {nDays} day{nDays == 1 ? "" : "s"}
            </h2>
            {methodInfo && (
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${methodInfo.className}`}>
                {methodInfo.label}
              </span>
            )}
          </div>
          {methodInfo && <p className="mb-4 text-sm text-muted-foreground">{methodInfo.blurb}</p>}

          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Predicted demand</th>
                  <th className="px-4 py-2">Range</th>
                </tr>
              </thead>
              <tbody>
                {results.map((row) => (
                  <tr key={row.date} className="border-t">
                    <td className="px-4 py-2">{new Date(row.date).toLocaleDateString()}</td>
                    <td className="px-4 py-2 font-medium">{Math.round(row.predicted_demand)} units</td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {Math.round(row.lower_bound)} – {Math.round(row.upper_bound)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
