import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useStore } from "@/context/StoreContext";
import { Button } from "@/components/ui/button";
import { QrCode, Scan, Utensils, PartyPopper, ArrowRight } from "lucide-react";

export default function QRTable() {
  const { slug, tableId } = useParams();
  const { shop } = useStore();
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      
      animate={{ opacity: 1 }}
      className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-black text-white"
    >
      <Utensils className="w-10 h-10 mb-4" />
      <h1 className="text-2xl font-heading font-bold">{shop?.name || "Tasty Bites"}</h1>
      <div className="my-8 bg-white text-black p-6 rounded-xl">
        <QrCode className="w-32 h-32 mx-auto" />
        <p className="mt-2 font-semibold">SCAN TO ORDER</p>
        <p className="text-sm">TABLE {tableId}</p>
      </div>
      <div className="flex gap-6 text-sm mb-8">
        <div className="flex flex-col items-center gap-1">
          <Scan className="w-5 h-5" /> 1. Scan
        </div>
        <ArrowRight className="w-4 h-4 mt-2" />
        <div className="flex flex-col items-center gap-1">
          <Utensils className="w-5 h-5" /> 2. Order
        </div>
        <ArrowRight className="w-4 h-4 mt-2" />
        <div className="flex flex-col items-center gap-1">
          <PartyPopper className="w-5 h-5" /> 3. Enjoy
        </div>
      </div>
      <Button onClick={() => navigate(`/store/${slug}?table=${tableId}`)}>
        Start Order
      </Button>
    </motion.div>
  );
}