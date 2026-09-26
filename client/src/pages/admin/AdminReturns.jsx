import { API_URL } from "../../services/api";
import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "../../components/Alert";
import AdminLayout from "./AdminLayout";
import { openInvoice } from "../../services/invoiceGenerator";

export default function AdminReturns() {
  const [mode, setMode] = useState("all"); // "all" | "single" | "range"
  const [singleDate, setSingleDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { addToast } = useToast();

  // Local date helper (YYYY-MM-DD)
  const toLocalDateString = (d = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const fetchReturnData = useCallback(async (customStart = "", customEnd = "") => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      let url = `${API_URL}/admin/orders/returns/reports`;
      
      const effectiveStart = customStart || (mode === "single" ? singleDate : mode === "range" ? startDate : "");
      const effectiveEnd = customEnd || (mode === "single" ? singleDate : mode === "range" ? endDate : "");

      if (effectiveStart && effectiveEnd) {
        url += `?startDate=${effectiveStart}&endDate=${effectiveEnd}`;
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setReport(data.report);
      } else {
        addToast(data.message || "Failed to load return data", "error");
      }
    } catch (error) {
      console.error("Error fetching return reports:", error);
      addToast("Failed to load return reports", "error");
    } finally {
      setLoading(false);
    }
  }, [mode, singleDate, startDate, endDate, addToast]);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin/login");
      return;
    }
    const today = toLocalDateString();
    setSingleDate(today);
    setEndDate(today);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    setStartDate(toLocalDateString(thirtyDaysAgo));
    
    fetchReturnData();
  }, [navigate]);

  const applyPreset = (preset) => {
    const today = new Date();
    if (preset === "all") {
      setMode("all");
      fetchReturnData("", "");
    } else if (preset === "today") {
      const str = toLocalDateString(today);
      setMode("single");
      setSingleDate(str);
      fetchReturnData(str, str);
    } else if (preset === "yesterday") {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      const str = toLocalDateString(y);
      setMode("single");
      setSingleDate(str);
      fetchReturnData(str, str);
    } else if (preset === "last7") {
      const s = new Date(today);
      s.setDate(s.getDate() - 6);
      const startStr = toLocalDateString(s);
      const endStr = toLocalDateString(today);
      setMode("range");
      setStartDate(startStr);
      setEndDate(endStr);
      fetchReturnData(startStr, endStr);
    } else if (preset === "thisMonth") {
      const s = new Date(today.getFullYear(), today.getMonth(), 1);
      const startStr = toLocalDateString(s);
      const endStr = toLocalDateString(today);
      setMode("range");
      setStartDate(startStr);
      setEndDate(endStr);
      fetchReturnData(startStr, endStr);
    }
  };

  // ── CSV ("CV") Export Builder ──
  const downloadReturnCSV = () => {
    if (!report || !report.orders || report.orders.length === 0) {
      addToast("No returned orders to download", "error");
      return;
    }

    const returnedOrders = report.orders;

    // Helper: format date cleanly in IST
    const fmtDate = (dateStr) => {
      if (!dateStr) return "N/A";
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "N/A";
      const day = String(d.getDate()).padStart(2, "0");
      const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getMonth()];
      const year = d.getFullYear();
      let hrs = d.getHours();
      const mins = String(d.getMinutes()).padStart(2, "0");
      const ampm = hrs >= 12 ? "PM" : "AM";
      hrs = hrs % 12;
      hrs = hrs ? hrs : 12;
      const formattedHrs = String(hrs).padStart(2, "0");
      return `${day}-${month}-${year} ${formattedHrs}:${mins} ${ampm}`;
    };

    // Helper: clean string
    const cleanStr = (val) => {
      if (!val) return "N/A";
      return String(val).replace(/[\r\n]+/g, ", ").trim();
    };

    // Helper: escape cell
    const esc = (val) => `"${String(val ?? "N/A").replace(/"/g, '""')}"`;
    // Text formula escape for Excel
    const escText = (val) => {
      if (!val || val === "N/A") return '"N/A"';
      const clean = String(val).replace(/[\r\n]+/g, " ").replace(/"/g, '""').trim();
      return `="${clean}"`;
    };

    // Headers exactly as requested by user
    const headers = [
      "S.NO",
      "re-Invoice Number",
      "re-Order ID",
      "Customer Name",
      "Address",
      "Phone number",
      "District",
      "State",
      "Pincode",
      "Products Ordered",
      "Total Amount (₹)",
      "Order Date & Time",
      "Return Reason",
      "Returned Date & Time",
    ];

    const rows = returnedOrders.map((order, idx) => {
      const addr = order.customer?.address || {};
      const addressVal = [addr.door, addr.street, addr.landmark].filter(Boolean).join(", ") || addr.address || "N/A";
      const districtVal = addr.district || addr.city || "N/A";
      const stateVal = addr.state || "N/A";
      const pincodeVal = addr.pincode || addr.zipCode || "N/A";
      const rawOrderId = order.orderId || (order._id ? order._id.toString().slice(-8).toUpperCase() : "ORDER");
      
      const reInvoiceNo = `RET-KAH-${rawOrderId}`;
      const reOrderId = `re-${rawOrderId}`;

      const products = (order.items || [])
        .map(i => `${i.name || "Product"} (${i.size || "Standard"}) x${i.quantity || 1} @ ₹${i.price || 0}`)
        .join(" | ");

      return [
        esc(idx + 1),
        escText(reInvoiceNo),
        escText(reOrderId),
        esc(cleanStr(order.customer?.name)),
        esc(cleanStr(addressVal)),
        escText(order.customer?.phone),
        esc(cleanStr(districtVal)),
        esc(cleanStr(stateVal)),
        escText(pincodeVal),
        esc(cleanStr(products)),
        esc(order.totalAmount || 0),
        escText(fmtDate(order.createdAt)),
        esc(cleanStr(order.returnReason || "Customer Return")),
        escText(fmtDate(order.returnedAt || order.updatedAt)),
      ];
    });

    const BOM = "\uFEFF";
    const csvContent = BOM + [
      headers.map(esc).join(","),
      ...rows.map(r => r.join(",")),
    ].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateTag = mode === "all" ? "All_Time" : `${mode === "single" ? singleDate : `${startDate}_to_${endDate}`}`;
    link.setAttribute("href", url);
    link.setAttribute("download", `KAH_Returned_Orders_Report_${dateTag}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast(`Downloaded CSV with ${returnedOrders.length} returned order(s) ✅`, "success");
  };

  // Filter returned orders by search query
  const filteredOrders = (report?.orders || []).filter(order => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    if (order.orderId && order.orderId.toLowerCase().includes(q)) return true;
    if (order._id && order._id.toString().toLowerCase().includes(q)) return true;
    if (order.customer?.name && order.customer.name.toLowerCase().includes(q)) return true;
    if (order.customer?.phone && order.customer.phone.toLowerCase().includes(q)) return true;
    if (order.returnReason && order.returnReason.toLowerCase().includes(q)) return true;
    if (order.customer?.address?.district && order.customer.address.district.toLowerCase().includes(q)) return true;
    if (order.items && Array.isArray(order.items)) {
      if (order.items.some(i => i.name && i.name.toLowerCase().includes(q))) return true;
    }
    return false;
  });

  return (
    <AdminLayout>
      {/* Header section */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-3xl">↩️</span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1C1A16] font-soria">Return Orders & Reports</h1>
          </div>
          <p className="text-[#6C685F] text-sm font-inter">
            Monitor returned orders, analyze returned product bottle counts, and download return CSV reports
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/admin/orders"
            className="px-4 py-2 bg-white border border-yellow-500/25 rounded-xl text-xs font-bold font-grotesk text-yellow-900 hover:bg-yellow-500/10 transition-all uppercase tracking-wider shadow-xs"
          >
            ← Back to Orders
          </Link>
          {report && (
            <button
              onClick={downloadReturnCSV}
              className="px-4 py-2 bg-gradient-to-r from-rose-600 to-rose-700 text-white rounded-xl text-xs font-bold font-grotesk uppercase tracking-wider hover:from-rose-500 hover:to-rose-600 transition-all shadow-md flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download Return CSV
            </button>
          )}
        </div>
      </div>

      {/* Date Filter & Preset Controls */}
      <div className="bg-white rounded-3xl border border-yellow-500/15 p-6 mb-8 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-base font-bold text-[#1C1A16] font-grotesk uppercase tracking-wider flex items-center gap-2">
            <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Select Return Reporting Period
          </h2>

          {/* Presets */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: "All Time", preset: "all" },
              { label: "Today", preset: "today" },
              { label: "Yesterday", preset: "yesterday" },
              { label: "Last 7 Days", preset: "last7" },
              { label: "This Month", preset: "thisMonth" },
            ].map(({ label, preset }) => (
              <button
                key={preset}
                onClick={() => applyPreset(preset)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-grotesk uppercase tracking-wider transition-all border ${
                  mode === preset || (preset === "all" && mode === "all")
                    ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                    : "border-yellow-500/25 bg-yellow-500/8 text-yellow-900 hover:bg-yellow-500/20"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Mode Toggle & Date inputs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end pt-3 border-t border-yellow-500/10 font-inter">
          <div>
            <label className="block text-[10px] font-bold text-yellow-900 uppercase font-grotesk mb-1.5">Date Filter Mode</label>
            <div className="flex gap-1 p-1 bg-[#F5F2EB] rounded-xl border border-yellow-500/15">
              {[["all", "All Time"], ["single", "Single Day"], ["range", "Range"]].map(([val, lbl]) => (
                <button
                  key={val}
                  onClick={() => {
                    setMode(val);
                    if (val === "all") fetchReturnData("", "");
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold font-grotesk uppercase tracking-wider transition-all ${
                    mode === val ? "bg-rose-600 text-white shadow-xs" : "text-[#6C685F] hover:text-[#1C1A16]"
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          {mode === "single" && (
            <div>
              <label className="block text-[10px] font-bold text-yellow-900 uppercase font-grotesk mb-1.5">Select Date</label>
              <input
                type="date"
                value={singleDate}
                onChange={(e) => setSingleDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FDFBF7] border border-yellow-500/20 rounded-xl text-xs text-[#1C1A16] font-inter focus:outline-none focus:border-yellow-600"
              />
            </div>
          )}

          {mode === "range" && (
            <>
              <div>
                <label className="block text-[10px] font-bold text-yellow-900 uppercase font-grotesk mb-1.5">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FDFBF7] border border-yellow-500/20 rounded-xl text-xs text-[#1C1A16] font-inter focus:outline-none focus:border-yellow-600"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-yellow-900 uppercase font-grotesk mb-1.5">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FDFBF7] border border-yellow-500/20 rounded-xl text-xs text-[#1C1A16] font-inter focus:outline-none focus:border-yellow-600"
                />
              </div>
            </>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => fetchReturnData()}
              disabled={loading}
              className="flex-1 py-2.5 bg-gradient-to-r from-yellow-500 to-amber-600 text-black rounded-xl font-bold font-grotesk text-xs uppercase tracking-wider hover:from-yellow-400 hover:to-amber-500 transition-all shadow-gold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? "Loading..." : "Filter Results"}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center">
          <div className="animate-spin h-10 w-10 border-4 border-rose-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-[#6C685F] text-sm font-inter">Loading return order reports...</p>
        </div>
      ) : (
        <>
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-3xl border border-yellow-500/15 p-6 shadow-card flex items-center justify-between">
              <div>
                <p className="text-[10px] text-[#9A9690] uppercase tracking-widest font-bold font-grotesk">Total Returned Orders</p>
                <h3 className="text-3xl font-black text-rose-950 font-soria mt-1">
                  {report?.totalReturnedOrders || 0}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700 text-2xl font-bold">
                ↩️
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-yellow-500/15 p-6 shadow-card flex items-center justify-between">
              <div>
                <p className="text-[10px] text-[#9A9690] uppercase tracking-widest font-bold font-grotesk">Returned Bottle / Unit Count</p>
                <h3 className="text-3xl font-black text-yellow-900 font-soria mt-1">
                  {report?.totalReturnedUnits || 0} <span className="text-sm font-normal font-inter text-[#6C685F]">Units</span>
                </h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800 text-2xl">
                🧴
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-yellow-500/15 p-6 shadow-card flex items-center justify-between">
              <div>
                <p className="text-[10px] text-[#9A9690] uppercase tracking-widest font-bold font-grotesk">Total Returned Value</p>
                <h3 className="text-3xl font-black text-rose-900 font-soria mt-1">
                  ₹{(report?.totalReturnedAmount || 0).toFixed(0)}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700 text-2xl">
                💰
              </div>
            </div>
          </div>

          {/* ── RETURN ORDER REPORT MODULE: Product Breakdown with Counts (e.g. 100ml = 2 bottle) ── */}
          <div className="bg-white rounded-3xl border border-yellow-500/15 shadow-card p-6 sm:p-8 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-yellow-500/12 pb-4">
              <div>
                <h2 className="text-xl font-bold text-[#1C1A16] font-grotesk flex items-center gap-2.5">
                  <span className="w-2 h-6 bg-rose-500 rounded-full"></span>
                  Returned Products Breakdown (By Size & Unit Count)
                </h2>
                <p className="text-xs text-[#6C685F] font-inter mt-0.5">
                  Detailed count of returned products and bottle sizes (e.g., 100ml = 2 bottles, 200ml = 1 bottle)
                </p>
              </div>
              <div className="bg-rose-50 border border-rose-200 px-4 py-1.5 rounded-xl text-xs font-bold font-grotesk text-rose-800">
                {report?.returnedProductsBreakdown?.length || 0} Product Variant{(report?.returnedProductsBreakdown?.length !== 1) ? 's' : ''}
              </div>
            </div>

            {report?.returnedProductsBreakdown && report.returnedProductsBreakdown.length > 0 ? (
              <div className="space-y-4">
                {report.returnedProductsBreakdown.map((item, idx) => {
                  const maxUnits = report.returnedProductsBreakdown[0]?.quantity || 1;
                  const barWidth = Math.max((item.quantity / maxUnits) * 100, 8);

                  return (
                    <div
                      key={idx}
                      className="bg-[#FDFBF7] rounded-2xl border border-yellow-500/15 hover:border-rose-300 transition-all overflow-hidden"
                    >
                      <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-900 border border-rose-200 flex items-center justify-center font-bold text-sm font-grotesk shrink-0">
                            #{idx + 1}
                          </div>
                          <div>
                            <p className="font-bold text-[#1C1A16] uppercase text-sm font-grotesk">
                              {item.productName}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className="px-2.5 py-0.5 bg-yellow-500/15 border border-yellow-500/25 rounded-md text-[11px] font-bold font-mono text-yellow-900">
                                Size: {item.bottleSize}
                              </span>
                              <span className="text-xs font-bold text-rose-800 font-grotesk bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                👉 {item.bottleSize} = {item.quantity} {item.quantity === 1 ? "bottle" : "bottles"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                          <div className="bg-white border border-rose-200 rounded-xl px-4 py-2 text-center min-w-[120px]">
                            <p className="text-[9px] text-rose-700 uppercase tracking-wider font-bold font-grotesk">Returned Count</p>
                            <p className="text-xl font-black text-rose-900 font-soria leading-none mt-0.5">
                              {item.quantity} {item.quantity === 1 ? "Bottle" : "Bottles"}
                            </p>
                          </div>
                          <div className="bg-white border border-yellow-500/20 rounded-xl px-4 py-2 text-center min-w-[110px]">
                            <p className="text-[9px] text-[#9A9690] uppercase tracking-wider font-bold font-grotesk">Total Value</p>
                            <p className="text-xl font-bold text-yellow-900 font-soria leading-none mt-0.5">
                              ₹{item.totalAmount.toFixed(0)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="h-1 bg-rose-100">
                        <div
                          className="h-full rounded-r-full transition-all duration-700 bg-gradient-to-r from-rose-500 to-amber-600"
                          style={{ width: `${barWidth}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-[#6C685F]">
                <div className="text-4xl mb-2">📦</div>
                <p className="font-bold text-[#1C1A16] font-grotesk">No Returned Products in Selected Period</p>
                <p className="text-xs font-inter mt-1">Returned items breakdown will appear here once orders are marked as returned.</p>
              </div>
            )}
          </div>

          {/* ── Returned Orders History Table ── */}
          <div className="bg-white rounded-3xl border border-yellow-500/15 overflow-hidden shadow-card">
            <div className="p-6 bg-[#FDFBF7] border-b border-yellow-500/12 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-[#1C1A16] uppercase font-grotesk tracking-wider flex items-center gap-2">
                  <span>📋</span>
                  Returned Orders List ({filteredOrders.length})
                </h2>
              </div>
              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Order ID, Customer, Phone..."
                  className="w-full pl-9 pr-8 py-2 bg-white border border-yellow-500/20 rounded-xl text-xs text-[#1C1A16] placeholder-[#9A9690] focus:outline-none focus:border-yellow-600 font-inter"
                />
                <svg className="w-4 h-4 text-yellow-700 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-2.5 text-gray-400 hover:text-black">
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto custom-admin-table-scroll w-full">
              <table className="w-full min-w-[1100px] border-collapse font-inter text-sm">
                <thead className="bg-[#FDFBF7] border-b border-yellow-500/15">
                  <tr>
                    {["re-Order ID", "re-Invoice No", "Customer Name", "Contact / District", "Returned Items (Size & Qty)", "Amount", "Return Reason", "Return Date", "Actions"].map((h) => (
                      <th key={h} className="px-4 py-4 text-left text-[11px] font-bold text-yellow-900 uppercase tracking-wider font-grotesk whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-yellow-500/10">
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => {
                      const rawId = order.orderId || (order._id ? order._id.slice(-8).toUpperCase() : "—");
                      const reInvoice = `RET-KAH-${rawId}`;
                      const reOrder = `re-${rawId}`;

                      return (
                        <tr key={order._id} className="hover:bg-rose-50/20 transition-colors group">
                          {/* 1. re-Order ID */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="font-mono text-xs font-bold text-rose-900 bg-rose-100/70 px-2.5 py-1 rounded-lg border border-rose-200 inline-block">
                              {reOrder}
                            </span>
                          </td>

                          {/* 2. re-Invoice No */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="font-mono text-xs font-bold text-yellow-900 bg-yellow-500/10 px-2.5 py-1 rounded-lg border border-yellow-500/20 inline-block">
                              #{reInvoice}
                            </span>
                          </td>

                          {/* 3. Customer Name */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="font-bold text-[#1C1A16]">{order.customer?.name || "Customer"}</div>
                            {order.customer?.email && (
                              <div className="text-[11px] text-[#9A9690]">{order.customer.email}</div>
                            )}
                          </td>

                          {/* 4. Contact / District */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="font-mono text-xs font-semibold text-[#3a372e]">{order.customer?.phone || "—"}</div>
                            <div className="text-[11px] text-[#8A867E]">
                              {[order.customer?.address?.district, order.customer?.address?.state].filter(Boolean).join(", ") || "—"}
                            </div>
                          </td>

                          {/* 5. Returned Items */}
                          <td className="px-4 py-4">
                            <div className="space-y-1 min-w-[200px]">
                              {(order.items || []).map((item, idx) => (
                                <div key={idx} className="text-xs flex items-center justify-between gap-2 bg-[#FDFBF7] px-2 py-1 rounded border border-yellow-500/10">
                                  <span className="font-medium text-[#1C1A16]">{item.name}</span>
                                  <span className="font-bold text-rose-800 font-mono">
                                    {item.size || "Standard"} = {item.quantity} {item.quantity === 1 ? "bottle" : "bottles"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>

                          {/* 6. Amount & Payment/Refund Status */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="font-black text-rose-900 font-soria text-base">
                              ₹{(Number(order.totalAmount) || 0).toFixed(0)}
                            </div>
                            <span className={`text-[9px] font-bold uppercase font-grotesk px-2 py-0.5 rounded border ${
                              order.paymentStatus === "REFUNDED"
                                ? "text-purple-900 bg-purple-100 border-purple-200"
                                : order.paymentStatus === "PAID"
                                  ? "text-emerald-800 bg-emerald-50 border border-emerald-200"
                                  : "text-amber-800 bg-amber-50 border border-amber-200"
                            }`}>
                              {order.paymentStatus}
                            </span>
                          </td>

                          {/* 7. Return Reason */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="px-2.5 py-1 bg-rose-50 text-rose-800 border border-rose-200 rounded-lg text-xs font-bold font-grotesk inline-block">
                              {order.returnReason || "Customer Return"}
                            </span>
                          </td>

                          {/* 8. Return Date */}
                          <td className="px-4 py-4 whitespace-nowrap text-xs text-[#8A867E]">
                            <div className="font-medium text-[#4A473E]">
                              {new Date(order.returnedAt || order.updatedAt || order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                            </div>
                            <div className="text-[10px] text-[#9A9690] mt-0.5">
                              {new Date(order.returnedAt || order.updatedAt || order.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </td>

                          {/* 9. Actions */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Link
                                to={`/admin/orders/${order._id}`}
                                className="px-3 py-1.5 bg-[#FDFBF7] text-yellow-900 border border-yellow-500/25 rounded-xl hover:bg-yellow-500/15 transition-all font-bold text-[10px] font-grotesk uppercase tracking-wider"
                              >
                                View
                              </Link>
                              
                              {order.paymentStatus === "PAID" && (
                                <button
                                  onClick={async () => {
                                    const amt = window.prompt("Enter refund amount in ₹:", order.totalAmount);
                                    if (amt) {
                                      const note = window.prompt("Enter refund note / Txn ID:", "Product return amount refunded to customer");
                                      try {
                                        const token = localStorage.getItem("adminToken");
                                        const res = await fetch(`${API_URL}/admin/orders/${order._id}/refund`, {
                                          method: "PUT",
                                          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                                          body: JSON.stringify({ refundAmount: Number(amt), refundNote: note || "" })
                                        });
                                        const data = await res.json();
                                        if (data.success) {
                                          addToast("Refund processed successfully!", "success");
                                          fetchReturnData();
                                        } else {
                                          addToast(data.message || "Failed to process refund", "error");
                                        }
                                      } catch (err) {
                                        addToast("Refund error", "error");
                                      }
                                    }
                                  }}
                                  className="px-2.5 py-1.5 bg-purple-50 text-purple-800 border border-purple-200 rounded-xl hover:bg-purple-600 hover:text-white transition-all font-bold text-[10px] font-grotesk uppercase tracking-wider shadow-xs"
                                  title="Issue refund for this returned order"
                                >
                                  💸 Refund
                                </button>
                              )}

                              <button
                                onClick={() => openInvoice(order)}
                                className="px-3 py-1.5 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl hover:bg-rose-100 transition-all font-bold text-[10px] font-grotesk uppercase tracking-wider"
                                title="Download Invoice"
                              >
                                Invoice
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="px-6 py-16 text-center text-[#6C685F]">
                        <div className="flex flex-col items-center">
                          <span className="text-4xl mb-2">↩️</span>
                          <p className="text-base font-bold text-[#1C1A16] font-grotesk">No Returned Orders Found</p>
                          <p className="text-xs font-inter mt-1">
                            {searchQuery ? `No returned orders match "${searchQuery}"` : "There are currently no orders in returned status."}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
