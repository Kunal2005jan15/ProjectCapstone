import { useEffect, useState } from "react";
import { toast } from "sonner";
import api, { apiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Loader2, ImageIcon, X } from "lucide-react";

const EMPTY = { name: "", description: "", price: "", category: "", active: true, image: "" };
const MAX_IMAGE_BYTES = 1024 * 1024; // 1MB cap, same convention as StoreCustomization

export default function MenuManagement() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    try {
      const res = await api.get("/menu");
      setItems(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchItems();
     
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/menu/${editingId}`, form);
        toast.success("Item updated");
      } else {
        await api.post("/menu", form);
        toast.success("Item added");
      }
      setForm(EMPTY);
      setEditingId(null);
      fetchItems();
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  const handleEdit = (item) => {
    setForm({ ...EMPTY, ...item });
    setEditingId(item.id);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Image is too large — please choose one under 1MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, image: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/menu/${id}`);
      toast.success("Item removed");
      fetchItems();
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div>
      <h1 className="text-xl font-heading font-bold mb-4">Menu Management</h1>

      <form onSubmit={handleSubmit} className="bg-card border rounded-lg p-4 mb-6 grid grid-cols-2 gap-3">
        {/* Dish photo — real upload + optional URL fallback */}
        <div className="col-span-2">
          <Label className="mb-1 block">Dish Photo</Label>
          <div className="flex items-center gap-3">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted relative">
              {form.image ? (
                <>
                  <img src={form.image} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, image: "" }))}
                    className="absolute top-0.5 right-0.5 rounded-full bg-black/60 p-0.5 text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </>
              ) : (
                <ImageIcon className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 space-y-1.5">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="block w-full text-xs file:mr-2 file:rounded-md file:border-0 file:bg-primary file:px-2 file:py-1 file:text-xs file:text-primary-foreground"
              />
              <Input
                placeholder="...or paste an image URL"
                value={form.image?.startsWith("data:") ? "" : form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
              />
            </div>
          </div>
        </div>
        <div>
          <Label>Name</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div>
          <Label>Category</Label>
          <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required />
        </div>
        <div>
          <Label>Price (₹)</Label>
          <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
        </div>
        <div>
          <Label>Description</Label>
          <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <Button type="submit" className="col-span-2">
          <Plus className="w-4 h-4 mr-2" /> {editingId ? "Update Item" : "Add Item"}
        </Button>
      </form>

      <div className="bg-card border rounded-lg divide-y">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between items-center p-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border bg-muted flex items-center justify-center">
                {item.image ? (
                  <img src={item.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.category} · ₹{item.price}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="icon" variant="outline" onClick={() => handleEdit(item)}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="destructive" onClick={() => handleDelete(item.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}