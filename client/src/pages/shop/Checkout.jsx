import { useState, useMemo, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { API_URL, createOrder } from "../../services/api";
import { sanitizeCartItems, syncCartWithProducts } from "../../utils/cartUtils";

// Indian states list
const INDIAN_STATES = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

// Shipping rate logic
const SOUTH_INDIA_75 = ["Andhra Pradesh", "Telangana", "Kerala", "Karnataka"];
const TAMIL_NADU = ["Tamil Nadu"];
const PUDUCHERRY = ["Puducherry"];

function getShippingInfo(state) {
  if (!state) return { amount: 0, label: "Select a state to see shipping", free: false, pending: true };
  if (TAMIL_NADU.includes(state)) return { amount: 30, label: "₹30", free: false, pending: false };
  if (PUDUCHERRY.includes(state)) return { amount: 40, label: "₹40", free: false, pending: false };
  if (SOUTH_INDIA_75.includes(state)) return { amount: 75, label: "₹75", free: false, pending: false };
  return { amount: 165, label: "₹165", free: false, pending: false };
}

export default function Checkout() {
  const [cart, setCart] = useState(() => {
    try {
      return sanitizeCartItems(JSON.parse(localStorage.getItem("cart")) || []);
    } catch {
      return [];
    }
  });
  const [syncingPrices, setSyncingPrices] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  // Always refresh authoritative product prices from backend on checkout load
  useEffect(() => {
    let active = true;
    fetch(`${API_URL}/products`)
      .then(r => r.json())
      .then(data => {
        if (!active) return;
        if (data.success && Array.isArray(data.products) && data.products.length > 0) {
          setCart(prevCart => {
            const verified = syncCartWithProducts(prevCart, data.products);
            try { localStorage.setItem("cart", JSON.stringify(verified)); } catch { /* ignore */ }
            document.dispatchEvent(new Event("cartUpdated"));
            if (verified.length === 0) {
              navigate("/cart");
            }
            return verified;
          });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setSyncingPrices(false);
      });

    return () => { active = false; };
  }, [navigate]);

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  const [form, setForm] = useState(() => {
    const saved = localStorage.getItem("checkoutForm");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          name: localStorage.getItem("userName") || parsed.name || "",
          email: localStorage.getItem("userEmail") || parsed.email || "",
        };
      } catch (e) {
        // ignore
      }
    }
    return {
      name: localStorage.getItem("userName") || "",
      email: localStorage.getItem("userEmail") || "",
      phone: "",
      address: "",
      city: "",
      state: "",
      pincode: ""
    };
  });

  const shipping = useMemo(() => getShippingInfo(form.state), [form.state]);
  const gstAmount = Math.round(subtotal * 0.18);
  const crossedTotal = subtotal + gstAmount + shipping.amount;
  const finalAmount = subtotal + shipping.amount;

  const handleChange = e =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (syncingPrices || submitting || cart.length === 0) return;
    
    // Always save form fields first
    localStorage.setItem("checkoutForm", JSON.stringify(form));

    // Only send product identifiers & quantities; server calculates authoritative prices, shipping, and total
    const orderData = {
      customer: {
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: {
          street: form.address,
          district: form.city,
          state: form.state,
          pincode: form.pincode
        }
      },
      items: cart.map(item => ({
        productId: item.productId,
        id: item.id,
        name: item.name,
        size: item.size,
        quantity: item.quantity
      }))
    };

    // Check if logged in. If not, redirect to login
    if (!localStorage.getItem("userToken")) {
      navigate("/login?redirect=checkout");
      return;
    }

    setSubmitting(true);
    try {
      const data = await createOrder(orderData);
      if (data.success && data.order && data.order._id) {
        localStorage.setItem("lastOrderId", data.order._id);
        localStorage.setItem("lastOrderTotal", String(data.order.totalAmount));
        // Clear checkout cache on successful order creation
        localStorage.removeItem("checkoutForm");
        navigate("/payment");
      } else {
        console.error("Order creation returned no ID:", data);
        alert(data.message || "Could not create order. Please check the form and try again.");
      }
    } catch (err) {
      console.error("Order creation failed", err);
      alert("Server error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] pt-10 pb-20 relative overflow-hidden text-[#2C2921]">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-yellow-500/5 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Back Button */}
        <div className="mb-8">
          <Link
            to="/cart"
            className="inline-flex items-center gap-2 text-[#7C786E] hover:text-yellow-600 transition-colors group px-4 py-2 rounded-lg hover:bg-black/5 font-playfair"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Cart
          </Link>
        </div>

        <h2 className="text-4xl md:text-5xl font-bold mb-12 text-yellow-600 text-center drop-shadow-[0_0_15px_rgba(234,179,8,0.1)] font-soria">
          Checkout
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Shipping Form */}
          <div className="lg:col-span-2">
            <div className="bg-white p-8 md:p-10 rounded-3xl border border-yellow-500/10 shadow-xl">
              <h3 className="text-2xl font-bold text-[#2C2921] mb-8 font-playfair">Shipping Address</h3>

              <form id="checkout-form" onSubmit={onSubmit} className="space-y-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-yellow-800 uppercase ml-1">Full Name</label>
                  <input
                    required
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full bg-[#F5F2EB] border border-yellow-500/20 text-[#2C2921] p-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all placeholder:text-gray-400"
                    placeholder="Enter full name"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-yellow-800 uppercase ml-1">Email</label>
                    <input
                      required
                      type="email"
                      name="email"
                      value={form.email}
                      readOnly={!!localStorage.getItem("userToken")}
                      onChange={handleChange}
                      className={`w-full bg-[#F5F2EB] border border-yellow-500/20 text-[#2C2921] p-4 rounded-xl focus:outline-none transition-all placeholder:text-gray-400 ${localStorage.getItem("userToken") ? 'opacity-60 cursor-not-allowed' : ''}`}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-yellow-800 uppercase ml-1">Phone</label>
                    <input
                      required
                      type="tel"
                      pattern="[0-9]{10}"
                      title="Please enter a valid 10-digit phone number"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      className="w-full bg-[#F5F2EB] border border-yellow-500/20 text-[#2C2921] p-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all placeholder:text-gray-400"
                      placeholder="Enter 10-digit phone number"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-yellow-800 uppercase ml-1">Address</label>
                  <textarea
                    required
                    rows="3"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    className="w-full bg-[#F5F2EB] border border-yellow-500/20 text-[#2C2921] p-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all resize-none placeholder:text-gray-400"
                    placeholder="Enter complete address"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-yellow-800 uppercase ml-1">City / District</label>
                    <input
                      required
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      className="w-full bg-[#F5F2EB] border border-yellow-500/20 text-[#2C2921] p-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all placeholder:text-gray-400"
                      placeholder="City"
                    />
                  </div>

                  {/* State Dropdown */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-yellow-800 uppercase ml-1">State</label>
                    <div className="relative">
                      <select
                        required
                        name="state"
                        value={form.state}
                        onChange={handleChange}
                        className="w-full bg-[#F5F2EB] border border-yellow-500/20 text-[#2C2921] p-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all appearance-none cursor-pointer pr-10"
                      >
                        <option value="" disabled className="text-gray-500">Select State</option>
                        {INDIAN_STATES.map(s => (
                          <option key={s} value={s} className="bg-white text-[#2C2921]">{s}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                        <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    {/* Shipping preview badge under state */}
                    {form.state && (
                      <div className="mt-1.5 ml-1 flex items-center gap-1.5 text-[10px] font-bold uppercase text-amber-600">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8l1 11a2 2 0 002 2h8a2 2 0 002-2L19 8" />
                        </svg>
                        {`Shipping: ${shipping.label}`}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-yellow-800 uppercase ml-1">Pincode</label>
                    <input
                      required
                      pattern="[0-9]{6}"
                      title="Please enter a valid 6-digit pincode"
                      name="pincode"
                      value={form.pincode}
                      onChange={handleChange}
                      className="w-full bg-[#F5F2EB] border border-yellow-500/20 text-[#2C2921] p-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all placeholder:text-gray-400"
                      placeholder="Pincode"
                    />
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-3xl border border-yellow-500/10 shadow-xl sticky top-24">
              <h3 className="text-2xl font-bold text-[#2C2921] mb-8 border-b border-yellow-500/10 pb-4 font-playfair">Order Summary</h3>

              <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start text-sm">
                    <div className="flex-1 pr-4">
                      <p className="text-[#4A473E] font-medium">{item.name} ({item.size})</p>
                      <p className="text-[#7C786E] italic">x {item.quantity}</p>
                    </div>
                    <span className="text-yellow-600 font-bold font-soria">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              {/* Original Price */}
              <div className="flex justify-between items-center py-3 border-t border-yellow-500/10">
                <span className="text-sm text-[#7C786E]">Original Price</span>
                <span className="text-sm font-bold text-[#2C2921]">₹{subtotal.toFixed(2)}</span>
              </div>

              {/* GST Row â€” label only, 18% included in price */}
              <div className="flex justify-between items-center py-2 border-yellow-500/10">
                <span className="text-sm text-[#7C786E]">GST</span>
                <span className="text-sm font-bold text-amber-600">18%</span>
              </div>

              {/* Shipping Row */}
              <div className="flex justify-between items-center py-3 border-b border-yellow-500/10">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#7C786E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8l1 11a2 2 0 002 2h8a2 2 0 002-2L19 8" />
                  </svg>
                  <span className="text-sm text-[#7C786E]">Shipping</span>
                </div>
                {shipping.pending ? (
                  <span className="text-xs text-[#7C786E] italic">Select state</span>
                ) : (
                  <span className="text-sm font-bold text-amber-600">{shipping.label}</span>
                )}
              </div>

              {/* Crossed Total */}
              <div className="flex justify-between items-center py-2 mt-2">
                <span className="text-sm text-[#7C786E]">Total Amount</span>
                <span className="text-sm text-[#7C786E] line-through">₹{crossedTotal.toFixed(2)}</span>
              </div>

              {/* Final Amount */}
              <div className="flex justify-between items-center mt-1 mb-8 pt-3 border-t-2 border-yellow-600/50 font-soria">
                <span className="text-xl font-bold text-yellow-700">Final Amount</span>
                <span className="text-3xl font-bold text-yellow-600 drop-shadow-[0_0_10px_rgba(234,179,8,0.1)]">₹{finalAmount.toFixed(2)}</span>
              </div>

              {/* Shipping note */}
              {form.state && (
                <div className="mb-6 px-4 py-3 rounded-xl text-xs font-medium bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  {TAMIL_NADU.includes(form.state)
                    ? `🚚 Delivery to Tamil Nadu: ₹30`
                    : PUDUCHERRY.includes(form.state)
                      ? `🚚 Delivery to Puducherry: ₹40`
                      : SOUTH_INDIA_75.includes(form.state)
                        ? `🚚 Standard delivery to ${form.state}: ₹75`
                        : `🚚 Delivery to ${form.state}: ₹165`
                  }
                </div>
              )}


              <button
                type="submit"
                form="checkout-form"
                disabled={syncingPrices || submitting || cart.length === 0}
                className="w-full group relative py-5 bg-gradient-to-r from-yellow-600 via-amber-500 to-yellow-600 bg-size-200 hover:bg-pos-100 text-black font-extrabold text-lg rounded-xl shadow-[0_0_25px_rgba(234,179,8,0.4)] hover:shadow-[0_0_40px_rgba(234,179,8,0.6)] transform hover:-translate-y-1 active:scale-[0.98] transition-all duration-500 uppercase tracking-widest overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none skew-x-12 -translate-x-full group-hover:translate-x-full duration-1000"></div>
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {syncingPrices ? "Verifying Prices..." : submitting ? "Creating Order..." : "Continue to Payment"}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #eab30833; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #eab30866; }
        .bg-size-200 { background-size: 200% auto; }
        .hover\\:bg-pos-100:hover { background-position: right center; }
        select option { background-color: white; color: #2C2921; }
      `}</style>
    </div>
  );
}
