import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "./Alert";
import AdminLayout from "./AdminLayout";

export default function AdminReports() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin/login");
      return;
    }

    // Set default dates (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    setEndDate(today.toISOString().split("T")[0]);
    setStartDate(thirtyDaysAgo.toISOString().split("T")[0]);
  }, [navigate]);

  const fetchReport = async () => {
    if (!startDate || !endDate) {
      addToast("Please select both start and end dates", "error");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(
        `https://kala-agalya-herbals.onrender.com/api/admin/orders/reports/data?startDate=${startDate}&endDate=${endDate}`,
        { 
          headers: { 
            "Authorization": `Bearer ${token}` 
          } 
        }
      );
      const data = await response.json();
      if (data.success) {
        setReport(data.report);
      } else {
        addToast(data.message || "Failed to fetch data", "error");
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      addToast("Failed to fetch report", "error");
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = () => {
    if (!report || !report.orders || report.orders.length === 0) {
      addToast("No data to download", "error");
      return;
    }

    // Create CSV content
    const headers = [
      "Order ID",
      "Customer Name",
      "Phone",
      "Address",
      "District",
      "State",
      "Pincode",
      "Products",
      "Total Amount",
      "Payment Status",
      "Order Status",
      "Order Date",
    ];

    const rows = report.orders.map((order) => {
      const products = order.items
        .map((item) => `${item.name} (${item.size}) x${item.quantity}`)
        .join("; ");

      const address = `${order.customer.address.door}, ${order.customer.address.street}, ${order.customer.address.landmark || ""}`;

      return [
        order._id,
        order.customer.name,
        order.customer.phone,
        address,
        order.customer.address.district,
        order.customer.address.state,
        order.customer.address.pincode,
        products,
        order.totalAmount,
        order.paymentStatus,
        order.orderStatus,
        new Date(order.createdAt).toLocaleDateString(),
      ];
    });

    // Convert to CSV
    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `orders_${startDate}_to_${endDate}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast("Report downloaded successfully", "success");
  };

  return (
    <AdminLayout>
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">Sales Analytics</h1>
        <p className="text-gray-500 text-sm">Generate detailed reports and track performance metrics</p>
      </div>

      {/* Date Range Selector */}
      <div className="bg-[#111a11] rounded-2xl border border-yellow-500/10 shadow-lg p-6 sm:p-8 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 blur-[100px] rounded-full pointer-events-none"></div>
        
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
           <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
           Select Report Period
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-[10px] font-bold text-yellow-500 uppercase tracking-widest mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-3 bg-[#0d0b03] border border-yellow-900/40 rounded-xl focus:ring-1 focus:ring-yellow-500/50 outline-none text-white transition-all shadow-inner text-sm"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-yellow-500 uppercase tracking-widest mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-3 bg-[#0d0b03] border border-yellow-900/40 rounded-xl focus:ring-1 focus:ring-yellow-500/50 outline-none text-white transition-all shadow-inner text-sm"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchReport}
              disabled={loading}
              className="w-full py-3.5 bg-yellow-600 text-black rounded-xl font-bold hover:bg-yellow-500 hover:shadow-[0_0_20px_rgba(234,179,8,0.4)] transition-all uppercase tracking-wider relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed text-xs"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Generate Report
                  </>
                )}
              </span>
            </button>
          </div>
        </div>
      </div>

      {report && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="bg-[#111a11] border border-yellow-500/20 rounded-2xl shadow-xl p-6 sm:p-8 relative overflow-hidden group hover:border-yellow-500/40 transition-colors">
              <div className="absolute right-0 top-0 w-32 h-32 bg-yellow-500/10 blur-[50px] rounded-full group-hover:bg-yellow-500/20 transition-all duration-500"></div>
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Total Orders</p>
                  <h3 className="text-4xl font-black mt-2 text-white group-hover:text-yellow-400 transition-colors">{report.totalOrders}</h3>
                </div>
                <div className="bg-green-900/20 text-yellow-500 rounded-2xl p-4 border border-yellow-500/10">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-[#111a11] border border-yellow-500/20 rounded-2xl shadow-xl p-6 sm:p-8 relative overflow-hidden group hover:border-yellow-500/40 transition-colors">
               <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/10 blur-[50px] rounded-full group-hover:bg-emerald-500/20 transition-all duration-500"></div>
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Total Revenue</p>
                  <h3 className="text-4xl font-black mt-2 text-white group-hover:text-emerald-400 transition-colors">₹{report.totalSales.toFixed(0)}</h3>
                </div>
                <div className="bg-emerald-900/20 text-emerald-500 rounded-2xl p-4 border border-emerald-500/10">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Best Selling Products */}
          <div className="bg-[#111a11] border border-yellow-500/10 rounded-2xl shadow-lg p-6 sm:p-8 mb-8">
            <h2 className="text-xl font-bold text-white tracking-wide mb-6 flex items-center gap-3">
              <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              Top Performing Products
            </h2>
            <div className="space-y-4">
              {report.bestSelling && report.bestSelling.length > 0 ? (
                report.bestSelling.map((product, index) => {
                  // Extract size from name like "HERBAL OIL - 100ML"
                  const nameParts = product.name.split(" - ");
                  const productName = nameParts[0] || product.name;
                  const bottleSize = nameParts[1] || "";
                  const maxQty = report.bestSelling[0]?.quantity || 1;
                  const barWidth = Math.max((product.quantity / maxQty) * 100, 8);

                  return (
                    <div
                      key={index}
                      className="bg-black/40 rounded-xl border border-yellow-900/20 hover:border-yellow-500/30 transition-all hover:bg-black/60 group overflow-hidden"
                    >
                      <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        {/* Rank + Name */}
                        <div className="flex items-center gap-5">
                          <div className={`w-11 h-11 rounded-lg flex items-center justify-center font-black text-sm shadow-inner shrink-0 ${index === 0 ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' : index === 1 ? 'bg-gray-400/20 text-gray-400 border border-gray-400/30' : index === 2 ? 'bg-orange-700/20 text-orange-600 border border-orange-700/30' : 'bg-green-900/20 text-yellow-500 border border-yellow-500/20'}`}>
                            #{index + 1}
                          </div>
                          <div>
                            <p className="font-bold text-white group-hover:text-yellow-400 transition-colors uppercase text-sm">{productName}</p>
                            {bottleSize && (
                              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-500/50"></span>
                                Bottle Size: <span className="text-yellow-500/80 font-bold">{bottleSize}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-6 w-full sm:w-auto">
                          {/* Pieces Sold */}
                          <div className="bg-[#0d0b03] border border-yellow-900/30 rounded-xl px-5 py-3 text-center min-w-[100px]">
                            <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-1">Pieces Sold</p>
                            <p className="text-2xl font-black text-yellow-400 font-mono leading-none">{product.quantity}</p>
                          </div>
                          {/* Revenue */}
                          <div className="bg-[#0d0b03] border border-emerald-900/30 rounded-xl px-5 py-3 text-center min-w-[120px]">
                            <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-1">Revenue</p>
                            <p className="text-2xl font-black text-emerald-400 font-mono leading-none">₹{product.revenue.toFixed(0)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="h-1 bg-black/60">
                        <div
                          className={`h-full rounded-r-full transition-all duration-700 ${index === 0 ? 'bg-gradient-to-r from-yellow-600 to-yellow-400' : index === 1 ? 'bg-gradient-to-r from-gray-600 to-gray-400' : 'bg-gradient-to-r from-yellow-900 to-yellow-600'}`}
                          style={{ width: `${barWidth}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-gray-500 py-8 italic text-sm">No sales data available for this period.</p>
              )}
            </div>
          </div>

          {/* Export Button */}
          <div className="bg-[#111a11] border border-yellow-500/10 rounded-2xl shadow-lg p-6 sm:p-8 mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <h2 className="text-xl font-bold text-white mb-2">Export Data</h2>
                <p className="text-sm text-gray-400">
                  Full history from <span className="text-yellow-400 font-bold">{new Date(startDate).toLocaleDateString()}</span> to{" "}
                  <span className="text-yellow-400 font-bold">{new Date(endDate).toLocaleDateString()}</span>
                </p>
              </div>
              <button
                onClick={downloadExcel}
                className="bg-gray-800 text-white px-8 py-4 rounded-xl font-bold hover:bg-yellow-600 hover:text-black transition-all transform hover:scale-105 flex items-center gap-3 shadow-lg border border-gray-700 hover:border-yellow-500 group text-xs uppercase tracking-widest w-full md:w-auto justify-center"
              >
                <svg className="w-5 h-5 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download CSV
              </button>
          </div>

          {/* Table */}
          <div className="bg-[#111a11] border border-yellow-500/10 rounded-2xl shadow-lg overflow-hidden relative">
            <div className="px-6 sm:px-8 py-6 bg-black/20 border-b border-yellow-900/30">
              <h2 className="text-sm font-bold text-white uppercase tracking-widest">Detailed Order History</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#000]/40">
                  <tr>
                    {["Order ID", "Customer", "Amount", "Status", "Date"].map((head) => (
                        <th key={head} className="px-6 sm:px-8 py-5 text-left text-[10px] font-bold text-yellow-500/70 uppercase tracking-widest whitespace-nowrap">{head}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-yellow-900/10">
                  {report.orders.map((order) => (
                    <tr key={order._id} className="hover:bg-yellow-500/[0.02] transition-colors group">
                      <td className="px-6 sm:px-8 py-5 text-xs font-mono text-gray-500 group-hover:text-yellow-400 transition-colors whitespace-nowrap">
                        {order._id.slice(-8).toUpperCase()}
                      </td>
                      <td className="px-6 sm:px-8 py-5 text-sm text-gray-300 font-bold whitespace-nowrap">{order.customer.name}</td>
                      <td className="px-6 sm:px-8 py-5 text-sm font-bold text-white font-mono whitespace-nowrap">
                        ₹{order.totalAmount.toFixed(0)}
                      </td>
                      <td className="px-6 sm:px-8 py-5 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${
                            order.orderStatus === "Delivered"
                              ? "bg-green-500/10 text-green-500"
                              : order.orderStatus === "Cancelled"
                              ? "bg-red-500/10 text-red-500"
                              : "bg-blue-500/10 text-blue-500"
                          }`}
                        >
                          {order.orderStatus}
                        </span>
                      </td>
                      <td className="px-6 sm:px-8 py-5 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!report && !loading && (
        <div className="bg-[#111a11] rounded-3xl border border-dashed border-yellow-500/20 p-16 sm:p-24 text-center mt-8">
          <svg className="w-16 h-16 text-gray-800 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-2xl font-bold text-white mb-2">Analytics Ready</h3>
          <p className="text-gray-500 text-sm">Adjust your date range above and click "Generate Report" to see results.</p>
        </div>
      )}
    </AdminLayout>
  );
}


