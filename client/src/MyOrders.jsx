import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useToast } from "./Alert";
import { API_URL } from "./services/api";
import { openInvoice } from "./services/invoiceGenerator";

const STATUS_MAP = {
  "Pending":   { level: 1, label: "Placed",     icon: "⏳", color: "text-orange-400", border: "border-orange-500/40", bg: "bg-orange-500", bgLight: "bg-orange-500/10" },
  "Packed":    { level: 2, label: "Packed",      icon: "📦", color: "text-blue-400",   border: "border-blue-500/40",   bg: "bg-blue-500",   bgLight: "bg-blue-500/10" },
  "Shipped":   { level: 3, label: "Dispatched",  icon: "🚚", color: "text-purple-400", border: "border-purple-500/40", bg: "bg-purple-500", bgLight: "bg-purple-500/10" },
  "Delivered": { level: 4, label: "Delivered",   icon: "✅", color: "text-green-400",  border: "border-green-500/40",  bg: "bg-green-500",  bgLight: "bg-green-500/10" },
  "Cancelled": { level: 0, label: "Cancelled",  icon: "❌", color: "text-red-400",    border: "border-red-500/40",    bg: "bg-red-500",    bgLight: "bg-red-500/10" },
};

const FILTERS = [
  { key: "all",       label: "All Orders" },
  { key: "active",    label: "Active" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
];

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem("userToken");
    if (!token) { navigate("/login"); return; }
    (async () => {
      try {
        const res = await fetch(`${API_URL}/orders/my-orders`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) setOrders(data.orders);
        else addToast(data.message || "Failed to load orders", "error");
      } catch { addToast("Server error", "error"); }
      finally { setLoading(false); }
    })();
  }, [navigate]);

  const markAsDelivered = async (orderId) => {
    try {
      const token = localStorage.getItem("userToken");
      const res = await fetch(`${API_URL}/orders/${orderId}/customer-status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: "Delivered" })
      });
      const data = await res.json();
      if (data.success) {
        addToast("Order marked as Delivered!", "success");
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, orderStatus: "Delivered" } : o));
      } else addToast(data.message || "Failed to update status", "error");
    } catch { addToast("Server error", "error"); }
  };

  // ── Derived data ──
  const filtered = orders.filter(o => {
    if (filter === "active") return ["Pending", "Packed", "Shipped"].includes(o.orderStatus);
    if (filter === "delivered") return o.orderStatus === "Delivered";
    if (filter === "cancelled") return o.orderStatus === "Cancelled";
    return true;
  }).filter(o => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return o._id.toLowerCase().includes(q) || o.items.some(i => i.name.toLowerCase().includes(q));
  });

  const totalSpent = orders.filter(o => o.paymentStatus === "PAID").reduce((s, o) => s + o.totalAmount, 0);
  const totalItems = orders.reduce((s, o) => s + o.items.reduce((a, i) => a + i.quantity, 0), 0);
  const activeCount = orders.filter(o => ["Pending", "Packed", "Shipped"].includes(o.orderStatus)).length;

  // ── Loading ──
  if (loading) return (
    <div className="min-h-screen bg-[#0d0b03] flex items-center justify-center">
      <Helmet><title>My Orders | Kala Agalya Herbals</title></Helmet>
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-yellow-500/60 text-xs uppercase tracking-[0.3em] font-bold">Loading your orders...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0d0b03] text-gray-200 font-sans selection:bg-yellow-500 selection:text-black">
      <Helmet>
        <title>My Orders | Kala Agalya Herbals</title>
        <meta name="description" content="View your order history, track deliveries and download invoices." />
      </Helmet>

      {/* Ambient glow */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-yellow-900/5 blur-[120px] pointer-events-none mix-blend-screen"></div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 relative z-10">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">My Orders</h1>
              <span className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-full text-yellow-500 text-xs font-black">{orders.length}</span>
            </div>
            <p className="text-gray-500 text-sm">Track, manage & download invoices for all your purchases</p>
          </div>
          <Link to="/product" className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-amber-700 text-black rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-[0_0_20px_rgba(234,179,8,0.15)] hover:shadow-[0_0_30px_rgba(234,179,8,0.3)] transition-all transform hover:-translate-y-0.5">
            Continue Shopping
          </Link>
        </div>

        {/* ── Stats Strip ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Total Orders", value: orders.length, icon: "📋" },
            { label: "Total Spent", value: `₹${totalSpent.toLocaleString("en-IN")}`, icon: "💰" },
            { label: "Items Purchased", value: totalItems, icon: "🛍️" },
            { label: "Active Orders", value: activeCount, icon: "🔥" },
          ].map(s => (
            <div key={s.label} className="bg-[#15120a] border border-yellow-900/20 rounded-2xl p-4 text-center group hover:border-yellow-500/30 transition-colors">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-xl font-black text-white">{s.value}</div>
              <div className="text-[9px] text-gray-500 uppercase tracking-[0.2em] font-bold mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Filters + Search ── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-8">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {FILTERS.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all border ${
                  filter === f.key
                    ? "bg-yellow-500/15 border-yellow-500/40 text-yellow-400 shadow-[0_0_12px_rgba(234,179,8,0.1)]"
                    : "bg-[#15120a] border-yellow-900/15 text-gray-500 hover:text-gray-300 hover:border-yellow-900/30"
                }`}>
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex-1 sm:max-w-xs relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" placeholder="Search order ID or product..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#15120a] border border-yellow-900/20 rounded-xl text-sm text-gray-300 placeholder-gray-600 focus:border-yellow-500/40 focus:outline-none transition-colors" />
          </div>
        </div>

        {/* ── Orders List ── */}
        {filtered.length === 0 ? (
          <div className="text-center py-24 bg-[#15120a] border border-yellow-900/15 rounded-3xl">
            <div className="text-6xl mb-6">{orders.length === 0 ? "🛒" : "🔍"}</div>
            <h3 className="text-xl font-bold text-white mb-2">{orders.length === 0 ? "No orders yet" : "No orders match"}</h3>
            <p className="text-gray-500 text-sm mb-8">{orders.length === 0 ? "Your purchase history will appear here" : "Try a different filter or search term"}</p>
            {orders.length === 0 && (
              <Link to="/product" className="inline-block px-8 py-3 bg-gradient-to-r from-yellow-600 to-amber-700 text-black rounded-xl font-bold uppercase tracking-widest text-xs">
                Browse Products
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {filtered.map(order => {
              const st = STATUS_MAP[order.orderStatus] || STATUS_MAP["Pending"];
              const currentLvl = st.level;
              const isExpanded = expandedId === order._id;
              const invoiceNo = `KAH-${order._id.slice(-8).toUpperCase()}`;
              const orderDate = new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
              const totalQty = order.items.reduce((s, i) => s + i.quantity, 0);

              return (
                <div key={order._id} className="bg-[#15120a] border border-yellow-900/20 rounded-2xl overflow-hidden hover:border-yellow-900/40 transition-colors group">
                  {/* ── Card Header ── */}
                  <div className="p-5 sm:p-6 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : order._id)}>
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Left: Order info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="text-white font-black text-sm tracking-wide">#{invoiceNo}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${st.bgLight} border ${st.border} ${st.color}`}>
                            {st.icon} {st.label}
                          </span>
                          {order.paymentStatus === "PAID" && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-green-500/10 border border-green-500/30 text-green-400">✓ Paid</span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                          <span>{orderDate}</span>
                          <span className="hidden sm:inline">•</span>
                          <span>{totalQty} {totalQty === 1 ? "Item" : "Items"}</span>
                          <span className="hidden sm:inline">•</span>
                          <span className="text-yellow-500 font-bold">₹{order.totalAmount.toLocaleString("en-IN")}</span>
                        </div>
                      </div>

                      {/* Right: Action buttons */}
                      <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                        {order.paymentStatus === "PAID" && (
                          <button onClick={() => openInvoice(order)}
                            className="px-4 py-2 bg-[#0d0b03] border border-yellow-900/30 rounded-xl text-[10px] font-bold uppercase tracking-widest text-yellow-500/70 hover:text-yellow-400 hover:border-yellow-500/40 transition-all flex items-center gap-2">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            Invoice
                          </button>
                        )}
                        {order.orderStatus === "Shipped" && (
                          <button onClick={() => markAsDelivered(order._id)}
                            className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-700 border border-green-500/40 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white hover:from-green-500 hover:to-emerald-600 transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                            ✅ Confirm Delivery
                          </button>
                        )}
                        <button onClick={() => setExpandedId(isExpanded ? null : order._id)}
                          className="p-2 rounded-lg hover:bg-yellow-500/5 transition-colors">
                          <svg className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* ── Tracking Timeline (always visible) ── */}
                    {order.orderStatus !== "Cancelled" && (
                      <div className="mt-5 pt-4 border-t border-yellow-900/10">
                        {/* Desktop horizontal timeline */}
                        <div className="hidden sm:flex items-center w-full max-w-lg">
                          {[
                            { lvl: 1, label: "Placed" },
                            { lvl: 2, label: "Packed" },
                            { lvl: 3, label: "Dispatched" },
                            { lvl: 4, label: "Delivered" }
                          ].map((step, idx) => {
                            const isActive = currentLvl >= step.lvl;
                            return (
                              <div key={step.lvl} className="flex-1 flex items-center relative">
                                <div className="relative flex flex-col items-center z-10">
                                  <div className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${isActive ? 'bg-yellow-500 border-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]' : 'bg-[#15120a] border-gray-700'}`}></div>
                                  <span className={`absolute top-5 text-[8px] font-bold uppercase tracking-widest whitespace-nowrap ${isActive ? 'text-yellow-500' : 'text-gray-600'}`}>{step.label}</span>
                                </div>
                                {idx < 3 && (
                                  <div className={`h-[2px] w-full ${currentLvl > step.lvl ? 'bg-yellow-500' : 'bg-gray-800'}`}></div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        {/* Mobile vertical timeline */}
                        <div className="flex sm:hidden flex-col gap-4 pl-2">
                          {[
                            { lvl: 1, label: "Placed" },
                            { lvl: 2, label: "Packed" },
                            { lvl: 3, label: "Dispatched" },
                            { lvl: 4, label: "Delivered" }
                          ].map((step, idx) => {
                            const isActive = currentLvl >= step.lvl;
                            return (
                              <div key={step.lvl} className="flex items-center gap-3 relative">
                                <div className={`w-3 h-3 shrink-0 rounded-full border-2 z-10 ${isActive ? 'bg-yellow-500 border-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]' : 'bg-[#15120a] border-gray-700'}`}></div>
                                <span className={`text-xs font-bold uppercase tracking-widest ${isActive ? 'text-yellow-500' : 'text-gray-600'}`}>{step.label}</span>
                                {idx < 3 && <div className={`absolute left-[5px] top-3 w-[2px] h-[calc(100%+8px)] ${currentLvl > step.lvl ? 'bg-yellow-500' : 'bg-gray-800'}`}></div>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── Expanded Details ── */}
                  {isExpanded && (
                    <div className="border-t border-yellow-900/15 bg-[#0d0b03] animate-fadeIn">
                      {/* Items table */}
                      <div className="p-5 sm:p-6">
                        <h4 className="text-[10px] font-bold text-yellow-500/60 uppercase tracking-[0.3em] mb-4">Order Items</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-yellow-900/20">
                                <th className="text-left py-2 text-[9px] font-bold text-gray-500 uppercase tracking-widest">Product</th>
                                <th className="text-center py-2 text-[9px] font-bold text-gray-500 uppercase tracking-widest">Size</th>
                                <th className="text-center py-2 text-[9px] font-bold text-gray-500 uppercase tracking-widest">Qty</th>
                                <th className="text-right py-2 text-[9px] font-bold text-gray-500 uppercase tracking-widest">Price</th>
                                <th className="text-right py-2 text-[9px] font-bold text-gray-500 uppercase tracking-widest">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {order.items.map((item, i) => (
                                <tr key={i} className="border-b border-yellow-900/10">
                                  <td className="py-3 text-white font-medium">{item.name}</td>
                                  <td className="py-3 text-center text-gray-400">{item.size || "-"}</td>
                                  <td className="py-3 text-center text-gray-400">{item.quantity}</td>
                                  <td className="py-3 text-right text-gray-400">₹{item.price}</td>
                                  <td className="py-3 text-right text-yellow-500 font-bold">₹{(item.price * item.quantity).toLocaleString("en-IN")}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Order meta */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-4 border-t border-yellow-900/10">
                          <div>
                            <div className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-1">Order ID</div>
                            <div className="text-xs text-gray-400 font-mono break-all">{order._id}</div>
                          </div>
                          <div>
                            <div className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-1">Payment</div>
                            <div className="text-xs text-gray-400">{order.paymentStatus} {order.paymentId ? `• ${order.paymentId}` : ""}</div>
                          </div>
                          <div>
                            <div className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-1">Shipping To</div>
                            <div className="text-xs text-gray-400">
                              {order.customer?.address ? [order.customer.address.door, order.customer.address.street, order.customer.address.district, order.customer.address.state, order.customer.address.pincode].filter(Boolean).join(", ") : "N/A"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Footer ── */}
        <div className="mt-12 pt-6 border-t border-yellow-900/10 text-center">
          <p className="text-[10px] text-gray-700 uppercase tracking-[0.3em] font-bold">Kala Agalya Herbals • Secure Order Management</p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
