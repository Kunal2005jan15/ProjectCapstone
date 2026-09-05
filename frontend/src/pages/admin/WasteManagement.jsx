import { useEffect, useState } from "react";
import { toast } from "sonner";
import api, { apiError } from "@/lib/api";
import { useStore } from "@/context/StoreContext";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { Trash2, Loader2, IndianRupee, Plus, PackageX } from "lucide-react";

const PERIOD_OPTIONS = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
];

export default function WasteManagement() {
  const { shop } = useStore();
  const [days, setDays] = useState("30");
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inventoryRows, setInventoryRows] = useState([]);

  const [logOpen, setLogOpen] = useState(false);
  const [logForm, setLogForm] = useState({ inventoryId: "", quantity: "", reason: "" });
  const [submitting, setSubmitting] = useState(false);

  const fetchDashboard = async (period = days) => {
    if (!shop?.id) return;
    setLoading(true);
    try {
      const res = await api.get(`/shops/${shop.id}/waste`, { params: { days: period } });
      setDashboard(res.data);
    } catch (err) {
      console.error(err);
      toast.error(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    if (!shop?.id) return;
    try {
      const res = await api.get(`/shops/${shop.id}/inventory`);
      setInventoryRows(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDashboard(days);
    fetchInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shop?.id]);

  const changePeriod = (v) => {
    setDays(v);
    fetchDashboard(v);
  };

  const openLog = () => {
    setLogForm({ inventoryId: inventoryRows[0]?.inventoryId || "", quantity: "", reason: "" });
    setLogOpen(true);
  };

  const submitLog = async (e) => {
    e.preventDefault();
    if (!shop?.id || !logForm.inventoryId) return;
    setSubmitting(true);
    try {
      await api.post(`/shops/${shop.id}/inventory/${logForm.inventoryId}/transactions`, {
        transactionType: "WASTAGE",
        quantity: Number(logForm.quantity),
        reason: logForm.reason || null,
      });
      toast.success("Waste logged");
      setLogOpen(false);
      fetchDashboard(days);
      fetchInventory();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !dashboard) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-xl font-heading font-bold">
          <PackageX className="h-5 w-5" /> Waste Management
        </h1>
        <div className="flex items-center gap-2">
          <Select value={days} onValueChange={changePeriod}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={openLog} disabled={!inventoryRows.length}>
            <Plus className="mr-1.5 h-4 w-4" /> Log Waste
          </Button>
        </div>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        Tracks stock recorded as wasted, expired, or otherwise unusable — built from the same inventory transaction log used for purchases and sales.
      </p>

      {!inventoryRows.length && (
        <div className="mb-6 rounded-lg border bg-amber-50 border-amber-200 p-4 text-sm text-amber-800">
          No inventory items are tracked yet. Add items on the Inventory Management page first, then you can log waste against them here.
        </div>
      )}

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-2xl font-bold">{Number(dashboard?.totalWasteQuantity ?? 0).toFixed(1)}</p>
          <p className="text-xs text-muted-foreground">Total quantity wasted ({dashboard?.periodDays ?? days}d)</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="flex items-center text-2xl font-bold text-red-600">
            <IndianRupee className="h-5 w-5" />{Number(dashboard?.totalWasteCost ?? 0).toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground">Estimated waste cost</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-2xl font-bold">{dashboard?.wasteEventCount ?? 0}</p>
          <p className="text-xs text-muted-foreground">Waste events logged</p>
        </div>
      </div>

      {/* Trend chart */}
      <div className="mb-6 rounded-xl border bg-card p-4">
        <h3 className="mb-2 font-medium">Waste Trend</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={dashboard?.trend ?? []}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="date" fontSize={10} />
            <YAxis fontSize={10} />
            <Tooltip />
            <Bar dataKey="quantity" fill="#FA4616" radius={[4, 4, 0, 0]} name="Quantity wasted" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top wasted items */}
      <div className="rounded-xl border bg-card p-4">
        <h3 className="mb-3 font-medium">Frequently Wasted Items</h3>
        {(dashboard?.topItems ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No waste logged for this period.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Quantity Wasted</TableHead>
                <TableHead>Estimated Cost</TableHead>
                <TableHead>Events</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dashboard.topItems.map((it) => (
                <TableRow key={it.itemId}>
                  <TableCell className="font-medium">{it.itemName}</TableCell>
                  <TableCell>{Number(it.quantity).toFixed(1)} {it.unit || ""}</TableCell>
                  <TableCell>₹{Number(it.cost).toFixed(2)}</TableCell>
                  <TableCell className="text-muted-foreground">{it.eventCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Log waste dialog */}
      <Dialog open={logOpen} onOpenChange={setLogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Trash2 className="h-4 w-4" /> Log Waste</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitLog} className="space-y-3">
            <div>
              <Label>Item</Label>
              <Select value={logForm.inventoryId} onValueChange={(v) => setLogForm((f) => ({ ...f, inventoryId: v }))}>
                <SelectTrigger className="mt-1 w-full"><SelectValue placeholder="Select item" /></SelectTrigger>
                <SelectContent>
                  {inventoryRows.map((r) => (
                    <SelectItem key={r.inventoryId} value={r.inventoryId}>{r.itemName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quantity wasted</Label>
              <Input type="number" step="0.01" min="0.01" required value={logForm.quantity}
                onChange={(e) => setLogForm((f) => ({ ...f, quantity: e.target.value }))} />
            </div>
            <div>
              <Label>Reason (optional)</Label>
              <Input placeholder="e.g. Expired, spoiled, over-prepared" value={logForm.reason}
                onChange={(e) => setLogForm((f) => ({ ...f, reason: e.target.value }))} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={submitting || !logForm.inventoryId}>
                {submitting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
                Record Waste
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
