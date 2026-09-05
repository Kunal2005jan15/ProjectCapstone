import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QrCode, Plus, Trash2 } from "lucide-react";

export default function TableManagement() {
  const [tables, setTables] = useState([]);
  const [seats, setSeats] = useState(2);

  const fetchTables = async () => {
    try {
      const res = await api.get("/tables");
      setTables(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTables();
     
  }, []);

  const addTable = async () => {
    try {
      await api.post("/tables", { seats });
      toast.success("Table added");
      fetchTables();
    } catch (err) {
      console.error(err);
      toast.error("Failed to add table");
    }
  };

  const deleteTable = async (id) => {
    try {
      await api.delete(`/tables/${id}`);
      fetchTables();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete table");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-heading font-bold">Table Management</h1>
        <div className="flex gap-2 items-center">
          <Input
            type="number"
            className="w-20"
            value={seats}
            onChange={(e) => setSeats(e.target.value)}
          />
          <Button onClick={addTable}><Plus className="w-4 h-4 mr-1" /> Add Table</Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {tables.map((t) => (
          <div key={t.id} className="bg-card border rounded-lg p-4 text-center">
            <p className="font-medium mb-1">Table {t.number}</p>
            <p className="text-xs text-muted-foreground mb-2">{t.seats} Seats</p>
            <QrCode className="w-16 h-16 mx-auto mb-2" />
            <div className="flex justify-center gap-2">
              <span className={`text-xs px-2 py-1 rounded-full ${t.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {t.active ? "Active" : "Inactive"}
              </span>
              <Button size="icon" variant="ghost" onClick={() => deleteTable(t.id)}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}