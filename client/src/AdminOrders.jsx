import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import AdminLayout from "./AdminLayout";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();

  const fetchOrders = useCallback(async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch("https://kala-agalya-herbals.onrender.com/api/admin/orders", {
        headers: { 
          "Authorization": `Bearer ${token}` 
        },
      });
      const data = await response.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin/login");
      return;
    }
    fetchOrders();
  }, [navigate, fetchOrders]);

  const getStatusColor = (status) => {
    const colors = {
      Pending: "bg-orange-900/40 text-orange-400 border-orange-500/50",
      Packed: "bg-blue-900/40 text-blue-400 border-blue-500/50",
      Shipped: "bg-purple-900/40 text-purple-400 border-purple-500/50",
      Delivered: "bg-green-900/40 text-yellow-400 border-yellow-500/50",
      Cancelled: "bg-red-900/40 text-red-400 border-red-500/50",
    };
    return colors[status] || "bg-gray-800 text-gray-400 border-gray-600";
  };

  const getPaymentStatusColor = (status) => {
    return status === "PAID"
      ? "text-yellow-400 bg-yellow-900/20 border border-yellow-500/30"
      : "text-yellow-400 bg-yellow-900/30 border border-yellow-500/30";
  };

  const filteredOrders = orders.filter((order) => {
    if (filter === "all") return true;
    return order.orderStatus === filter;
  });

  const handleFastUpdate = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`https://kala-agalya-herbals.onrender.com/api/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ orderStatus: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setOrders(orders.map(o => o._id === orderId ? { ...o, orderStatus: newStatus } : o));
      }
    } catch (err) {
      console.error("Fast update failed", err);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">Order Management</h1>
        <p className="text-gray-500 text-sm">Monitor and process incoming customer orders</p>
      </div>

      {/* Filters */}
      <div className="bg-[#111a11] rounded-2xl border border-yellow-500/10 p-2 mb-8 flex flex-wrap gap-2">
          {["all", "Pending", "Packed", "Shipped", "Delivered"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-6 py-2 rounded-xl font-bold transition-all duration-300 relative overflow-hidden group text-xs uppercase tracking-wider ${
                filter === status
                  ? "text-black bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.4)]"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="relative z-10">
                {status} {status === "all" ? `(${orders.length})` : `(${orders.filter(o => o.orderStatus === status).length})`}
              </span>
            </button>
          ))}
      </div>

      {/* Orders Table */}
      <div className="bg-[#111a11] rounded-2xl border border-yellow-500/10 overflow-hidden shadow-2xl relative">
        {loading ? (
          <div className="p-20 text-center">
            <div className="animate-spin h-10 w-10 border-4 border-yellow-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Retrieving order history...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0d0b03] border-b border-yellow-900/10">
                <tr>
                  {["Order ID", "Customer Name", "Contact", "Amount", "Payment", "Status", "Fast Action", "Date", "Details"].map((head) => (
                    <th key={head} className={`px-6 py-4 text-left text-[10px] font-bold text-yellow-500/60 uppercase tracking-widest whitespace-nowrap ${head === 'Fast Action' ? 'text-center' : ''}`}>
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-yellow-900/10">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-yellow-500/[0.02] transition-colors group">
                      <td className="px-6 py-4 text-xs font-mono text-gray-500 group-hover:text-yellow-400 transition-colors whitespace-nowrap">
                        {order._id.slice(-8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-white whitespace-nowrap">
                        {order.customer.name}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-400 whitespace-nowrap">{order.customer.phone}</div>
                        <div className="text-[10px] text-gray-600 truncate max-w-[150px]">{order.customer.address.district}</div>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-white font-mono whitespace-nowrap">
                        ₹{order.totalAmount.toFixed(0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight border ${getPaymentStatusColor(
                            order.paymentStatus
                          )}`}
                        >
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight border ${getStatusColor(
                            order.orderStatus
                          )}`}
                        >
                          {order.orderStatus}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex flex-col items-center gap-2">
                          <label className="relative inline-flex items-center cursor-pointer group">
                            <input 
                              type="checkbox" 
                              className="sr-only peer" 
                              checked={order.orderStatus === "Shipped" || order.orderStatus === "Delivered"}
                              onChange={(e) => handleFastUpdate(order._id, e.target.checked ? "Shipped" : "Pending")}
                              disabled={order.orderStatus === "Delivered" || order.orderStatus === "Cancelled"}
                            />
                            <div className="w-11 h-6 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600 peer-disabled:opacity-50"></div>
                            <span className="ml-3 text-[9px] font-bold text-gray-500 uppercase tracking-widest group-hover:text-white transition-colors w-16 text-center">
                              Dispatched
                            </span>
                          </label>
                          
                          {(order.orderStatus === "Shipped") && (
                            <button
                               onClick={() => handleFastUpdate(order._id, "Delivered")}
                               className="px-3 py-1 bg-green-500/10 text-green-500 border border-green-500/30 rounded text-[9px] font-bold uppercase tracking-widest hover:bg-green-500/20 transition-all w-24 text-center mt-1"
                            >
                               Mark Delivered
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap border-l border-yellow-900/10">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Link
                          to={`/admin/orders/${order._id}`}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#0d0b03] text-gray-400 border border-yellow-900/30 rounded-lg hover:border-yellow-500/50 hover:text-yellow-400 transition-all font-bold text-[9px] uppercase tracking-wider"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-20 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <svg className="w-16 h-16 text-gray-800 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                        <p className="text-xl font-bold text-white mb-1">No Orders Found</p>
                        <p className="text-sm">Try selecting a different status filter</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}


