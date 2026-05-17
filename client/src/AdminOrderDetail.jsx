import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useToast } from "./Alert";
import AdminLayout from "./AdminLayout";
import Avatar from "./Avatar";

export default function AdminOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useToast();

  const fetchOrder = useCallback(async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`https://kala-agalya-herbals-production.up.railway.app/api/admin/orders/${id}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        },
      });
      const data = await response.json();
      if (data.success) {
        setOrder(data.order);
      } else {
        addToast("Failed to fetch order details", "error");
      }
    } catch (error) {
      console.error("Error fetching order:", error);
      addToast("Error fetching order", "error");
    } finally {
      setLoading(false);
    }
  }, [id, addToast]);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin/login");
      return;
    }
    fetchOrder();
  }, [id, navigate, fetchOrder]);

  const updateOrderStatus = async (newStatus) => {
    setUpdating(true);
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`https://kala-agalya-herbals-production.up.railway.app/api/admin/orders/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ orderStatus: newStatus }),
      });
      const data = await response.json();
      if (data.success) {
        setOrder(data.order);
        addToast(`Order status updated to ${newStatus}`, "success");
      } else {
        addToast("Failed to update status", "error");
      }
    } catch (error) {
      console.error("Error updating order:", error);
      addToast("Failed to update order status", "error");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0b03]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)]"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <AdminLayout>
        <div className="text-center p-20 bg-[#111a11] rounded-2xl border border-yellow-500/10">
          <svg className="w-16 h-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <h2 className="text-2xl font-bold text-gray-200 mb-4">Order Not Found</h2>
          <Link to="/admin/orders" className="text-yellow-500 hover:text-yellow-400 font-semibold underline uppercase tracking-widest text-xs">
            Back to Orders
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-10">
        <div className="flex items-center gap-6">
          <Link
            to="/admin/orders"
            className="group relative inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold text-yellow-500 bg-[#0d0b03] border border-yellow-500/20 hover:border-yellow-500/60 transition-all uppercase tracking-widest"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 transform group-hover:-translate-x-1 transition-transform relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="relative z-10">Back to Orders</span>
          </Link>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Order Transaction ID</p>
            <p className="font-mono text-sm text-yellow-400 bg-yellow-900/20 px-3 py-1 rounded-lg border border-yellow-500/10 inline-block font-bold">
              {order._id.slice(-8).toUpperCase()}
            </p>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Order Date</p>
          <p className="font-bold text-white text-sm">
            {new Date(order.createdAt).toLocaleDateString("en-IN", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Customer Details */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-[#111a11] rounded-2xl shadow-xl p-8 border border-yellow-500/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 blur-[60px] rounded-full"></div>
            <h2 className="text-xl font-bold text-white mb-8 flex items-center border-b border-yellow-900/10 pb-4">
              <Avatar src={order.customer.avatar} name={order.customer.name} size="sm" className="mr-3" />
              Customer Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="text-[10px] text-yellow-500 uppercase tracking-widest mb-2 font-bold">Full Name</p>
                <p className="font-bold text-white text-lg group-hover:text-yellow-400 transition-colors uppercase tracking-tight">{order.customer.name}</p>
              </div>
              <div>
                <p className="text-[10px] text-yellow-500 uppercase tracking-widest mb-2 font-bold">Primary Phone</p>
                <p className="font-bold text-white text-lg font-mono">{order.customer.phone}</p>
              </div>
              {order.customer.altPhone && (
                <div>
                  <p className="text-[10px] text-yellow-500 uppercase tracking-widest mb-2 font-bold">Alt Phone</p>
                  <p className="font-bold text-white text-lg font-mono">{order.customer.altPhone}</p>
                </div>
              )}
            </div>
            <div className="mt-10 pt-8 border-t border-yellow-900/10">
              <p className="text-[10px] text-yellow-500 uppercase tracking-widest mb-4 font-bold">Shipping Information</p>
              <div className="bg-[#0a0f0a]/60 rounded-2xl p-6 border border-yellow-900/20 shadow-inner">
                <p className="text-gray-300 text-lg leading-relaxed font-medium">
                  {order.customer.address.door}, {order.customer.address.street}
                </p>
                {order.customer.address.landmark && (
                  <p className="text-gray-500 text-xs mt-2 uppercase tracking-wide">Landmark: <span className="text-gray-400">{order.customer.address.landmark}</span></p>
                )}
                <p className="text-gray-300 text-lg mt-1 font-medium">
                  {order.customer.address.district}, {order.customer.address.state} - <span className="font-mono text-yellow-500 font-black">{order.customer.address.pincode}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Ordered Products */}
          <div className="bg-[#111a11] rounded-2xl shadow-xl p-8 border border-yellow-500/10 relative overflow-hidden">
            <h2 className="text-xl font-bold text-white mb-8 flex items-center border-b border-yellow-900/10 pb-4">
              <div className="bg-green-900/20 p-2 rounded-xl mr-3 border border-yellow-500/20">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              Ordered Products
            </h2>
            <div className="space-y-6">
              {order.items.map((item, index) => (
                <div key={index} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#0a0f0a]/60 rounded-2xl p-6 border border-yellow-900/20 hover:border-yellow-500/30 transition-all group gap-6">
                  <div className="flex-1">
                    <p className="font-bold text-white text-lg uppercase tracking-tight group-hover:text-yellow-400 transition-colors">{item.name}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">Size: <span className="text-yellow-500">{item.size}</span></p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">Qty: <span className="text-yellow-500">{item.quantity}</span></p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right min-w-[120px] pt-4 sm:pt-0 border-t sm:border-t-0 border-white/5 w-full sm:w-auto">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Line Total</p>
                    <p className="font-black text-white text-xl font-mono">₹{item.price.toFixed(0)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 pt-8 border-t border-yellow-900/20">
              <div className="flex justify-between items-center">
                <p className="text-xl font-black text-gray-400 uppercase tracking-widest">Grand Total</p>
                <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600 font-mono shadow-sm">₹{order.totalAmount.toFixed(0)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Status & Actions */}
        <div className="space-y-8">
          {/* Payment Information */}
          <div className="bg-[#111a11] rounded-2xl shadow-xl p-8 border border-yellow-500/10 relative overflow-hidden group">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center">
              <div className="bg-yellow-900/20 p-2 rounded-xl mr-3 border border-yellow-500/10">
                <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              Transaction Info
            </h2>
            <div className="space-y-6">
              {order.paymentId && (
                <div>
                  <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2 font-bold">RazorPay Payment ID</p>
                  <p className="font-mono text-[10px] text-yellow-500 bg-[#0d0b03] p-3 rounded-xl border border-yellow-900/40 break-all font-bold shadow-inner">{order.paymentId}</p>
                </div>
              )}
              <div>
                <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2 font-bold">Payment Status</p>
                <span
                  className={`inline-flex items-center px-4 py-2 rounded-xl text-xs font-black tracking-widest border shadow-lg ${order.paymentStatus === "PAID"
                      ? "bg-green-500/10 text-green-500 border-green-500/40"
                      : "bg-red-500/10 text-red-500 border-red-500/40"
                    }`}
                >
                  {order.paymentStatus === "PAID" && <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                  {order.paymentStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Activity Logs / Control Panel */}
          <div className="bg-[#111a11] rounded-2xl shadow-xl p-8 border border-yellow-500/10 relative overflow-hidden">
            <h2 className="text-lg font-bold text-white mb-8 bg-yellow-900/10 -mx-8 px-8 py-3 border-y border-yellow-900/10 uppercase tracking-widest text-[10px]">Processing Control Panel</h2>

            <div className="text-center mb-10">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-4 font-bold">Current Logistics Status</p>
              <div className="relative inline-block">
                <div className={`absolute inset-0 blur-2xl opacity-40 rounded-full scale-110 ${order.orderStatus === "Delivered" ? "bg-green-500" :
                    order.orderStatus === "Cancelled" ? "bg-red-500" :
                      "bg-yellow-500"
                  }`}></div>
                <span
                  className={`relative z-10 inline-block px-10 py-5 rounded-2xl text-2xl font-black tracking-tighter uppercase border-2 shadow-2xl transition-all ${order.orderStatus === "Pending"
                      ? "bg-orange-600 text-white border-white/20"
                      : order.orderStatus === "Packed"
                        ? "bg-blue-600 text-white border-white/20"
                        : order.orderStatus === "Shipped"
                          ? "bg-indigo-600 text-white border-white/20"
                          : order.orderStatus === "Delivered"
                            ? "bg-emerald-600 text-white border-white/20"
                            : "bg-red-600 text-white border-white/20"
                    }`}
                >
                  {order.orderStatus}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 text-center">Execute State Change</p>
              {order.orderStatus !== "Packed" && order.orderStatus !== "Cancelled" && order.orderStatus !== "Shipped" && order.orderStatus !== "Delivered" && (
                <button
                  onClick={() => updateOrderStatus("Packed")}
                  disabled={updating}
                  className="w-full bg-[#0d0b03] text-blue-500 border border-blue-500/30 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-[0_0_15px_rgba(37,99,235,0.1)] hover:shadow-[0_0_25px_rgba(37,99,235,0.3)] disabled:opacity-50"
                >
                  {updating ? "Processing..." : "Move to Packed State"}
                </button>
              )}
              {order.orderStatus === "Packed" && (
                <button
                  onClick={() => updateOrderStatus("Shipped")}
                  disabled={updating}
                  className="w-full bg-[#0d0b03] text-indigo-500 border border-indigo-500/30 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-[0_0_15px_rgba(147,51,234,0.1)] hover:shadow-[0_0_25px_rgba(147,51,234,0.3)] disabled:opacity-50"
                >
                  {updating ? "Processing..." : "Mark as Dispatched"}
                </button>
              )}
              {order.orderStatus === "Shipped" && (
                <button
                  onClick={() => updateOrderStatus("Delivered")}
                  disabled={updating}
                  className="w-full bg-[#0d0b03] text-emerald-500 border border-emerald-500/30 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:shadow-[0_0_25px_rgba(16,185,129,0.3)] disabled:opacity-50"
                >
                  {updating ? "Processing..." : "Confirm Delivery"}
                </button>
              )}
              {order.orderStatus !== "Delivered" && order.orderStatus !== "Cancelled" && (
                <button
                  onClick={() => {
                    if (window.confirm("CRITICAL ACTION: Are you sure you want to cancel this order?")) {
                      updateOrderStatus("Cancelled");
                    }
                  }}
                  disabled={updating}
                  className="w-full bg-red-600/10 text-red-500 border border-red-500/30 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-[0_0_15px_rgba(220,38,38,0.1)] hover:shadow-[0_0_25px_rgba(220,38,38,0.3)] disabled:opacity-50"
                >
                  {updating ? "Processing..." : "Cancel Order"}
                </button>
              )}
              {order.orderStatus === "Delivered" && (
                <div className="bg-emerald-900/10 border border-emerald-500/20 p-4 rounded-xl text-center">
                  <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Fulfillment Cycle Complete</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}


