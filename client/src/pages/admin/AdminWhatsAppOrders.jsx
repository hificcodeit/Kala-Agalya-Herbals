import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { API_URL } from "../../services/api";
import { useToast } from "../../components/Alert";
import AdminLayout from "./AdminLayout";
import WhatsAppBulkImportModal from "./WhatsAppBulkImportModal";
import { openInvoice, openBatchInvoices } from "../../services/invoiceGenerator";
import { openShippingLabels } from "../../services/shippingLabelGenerator";

export default function AdminWhatsAppOrders() {
  const [orders, setOrders] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    shippedOrders: 0
  });

  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalMode, setModalMode] = useState("create"); // 'create' | 'edit'
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [viewTab, setViewTab] = useState("active"); // "active" | "returns"
  const [printFilter, setPrintFilter] = useState("all"); // "all" | "unprinted" | "printed"
  const [invoiceFilter, setInvoiceFilter] = useState("all"); // "all" | "sent" | "pending"
  const [openActionMenuId, setOpenActionMenuId] = useState(null);

  // Return modal state
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnTargetOrder, setReturnTargetOrder] = useState(null);
  const [returnFormData, setReturnFormData] = useState({
    returnType: "Refund",
    refundAmount: 0,
    refundStatus: "Pending",
    reorderNotes: "",
    returnReason: "Customer Refused / RTO",
    returnNotes: ""
  });
  const [submittingReturn, setSubmittingReturn] = useState(false);

  // Form state for Create / Edit
  const [formData, setFormData] = useState({
    customerName: "",
    mobileNumber: "",
    whatsappNumber: "",
    email: "",
    address: "",
    door: "",
    street: "",
    district: "",
    state: "Tamil Nadu",
    pincode: "",
    shippingAmount: 0,
    orderStatus: "Pending",
    paymentStatus: "PAID",
    paymentMethod: "WhatsApp / Direct UPI",
    invoiceNumber: "",
    notes: "",
    orderDate: new Date().toISOString().slice(0, 10),
    items: [
      {
        productId: "",
        name: "",
        size: "Standard",
        price: 0,
        quantity: 1,
        total: 0
      }
    ]
  });

  const [formSubmitting, setFormSubmitting] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useToast();

  // 1. Fetch WhatsApp Orders from API
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      if (!token) {
        navigate("/admin/login");
        return;
      }

      const res = await fetch(`${API_URL}/admin/whatsapp-orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders || []);
        if (data.stats) setStats(data.stats);
      } else {
        addToast(data.message || "Failed to load WhatsApp orders", "error");
      }
    } catch (err) {
      console.error("Error loading WhatsApp orders:", err);
      addToast("Network error loading WhatsApp orders", "error");
    } finally {
      setLoading(false);
    }
  }, [navigate, addToast]);

  // 2. Fetch active store products for item dropdowns
  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/products`);
      const data = await res.json();
      if (data.success && Array.isArray(data.products)) {
        setProductsList(data.products);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, [fetchOrders, fetchProducts]);

  // Global click listener to dismiss any open Actions dropdown menu
  useEffect(() => {
    const handleGlobalClick = () => setOpenActionMenuId(null);
    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, []);

  // Clean 10-digit phone
  const clean10Digits = (phone) => {
    if (!phone) return "";
    const digits = String(phone).replace(/\D/g, "");
    if (digits.length === 10) return digits;
    if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
    if (digits.length > 10) return digits.slice(-10);
    return digits;
  };

  // Split active orders vs returned orders
  const activeOrders = useMemo(() => {
    return orders.filter((o) => o.orderStatus !== "Returned");
  }, [orders]);

  const returnedOrders = useMemo(() => {
    return orders.filter((o) => o.orderStatus === "Returned");
  }, [orders]);

  // Filtered orders list based on current active viewTab (active vs returns) & filters
  const filteredOrders = useMemo(() => {
    const baseList = viewTab === "returns" ? returnedOrders : activeOrders;

    return baseList.filter((o) => {
      // Status filter (when in active orders tab)
      if (viewTab === "active" && statusFilter !== "all" && o.orderStatus !== statusFilter) {
        return false;
      }

      // Print filter
      if (printFilter === "unprinted" && o.isPrinted) return false;
      if (printFilter === "printed" && !o.isPrinted) return false;

      // WhatsApp Invoice filter
      if (invoiceFilter === "sent" && !o.invoiceSent) return false;
      if (invoiceFilter === "pending" && o.invoiceSent) return false;

      // Search query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();

      const name = o.customer?.name?.toLowerCase() || "";
      const mob = o.customer?.mobileNumber || "";
      const wa = o.customer?.whatsappNumber || "";
      const addr = (o.customer?.address?.fullAddress || "").toLowerCase();
      const oId = (o.orderId || "").toLowerCase();
      const inv = (o.invoiceNumber || "").toLowerCase();
      const items = (o.items || []).map((i) => i.name.toLowerCase()).join(" ");

      return (
        name.includes(q) ||
        mob.includes(q) ||
        wa.includes(q) ||
        addr.includes(q) ||
        oId.includes(q) ||
        inv.includes(q) ||
        items.includes(q)
      );
    });
  }, [viewTab, activeOrders, returnedOrders, statusFilter, printFilter, invoiceFilter, searchQuery]);

  // Open Create Order Modal
  const handleOpenCreateModal = () => {
    setModalMode("create");
    setSelectedOrder(null);
    const year = new Date().getFullYear();
    const suggestedInv = `KAH-WA-${year}-${Math.floor(100000 + Math.random() * 900000)}`;

    const firstProduct = productsList[0];
    const firstSize = firstProduct?.sizes?.[0];
    const initialPrice = firstSize?.offerPrice || firstSize?.price || 0;

    setFormData({
      customerName: "",
      mobileNumber: "",
      whatsappNumber: "",
      email: "",
      address: "",
      door: "",
      street: "",
      district: "",
      state: "Tamil Nadu",
      pincode: "",
      shippingAmount: 0,
      orderStatus: "Pending",
      paymentStatus: "PAID",
      paymentMethod: "WhatsApp / Direct UPI",
      invoiceNumber: suggestedInv,
      notes: "",
      orderDate: new Date().toISOString().slice(0, 10),
      items: [
        {
          productId: firstProduct?._id || "",
          name: firstProduct?.name || "Herbal Hair Oil",
          size: firstSize?.size || "200ml",
          price: initialPrice,
          quantity: 1,
          total: initialPrice
        }
      ]
    });
    setIsAddEditModalOpen(true);
  };

  // Open Edit Order Modal
  const handleOpenEditModal = (order) => {
    setModalMode("edit");
    setSelectedOrder(order);

    const addr = order.customer?.address || {};
    const fullAddr =
      typeof addr === "string"
        ? addr
        : addr.fullAddress || [addr.door, addr.street, addr.district, addr.state, addr.pincode].filter(Boolean).join(", ");

    setFormData({
      customerName: order.customer?.name || "",
      mobileNumber: order.customer?.mobileNumber || "",
      whatsappNumber: order.customer?.whatsappNumber || order.customer?.mobileNumber || "",
      email: order.customer?.email || "",
      address: fullAddr,
      door: addr.door || "",
      street: addr.street || "",
      district: addr.district || "",
      state: addr.state || "Tamil Nadu",
      pincode: addr.pincode || "",
      shippingAmount: order.shippingAmount || 0,
      orderStatus: order.orderStatus || "Pending",
      paymentStatus: order.paymentStatus || "PAID",
      paymentMethod: order.paymentMethod || "WhatsApp / Direct UPI",
      invoiceNumber: order.invoiceNumber || "",
      notes: order.notes || "",
      orderDate: order.orderDate ? new Date(order.orderDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      items: (order.items || []).map((i) => ({
        productId: i.productId || "",
        name: i.name,
        size: i.size || "Standard",
        price: i.price || 0,
        quantity: i.quantity || 1,
        total: (i.price || 0) * (i.quantity || 1)
      }))
    });
    setIsAddEditModalOpen(true);
  };

  // Open View Order Modal
  const handleOpenViewModal = (order) => {
    setSelectedOrder(order);
    setIsViewModalOpen(true);
  };

  // Open Delete Confirmation Modal
  const handleOpenDeleteModal = (order) => {
    setSelectedOrder(order);
    setIsDeleteModalOpen(true);
  };

  // Dynamic Product Selection handler in Add/Edit modal
  const handleProductSelect = (index, productId) => {
    const updatedItems = [...formData.items];
    const product = productsList.find((p) => p._id === productId);

    if (product) {
      const defaultSize = product.sizes?.[0];
      const price = defaultSize?.offerPrice || defaultSize?.price || 0;
      const qty = updatedItems[index].quantity || 1;

      updatedItems[index] = {
        productId: product._id,
        name: product.name,
        size: defaultSize?.size || "Standard",
        price,
        quantity: qty,
        total: price * qty
      };
    } else {
      updatedItems[index] = {
        ...updatedItems[index],
        productId: "",
        name: "Custom Herbal Item"
      };
    }
    setFormData({ ...formData, items: updatedItems });
  };

  // Handle Size change for an item
  const handleSizeSelect = (index, newSize) => {
    const updatedItems = [...formData.items];
    const item = updatedItems[index];
    const product = productsList.find((p) => p._id === item.productId);

    if (product) {
      const sizeObj = product.sizes?.find((s) => s.size === newSize);
      const price = sizeObj ? (sizeObj.offerPrice || sizeObj.price || 0) : item.price;
      const qty = item.quantity || 1;
      updatedItems[index] = {
        ...item,
        size: newSize,
        price,
        total: price * qty
      };
    } else {
      updatedItems[index] = { ...item, size: newSize };
    }
    setFormData({ ...formData, items: updatedItems });
  };

  // Update item field (quantity, price, name)
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    const current = updatedItems[index];
    let nextVal = value;

    if (field === "quantity") {
      nextVal = Math.max(1, parseInt(value, 10) || 1);
    } else if (field === "price") {
      nextVal = Math.max(0, parseFloat(value) || 0);
    }

    current[field] = nextVal;
    current.total = (current.price || 0) * (current.quantity || 1);
    updatedItems[index] = current;
    setFormData({ ...formData, items: updatedItems });
  };

  // Add Item Row
  const handleAddItemRow = () => {
    const firstProduct = productsList[0];
    const firstSize = firstProduct?.sizes?.[0];
    const price = firstSize?.offerPrice || firstSize?.price || 0;

    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          productId: firstProduct?._id || "",
          name: firstProduct?.name || "Herbal Care Product",
          size: firstSize?.size || "Standard",
          price,
          quantity: 1,
          total: price
        }
      ]
    });
  };

  // Remove Item Row
  const handleRemoveItemRow = (index) => {
    if (formData.items.length <= 1) {
      addToast("Order must contain at least one item", "error");
      return;
    }
    const filtered = formData.items.filter((_, idx) => idx !== index);
    setFormData({ ...formData, items: filtered });
  };

  // Computed totals for the form
  const subtotalAmount = formData.items.reduce((acc, curr) => acc + (curr.total || 0), 0);
  const totalOrderAmount = subtotalAmount + (Number(formData.shippingAmount) || 0);

  // Submit Add or Edit Form
  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!formData.customerName.trim()) {
      addToast("Customer name is required", "error");
      return;
    }

    const cleanMobile = clean10Digits(formData.mobileNumber);
    if (!cleanMobile || cleanMobile.length !== 10) {
      addToast("Valid 10-digit mobile number is required", "error");
      return;
    }

    const cleanWhatsApp = clean10Digits(formData.whatsappNumber || formData.mobileNumber);
    if (!cleanWhatsApp || cleanWhatsApp.length !== 10) {
      addToast("Valid 10-digit WhatsApp number is required", "error");
      return;
    }

    const fullAddress =
      formData.address.trim() ||
      [formData.door, formData.street, formData.district, formData.state, formData.pincode].filter(Boolean).join(", ");

    if (!fullAddress) {
      addToast("Customer address is required", "error");
      return;
    }

    if (formData.items.length === 0) {
      addToast("Please add at least one product", "error");
      return;
    }

    setFormSubmitting(true);
    try {
      const token = localStorage.getItem("adminToken");
      const url =
        modalMode === "create"
          ? `${API_URL}/admin/whatsapp-orders`
          : `${API_URL}/admin/whatsapp-orders/${selectedOrder._id}`;
      const method = modalMode === "create" ? "POST" : "PUT";

      const payload = {
        customer: {
          name: formData.customerName.trim(),
          mobileNumber: cleanMobile,
          whatsappNumber: cleanWhatsApp,
          email: formData.email.trim(),
          address: {
            door: formData.door,
            street: formData.street,
            district: formData.district,
            state: formData.state,
            pincode: formData.pincode,
            fullAddress
          }
        },
        items: formData.items,
        totalAmount: totalOrderAmount,
        shippingAmount: Number(formData.shippingAmount) || 0,
        orderStatus: formData.orderStatus,
        paymentStatus: formData.paymentStatus,
        paymentMethod: formData.paymentMethod,
        invoiceNumber: formData.invoiceNumber.trim(),
        notes: formData.notes,
        orderDate: formData.orderDate ? new Date(formData.orderDate) : new Date()
      };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        addToast(
          modalMode === "create" ? "WhatsApp order created successfully!" : "Order updated successfully!",
          "success"
        );
        setIsAddEditModalOpen(false);
        fetchOrders();
      } else {
        addToast(data.message || "Failed to save order", "error");
      }
    } catch (err) {
      console.error("Error submitting order form:", err);
      addToast("Server error saving WhatsApp order", "error");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete Order confirmed
  const handleConfirmDelete = async () => {
    if (!selectedOrder) return;
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_URL}/admin/whatsapp-orders/${selectedOrder._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        addToast("Order deleted successfully", "success");
        setIsDeleteModalOpen(false);
        setSelectedOrder(null);
        fetchOrders();
      } else {
        addToast(data.message || "Failed to delete order", "error");
      }
    } catch (err) {
      console.error("Error deleting order:", err);
      addToast("Server error deleting order", "error");
    }
  };

  // Fast status update from view popup or table
  const handleUpdateStatus = async (orderId, newStatus) => {
    if (!orderId || !newStatus) return;
    setUpdatingStatus(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_URL}/admin/whatsapp-orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ orderStatus: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        addToast(`Order status updated to "${newStatus}"`, "success");
        setSelectedOrder((prev) => (prev ? { ...prev, orderStatus: newStatus } : null));
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, orderStatus: newStatus } : o))
        );
        fetchOrders();
      } else {
        addToast(data.message || "Failed to update status", "error");
      }
    } catch (err) {
      console.error("Error updating status:", err);
      addToast("Network error updating status", "error");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Batch selection helpers
  const isAllSelected =
    filteredOrders.length > 0 &&
    filteredOrders.every((o) => selectedOrderIds.includes(o._id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders.map((o) => o._id));
    }
  };

  const handleToggleSelectOrder = (id) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Fast tracking update (invoiceSent or isPrinted)
  const handleUpdateTracking = async (orderId, updates) => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_URL}/admin/whatsapp-orders/${orderId}/tracking`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (data.success && data.order) {
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, ...data.order } : o))
        );
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder((prev) => ({ ...prev, ...data.order }));
        }
      }
    } catch (err) {
      console.error("Error updating tracking status:", err);
    }
  };

  // Batch update tracking
  const handleBatchUpdateTracking = async (orderIds, updates) => {
    try {
      const token = localStorage.getItem("adminToken");
      await fetch(`${API_URL}/admin/whatsapp-orders/batch-tracking`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ orderIds, ...updates })
      });
      setOrders((prev) =>
        prev.map((o) => (orderIds.includes(o._id) ? { ...o, ...updates } : o))
      );
    } catch (err) {
      console.error("Error batch updating tracking:", err);
    }
  };

  const handlePrintSelected = async () => {
    const selectedOrders = orders.filter((o) => selectedOrderIds.includes(o._id));
    if (selectedOrders.length === 0) {
      addToast("Please select at least one order to print", "error");
      return;
    }
    openBatchInvoices(selectedOrders);
    await handleBatchUpdateTracking(selectedOrderIds, { isPrinted: true });
    addToast(`Opening batch print view for ${selectedOrders.length} invoice(s)... 🖨️`, "info");
  };

  const handlePrintLabelsSelected = async () => {
    const selectedOrders = orders.filter((o) => selectedOrderIds.includes(o._id));
    if (selectedOrders.length === 0) {
      addToast("Please select at least one order to print labels", "error");
      return;
    }
    openShippingLabels(selectedOrders);
    await handleBatchUpdateTracking(selectedOrderIds, { isPrinted: true });
    addToast(`Opening 152×102mm thermal shipping labels for ${selectedOrders.length} order(s)... 📦`, "info");
  };

  const handlePrintSingleShippingLabel = async (order) => {
    openShippingLabels(order);
    await handleUpdateTracking(order._id, { isPrinted: true });
  };

  const handlePrintSingleInvoice = async (order) => {
    openInvoice(order);
    await handleUpdateTracking(order._id, { isPrinted: true });
  };

  // ── WhatsApp Messaging Function with 20-Minute Secure Expiring PDF Link ──
  const handleSendWhatsAppMessage = async (order) => {
    if (!order) return;
    const phone = clean10Digits(order.customer?.whatsappNumber || order.customer?.mobileNumber);
    if (!phone) {
      addToast("No valid WhatsApp phone number found for this customer", "error");
      return;
    }

    // Open blank window immediately to prevent popup blocker during async fetch
    const waWin = window.open("about:blank", "_blank");

    try {
      const token = localStorage.getItem("adminToken");
      let shareToken = "";
      try {
        const res = await fetch(`${API_URL}/admin/whatsapp-orders/${order._id}/share-token`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.token) {
          shareToken = data.token;
        }
      } catch (err) {
        console.warn("Could not obtain expiring share token:", err);
      }

      const waPhone = phone.startsWith("91") ? phone : `91${phone}`;
      const customerName = order.customer?.name || "Valued Customer";
      const invoiceNo = order.invoiceNumber || `KAH-WA-${order.orderId}`;
      const orderDate = new Date(order.orderDate || order.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });

      const itemsSummary = (order.items || [])
        .map(
          (i, idx) =>
            `  ${idx + 1}. *${i.name}* (${i.size || "Standard"}) x${i.quantity || 1} - ₹${((i.price || 0) * (i.quantity || 1)).toFixed(0)}`
        )
        .join("\n");

      const fullAddr =
        order.customer?.address?.fullAddress ||
        [
          order.customer?.address?.door,
          order.customer?.address?.street,
          order.customer?.address?.district,
          order.customer?.address?.state,
          order.customer?.address?.pincode
        ]
          .filter(Boolean)
          .join(", ") ||
        "Provided Address";

      // Direct secure link for customer to view/download official tax invoice PDF (20-min validity)
      const invoicePdfLink = shareToken
        ? `${window.location.origin}/invoice/${order.orderId || order._id}?token=${shareToken}`
        : `${window.location.origin}/invoice/${order.orderId || order._id}`;

      const message =
        `🌿 *KALA AGALYA HERBALS - ORDER INVOICE* 🌿\n\n` +
        `Hello *${customerName}*! 👋\n` +
        `Thank you for your order with Kala Agalya Herbals!\n\n` +
        `📄 *Invoice No:* ${invoiceNo}\n` +
        `🗓️ *Order Date:* ${orderDate}\n` +
        `📦 *Items Ordered:*\n${itemsSummary}\n\n` +
        `💰 *Total Amount:* ₹${(Number(order.totalAmount) || 0).toFixed(0)} (Status: ${order.paymentStatus || "PAID"})\n` +
        `📍 *Delivery Address:*\n${fullAddr}\n\n` +
        `📥 *Download Your Official Tax Invoice (PDF):*\n` +
        `👉 ${invoicePdfLink}\n\n` +
        `🔒 _For your security, this direct invoice download link is active for 20 minutes._\n\n` +
        `✨ Tap the link above to view or download your official tax invoice.\n` +
        `Our herbal team is preparing your package with care! 🍃\n\n` +
        `For queries, reply directly to this chat.\n` +
        `*Kala Agalya Herbals*`;

      const encoded = encodeURIComponent(message);
      const waUrl = `https://wa.me/${waPhone}?text=${encoded}`;
      if (waWin) {
        waWin.location.href = waUrl;
      } else {
        window.open(waUrl, "_blank");
      }

      // Auto-update tracking: Invoice Sent
      await handleUpdateTracking(order._id, { invoiceSent: true });

      addToast(`WhatsApp chat opened for ${customerName} with secure 20-min invoice link 💬`, "success");
    } catch (err) {
      if (waWin) waWin.close();
      addToast("Failed to initiate WhatsApp message", "error");
    }
  };

  // ── Return Order Processing Handlers ─────────────────────────────────────
  const handleOpenReturnModal = (order) => {
    setReturnTargetOrder(order);
    const ret = order.returnDetails || {};
    setReturnFormData({
      returnType: ret.returnType && ret.returnType !== "None" ? ret.returnType : "Refund",
      refundAmount: ret.refundAmount !== undefined ? ret.refundAmount : (order.totalAmount || 0),
      refundStatus: ret.refundStatus || "Pending",
      reorderNotes: ret.reorderNotes || "",
      returnReason: ret.returnReason || "Customer Refused / RTO",
      returnNotes: ret.returnNotes || ""
    });
    setIsReturnModalOpen(true);
  };

  const handleSubmitReturn = async (e) => {
    e.preventDefault();
    if (!returnTargetOrder) return;
    setSubmittingReturn(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_URL}/admin/whatsapp-orders/${returnTargetOrder._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          orderStatus: "Returned",
          returnDetails: {
            returnType: returnFormData.returnType,
            refundAmount: Number(returnFormData.refundAmount) || 0,
            refundStatus: returnFormData.refundStatus,
            reorderNotes: returnFormData.reorderNotes,
            returnReason: returnFormData.returnReason,
            returnNotes: returnFormData.returnNotes,
            returnedAt: new Date()
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        addToast(
          `Order marked as Returned with ${returnFormData.returnType === "Refund" ? "Refund" : "Re-Order"} resolution!`,
          "success"
        );
        setIsReturnModalOpen(false);
        fetchOrders();
      } else {
        addToast(data.message || "Failed to update return order", "error");
      }
    } catch (err) {
      console.error("Error submitting return:", err);
      addToast("Server error saving return details", "error");
    } finally {
      setSubmittingReturn(false);
    }
  };

  // Export Return Orders to Excel
  const handleExportReturnsExcel = () => {
    const returnsList = orders.filter((o) => o.orderStatus === "Returned");
    if (returnsList.length === 0) {
      addToast("No return orders available to export", "error");
      return;
    }

    const rows = returnsList.map((o) => {
      const itemsStr = (o.items || [])
        .map((i) => `${i.name} (${i.size || "Std"}) x${i.quantity || 1}`)
        .join(" | ");

      const addrStr =
        o.customer?.address?.fullAddress ||
        [
          o.customer?.address?.door,
          o.customer?.address?.street,
          o.customer?.address?.district,
          o.customer?.address?.state,
          o.customer?.address?.pincode
        ]
          .filter(Boolean)
          .join(", ") ||
        "N/A";

      const ret = o.returnDetails || {};
      const returnDateStr = ret.returnedAt
        ? new Date(ret.returnedAt).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
          })
        : new Date(o.updatedAt || o.createdAt).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
          });

      return {
        "Invoice Number": o.invoiceNumber || `KAH-WA-${o.orderId}`,
        "Order ID": o.orderId,
        "Customer Name": o.customer?.name || "N/A",
        "Mobile Number": o.customer?.mobileNumber || "N/A",
        "WhatsApp Number": o.customer?.whatsappNumber || o.customer?.mobileNumber || "N/A",
        "Delivery Address": addrStr,
        "Returned Items": itemsStr || "Herbal Items",
        "Original Amount": o.totalAmount || 0,
        "Return Type": ret.returnType || "Refund",
        "Refund Amount": ret.returnType === "Refund" ? (ret.refundAmount || o.totalAmount || 0) : 0,
        "Refund Status": ret.returnType === "Refund" ? (ret.refundStatus || "Pending") : "N/A",
        "Re-Order Notes": ret.reorderNotes || "N/A",
        "Return Reason": ret.returnReason || "N/A",
        "Return Notes": ret.returnNotes || "",
        "Return Date": returnDateStr
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet["!cols"] = [
      { wch: 22 },
      { wch: 14 },
      { wch: 22 },
      { wch: 16 },
      { wch: 16 },
      { wch: 35 },
      { wch: 35 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 25 },
      { wch: 22 },
      { wch: 25 },
      { wch: 15 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "WhatsApp Returns");
    const todayStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `KAH_WhatsApp_Return_Orders_${todayStr}.xlsx`);
    addToast(`Exported ${rows.length} return order(s) to Excel (.xlsx) 📊`, "success");
  };

  // ── Excel & CSV Exports ──────────────────────────────────────────────────
  const buildExportRows = () => {
    return filteredOrders.map((o) => {
      const itemsStr = (o.items || [])
        .map((i) => `${i.name} (${i.size || "Std"}) x${i.quantity || 1} @ ₹${i.price || 0}`)
        .join(" | ");

      const addrStr =
        o.customer?.address?.fullAddress ||
        [
          o.customer?.address?.door,
          o.customer?.address?.street,
          o.customer?.address?.district,
          o.customer?.address?.state,
          o.customer?.address?.pincode
        ]
          .filter(Boolean)
          .join(", ") ||
        "N/A";

      const fmtDate = new Date(o.orderDate || o.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });

      return {
        "Customer Name": o.customer?.name || "N/A",
        Address: addrStr,
        "Mobile Number": o.customer?.mobileNumber || "N/A",
        "WhatsApp Number": o.customer?.whatsappNumber || o.customer?.mobileNumber || "N/A",
        "Placed Order": itemsStr || "Herbal Care Products",
        "Order Date": fmtDate,
        "Total Amount": o.totalAmount || 0,
        "Invoice Number": o.invoiceNumber || `KAH-WA-${o.orderId}`,
        "Invoice Status": o.invoiceStatus || "GENERATED"
      };
    });
  };

  // Export to Excel (.xlsx)
  const handleExportExcel = () => {
    if (filteredOrders.length === 0) {
      addToast("No orders available to export", "error");
      return;
    }

    const rows = buildExportRows();
    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Auto fit column widths
    const colWidths = [
      { wch: 22 }, // Customer Name
      { wch: 35 }, // Address
      { wch: 16 }, // Mobile Number
      { wch: 16 }, // WhatsApp Number
      { wch: 40 }, // Placed Order
      { wch: 15 }, // Order Date
      { wch: 14 }, // Total Amount
      { wch: 22 }, // Invoice Number
      { wch: 15 } // Invoice Status
    ];
    worksheet["!cols"] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "WhatsApp Orders");

    const todayStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `KAH_WhatsApp_Orders_${todayStr}.xlsx`);
    addToast(`Exported ${rows.length} WhatsApp order(s) to Excel (.xlsx) ✅`, "success");
  };

  // Export to CSV (.csv)
  const handleExportCSV = () => {
    if (filteredOrders.length === 0) {
      addToast("No orders available to export", "error");
      return;
    }

    const rows = buildExportRows();
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const csvContent = "\uFEFF" + XLSX.utils.sheet_to_csv(worksheet);

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const todayStr = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.setAttribute("download", `KAH_WhatsApp_Orders_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addToast(`Exported ${rows.length} WhatsApp order(s) to CSV (.csv) ✅`, "success");
  };

  // Download Sample Excel Template
  const handleDownloadSampleTemplate = (type = "xlsx") => {
    const sampleRows = [
      {
        "Customer Name": "Priya Sundaram",
        Address: "No. 14, Gandhi Road, Adyar, Chennai, Tamil Nadu - 600020",
        "Mobile Number": "9876543210",
        "WhatsApp Number": "9876543210",
        "Placed Order": "Herbal Hair Oil (200ml) x2 @ 499 | Herbal Shampoo (100ml) x1 @ 249",
        "Order Date": "2026-11-20",
        "Total Amount": 1247,
        "Invoice Number": "KAH-WA-2026-901231",
        "Invoice Status": "GENERATED"
      },
      {
        "Customer Name": "Kavitha Rajan",
        Address: "Flat 4B, Lotus Apartments, Saibaba Colony, Coimbatore, Tamil Nadu - 641011",
        "Mobile Number": "9845123456",
        "WhatsApp Number": "9845123456",
        "Placed Order": "Spikenard Herbal Oil (500ml) x1 @ 899",
        "Order Date": "2026-11-21",
        "Total Amount": 899,
        "Invoice Number": "KAH-WA-2026-901232",
        "Invoice Status": "GENERATED"
      },
      {
        "Customer Name": "Suresh Kumar",
        Address: "22, Temple Street, Madurai, Tamil Nadu - 625001",
        "Mobile Number": "9789012345",
        "WhatsApp Number": "9789012345",
        "Placed Order": "Vetiver Root Hair Cleanser (200ml) x3 @ 350",
        "Order Date": "2026-11-22",
        "Total Amount": 1050,
        "Invoice Number": "",
        "Invoice Status": "GENERATED"
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleRows);
    worksheet["!cols"] = [
      { wch: 20 },
      { wch: 45 },
      { wch: 16 },
      { wch: 16 },
      { wch: 45 },
      { wch: 14 },
      { wch: 14 },
      { wch: 22 },
      { wch: 16 }
    ];

    if (type === "csv") {
      const csvContent = "\uFEFF" + XLSX.utils.sheet_to_csv(worksheet);
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "KAH_WhatsApp_Orders_Sample_Template.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sample Orders");
      XLSX.writeFile(workbook, "KAH_WhatsApp_Orders_Sample_Template.xlsx");
    }
    addToast(`Sample ${type.toUpperCase()} template downloaded 📥`, "info");
  };

  const getStatusBadge = (status) => {
    const badges = {
      Pending: "bg-amber-50 text-amber-800 border-amber-200",
      Packed: "bg-blue-50 text-blue-800 border-blue-200",
      Shipped: "bg-purple-50 text-purple-800 border-purple-200",
      Delivered: "bg-emerald-50 text-emerald-800 border-emerald-200",
      Cancelled: "bg-red-50 text-red-800 border-red-200",
      Returned: "bg-rose-50 text-rose-800 border-rose-300"
    };
    return badges[status] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  return (
    <AdminLayout>
      <div className="space-y-6 pb-16">
        
        {/* Page Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-yellow-500/15 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-green-500 to-emerald-600 text-white flex items-center justify-center shadow-md">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                </svg>
              </span>
              <h1 className="text-2xl font-black text-[#1C1A16] font-soria tracking-wide">
                WhatsApp Orders
              </h1>
            </div>
            <p className="text-xs text-[#8A867E] mt-1 font-inter">
              Create, view, manage, and dispatch direct orders placed via WhatsApp with instant PDF invoices
            </p>
          </div>

          {/* Action Buttons: Add, Bulk Import, Export */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 font-grotesk uppercase tracking-wider shadow-gold active:scale-95 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>+ New WhatsApp Order</span>
            </button>

            <button
              onClick={() => setIsBulkModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 font-grotesk uppercase tracking-wider transition-all"
            >
              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span>Bulk Import</span>
            </button>

            {/* Export Dropdown Group */}
            <div className="flex items-center gap-1.5 bg-white border border-yellow-500/20 p-1 rounded-xl shadow-xs">
              <button
                onClick={handleExportExcel}
                title="Export filtered orders to Excel (.xlsx)"
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-yellow-900 hover:bg-yellow-500/10 font-grotesk transition-colors flex items-center gap-1"
              >
                <span>📊 Excel</span>
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={handleExportCSV}
                title="Export filtered orders to CSV (.csv)"
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-yellow-900 hover:bg-yellow-500/10 font-grotesk transition-colors flex items-center gap-1"
              >
                <span>📄 CSV</span>
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => handleDownloadSampleTemplate("xlsx")}
                title="Download Sample Excel Template with instructions"
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-[#8A867E] hover:text-yellow-900 hover:bg-yellow-500/10 font-grotesk transition-colors"
              >
                <span>Template</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-yellow-500/15 shadow-card">
            <p className="text-[10px] font-bold text-[#9A9690] uppercase tracking-wider font-grotesk">
              Total WA Orders
            </p>
            <p className="text-xl sm:text-2xl font-black text-[#1C1A16] font-soria mt-1">
              {stats.totalOrders}
            </p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-yellow-500/15 shadow-card">
            <p className="text-[10px] font-bold text-[#9A9690] uppercase tracking-wider font-grotesk">
              Total Revenue
            </p>
            <p className="text-xl sm:text-2xl font-black text-yellow-800 font-soria mt-1">
              ₹{stats.totalRevenue.toLocaleString("en-IN")}
            </p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-yellow-500/15 shadow-card">
            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider font-grotesk">
              Pending Orders
            </p>
            <p className="text-xl sm:text-2xl font-black text-amber-800 font-soria mt-1">
              {stats.pendingOrders}
            </p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-yellow-500/15 shadow-card">
            <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider font-grotesk">
              Delivered
            </p>
            <p className="text-xl sm:text-2xl font-black text-emerald-700 font-soria mt-1">
              {stats.deliveredOrders}
            </p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-rose-500/25 shadow-card">
            <p className="text-[10px] font-bold text-rose-700 uppercase tracking-wider font-grotesk">
              Return Orders
            </p>
            <p className="text-xl sm:text-2xl font-black text-rose-700 font-soria mt-1">
              {stats.returnedOrders !== undefined ? stats.returnedOrders : returnedOrders.length}
            </p>
          </div>
        </div>

        {/* View Mode Tabs: Active Orders vs Return Orders */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-yellow-500/20 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setViewTab("active");
                setSelectedOrderIds([]);
              }}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold font-grotesk uppercase tracking-wider transition-all flex items-center gap-2 ${
                viewTab === "active"
                  ? "bg-yellow-900 text-white shadow-md ring-2 ring-yellow-600/30"
                  : "bg-white text-gray-700 hover:bg-yellow-500/10 border border-yellow-500/20"
              }`}
            >
              <span>📦 Active Orders</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  viewTab === "active" ? "bg-yellow-700 text-white" : "bg-gray-100 text-gray-700"
                }`}
              >
                {activeOrders.length}
              </span>
            </button>

            <button
              onClick={() => {
                setViewTab("returns");
                setSelectedOrderIds([]);
              }}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold font-grotesk uppercase tracking-wider transition-all flex items-center gap-2 ${
                viewTab === "returns"
                  ? "bg-rose-900 text-white shadow-md ring-2 ring-rose-600/30"
                  : "bg-white text-rose-800 hover:bg-rose-50 border border-rose-200"
              }`}
            >
              <span>🔄 Return Orders & Refunds</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  viewTab === "returns" ? "bg-rose-700 text-white" : "bg-rose-100 text-rose-800"
                }`}
              >
                {returnedOrders.length}
              </span>
            </button>
          </div>

          {viewTab === "returns" && (
            <button
              onClick={handleExportReturnsExcel}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-300 font-grotesk uppercase tracking-wider transition-all shadow-xs active:scale-95"
            >
              <svg className="w-4 h-4 text-rose-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Export Returns Excel (.xlsx)</span>
            </button>
          )}
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-yellow-500/15 shadow-card flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer name, phone, WhatsApp, invoice #, address or product..."
              className="w-full pl-10 pr-4 py-2.5 text-xs text-[#1C1A16] bg-[#FDFBF7] border border-yellow-500/20 rounded-xl focus:outline-none focus:border-yellow-500 font-inter placeholder-gray-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filters Area */}
          {viewTab === "active" ? (
            <div className="flex flex-wrap items-center gap-3">
              {/* Status Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 custom-scrollbar shrink-0">
                {["all", "Pending", "Packed", "Shipped", "Delivered", "Cancelled"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold font-grotesk uppercase tracking-wider transition-all whitespace-nowrap ${
                      statusFilter === st
                        ? "bg-yellow-800 text-white shadow-xs"
                        : "bg-[#FDFBF7] text-[#6C685F] hover:bg-yellow-500/10 border border-yellow-500/15"
                    }`}
                  >
                    {st === "all" ? `All (${activeOrders.length})` : st}
                  </button>
                ))}
              </div>

              {/* Print Status Filter */}
              <div className="flex items-center gap-1 text-[11px] font-grotesk border-l border-yellow-500/15 pl-3">
                <span className="text-[#8A867E] font-bold">Print:</span>
                <select
                  value={printFilter}
                  onChange={(e) => setPrintFilter(e.target.value)}
                  className="px-2 py-1 text-xs bg-[#FDFBF7] border border-yellow-500/25 rounded-lg focus:outline-none font-bold text-gray-800"
                >
                  <option value="all">All</option>
                  <option value="unprinted">⬜ Unprinted Only</option>
                  <option value="printed">🖨️ Printed</option>
                </select>
              </div>

              {/* WhatsApp Sent Filter */}
              <div className="flex items-center gap-1 text-[11px] font-grotesk">
                <span className="text-[#8A867E] font-bold">WhatsApp:</span>
                <select
                  value={invoiceFilter}
                  onChange={(e) => setInvoiceFilter(e.target.value)}
                  className="px-2 py-1 text-xs bg-[#FDFBF7] border border-yellow-500/25 rounded-lg focus:outline-none font-bold text-gray-800"
                >
                  <option value="all">All</option>
                  <option value="sent">💬 Sent</option>
                  <option value="pending">⏳ Not Sent</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="text-xs font-bold font-grotesk text-rose-800 flex items-center gap-2">
              <span>Showing {filteredOrders.length} Return Order(s)</span>
            </div>
          )}
        </div>

        {/* Batch Action Toolbar */}
        {selectedOrderIds.length > 0 && (
          <div className="bg-[#1C1A16] text-white px-5 py-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xl border border-yellow-500/30 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-lg bg-yellow-500 text-black font-extrabold flex items-center justify-center text-xs shadow-xs">
                {selectedOrderIds.length}
              </span>
              <span className="font-bold text-xs font-grotesk tracking-wide text-yellow-100">
                {selectedOrderIds.length} order{selectedOrderIds.length > 1 ? "s" : ""} selected
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* 1. Print Shipping Labels (152x102mm Thermal) */}
              <button
                type="button"
                onClick={handlePrintLabelsSelected}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-bold font-grotesk uppercase tracking-wider flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                title="Print 152×102mm (6x4 inch) 2-Up Thermal Courier Stickers"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <span>Print Shipping Labels ({selectedOrderIds.length})</span>
              </button>

              {/* 2. Print Full Invoices */}
              <button
                type="button"
                onClick={handlePrintSelected}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black text-xs font-bold font-grotesk uppercase tracking-wider flex items-center gap-1.5 shadow-gold active:scale-95 transition-all"
                title="Print Full Tax Invoices"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>Invoices ({selectedOrderIds.length})</span>
              </button>

              {/* 3. Deselect All */}
              <button
                type="button"
                onClick={() => setSelectedOrderIds([])}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold font-grotesk uppercase tracking-wider transition-colors"
              >
                Deselect
              </button>
            </div>
          </div>
        )}

        {/* Orders Table */}
        <div className="bg-white rounded-3xl border border-yellow-500/15 shadow-card overflow-hidden">
          {loading ? (
            <div className="py-24 text-center">
              <div className="animate-spin h-8 w-8 border-3 border-yellow-600 border-t-transparent rounded-full mx-auto mb-3"></div>
              <p className="text-xs text-[#8A867E] font-inter">Loading WhatsApp orders...</p>
            </div>
          ) : filteredOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FDFBF7] border-b border-yellow-500/15 font-bold font-grotesk text-yellow-900 tracking-wider uppercase text-[11px]">
                  <tr>
                    <th className="py-3.5 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={handleToggleSelectAll}
                        className="w-4 h-4 rounded text-yellow-600 focus:ring-yellow-500 border-gray-300 cursor-pointer accent-yellow-600"
                        title="Select All"
                      />
                    </th>
                    <th className="py-3.5 px-4">Invoice / Order ID</th>
                    <th className="py-3.5 px-4">Customer Name</th>
                    <th className="py-3.5 px-4">Mobile & WhatsApp</th>
                    {viewTab === "active" ? (
                      <>
                        <th className="py-3.5 px-4">Address</th>
                        <th className="py-3.5 px-4">Placed Order</th>
                        <th className="py-3.5 px-4 text-right">Total Amount</th>
                        <th className="py-3.5 px-4 text-center">Order Status</th>
                        <th className="py-3.5 px-4 text-center">Order Date</th>
                      </>
                    ) : (
                      <>
                        <th className="py-3.5 px-4">Returned Items</th>
                        <th className="py-3.5 px-4 text-right">Order Amount</th>
                        <th className="py-3.5 px-4 text-center">Return Resolution</th>
                        <th className="py-3.5 px-4 text-center">Refund Status / Amount</th>
                        <th className="py-3.5 px-4">Return Reason & Date</th>
                      </>
                    )}
                    <th className="py-3.5 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-yellow-500/10 font-inter text-[#1C1A16]">
                  {filteredOrders.map((order) => {
                    const fullAddr =
                      order.customer?.address?.fullAddress ||
                      [
                        order.customer?.address?.door,
                        order.customer?.address?.street,
                        order.customer?.address?.district,
                        order.customer?.address?.state,
                        order.customer?.address?.pincode
                      ]
                        .filter(Boolean)
                        .join(", ");

                    const itemsCount = (order.items || []).length;
                    const itemsDesc = (order.items || [])
                      .map((i) => `${i.name} (${i.size || "Std"}) x${i.quantity || 1}`)
                      .join(", ");

                    const isChecked = selectedOrderIds.includes(order._id);

                    return (
                      <tr
                        key={order._id}
                        className={`transition-colors ${
                          isChecked ? "bg-yellow-500/8 hover:bg-yellow-500/12" : "hover:bg-yellow-500/4"
                        }`}
                      >
                        {/* 0. Row Checkbox */}
                        <td className="py-4 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleSelectOrder(order._id)}
                            className="w-4 h-4 rounded text-yellow-600 focus:ring-yellow-500 border-gray-300 cursor-pointer accent-yellow-600"
                          />
                        </td>
                        
                        {/* 1. Invoice & Order ID + Tracking Badges */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="font-mono font-bold text-yellow-800 text-xs">
                            {order.invoiceNumber || `#${order.orderId}`}
                          </div>
                          <div className="text-[10px] text-[#8A867E] font-mono mt-0.5">
                            ID: {order.orderId}
                          </div>

                          {/* Quick Interactive Tracking Badges */}
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            {/* Invoice Sent Status */}
                            <button
                              type="button"
                              onClick={() => handleUpdateTracking(order._id, { invoiceSent: !order.invoiceSent })}
                              title={`Invoice: ${order.invoiceSent ? "Sent to customer" : "Not sent yet"}. Click to toggle.`}
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold font-grotesk uppercase tracking-wider border transition-all ${
                                order.invoiceSent
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                                  : "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
                              }`}
                            >
                              <span>{order.invoiceSent ? "✓" : "⏳"}</span>
                              <span>{order.invoiceSent ? "Sent" : "Unsent"}</span>
                            </button>

                            {/* Label/Invoice Printed Status */}
                            <button
                              type="button"
                              onClick={() => handleUpdateTracking(order._id, { isPrinted: !order.isPrinted })}
                              title={`Print Status: ${order.isPrinted ? "Printed" : "Not printed yet"}. Click to toggle.`}
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold font-grotesk uppercase tracking-wider border transition-all ${
                                order.isPrinted
                                  ? "bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-100"
                                  : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                              }`}
                            >
                              <span>{order.isPrinted ? "🖨️" : "⬜"}</span>
                              <span>{order.isPrinted ? "Printed" : "Unprinted"}</span>
                            </button>
                          </div>
                        </td>

                        {/* 2. Customer Name */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="font-bold text-[#1C1A16] max-w-[130px] truncate" title={order.customer?.name}>
                            {order.customer?.name}
                          </div>
                          {order.customer?.email && (
                            <div className="text-[10px] text-[#9A9690] max-w-[130px] truncate">
                              {order.customer.email}
                            </div>
                          )}
                        </td>

                        {/* 3. Mobile & WhatsApp Numbers */}
                        <td className="py-4 px-4 whitespace-nowrap font-mono text-[11px]">
                          <div className="text-[#3a372e] font-semibold flex items-center gap-1.5">
                            <span className="text-[#9A9690]">📞</span>
                            <span>{order.customer?.mobileNumber || "—"}</span>
                          </div>
                          <div className="text-emerald-700 font-semibold flex items-center gap-1.5 mt-0.5">
                            <span className="text-emerald-600">💬</span>
                            <span>{order.customer?.whatsappNumber || order.customer?.mobileNumber || "—"}</span>
                          </div>
                        </td>

                        {/* View Tab = "active" Columns */}
                        {viewTab === "active" ? (
                          <>
                            {/* 4. Customer Address */}
                            <td className="py-4 px-4 max-w-[180px]">
                              <div className="truncate text-xs text-[#4A473E]" title={fullAddr}>
                                {fullAddr || "—"}
                              </div>
                            </td>

                            {/* 5. Placed Order Summary */}
                            <td className="py-4 px-4 max-w-[200px]">
                              <div className="truncate font-medium text-xs text-[#1C1A16]" title={itemsDesc}>
                                {itemsDesc || "Herbal Order"}
                              </div>
                              <div className="text-[10px] text-[#8A867E]">
                                {itemsCount} item{itemsCount !== 1 ? "s" : ""}
                              </div>
                            </td>

                            {/* 6. Total Amount */}
                            <td className="py-4 px-4 text-right whitespace-nowrap">
                              <div className="font-black text-[#1C1A16] font-soria text-base">
                                ₹{(Number(order.totalAmount) || 0).toFixed(0)}
                              </div>
                              <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider font-grotesk">
                                {order.paymentStatus || "PAID"}
                              </span>
                            </td>

                            {/* 7. Order Status */}
                            <td className="py-4 px-4 text-center whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold font-grotesk uppercase tracking-wider border ${getStatusBadge(
                                  order.orderStatus
                                )}`}
                              >
                                {order.orderStatus}
                              </span>
                            </td>

                            {/* 8. Order Date */}
                            <td className="py-4 px-4 text-center whitespace-nowrap text-xs text-[#8A867E]">
                              <div>
                                {new Date(order.orderDate || order.createdAt).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric"
                                })}
                              </div>
                            </td>
                          </>
                        ) : (
                          /* View Tab = "returns" Columns */
                          <>
                            {/* Returned Items */}
                            <td className="py-4 px-4 max-w-[180px]">
                              <div className="truncate font-medium text-xs text-[#1C1A16]" title={itemsDesc}>
                                {itemsDesc || "Herbal Products"}
                              </div>
                              <div className="text-[10px] text-rose-800 font-bold">
                                {itemsCount} item{itemsCount !== 1 ? "s" : ""} returned
                              </div>
                            </td>

                            {/* Original Order Total */}
                            <td className="py-4 px-4 text-right whitespace-nowrap">
                              <div className="font-black text-[#1C1A16] font-soria text-base">
                                ₹{(Number(order.totalAmount) || 0).toFixed(0)}
                              </div>
                            </td>

                            {/* Return Type (Refund vs Re-order) */}
                            <td className="py-4 px-4 text-center whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold font-grotesk uppercase tracking-wider border ${
                                  (order.returnDetails?.returnType || "Refund") === "Re-Order"
                                    ? "bg-purple-50 text-purple-800 border-purple-200"
                                    : "bg-rose-50 text-rose-800 border-rose-200"
                                }`}
                              >
                                <span>{(order.returnDetails?.returnType || "Refund") === "Re-Order" ? "🔁 Re-Order" : "💰 Refund"}</span>
                              </span>
                            </td>

                            {/* Refund Details */}
                            <td className="py-4 px-4 text-center whitespace-nowrap">
                              {(order.returnDetails?.returnType || "Refund") === "Re-Order" ? (
                                <div className="text-xs text-purple-900 font-medium max-w-[140px] truncate" title={order.returnDetails?.reorderNotes}>
                                  {order.returnDetails?.reorderNotes || "Replacement order"}
                                </div>
                              ) : (
                                <div>
                                  <div className="font-soria font-bold text-sm text-rose-900">
                                    ₹{order.returnDetails?.refundAmount !== undefined ? order.returnDetails.refundAmount : (order.totalAmount || 0)}
                                  </div>
                                  <span
                                    className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold font-grotesk uppercase ${
                                      order.returnDetails?.refundStatus === "Completed"
                                        ? "bg-emerald-100 text-emerald-800"
                                        : "bg-amber-100 text-amber-800"
                                    }`}
                                  >
                                    {order.returnDetails?.refundStatus || "Pending"}
                                  </span>
                                </div>
                              )}
                            </td>

                            {/* Return Reason & Date */}
                            <td className="py-4 px-4 max-w-[160px]">
                              <div className="font-bold text-xs text-rose-900 truncate" title={order.returnDetails?.returnReason}>
                                {order.returnDetails?.returnReason || "Customer Return"}
                              </div>
                              <div className="text-[10px] text-[#8A867E] mt-0.5">
                                {order.returnDetails?.returnedAt
                                  ? new Date(order.returnDetails.returnedAt).toLocaleDateString("en-IN", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric"
                                    })
                                  : new Date(order.updatedAt || order.createdAt).toLocaleDateString("en-IN", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric"
                                    })}
                              </div>
                            </td>
                          </>
                        )}

                        {/* 9. Actions Column - Unified Common Dropdown Button */}
                        <td className="py-4 px-4 whitespace-nowrap text-center relative">
                          <div className="relative inline-block text-left">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenActionMenuId(openActionMenuId === order._id ? null : order._id);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FDFBF7] hover:bg-yellow-500/15 text-yellow-900 border border-yellow-500/30 font-bold font-grotesk text-xs uppercase tracking-wider transition-all shadow-2xs active:scale-95"
                            >
                              <span>Actions</span>
                              <svg className="w-3.5 h-3.5 text-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>

                            {openActionMenuId === order._id && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 mt-1.5 w-56 bg-white rounded-2xl shadow-2xl border border-yellow-500/20 py-2 z-50 text-left font-inter animate-in fade-in zoom-in-95 duration-150"
                              >
                                {/* WhatsApp message */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    handleSendWhatsAppMessage(order);
                                  }}
                                  className="w-full px-3.5 py-2 text-xs text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 flex items-center gap-2.5 transition-colors font-medium text-left"
                                >
                                  <span className="text-emerald-600 text-sm">💬</span>
                                  <span>Send on WhatsApp</span>
                                </button>

                                {/* Print Shipping Label */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    handlePrintSingleShippingLabel(order);
                                  }}
                                  className="w-full px-3.5 py-2 text-xs text-gray-700 hover:bg-teal-50 hover:text-teal-800 flex items-center gap-2.5 transition-colors font-medium text-left"
                                >
                                  <span className="text-teal-600 text-sm">📦</span>
                                  <span>Print Label (152×102)</span>
                                </button>

                                {/* Print Tax Invoice */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    handlePrintSingleInvoice(order);
                                  }}
                                  className="w-full px-3.5 py-2 text-xs text-gray-700 hover:bg-yellow-500/10 hover:text-yellow-900 flex items-center gap-2.5 transition-colors font-medium text-left"
                                >
                                  <span className="text-yellow-700 text-sm">🧾</span>
                                  <span>Print Tax Invoice (A4)</span>
                                </button>

                                <div className="border-t border-gray-100 my-1"></div>

                                {/* View Details */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    handleOpenViewModal(order);
                                  }}
                                  className="w-full px-3.5 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors font-medium text-left"
                                >
                                  <span className="text-gray-500 text-sm">👁️</span>
                                  <span>View Order Details</span>
                                </button>

                                {/* Process Return / Refund / Re-Order */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    handleOpenReturnModal(order);
                                  }}
                                  className="w-full px-3.5 py-2 text-xs text-rose-800 hover:bg-rose-50 flex items-center gap-2.5 transition-colors font-medium text-left"
                                >
                                  <span className="text-rose-600 text-sm">🔄</span>
                                  <span>{order.orderStatus === "Returned" ? "Edit Return / Refund" : "Process Return / Refund"}</span>
                                </button>

                                {/* Edit Order */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    handleOpenEditModal(order);
                                  }}
                                  className="w-full px-3.5 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors font-medium text-left"
                                >
                                  <span className="text-blue-500 text-sm">✏️</span>
                                  <span>Edit Order</span>
                                </button>

                                <div className="border-t border-gray-100 my-1"></div>

                                {/* Delete Order */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    handleOpenDeleteModal(order);
                                  }}
                                  className="w-full px-3.5 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors font-medium text-left"
                                >
                                  <span className="text-red-500 text-sm">🗑️</span>
                                  <span>Delete Order</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-16 text-center text-[#6C685F]">
              <div className="w-14 h-14 rounded-3xl bg-yellow-500/10 text-yellow-800 flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                </svg>
              </div>
              <p className="text-base font-bold text-[#1C1A16] font-grotesk">
                {searchQuery ? "No WhatsApp Orders Match Search" : "No WhatsApp Orders Found"}
              </p>
              <p className="text-xs text-[#8A867E] mt-1 font-inter max-w-sm mx-auto">
                {searchQuery
                  ? `No orders match "${searchQuery}". Clear your search or change filters.`
                  : "Click '+ New WhatsApp Order' or 'Bulk Import' to record incoming customer orders."}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="mt-3 px-3 py-1.5 bg-yellow-500/10 text-yellow-800 rounded-xl font-grotesk text-xs font-bold"
                >
                  Clear Search
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── CREATE / EDIT ORDER MODAL ────────────────────────────────────── */}
        {isAddEditModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl border border-yellow-500/20 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              
              {/* Modal Header */}
              <div className="px-6 py-5 bg-[#FDFBF7] border-b border-yellow-500/15 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-yellow-500 to-amber-600 flex items-center justify-center text-black font-bold shadow-md">
                    📝
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#1C1A16] font-grotesk">
                      {modalMode === "create" ? "Create New WhatsApp Order" : `Edit Order #${formData.invoiceNumber}`}
                    </h3>
                    <p className="text-xs text-[#8A867E] font-inter">
                      Auto-generates unique tax invoice and formats message for customer
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Section 1: Customer Details */}
                <div className="bg-[#FDFBF7] p-5 rounded-2xl border border-yellow-500/15 space-y-4">
                  <h4 className="text-xs font-bold text-yellow-900 uppercase tracking-widest font-grotesk flex items-center gap-2">
                    <span>👤</span> Customer Information
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Customer Name */}
                    <div>
                      <label className="block text-[11px] font-bold text-[#6C685F] uppercase font-grotesk mb-1">
                        Customer Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.customerName}
                        onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                        placeholder="e.g. Priya Sundaram"
                        className="w-full px-3 py-2 text-xs bg-white border border-yellow-500/20 rounded-xl focus:outline-none focus:border-yellow-500"
                      />
                    </div>

                    {/* Mobile Number */}
                    <div>
                      <label className="block text-[11px] font-bold text-[#6C685F] uppercase font-grotesk mb-1">
                        Mobile Number * (10 Digits)
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.mobileNumber}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData({
                            ...formData,
                            mobileNumber: val,
                            // Auto-copy to WhatsApp Number if WhatsApp number is untouched or same
                            whatsappNumber:
                              formData.whatsappNumber === formData.mobileNumber || !formData.whatsappNumber
                                ? val
                                : formData.whatsappNumber
                          });
                        }}
                        placeholder="9876543210"
                        className="w-full px-3 py-2 text-xs bg-white border border-yellow-500/20 rounded-xl focus:outline-none focus:border-yellow-500 font-mono"
                      />
                    </div>

                    {/* WhatsApp Number */}
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-700 uppercase font-grotesk mb-1">
                        WhatsApp Number * (10 Digits)
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.whatsappNumber}
                        onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                        placeholder="9876543210"
                        className="w-full px-3 py-2 text-xs bg-white border border-emerald-300 rounded-xl focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* Customer Address */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#6C685F] uppercase font-grotesk mb-1">
                      Full Delivery Address *
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Door no, Street, Landmark, District, State, Pincode"
                      className="w-full px-3 py-2 text-xs bg-white border border-yellow-500/20 rounded-xl focus:outline-none focus:border-yellow-500 font-inter"
                    />
                  </div>
                </div>

                {/* Section 2: Products Ordered (Multiple items supported) */}
                <div className="bg-[#FDFBF7] p-5 rounded-2xl border border-yellow-500/15 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-yellow-900 uppercase tracking-widest font-grotesk flex items-center gap-2">
                      <span>🌿</span> Ordered Products & Quantities
                    </h4>
                    <button
                      type="button"
                      onClick={handleAddItemRow}
                      className="px-3 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-900 rounded-lg text-xs font-bold font-grotesk transition-colors"
                    >
                      + Add Another Product
                    </button>
                  </div>

                  {/* Dynamic Product Rows */}
                  <div className="space-y-3">
                    {formData.items.map((item, index) => {
                      const selectedProd = productsList.find((p) => p._id === item.productId);
                      const availableSizes = selectedProd?.sizes || [];

                      return (
                        <div
                          key={index}
                          className="bg-white p-3.5 rounded-xl border border-yellow-500/20 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                        >
                          {/* Product Select */}
                          <div className="sm:col-span-5">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase font-grotesk mb-0.5">
                              Product Name
                            </label>
                            <select
                              value={item.productId || ""}
                              onChange={(e) => handleProductSelect(index, e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs bg-[#FDFBF7] border border-yellow-500/20 rounded-lg focus:outline-none focus:border-yellow-500 font-medium"
                            >
                              <option value="">-- Choose Store Product or Custom --</option>
                              {productsList.map((p) => (
                                <option key={p._id} value={p._id}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                            {/* If custom or selected, editable name */}
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => handleItemChange(index, "name", e.target.value)}
                              placeholder="Item Name"
                              className="w-full mt-1 px-2.5 py-1 text-[11px] bg-white border border-gray-200 rounded-lg focus:outline-none"
                            />
                          </div>

                          {/* Size Select */}
                          <div className="sm:col-span-2">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase font-grotesk mb-0.5">
                              Size / Variant
                            </label>
                            {availableSizes.length > 0 ? (
                              <select
                                value={item.size}
                                onChange={(e) => handleSizeSelect(index, e.target.value)}
                                className="w-full px-2 py-1.5 text-xs bg-[#FDFBF7] border border-yellow-500/20 rounded-lg focus:outline-none"
                              >
                                {availableSizes.map((s) => (
                                  <option key={s.size} value={s.size}>
                                    {s.size} (₹{s.offerPrice || s.price})
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={item.size}
                                onChange={(e) => handleItemChange(index, "size", e.target.value)}
                                placeholder="e.g. 200ml"
                                className="w-full px-2 py-1.5 text-xs bg-white border border-gray-200 rounded-lg"
                              />
                            )}
                          </div>

                          {/* Price */}
                          <div className="sm:col-span-2">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase font-grotesk mb-0.5">
                              Unit Price (₹)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={item.price}
                              onChange={(e) => handleItemChange(index, "price", e.target.value)}
                              className="w-full px-2 py-1.5 text-xs bg-white border border-gray-200 rounded-lg font-mono font-bold"
                            />
                          </div>

                          {/* Quantity */}
                          <div className="sm:col-span-1">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase font-grotesk mb-0.5">
                              Qty
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                              className="w-full px-2 py-1.5 text-xs bg-white border border-gray-200 rounded-lg font-mono font-bold text-center"
                            />
                          </div>

                          {/* Line Total & Remove */}
                          <div className="sm:col-span-2 flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0">
                            <div className="text-right">
                              <span className="text-[10px] text-gray-500 block uppercase font-grotesk">Total</span>
                              <span className="font-soria font-bold text-sm text-yellow-900">
                                ₹{(item.total || 0).toFixed(0)}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveItemRow(index)}
                              title="Remove item"
                              className="w-7 h-7 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition-colors text-xs"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Section 3: Billing & Invoice Information */}
                <div className="bg-[#FDFBF7] p-5 rounded-2xl border border-yellow-500/15 space-y-4">
                  <h4 className="text-xs font-bold text-yellow-900 uppercase tracking-widest font-grotesk flex items-center gap-2">
                    <span>🧾</span> Invoice & Status Details
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    {/* Invoice Number */}
                    <div>
                      <label className="block text-[11px] font-bold text-[#6C685F] uppercase font-grotesk mb-1">
                        Invoice Number *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.invoiceNumber}
                        onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-white border border-yellow-500/20 rounded-xl font-mono font-bold text-yellow-900"
                      />
                    </div>

                    {/* Order Date */}
                    <div>
                      <label className="block text-[11px] font-bold text-[#6C685F] uppercase font-grotesk mb-1">
                        Order Date
                      </label>
                      <input
                        type="date"
                        value={formData.orderDate}
                        onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-white border border-yellow-500/20 rounded-xl font-mono"
                      />
                    </div>

                    {/* Order Status */}
                    <div>
                      <label className="block text-[11px] font-bold text-[#6C685F] uppercase font-grotesk mb-1">
                        Order Status
                      </label>
                      <select
                        value={formData.orderStatus}
                        onChange={(e) => setFormData({ ...formData, orderStatus: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-white border border-yellow-500/20 rounded-xl font-grotesk font-bold"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Packed">Packed</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>

                    {/* Payment Status */}
                    <div>
                      <label className="block text-[11px] font-bold text-[#6C685F] uppercase font-grotesk mb-1">
                        Payment Status
                      </label>
                      <select
                        value={formData.paymentStatus}
                        onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-white border border-yellow-500/20 rounded-xl font-grotesk font-bold text-emerald-800"
                      >
                        <option value="PAID">PAID</option>
                        <option value="PENDING">PENDING</option>
                      </select>
                    </div>
                  </div>

                  {/* Shipping and Totals Row */}
                  <div className="flex flex-col sm:flex-row items-center justify-between border-t border-yellow-500/15 pt-4 gap-4">
                    <div className="flex items-center gap-3">
                      <label className="text-xs font-bold text-gray-700 font-grotesk">
                        Shipping Fee (₹):
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.shippingAmount}
                        onChange={(e) => setFormData({ ...formData, shippingAmount: e.target.value })}
                        className="w-24 px-2 py-1 text-xs bg-white border border-gray-300 rounded-lg font-mono font-bold"
                      />
                    </div>

                    <div className="text-right flex items-center gap-6">
                      <div>
                        <span className="text-[10px] text-gray-500 uppercase font-grotesk block">Items Subtotal</span>
                        <span className="font-soria text-sm font-bold text-gray-800">
                          ₹{subtotalAmount.toFixed(0)}
                        </span>
                      </div>
                      <div className="bg-yellow-500/15 px-4 py-2 rounded-xl border border-yellow-500/30">
                        <span className="text-[10px] text-yellow-900 uppercase font-grotesk font-bold block">
                          Grand Total Amount
                        </span>
                        <span className="font-soria text-lg font-black text-yellow-900">
                          ₹{totalOrderAmount.toFixed(0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddEditModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 font-bold font-grotesk text-xs uppercase tracking-wider transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-bold font-grotesk text-xs uppercase tracking-wider shadow-gold active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {formSubmitting ? (
                      <>
                        <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Saving Order...
                      </>
                    ) : modalMode === "create" ? (
                      "Create Order & Generate Invoice"
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* ── VIEW ORDER DETAILS MODAL ─────────────────────────────────────── */}
        {isViewModalOpen && selectedOrder && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl border border-yellow-500/20 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              
              {/* Header */}
              <div className="px-6 py-5 bg-[#FDFBF7] border-b border-yellow-500/15 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-yellow-800 font-bold tracking-widest uppercase font-grotesk">
                    Order Details
                  </span>
                  <h3 className="text-xl font-black text-[#1C1A16] font-soria">
                    Invoice #{selectedOrder.invoiceNumber || selectedOrder.orderId}
                  </h3>
                </div>
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto font-inter text-xs">
                
                {/* Customer Card */}
                <div className="bg-[#FDFBF7] p-4 rounded-2xl border border-yellow-500/15 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase font-grotesk">Customer Name</p>
                    <p className="font-bold text-sm text-gray-900 mt-0.5">{selectedOrder.customer?.name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase font-grotesk">Order Date</p>
                    <p className="font-bold text-gray-800 mt-0.5">
                      {new Date(selectedOrder.orderDate || selectedOrder.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase font-grotesk">Mobile Number</p>
                    <p className="font-mono font-bold text-gray-800 mt-0.5">{selectedOrder.customer?.mobileNumber}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-emerald-700 font-bold uppercase font-grotesk">WhatsApp Number</p>
                    <p className="font-mono font-bold text-emerald-800 mt-0.5">
                      {selectedOrder.customer?.whatsappNumber || selectedOrder.customer?.mobileNumber}
                    </p>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-yellow-500/10">
                    <p className="text-[10px] text-gray-500 font-bold uppercase font-grotesk">Delivery Address</p>
                    <p className="text-gray-700 mt-0.5">
                      {selectedOrder.customer?.address?.fullAddress ||
                        [
                          selectedOrder.customer?.address?.door,
                          selectedOrder.customer?.address?.street,
                          selectedOrder.customer?.address?.district,
                          selectedOrder.customer?.address?.state,
                          selectedOrder.customer?.address?.pincode
                        ]
                          .filter(Boolean)
                          .join(", ")}
                    </p>
                  </div>
                </div>

                {/* Ordered Items Table */}
                <div>
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider font-grotesk mb-2">
                    Items in this Order
                  </h4>
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 text-gray-600 font-bold font-grotesk border-b border-gray-200">
                        <tr>
                          <th className="p-2.5">Item</th>
                          <th className="p-2.5">Size</th>
                          <th className="p-2.5 text-center">Qty</th>
                          <th className="p-2.5 text-right">Price</th>
                          <th className="p-2.5 text-right">Line Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {(selectedOrder.items || []).map((item, idx) => (
                          <tr key={idx}>
                            <td className="p-2.5 font-semibold text-gray-800">{item.name}</td>
                            <td className="p-2.5 text-gray-600">{item.size || "Standard"}</td>
                            <td className="p-2.5 text-center font-bold">{item.quantity || 1}</td>
                            <td className="p-2.5 text-right font-mono">₹{(item.price || 0).toFixed(0)}</td>
                            <td className="p-2.5 text-right font-mono font-bold text-yellow-900">
                              ₹{((item.price || 0) * (item.quantity || 1)).toFixed(0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-between items-center pt-3 px-2">
                    <span className="text-xs text-gray-500">Shipping: ₹{selectedOrder.shippingAmount || 0}</span>
                    <span className="text-sm font-black text-gray-900 font-soria">
                      Grand Total: ₹{(Number(selectedOrder.totalAmount) || 0).toFixed(0)}
                    </span>
                  </div>
                </div>

                {/* Order Status Change Control Panel */}
                <div className="bg-[#FDFBF7] p-4 rounded-2xl border border-yellow-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-grotesk">
                        Order Status Control
                      </p>
                      <p className="text-[11px] text-gray-600 font-inter">
                        Click a status below to update this order instantly
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold font-grotesk uppercase tracking-wider border ${getStatusBadge(
                        selectedOrder.orderStatus
                      )}`}
                    >
                      {updatingStatus ? "Updating..." : `Current: ${selectedOrder.orderStatus}`}
                    </span>
                  </div>

                  {/* Return Summary Box if Returned */}
                  {selectedOrder.orderStatus === "Returned" && selectedOrder.returnDetails && (
                    <div className="bg-rose-50/80 border border-rose-200/80 rounded-2xl p-3.5 space-y-2 mt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-rose-900 uppercase tracking-wider font-grotesk flex items-center gap-1.5">
                          <span>🔄</span> Return Resolution Details
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-grotesk uppercase tracking-wider ${
                            selectedOrder.returnDetails.returnType === "Refund"
                              ? selectedOrder.returnDetails.refundStatus === "Completed"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                : "bg-amber-100 text-amber-800 border border-amber-300"
                              : "bg-blue-100 text-blue-800 border border-blue-300"
                          }`}
                        >
                          {selectedOrder.returnDetails.returnType === "Refund"
                            ? `Refund ${selectedOrder.returnDetails.refundStatus || "Pending"}`
                            : "Re-Order / Replacement"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs pt-1">
                        <div>
                          <span className="text-[10px] text-gray-500 uppercase font-grotesk block">Resolution</span>
                          <span className="font-bold text-gray-900 font-inter">
                            {selectedOrder.returnDetails.returnType || "Refund"}
                          </span>
                        </div>
                        {selectedOrder.returnDetails.returnType === "Refund" && (
                          <div>
                            <span className="text-[10px] text-gray-500 uppercase font-grotesk block">Refund Amount</span>
                            <span className="font-mono font-bold text-rose-800">
                              ₹{selectedOrder.returnDetails.refundAmount || 0}
                            </span>
                          </div>
                        )}
                        <div>
                          <span className="text-[10px] text-gray-500 uppercase font-grotesk block">Reason</span>
                          <span className="text-gray-800 font-inter">
                            {selectedOrder.returnDetails.returnReason || "Customer Refused / RTO"}
                          </span>
                        </div>
                      </div>
                      {selectedOrder.returnDetails.reorderNotes && (
                        <div className="pt-1.5 border-t border-rose-200/60">
                          <span className="text-[10px] text-gray-500 uppercase font-grotesk block">
                            Re-Order / Replacement Notes
                          </span>
                          <p className="text-xs text-blue-900 font-inter">{selectedOrder.returnDetails.reorderNotes}</p>
                        </div>
                      )}
                      {selectedOrder.returnDetails.returnNotes && (
                        <div className="pt-1.5 border-t border-rose-200/60">
                          <span className="text-[10px] text-gray-500 uppercase font-grotesk block">Admin Notes</span>
                          <p className="text-xs text-gray-700 font-inter">{selectedOrder.returnDetails.returnNotes}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-1">
                    {[
                      { status: "Pending", icon: "⏳", color: "hover:border-amber-400 hover:bg-amber-50" },
                      { status: "Packed", icon: "📦", color: "hover:border-blue-400 hover:bg-blue-50" },
                      { status: "Shipped", icon: "🚚", color: "hover:border-purple-400 hover:bg-purple-50" },
                      { status: "Delivered", icon: "✅", color: "hover:border-emerald-400 hover:bg-emerald-50" },
                      { status: "Returned", icon: "🔄", color: "hover:border-rose-400 hover:bg-rose-50" },
                      { status: "Cancelled", icon: "🚫", color: "hover:border-red-400 hover:bg-red-50" }
                    ].map(({ status, icon, color }) => {
                      const isCurrent = selectedOrder.orderStatus === status;
                      return (
                        <button
                          key={status}
                          type="button"
                          disabled={updatingStatus || isCurrent}
                          onClick={() => {
                            if (status === "Returned") {
                              handleOpenReturnModal(selectedOrder);
                            } else {
                              handleUpdateStatus(selectedOrder._id, status);
                            }
                          }}
                          className={`py-2 px-2 rounded-xl text-xs font-bold font-grotesk uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-xs border ${
                            isCurrent
                              ? "bg-yellow-800 text-white border-yellow-800 shadow-sm ring-2 ring-yellow-600/30 cursor-default"
                              : `bg-white text-gray-700 border-gray-200 ${color} active:scale-95`
                          } ${updatingStatus ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          <span>{icon}</span>
                          <span>{status}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-[#FDFBF7] border-t border-yellow-500/15 flex items-center justify-end">
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-bold font-grotesk text-xs uppercase tracking-wider transition-colors"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ── DELETE CONFIRMATION MODAL ────────────────────────────────────── */}
        {isDeleteModalOpen && selectedOrder && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl border border-red-200 w-full max-w-md p-6 text-center animate-in fade-in zoom-in-95 duration-200">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 font-grotesk mb-2">Delete WhatsApp Order?</h3>
              <p className="text-xs text-gray-600 font-inter mb-6">
                Are you sure you want to permanently delete order{" "}
                <strong>#{selectedOrder.invoiceNumber || selectedOrder.orderId}</strong> for{" "}
                <strong>{selectedOrder.customer?.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 font-bold font-grotesk text-xs uppercase tracking-wider transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold font-grotesk text-xs uppercase tracking-wider shadow-md transition-all active:scale-95"
                >
                  Yes, Delete Order
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── RETURN / REFUND PROCESSING MODAL ────────────────────────────── */}
        {isReturnModalOpen && returnTargetOrder && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl border border-rose-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              
              {/* Header */}
              <div className="px-6 py-5 bg-gradient-to-r from-rose-50 to-orange-50 border-b border-rose-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-md">
                    <span className="text-lg">🔄</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-rose-800 font-bold tracking-widest uppercase font-grotesk">
                      Return Order & Resolution
                    </span>
                    <h3 className="text-lg font-black text-[#1C1A16] font-soria">
                      Invoice #{returnTargetOrder.invoiceNumber || returnTargetOrder.orderId}
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsReturnModalOpen(false)}
                  className="w-9 h-9 rounded-xl bg-white hover:bg-rose-100 text-gray-500 hover:text-rose-700 flex items-center justify-center transition-colors shadow-xs"
                >
                  ✕
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmitReturn} className="p-6 space-y-5 font-inter text-xs">
                
                {/* Customer summary */}
                <div className="bg-[#FDFBF7] p-3.5 rounded-2xl border border-yellow-500/15 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase font-grotesk block">Customer</span>
                    <span className="font-bold text-gray-900 text-sm">{returnTargetOrder.customer?.name}</span>
                    <span className="text-gray-500 text-[11px] block">{returnTargetOrder.customer?.mobileNumber}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-gray-500 font-bold uppercase font-grotesk block">Order Value</span>
                    <span className="font-soria text-lg font-black text-yellow-900">₹{returnTargetOrder.totalAmount || 0}</span>
                  </div>
                </div>

                {/* Resolution Type: Refund vs Re-Order */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase font-grotesk mb-2">
                    Resolution Type *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setReturnFormData({ ...returnFormData, returnType: "Refund" })}
                      className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                        returnFormData.returnType === "Refund"
                          ? "bg-rose-50 border-rose-500 text-rose-950 ring-2 ring-rose-400/20 shadow-xs"
                          : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <span className="text-xl">💰</span>
                      <div>
                        <span className="font-bold font-grotesk text-xs block">Refund Money</span>
                        <span className="text-[11px] text-gray-500 block mt-0.5">Pay customer refund money for return</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setReturnFormData({ ...returnFormData, returnType: "Re-Order" })}
                      className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                        returnFormData.returnType === "Re-Order"
                          ? "bg-blue-50 border-blue-500 text-blue-950 ring-2 ring-blue-400/20 shadow-xs"
                          : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <span className="text-xl">🔁</span>
                      <div>
                        <span className="font-bold font-grotesk text-xs block">Re-Order / Replacement</span>
                        <span className="text-[11px] text-gray-500 block mt-0.5">Ship replacement or reschedule order</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Conditional Resolution Fields */}
                {returnFormData.returnType === "Refund" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-rose-50/50 p-4 rounded-2xl border border-rose-100">
                    <div>
                      <label className="block text-[11px] font-bold text-rose-900 uppercase font-grotesk mb-1">
                        Refund Amount (₹) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={returnFormData.refundAmount}
                        onChange={(e) => setReturnFormData({ ...returnFormData, refundAmount: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-white border border-rose-200 rounded-xl font-mono font-bold text-rose-900 focus:outline-hidden focus:border-rose-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-rose-900 uppercase font-grotesk mb-1">
                        Refund Status *
                      </label>
                      <select
                        value={returnFormData.refundStatus}
                        onChange={(e) => setReturnFormData({ ...returnFormData, refundStatus: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-white border border-rose-200 rounded-xl font-grotesk font-bold text-gray-800 focus:outline-hidden focus:border-rose-500"
                      >
                        <option value="Pending">⏳ Pending Refund</option>
                        <option value="Completed">✅ Refund Completed / Paid</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 space-y-1">
                    <label className="block text-[11px] font-bold text-blue-900 uppercase font-grotesk mb-1">
                      Replacement / Re-Order Notes
                    </label>
                    <textarea
                      rows={2}
                      value={returnFormData.reorderNotes}
                      onChange={(e) => setReturnFormData({ ...returnFormData, reorderNotes: e.target.value })}
                      placeholder="e.g. Reshipping 100ml hair oil tomorrow via courier with revised address..."
                      className="w-full px-3 py-2 text-xs bg-white border border-blue-200 rounded-xl font-inter text-gray-800 focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                )}

                {/* Return Reason */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase font-grotesk mb-1">
                    Reason for Return / RTO *
                  </label>
                  <select
                    value={returnFormData.returnReason}
                    onChange={(e) => setReturnFormData({ ...returnFormData, returnReason: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl font-grotesk font-medium text-gray-800 focus:outline-hidden focus:border-yellow-500"
                  >
                    <option value="Customer Refused / RTO">Customer Refused / RTO at Doorstep</option>
                    <option value="Address Not Found / Undelivered">Address Not Found / Undelivered Courier</option>
                    <option value="Customer Cancelled After Dispatch">Customer Cancelled After Dispatch</option>
                    <option value="Damaged in Transit / Defective">Damaged in Transit / Defective Item</option>
                    <option value="Wrong Item Dispatched">Wrong Item Dispatched</option>
                    <option value="Other Reason">Other Reason</option>
                  </select>
                </div>

                {/* Additional Notes */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase font-grotesk mb-1">
                    Return Notes & Remarks (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={returnFormData.returnNotes}
                    onChange={(e) => setReturnFormData({ ...returnFormData, returnNotes: e.target.value })}
                    placeholder="Enter any additional remarks, transaction ID, or courier return tracking number..."
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl font-inter text-gray-800 focus:outline-hidden focus:border-yellow-500"
                  />
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsReturnModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 font-bold font-grotesk text-xs uppercase tracking-wider transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReturn}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold font-grotesk text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {submittingReturn ? (
                      <>
                        <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Saving Return...
                      </>
                    ) : (
                      "Save Return & Resolution"
                    )}
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* ── BULK IMPORT MODAL ────────────────────────────────────────────── */}
        <WhatsAppBulkImportModal
          isOpen={isBulkModalOpen}
          onClose={() => setIsBulkModalOpen(false)}
          onImportSuccess={fetchOrders}
        />

      </div>
    </AdminLayout>
  );
}

