import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Landing from "./Landing";
import Product from "./Product";
import Navbar from "./Navbar";
import Cart from "./Cart";
import Checkout from "./Checkout";
import Payment from "./Payment";
import Success from "./Success";
import ProtectedRoute from "./ProtectedRoute";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";
import AdminOrders from "./AdminOrders";
import AdminOrderDetail from "./AdminOrderDetail";
import AdminProducts from "./AdminProducts";
import UserLogin from "./UserLogin";
import Register from "./Register";
import ForgotPassword from "./ForgotPassword";
import UserProfile from "./UserProfile";
import ResetPassword from "./ResetPassword";
import AuthRoute from "./AuthRoute";
import AdminReports from "./AdminReports";
import AdminUsers from "./AdminUsers";
import AdminReviews from "./AdminReviews";
import { ToastProvider } from "./Alert";
import Footer from "./Footer.jsx";
import Contact from "./Contact";
import PrivacyPolicy from "./PrivacyPolicy";
import RefundPolicy from "./RefundPolicy";
import ShippingPolicy from "./ShippingPolicy";
import TermsOfService from "./TermsOfService";
import { HelmetProvider } from "react-helmet-async";
import { BASE_URL } from "./services/api";

function Layout() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isAuthenticated = !!localStorage.getItem("userToken");
  const isAuthRoute = ["/login", "/register", "/forgot-password"].includes(location.pathname) || location.pathname.startsWith("/reset-password") || (location.pathname === "/" && !isAuthenticated);

  return (
    <>
      {(!isAdminRoute && !isAuthRoute) && <Navbar />}
      <main>
        <Routes>
          {/* Public Pages */}
          <Route 
            path="/" 
            element={isAuthenticated ? <Landing /> : <UserLogin />} 
          />
          <Route path="/login" element={<UserLogin />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          
          <Route path="/product" element={<Product />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route path="/shipping-policy" element={<ShippingPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />

          {/* User Protected Pages */}
          <Route
            path="/profile"
            element={
              <AuthRoute>
                <UserProfile />
              </AuthRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <AuthRoute>
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              </AuthRoute>
            }
          />

          <Route
            path="/payment"
            element={
              <AuthRoute>
                <ProtectedRoute>
                  <Payment />
                </ProtectedRoute>
              </AuthRoute>
            }
          />

          <Route path="/success" element={<Success />} />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/orders/:id" element={<AdminOrderDetail />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/reviews" element={<AdminReviews />} />
        </Routes>
      </main>
      {(!isAdminRoute && !isAuthRoute) && <Footer />}
    </>
  );
}

export default function App() {
  // Wake up the Render backend on app load (prevents ERR_SOCKET_NOT_CONNECTED)
  useEffect(() => {
    fetch(BASE_URL).catch(() => console.log("Backend wake-up ping sent"));
  }, []);

  return (
    <HelmetProvider>
      <ToastProvider>
        <Router>
          <Layout />
        </Router>
      </ToastProvider>
    </HelmetProvider>
  );
}
