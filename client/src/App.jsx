import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Landing from "./pages/Landing";
import Navbar from "./components/Navbar";
import Cart from "./pages/shop/Cart";
import Checkout from "./pages/shop/Checkout";
import Payment from "./pages/shop/Payment";
import Success from "./pages/shop/Success";
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminOrderDetail from "./pages/admin/AdminOrderDetail";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminBanners from "./pages/admin/AdminBanners";
import AdminReturns from "./pages/admin/AdminReturns";
import UserLogin from "./pages/auth/UserLogin";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import UserProfile from "./pages/user/UserProfile";
import MyOrders from "./pages/user/MyOrders";
import ResetPassword from "./pages/auth/ResetPassword";
import AuthRoute from "./routes/AuthRoute";
import AdminRoute from "./routes/AdminRoute";
import AdminReports from "./pages/admin/AdminReports";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminQueries from "./pages/admin/AdminQueries";
import { ToastProvider } from "./components/Alert";
import Footer from "./components/Footer.jsx";
import Contact from "./pages/Contact";
import About from "./pages/About";
import PrivacyPolicy from "./pages/policies/PrivacyPolicy";
import RefundPolicy from "./pages/policies/RefundPolicy";
import ShippingPolicy from "./pages/policies/ShippingPolicy";
import TermsOfService from "./pages/policies/TermsOfService";
import { HelmetProvider } from "react-helmet-async";
import { ReactLenis } from "@studio-freight/react-lenis";
import useScrollAnimation from "./hooks/useScrollAnimation";
import { LanguageProvider } from "./context/LanguageContext";
import LanguageSelectorModal from "./components/LanguageSelectorModal";

/* ── Global cursor + scroll-progress bar ─────────────── */
function useGlobalEffects() {
  useEffect(() => {
    const cursor  = document.getElementById("custom-cursor");
    const ring    = document.getElementById("custom-cursor-ring");
    const bar     = document.getElementById("scroll-progress");

    // Custom cursor
    const onMouse = (e) => {
      if (cursor) { cursor.style.left = e.clientX + "px"; cursor.style.top = e.clientY + "px"; }
      if (ring)   { ring.style.left   = e.clientX + "px"; ring.style.top   = e.clientY + "px"; }
    };

    // Scroll progress bar
    const onScroll = () => {
      if (!bar) return;
      const doc = document.documentElement;
      const pct = window.scrollY / (doc.scrollHeight - doc.clientHeight);
      bar.style.transform = `scaleX(${Math.min(pct, 1)})`;
    };

    window.addEventListener("mousemove", onMouse, { passive: true });
    window.addEventListener("scroll",    onScroll, { passive: true });

    return () => {
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("scroll",    onScroll);
    };
  }, []);
}


function Layout() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isAuthRoute  = ["/login", "/register", "/forgot-password"].includes(location.pathname)
    || location.pathname.startsWith("/reset-password");

  // Global scroll animations
  useScrollAnimation();
  // Global cursor + scroll-progress bar
  useGlobalEffects();

  // Scroll to top on route change
  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);

  return (
    <>
      {(!isAdminRoute && !isAuthRoute) && <Navbar />}
      <main>
        <Routes>
          {/* Public Pages */}
          <Route 
            path="/" 
            element={<Landing />} 
          />
          <Route path="/login" element={<UserLogin />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          
          <Route path="/cart" element={<Cart />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/about" element={<About />} />
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
            path="/my-orders"
            element={
              <AuthRoute>
                <MyOrders />
              </AuthRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
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
          <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
          <Route path="/admin/orders/:id" element={<AdminRoute><AdminOrderDetail /></AdminRoute>} />
          <Route path="/admin/returns" element={<AdminRoute><AdminReturns /></AdminRoute>} />
          <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
          <Route path="/admin/banners" element={<AdminRoute><AdminBanners /></AdminRoute>} />
          <Route path="/admin/reports" element={<AdminRoute><AdminReports /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
          <Route path="/admin/reviews" element={<AdminRoute><AdminReviews /></AdminRoute>} />
          <Route path="/admin/queries" element={<AdminRoute><AdminQueries /></AdminRoute>} />
        </Routes>
      </main>
      {(!isAdminRoute && !isAuthRoute) && <Footer />}
    </>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <LanguageProvider>
        <ToastProvider>
          <Router>
            <Layout />
            <LanguageSelectorModal />
          </Router>
        </ToastProvider>
      </LanguageProvider>
    </HelmetProvider>
  );
}
