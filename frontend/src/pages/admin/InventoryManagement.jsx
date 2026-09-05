import { useEffect, useState } from "react";
import { toast } from "sonner";
import api, { apiError } from "@/lib/api";
import { useStore } from "@/context/StoreContext";
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
import {
  Boxes, Plus, Loader2, AlertTriangle, PackagePlus, Sparkles, TrendingDown,
} from "lucide-react";

// Which transaction types can be logged from this page (WASTAGE is
// deliberately left out here — that's logged from the Waste Management page
// instead, even though it hits the same backend endpoint).
const TXN_TYPES = ["PURCHASE", "RESTOCK", "SALE", "ADJUSTMENT"];

export default function InventoryManagement() {
  const { shop } = useStore();
  const [rows, setRows] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reorderOpen, setReorderOpen] = useState(false);
  const [reorderSuggestions, setReorderSuggestions] = useState(null);
  const [reorderLoading, setReorderLoading] = useState(false);

  // "Add / update stock" dialog
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [stockForm, setStockForm] = useState({
    itemId: "", currentStock: "", unit: "", reorderLevel: "", safetyStock: "",
  });

  // "Log transaction" dialog
  const [txnDialogOpen, setTxnDialogOpen] = useState(false);
  const [txnTarget, setTxnTarget] = useState(null);
  const [txnForm, setTxnForm] = useState({ transactionType: "RESTOCK", quantity: "", reason: "" });

  const fetchAll = async () => {
    if (!shop?.id) return;
    setLoading(true);
    try {
      const [invRes, menuRes] = await Promise.all([
        api.get(`/shops/${shop.id}/inventory`),
        api.get("/menu"),
      ]);
      setRows(invRes.data);
      setMenuItems(menuRes.data);
    } catch (err) {
      console.error(err);
      toast.error(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shop?.id]);

  const itemsWithoutInventory = menuItems.filter(
    (m) => !rows.some((r) => r.itemId === m.id)
  );

  const openAddStock = (row) => {
    if (row) {
      setStockForm({
        itemId: row.itemId,
        currentStock: row.currentStock,
        unit: row.unit || "",
        reorderLevel: row.reorderLevel,
        safetyStock: row.safetyStock,
      });
    } else {
      setStockForm({ itemId: "", currentStock: "", unit: "", reorderLevel: "", safetyStock: "" });
    }
    setStockDialogOpen(true);
  };

  const submitStock = async (e) => {
    e.preventDefault();
    if (!shop?.id) return;
    try {
      await api.put(`/shops/${shop.id}/inventory`, {
        itemId: stockForm.itemId,
        currentStock: Number(stockForm.currentStock),
        unit: stockForm.unit || null,
        reorderLevel: stockForm.reorderLevel === "" ? null : Number(stockForm.reorderLevel),
        safetyStock: stockForm.safetyStock === "" ? null : Number(stockForm.safetyStock),
      });
      toast.success("Inventory saved");
      setStockDialogOpen(false);
      fetchAll();
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  const openTxn = (row) => {
    setTxnTarget(row);
    setTxnForm({ transactionType: "RESTOCK", quantity: "", reason: "" });
    setTxnDialogOpen(true);
  };

  const submitTxn = async (e) => {
    e.preventDefault();
    if (!shop?.id || !txnTarget) return;
    try {
      await api.post(`/shops/${shop.id}/inventory/${txnTarget.inventoryId}/transactions`, {
        transactionType: txnForm.transactionType,
        quantity: Number(txnForm.quantity),
        reason: txnForm.reason || null,
      });
      toast.success("Transaction recorded");
      setTxnDialogOpen(false);
      fetchAll();
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  const loadReorderSuggestions = async () => {
    if (!shop?.id) return;
    setReorderOpen(true);
    setReorderLoading(true);
    try {
      const res = await api.get(`/shops/${shop.id}/inventory/reorder-suggestions`, { params: { days: 7 } });
      setReorderSuggestions(res.data);
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setReorderLoading(false);
    }
  };

  const lowStockCount = rows.filter((r) => r.lowStock).length;

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-xl font-heading font-bold">
          <Boxes className="h-5 w-5" /> Inventory Management
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadReorderSuggestions}>
            <Sparkles className="mr-1.5 h-4 w-4" /> Reorder Suggestions
          </Button>
          <Button onClick={() => openAddStock(null)} disabled={!itemsWithoutInventory.length && rows.length > 0 && !menuItems.length}>
            <Plus className="mr-1.5 h-4 w-4" /> Track New Item
          </Button>
        </div>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        Current stock for every tracked menu item, pulled live from your shop&apos;s inventory records. Stock automatically decreases as orders come in.
      </p>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-2xl font-bold">{rows.length}</p>
          <p className="text-xs text-muted-foreground">Tracked items</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className={`text-2xl font-bold ${lowStockCount > 0 ? "text-red-600" : ""}`}>{lowStockCount}</p>
          <p className="text-xs text-muted-foreground">Low-stock items</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-2xl font-bold">{menuItems.length - rows.length > 0 ? menuItems.length - rows.length : 0}</p>
          <p className="text-xs text-muted-foreground">Menu items not yet tracked</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          No inventory tracked yet. Click &quot;Track New Item&quot; to start tracking stock for a menu item.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Reorder Level</TableHead>
                <TableHead>Safety Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.inventoryId}>
                  <TableCell className="font-medium">{r.itemName}</TableCell>
                  <TableCell>{r.currentStock} {r.unit || ""}</TableCell>
                  <TableCell className="text-muted-foreground">{r.reorderLevel} {r.unit || ""}</TableCell>
                  <TableCell className="text-muted-foreground">{r.safetyStock} {r.unit || ""}</TableCell>
                  <TableCell>
                    {r.lowStock ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                        <AlertTriangle className="h-3 w-3" /> Low stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                        In stock
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {r.lastUpdated ? new Date(r.lastUpdated).toLocaleString() : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => openAddStock(r)}>Edit</Button>
                      <Button size="sm" variant="outline" onClick={() => openTxn(r)}>
                        <PackagePlus className="mr-1 h-3.5 w-3.5" /> Log
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add / edit stock dialog */}
      <Dialog open={stockDialogOpen} onOpenChange={setStockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{stockForm.itemId && rows.some((r) => r.itemId === stockForm.itemId) ? "Edit Inventory" : "Track New Item"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitStock} className="space-y-3">
            <div>
              <Label>Menu item</Label>
              <Select
                value={stockForm.itemId}
                onValueChange={(v) => setStockForm((f) => ({ ...f, itemId: v }))}
                disabled={rows.some((r) => r.itemId === stockForm.itemId)}
              >
                <SelectTrigger className="mt-1 w-full"><SelectValue placeholder="Select a menu item" /></SelectTrigger>
                <SelectContent>
                  {(rows.some((r) => r.itemId === stockForm.itemId) ? menuItems : itemsWithoutInventory).map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Current stock</Label>
                <Input type="number" step="0.01" required value={stockForm.currentStock}
                  onChange={(e) => setStockForm((f) => ({ ...f, currentStock: e.target.value }))} />
              </div>
              <div>
                <Label>Unit (e.g. kg, pcs)</Label>
                <Input value={stockForm.unit}
                  onChange={(e) => setStockForm((f) => ({ ...f, unit: e.target.value }))} />
              </div>
              <div>
                <Label>Reorder level</Label>
                <Input type="number" step="0.01" value={stockForm.reorderLevel}
                  onChange={(e) => setStockForm((f) => ({ ...f, reorderLevel: e.target.value }))} />
              </div>
              <div>
                <Label>Safety stock</Label>
                <Input type="number" step="0.01" value={stockForm.safetyStock}
                  onChange={(e) => setStockForm((f) => ({ ...f, safetyStock: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={!stockForm.itemId}>Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Log transaction dialog */}
      <Dialog open={txnDialogOpen} onOpenChange={setTxnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log stock transaction — {txnTarget?.itemName}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitTxn} className="space-y-3">
            <div>
              <Label>Type</Label>
              <Select value={txnForm.transactionType} onValueChange={(v) => setTxnForm((f) => ({ ...f, transactionType: v }))}>
                <SelectTrigger className="mt-1 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TXN_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quantity</Label>
              <Input type="number" step="0.01" min="0.01" required value={txnForm.quantity}
                onChange={(e) => setTxnForm((f) => ({ ...f, quantity: e.target.value }))} />
            </div>
            <div>
              <Label>Reason (optional)</Label>
              <Input value={txnForm.reason} onChange={(e) => setTxnForm((f) => ({ ...f, reason: e.target.value }))} />
            </div>
            <DialogFooter>
              <Button type="submit">Record</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reorder suggestions dialog */}
      <Dialog open={reorderOpen} onOpenChange={setReorderOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4" /> Reorder Suggestions (next 7 days)
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground -mt-2">
            Based on Prophet demand forecasts already computed for your menu items, plus each item&apos;s safety stock.
          </p>
          {reorderLoading ? (
            <div className="flex justify-center p-6"><Loader2 className="animate-spin" /></div>
          ) : (
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {(reorderSuggestions ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">No inventory items to evaluate yet.</p>
              )}
              {(reorderSuggestions ?? []).map((s) => (
                <div key={s.inventoryId} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                  <div>
                    <p className="font-medium">{s.itemName}</p>
                    <p className="text-xs text-muted-foreground">
                      Forecasted demand: {Math.round(s.forecastedDemand)} {s.unit || ""} ·{" "}
                      {s.forecastSource === "prophet_forecast" ? "Prophet forecast" : "no forecast yet"}
                    </p>
                  </div>
                  <div className="text-right">
                    {s.reorderRecommended ? (
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                        Reorder {Math.round(s.suggestedReorderQty)} {s.unit || ""}
                      </span>
                    ) : (
                      <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                        Sufficient stock
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
