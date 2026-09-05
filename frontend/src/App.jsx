import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { StoreProvider } from "@/context/StoreContext";
import ProtectedRoute from "@/components/ProtectedRoute";

import Landing from "@/pages/Landing";
import Storefront from "@/pages/Storefront";
import Checkout from "@/pages/Checkout";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import QRTable from "@/pages/QRTable";
import OrderTracking from "@/pages/OrderTracking";
import OnboardingTemplate from "@/pages/OnboardingTemplate";

import AdminLayout from "@/pages/admin/AdminLayout";
import Dashboard from "@/pages/admin/Dashboard";
import LiveQueue from "@/pages/admin/LiveQueue";
import MenuManagement from "@/pages/admin/MenuManagement";
import TableManagement from "@/pages/admin/TableManagement";
import StoreCustomization from "@/pages/admin/StoreCustomization";
import DemandForecast from "@/pages/admin/DemandForecast";
import InventoryManagement from "@/pages/admin/InventoryManagement";
import WasteManagement from "@/pages/admin/WasteManagement";

import "./App.css";

export default function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <CartProvider>
          <BrowserRouter>
            <Toaster richColors position="top-center" />
            <Routes>
              {/* Public / customer routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              <Route
                path="/onboarding/template"
                element={
                  <ProtectedRoute>
                    <OnboardingTemplate />
                  </ProtectedRoute>
                }
              />

              <Route path="/store/:slug" element={<Storefront />} />
              <Route path="/store/:slug/table/:tableId" element={<QRTable />} />
              <Route path="/store/:slug/checkout" element={<Checkout />} />
              <Route path="/order/:orderId" element={<OrderTracking />} />

              {/* Admin routes — protected */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute adminOnly>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="queue" element={<LiveQueue />} />
                <Route path="menu" element={<MenuManagement />} />
                <Route path="tables" element={<TableManagement />} />
                <Route path="customize" element={<StoreCustomization />} />
                <Route path="forecast" element={<DemandForecast />} />
                <Route path="inventory" element={<InventoryManagement />} />
                <Route path="waste" element={<WasteManagement />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </StoreProvider>
    </AuthProvider>
  );
}