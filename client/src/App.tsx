import { Toaster } from "react-hot-toast";
import { Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import AppLayout from "./pages/AppLayout";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductPage from "./pages/ProductPage";
import SearchResults from "./pages/SearchResults";
import FlashDeals from "./pages/FlashDeals";
import Checkout from "./pages/Checkout";
import MyOrders from "./pages/MyOrders";
import OrderTracking from "./pages/OrderTracking";
import Addresses from "./pages/Addresses";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminProductForm from "./pages/admin/AdminProductForm";
import AdminOrders from "./pages/admin/AdminOrders";
import EsewaSuccess from "./pages/EsewaSuccess";
import EsewaFailure from "./pages/EsewaFailure";

const App = () => {
  return (
    <div>
      <>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#1B3022",
              color: "#fff",
              borderRadius: "12px",
              fontSize: "14px",
            },
          }}
        />

        <Routes>
          {/* Auth pages - no Navbar/Footer*/}
          <Route path="/login" element={<Login />} />

          {/* Main pages - with navbar/footer */}
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Home />} />
            <Route path="products" element={<Products />} />
            <Route path="products/:id" element={<ProductPage />} />
            <Route path="search" element={<SearchResults />} />
            <Route path="deals" element={<FlashDeals />} />
            <Route path="payment/esewa/success" element={<EsewaSuccess />} />
            <Route path="payment/esewa/failure" element={<EsewaFailure />} />
            <Route element={<ProtectedRoute />}>
              <Route path="checkout" element={<Checkout />} />
              <Route path="orders" element={<MyOrders />} />
              <Route path="orders/:id" element={<OrderTracking />} />
              <Route path="addresses" element={<Addresses />} />
            </Route>
          </Route>

          {/* Admin Pages  */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="products/new" element={<AdminProductForm />} />
            <Route path="products/:id/edit" element={<AdminProductForm />} />
            <Route path="orders" element={<AdminOrders />} />
          </Route>
        </Routes>
      </>
    </div>
  );
};

export default App;
