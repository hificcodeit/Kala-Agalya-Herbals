import { API_URL, BASE_URL } from "../../services/api";
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useToast } from "../../components/Alert";
import AdminLayout from "./AdminLayout";
import Avatar from "../../components/Avatar";
import { openInvoice } from "../../services/invoiceGenerator";

export default function AdminOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [savingAction, setSavingAction] = useState(null); // 'save' | 'whatsapp' | null
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const navigate = useNavigate();
  const { addToast } = useToast();

  const fetchOrder = useCallback(async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`${API_URL}/admin/orders/${id}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        },
      });
      const data = await response.json();
      if (data.success) {
        setOrder(data.order);
        setTrackingNumber(data.order.trackingNumber || "");
        setTrackingUrl(data.order.trackingUrl || "");
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

  const updateOrderStatus = async (newStatus, customReturnReason = "", customReturnNotes = "") => {
    setUpdating(true);
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`${API_URL}/admin/orders/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          orderStatus: newStatus,
          returnReason: customReturnReason,
          returnNotes: customReturnNotes
        }),
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

  const buildWhatsAppLink = (savedOrder) => {
    if (!savedOrder?.customer?.phone) return null;
    const rawPhone = savedOrder.customer.phone.replace(/\D/g, "");
    const waPhone = rawPhone.startsWith("91") ? rawPhone : `91${rawPhone}`;
    const customerName = savedOrder.customer.name || "Customer";
    const trackingNo = savedOrder.trackingNumber;
    const urlLine = savedOrder.trackingUrl ? `\n🔗 Track here: ${savedOrder.trackingUrl}` : "";
    const message = encodeURIComponent(
      `Hello ${customerName}! 👋\n\nYour order from *Kala Agalya Herbals* has been shipped! 🚚\n\n📦 Tracking Number: *${trackingNo}*${urlLine}\n\nThank you for shopping with us! 🌿`
    );
    return `https://wa.me/${waPhone}?text=${message}`;
  };

  const saveTracking = async (sendWhatsApp = false) => {
    if (!trackingNumber.trim()) {
      addToast("Please enter a tracking number", "error");
      return;
    }
    const actionType = sendWhatsApp ? "whatsapp" : "save";
    setSavingAction(actionType);
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`${API_URL}/admin/orders/${id}/tracking`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ trackingNumber: trackingNumber.trim(), trackingUrl: trackingUrl.trim() }),
      });
      const data = await response.json();
      if (data.success) {
        setOrder(data.order);
        addToast("Tracking info saved successfully!", "success");
        if (sendWhatsApp) {
          const waLink = buildWhatsAppLink(data.order);
          if (waLink) {
            window.open(waLink, "_blank", "noopener,noreferrer");
          } else {
            addToast("No customer phone number found to send WhatsApp", "error");
          }
        }
      } else {
        addToast(data.message || "Failed to save tracking info", "error");
      }
    } catch (error) {
      console.error("Error saving tracking:", error);
      addToast("Failed to save tracking info", "error");
    } finally {
      setSavingAction(null);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="py-24 text-center">
          <div className="animate-spin h-10 w-10 border-4 border-yellow-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-[#6C685F] font-inter text-sm">Loading order details...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!order) {
    return (
      <AdminLayout>
        <div className="text-center p-20 bg-white rounded-3xl border border-yellow-500/12 shadow-card">
          <svg className="w-16 h-16 text-yellow-600/30 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <h2 className="text-2xl font-bold text-[#1C1A16] font-grotesk mb-4">Order Not Found</h2>
          <Link to="/admin/orders" className="text-yellow-700 hover:text-yellow-600 font-bold underline font-grotesk uppercase tracking-wider text-xs">
            Back to Orders
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-8">
        <div className="flex flex-wrap items-center gap-4">
          <Link
            to="/admin/orders"
            className="group inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-yellow-800 bg-white border border-yellow-500/25 hover:bg-yellow-500/10 transition-all font-grotesk uppercase tracking-wider shadow-xs"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Orders</span>
          </Link>
          <div>
            <p className="text-[10px] text-[#9A9690] uppercase tracking-widest font-grotesk mb-0.5">Order Reference</p>
            <p className="font-mono text-sm text-yellow-800 bg-yellow-500/10 px-3 py-1 rounded-lg border border-yellow-500/20 inline-block font-bold">
              {order.orderId || order._id.slice(-8).toUpperCase()}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-[#9A9690] uppercase tracking-widest font-grotesk mb-0.5">Invoice Number</p>
            <p className="font-mono text-sm text-emerald-900 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20 inline-block font-bold">
              #KAH-{order.orderId || order._id.slice(-8).toUpperCase()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-left sm:text-right">
          <button
            onClick={() => openInvoice(order)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-yellow-600 hover:bg-yellow-700 active:scale-95 transition-all font-grotesk uppercase tracking-wider shadow-sm"
            title="Download or Print Tax Invoice"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Download Invoice</span>
          </button>
          <div>
            <p className="text-[10px] text-[#9A9690] uppercase tracking-widest font-grotesk mb-0.5">Order Date</p>
            <p className="font-bold text-[#1C1A16] text-sm font-inter">
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Customer Details */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl shadow-card p-8 border border-yellow-500/12 relative overflow-hidden">
            <h2 className="text-xl font-bold text-[#1C1A16] mb-6 flex items-center border-b border-yellow-500/12 pb-4 font-grotesk">
              <Avatar src={order.customer.avatar} name={order.customer.name} size="sm" className="mr-3" />
              Customer Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-inter">
              <div>
                <p className="text-[10px] text-yellow-800 uppercase tracking-widest mb-1 font-bold font-grotesk">Full Name</p>
                <p className="font-bold text-[#1C1A16] text-base">{order.customer.name}</p>
              </div>
              <div>
                <p className="text-[10px] text-yellow-800 uppercase tracking-widest mb-1 font-bold font-grotesk">Primary Phone</p>
                <p className="font-bold text-[#1C1A16] text-base font-mono">{order.customer.phone}</p>
              </div>
              {order.customer.altPhone && (
                <div>
                  <p className="text-[10px] text-yellow-800 uppercase tracking-widest mb-1 font-bold font-grotesk">Alt Phone</p>
                  <p className="font-bold text-[#1C1A16] text-base font-mono">{order.customer.altPhone}</p>
                </div>
              )}
            </div>
            <div className="mt-8 pt-6 border-t border-yellow-500/12">
              <p className="text-[10px] text-yellow-800 uppercase tracking-widest mb-3 font-bold font-grotesk">Shipping Address</p>
              <div className="bg-[#FDFBF7] rounded-2xl p-5 border border-yellow-500/15">
                <p className="text-[#1C1A16] text-base font-medium font-inter leading-relaxed">
                  {order.customer.address.door}, {order.customer.address.street}
                </p>
                {order.customer.address.landmark && (
                  <p className="text-[#6C685F] text-xs mt-1.5 uppercase font-grotesk">Landmark: <span className="text-[#1C1A16] font-medium">{order.customer.address.landmark}</span></p>
                )}
                <p className="text-[#1C1A16] text-base mt-1 font-medium font-inter">
                  {order.customer.address.district}, {order.customer.address.state} - <span className="font-mono text-yellow-700 font-bold">{order.customer.address.pincode}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Ordered Products */}
          <div className="bg-white rounded-3xl shadow-card p-8 border border-yellow-500/12 relative overflow-hidden">
            <h2 className="text-xl font-bold text-[#1C1A16] mb-6 flex items-center border-b border-yellow-500/12 pb-4 font-grotesk">
              <div className="bg-yellow-500/15 p-2 rounded-xl mr-3">
                <svg className="w-5 h-5 text-yellow-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              Ordered Items
            </h2>
            <div className="space-y-4 font-inter">
              {order.items.map((item, index) => (
                <div key={index} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#FDFBF7] rounded-2xl p-5 border border-yellow-500/12 gap-4">
                  <div className="flex-1">
                    <p className="font-bold text-[#1C1A16] text-base font-grotesk">{item.name}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <p className="text-[10px] text-[#6C685F] font-bold uppercase tracking-wider font-grotesk bg-white px-2 py-0.5 rounded border border-yellow-500/10">Size: <span className="text-yellow-800">{item.size}</span></p>
                      <p className="text-[10px] text-[#6C685F] font-bold uppercase tracking-wider font-grotesk bg-white px-2 py-0.5 rounded border border-yellow-500/10">Qty: <span className="text-yellow-800">{item.quantity}</span></p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right min-w-[100px]">
                    <p className="text-[10px] text-[#9A9690] uppercase tracking-wider font-grotesk font-bold">Line Total</p>
                    <p className="font-black text-[#1C1A16] text-lg font-soria">₹{item.price.toFixed(0)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-6 border-t border-yellow-500/12">
              <div className="flex justify-between items-center">
                <p className="text-lg font-bold text-[#6C685F] font-grotesk uppercase tracking-wider">Grand Total</p>
                <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-700 to-amber-800 font-soria">₹{order.totalAmount.toFixed(0)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Status & Actions */}
        <div className="space-y-8">
          {/* Payment Information */}
          <div className="bg-white rounded-3xl shadow-card p-7 border border-yellow-500/12">
            <h2 className="text-lg font-bold text-[#1C1A16] mb-5 flex items-center font-grotesk">
              <div className="bg-yellow-500/15 p-2 rounded-xl mr-3">
                <svg className="w-5 h-5 text-yellow-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              Transaction Info
            </h2>
            <div className="space-y-4">
              {order.paymentId && (
                <div>
                  <p className="text-[10px] text-[#9A9690] uppercase tracking-widest font-grotesk font-bold mb-1">Razorpay Payment ID</p>
                  <p className="font-mono text-[11px] text-yellow-800 bg-[#FDFBF7] p-3 rounded-xl border border-yellow-500/15 break-all font-bold">{order.paymentId}</p>
                </div>
              )}
              <div>
                <p className="text-[10px] text-[#9A9690] uppercase tracking-widest font-grotesk font-bold mb-1.5">Payment Status</p>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold font-grotesk tracking-wider uppercase border ${
                      order.paymentStatus === "REFUNDED"
                        ? "bg-purple-50 text-purple-800 border-purple-200"
                        : order.paymentStatus === "PAID"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                      }`}
                  >
                    {order.paymentStatus === "PAID" && <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                    {order.paymentStatus === "REFUNDED" && <span className="mr-1.5">💸</span>}
                    {order.paymentStatus}
                  </span>

                  {order.paymentStatus === "PAID" && (
                    <button
                      onClick={async () => {
                        const amt = window.prompt("Enter refund amount in ₹:", order.totalAmount);
                        if (amt) {
                          const note = window.prompt("Enter refund note / transaction ID:", "Refund processed for order");
                          try {
                            const token = localStorage.getItem("adminToken");
                            const res = await fetch(`${API_URL}/admin/orders/${id}/refund`, {
                              method: "PUT",
                              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                              body: JSON.stringify({ refundAmount: Number(amt), refundNote: note || "" })
                            });
                            const data = await res.json();
                            if (data.success) {
                              setOrder(data.order);
                              addToast("Refund processed successfully", "success");
                            } else {
                              addToast(data.message || "Refund failed", "error");
                            }
                          } catch (err) {
                            addToast("Error processing refund", "error");
                          }
                        }
                      }}
                      className="px-3 py-1 bg-purple-50 text-purple-800 border border-purple-200 rounded-xl hover:bg-purple-600 hover:text-white transition-all font-bold text-[10px] font-grotesk uppercase tracking-wider"
                    >
                      💸 Issue Refund
                    </button>
                  )}
                </div>

                {order.paymentStatus === "REFUNDED" && (
                  <div className="mt-3 p-3 bg-purple-50/70 border border-purple-200 rounded-xl text-xs space-y-1 font-inter">
                    <p className="font-bold text-purple-950 font-grotesk">Refund Amount: ₹{(order.refundAmount || order.totalAmount || 0).toFixed(0)}</p>
                    {order.refundNote && <p className="text-purple-800">Note: {order.refundNote}</p>}
                    {order.refundTransactionId && <p className="text-purple-700 font-mono text-[11px]">Txn Ref: {order.refundTransactionId}</p>}
                    {order.refundDate && (
                      <p className="text-[10px] text-purple-600">
                        Refunded on: {new Date(order.refundDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Courier Tracking */}
          <div className="bg-white rounded-3xl shadow-card p-7 border border-yellow-500/12">
            <h2 className="text-xs font-bold text-yellow-800 uppercase tracking-widest mb-5 font-grotesk bg-yellow-500/8 -mx-7 -mt-7 px-7 py-3 border-b border-yellow-500/12 rounded-t-3xl flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
              Courier Tracking
            </h2>

            {order.trackingNumber && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2">
                <svg className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                <div className="min-w-0">
                  <p className="text-[9px] font-bold text-emerald-700 uppercase tracking-widest font-grotesk mb-0.5">Current Tracking No.</p>
                  <p className="font-mono text-xs font-black text-emerald-800 break-all">{order.trackingNumber}</p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-[#9A9690] uppercase tracking-widest font-grotesk mb-1.5">
                  Courier Tracking Number *
                </label>
                <input
                  id="tracking-number-input"
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. C1001426132"
                  className="w-full px-3 py-2.5 font-mono text-sm text-[#1C1A16] bg-[#FDFBF7] border border-yellow-500/20 rounded-xl focus:outline-none focus:border-yellow-500 transition-colors placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#9A9690] uppercase tracking-widest font-grotesk mb-1.5">
                  Courier Tracking URL (Optional)
                </label>
                <input
                  id="tracking-url-input"
                  type="url"
                  value={trackingUrl}
                  onChange={(e) => setTrackingUrl(e.target.value)}
                  placeholder="https://www.dtdcexpress.com/..."
                  className="w-full px-3 py-2.5 text-sm text-[#1C1A16] bg-[#FDFBF7] border border-yellow-500/20 rounded-xl focus:outline-none focus:border-yellow-500 transition-colors placeholder-gray-400"
                />
                <p className="text-[9px] text-[#9A9690] mt-1 font-grotesk">Paste the full URL from your courier website. Customer will click this to track their package.</p>
              </div>
              {/* Two action buttons side by side */}
              <div className="grid grid-cols-1 gap-2">
                {/* Save to My Orders only */}
                <button
                  id="save-tracking-btn"
                  onClick={() => saveTracking(false)}
                  disabled={savingAction !== null}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-700 text-white py-3 rounded-xl font-bold uppercase text-xs tracking-wider hover:from-purple-500 hover:to-indigo-600 transition-all shadow-md disabled:opacity-50 font-grotesk flex items-center justify-center gap-2"
                >
                  {savingAction === "save" ? (
                    <>
                      <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Save to My Orders
                    </>
                  )}
                </button>

                {/* Save + Send WhatsApp combined */}
                <button
                  id="save-and-whatsapp-btn"
                  onClick={() => saveTracking(true)}
                  disabled={savingAction !== null}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3.5 rounded-xl font-bold uppercase text-xs tracking-wider hover:from-green-400 hover:to-emerald-500 transition-all shadow-md disabled:opacity-50 font-grotesk flex items-center justify-center gap-2"
                >
                  {savingAction === "whatsapp" ? (
                    <>
                      <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                      Saving & Opening WhatsApp...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" viewBox="0 0 32 32" fill="currentColor">
                        <path d="M16 0C7.163 0 0 7.163 0 16c0 2.822.738 5.472 2.027 7.773L0 32l8.418-2.006A15.94 15.94 0 0016 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm0 29.333a13.28 13.28 0 01-6.773-1.853l-.486-.29-4.997 1.191 1.259-4.866-.317-.5A13.268 13.268 0 012.667 16C2.667 8.636 8.636 2.667 16 2.667S29.333 8.636 29.333 16 23.364 29.333 16 29.333zm7.27-9.862c-.398-.199-2.356-1.163-2.72-1.295-.365-.133-.63-.199-.896.199-.265.397-1.028 1.295-1.26 1.561-.232.265-.464.298-.862.1-.398-.2-1.68-.619-3.2-1.975-1.183-1.056-1.982-2.36-2.214-2.758-.232-.398-.025-.613.174-.811.18-.178.398-.464.597-.696.199-.232.265-.398.398-.663.132-.265.066-.497-.034-.696-.1-.199-.896-2.16-1.228-2.958-.323-.778-.651-.672-.896-.685l-.763-.013c-.265 0-.696.1-.1061.497-.365.398-1.393 1.361-1.393 3.32s1.426 3.85 1.625 4.115c.199.265 2.807 4.285 6.803 6.011.951.41 1.693.655 2.272.839.954.303 1.823.26 2.51.158.766-.114 2.356-.963 2.688-1.894.332-.93.332-1.728.232-1.894-.1-.166-.365-.265-.763-.464z"/>
                      </svg>
                      Save & Send WhatsApp
                    </>
                  )}
                </button>
              </div>

              <p className="text-[9px] text-[#9A9690] text-center font-grotesk pt-1">
                "Save to My Orders" updates the customer's order page only.<br/>
                "Save & Send WhatsApp" does both at once.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-3xl shadow-card p-7 border border-yellow-500/12">
            <h2 className="text-xs font-bold text-yellow-800 uppercase tracking-widest mb-6 font-grotesk bg-yellow-500/8 -mx-7 -mt-7 px-7 py-3 border-b border-yellow-500/12 rounded-t-3xl">Logistics Control Panel</h2>

            <div className="text-center mb-8">
              <p className="text-[10px] text-[#9A9690] uppercase tracking-widest mb-3 font-bold font-grotesk">Current Order Status</p>
              <span
                className={`inline-block px-8 py-3.5 rounded-2xl text-lg font-black tracking-wider font-grotesk uppercase border-2 shadow-xs ${order.orderStatus === "Pending"
                    ? "bg-amber-50 text-amber-900 border-amber-300"
                    : order.orderStatus === "Packed"
                      ? "bg-blue-50 text-blue-900 border-blue-300"
                      : order.orderStatus === "Shipped"
                        ? "bg-purple-50 text-purple-900 border-purple-300"
                        : order.orderStatus === "Delivered"
                          ? "bg-emerald-50 text-emerald-900 border-emerald-300"
                          : order.orderStatus === "Returned"
                            ? "bg-rose-50 text-rose-900 border-rose-300"
                            : "bg-red-50 text-red-900 border-red-300"
                  }`}
              >
                {order.orderStatus === "Returned" ? "↩️ Returned" : order.orderStatus}
              </span>

              {order.orderStatus === "Returned" && (
                <div className="mt-4 p-4 bg-rose-50/80 border border-rose-200 rounded-2xl text-left space-y-1.5 font-inter">
                  <p className="text-[10px] text-rose-800 uppercase font-bold tracking-wider font-grotesk">Return Details</p>
                  <p className="text-xs text-rose-950 font-bold">Reason: <span className="font-normal">{order.returnReason || "Customer Return"}</span></p>
                  {order.returnNotes && (
                    <p className="text-xs text-rose-900">Notes: <span className="italic">{order.returnNotes}</span></p>
                  )}
                  {order.returnedAt && (
                    <p className="text-[11px] text-rose-700">
                      Returned Date: {new Date(order.returnedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  )}
                  <div className="pt-2">
                    <Link
                      to="/admin/returns"
                      className="text-xs font-bold text-rose-800 underline font-grotesk uppercase tracking-wider inline-flex items-center gap-1 hover:text-rose-950"
                    >
                      View in Return Orders Module →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3 font-grotesk">
              <p className="text-[10px] font-bold text-[#9A9690] uppercase tracking-widest mb-1 text-center">Execute Status Update</p>
              {order.orderStatus !== "Packed" && order.orderStatus !== "Cancelled" && order.orderStatus !== "Shipped" && order.orderStatus !== "Delivered" && order.orderStatus !== "Returned" && (
                <button
                  onClick={() => updateOrderStatus("Packed")}
                  disabled={updating}
                  className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 text-black py-3.5 rounded-xl font-bold uppercase text-xs tracking-wider hover:from-yellow-400 hover:to-amber-500 transition-all shadow-gold disabled:opacity-50"
                >
                  {updating ? "Processing..." : "Move to Packed State"}
                </button>
              )}
              {order.orderStatus === "Packed" && (
                <button
                  onClick={() => updateOrderStatus("Shipped")}
                  disabled={updating}
                  className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 text-black py-3.5 rounded-xl font-bold uppercase text-xs tracking-wider hover:from-yellow-400 hover:to-amber-500 transition-all shadow-gold disabled:opacity-50"
                >
                  {updating ? "Processing..." : "Mark as Dispatched (Shipped)"}
                </button>
              )}
              {order.orderStatus === "Shipped" && (
                <button
                  onClick={() => updateOrderStatus("Delivered")}
                  disabled={updating}
                  className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold uppercase text-xs tracking-wider hover:bg-emerald-500 transition-all shadow-md disabled:opacity-50"
                >
                  {updating ? "Processing..." : "Confirm Delivery"}
                </button>
              )}

              {/* Return Button (Available for Shipped or Delivered orders) */}
              {(order.orderStatus === "Shipped" || order.orderStatus === "Delivered") && (
                <button
                  onClick={() => {
                    const reason = window.prompt("Enter return reason (or leave default):", "Customer Requested Return");
                    if (reason !== null) {
                      updateOrderStatus("Returned", reason.trim() || "Customer Requested Return");
                    }
                  }}
                  disabled={updating}
                  className="w-full bg-rose-50 text-rose-800 border border-rose-300 py-3.5 rounded-xl font-bold uppercase text-xs tracking-wider hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-xs"
                >
                  {updating ? "Processing..." : "↩️ Process Order Return"}
                </button>
              )}

              {order.orderStatus !== "Delivered" && order.orderStatus !== "Cancelled" && order.orderStatus !== "Returned" && (
                <button
                  onClick={() => {
                    if (window.confirm("Are you sure you want to cancel this order?")) {
                      updateOrderStatus("Cancelled");
                    }
                  }}
                  disabled={updating}
                  className="w-full bg-red-50 text-red-700 border border-red-200 py-3.5 rounded-xl font-bold uppercase text-xs tracking-wider hover:bg-red-100 transition-all disabled:opacity-50"
                >
                  {updating ? "Processing..." : "Cancel Order"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}


