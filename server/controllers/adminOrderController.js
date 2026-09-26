const Order = require("../models/Order");
const Product = require("../models/Product");

// Get all orders
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get single order
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus, returnReason, returnNotes } = req.body;
    
    const updateData = { 
      orderStatus, 
      updatedAt: Date.now() 
    };

    if (orderStatus === "Returned") {
      updateData.returnedAt = new Date();
      if (returnReason) updateData.returnReason = returnReason;
      if (returnNotes) updateData.returnNotes = returnNotes;
    }
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Manually mark an order as PAID (admin override for stuck payments)
exports.markOrderAsPaid = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        paymentStatus: "PAID",
        paymentDate: new Date(),
        updatedAt: Date.now()
      },
      { new: true }
    );
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Process / Record refund for an order
exports.processRefund = async (req, res) => {
  try {
    const { refundAmount, refundNote, refundTransactionId, orderStatus } = req.body;
    
    const existingOrder = await Order.findById(req.params.id);
    if (!existingOrder) return res.status(404).json({ success: false, message: "Order not found" });

    const updateData = {
      paymentStatus: "REFUNDED",
      refundAmount: Number(refundAmount) || existingOrder.totalAmount,
      refundDate: new Date(),
      refundNote: refundNote ? refundNote.trim() : "Amount refunded to customer",
      refundTransactionId: refundTransactionId ? refundTransactionId.trim() : "",
      updatedAt: Date.now()
    };

    if (orderStatus) {
      updateData.orderStatus = orderStatus;
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json({ success: true, order, message: "Refund processed successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Save courier tracking number and URL
exports.updateTracking = async (req, res) => {
  try {
    const { trackingNumber, trackingUrl } = req.body;

    if (!trackingNumber || !trackingNumber.trim()) {
      return res.status(400).json({ success: false, message: "Tracking number is required" });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        trackingNumber: trackingNumber.trim(),
        trackingUrl: trackingUrl ? trackingUrl.trim() : "",
        updatedAt: Date.now()
      },
      { new: true }
    );

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    // Use IST (UTC+5:30) for "today" boundary
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // 5h 30m in ms
    const istNow = new Date(now.getTime() + istOffset);
    const todayIST = new Date(Date.UTC(
      istNow.getUTCFullYear(),
      istNow.getUTCMonth(),
      istNow.getUTCDate(),
      0, 0, 0, 0
    ));
    // Convert IST midnight back to UTC for DB query
    const todayStart = new Date(todayIST.getTime() - istOffset);

    const [
      totalOrders,
      paidSalesAgg,
      todayOrders,
      pendingOrders,
      paidOrders,
      todayPendingOrders,
      todayPaidOrders
    ] = await Promise.all([
      Order.countDocuments(),
      Order.aggregate([
        { $match: { paymentStatus: "PAID" } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } }
      ]),
      Order.countDocuments({ createdAt: { $gte: todayStart } }),
      Order.countDocuments({ paymentStatus: "PENDING" }),
      Order.countDocuments({ paymentStatus: "PAID" }),
      Order.countDocuments({ paymentStatus: "PENDING", createdAt: { $gte: todayStart } }),
      Order.countDocuments({ paymentStatus: "PAID", createdAt: { $gte: todayStart } })
    ]);

    res.json({
      success: true,
      stats: {
        totalOrders,
        totalSales: paidSalesAgg[0]?.total || 0,
        todayOrders,
        pendingOrders,
        paidOrders,
        todayPendingOrders,
        todayPaidOrders
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// Get sales chart data
exports.getSalesChartData = async (req, res) => {
  try {
    const { period } = req.query; // 'daily' or 'monthly'
    
    let groupBy;
    if (period === 'monthly') {
      groupBy = {
        year: { $year: { date: "$createdAt", timezone: "+05:30" } },
        month: { $month: { date: "$createdAt", timezone: "+05:30" } }
      };
    } else {
      groupBy = {
        year: { $year: { date: "$createdAt", timezone: "+05:30" } },
        month: { $month: { date: "$createdAt", timezone: "+05:30" } },
        day: { $dayOfMonth: { date: "$createdAt", timezone: "+05:30" } }
      };
    }

    const sortDesc = period === 'monthly'
      ? { "_id.year": -1, "_id.month": -1 }
      : { "_id.year": -1, "_id.month": -1, "_id.day": -1 };

    const sortAsc = period === 'monthly'
      ? { "_id.year": 1, "_id.month": 1 }
      : { "_id.year": 1, "_id.month": 1, "_id.day": 1 };

    const limitCount = period === 'monthly' ? 12 : 30;
    
    const salesData = await Order.aggregate([
      {
        $match: {
          paymentStatus: "PAID"
        }
      },
      {
        $group: {
          _id: groupBy,
          totalSales: { $sum: "$totalAmount" },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: sortDesc },
      { $limit: limitCount },
      { $sort: sortAsc }
    ]);
    
    res.json({ success: true, salesData });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get reports by date range
exports.getReports = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = {};
    if (startDate && endDate) {
      // Explicitly construct IST (+05:30) boundaries so Railway/UTC server filters exact Indian calendar days
      const start = new Date(`${startDate}T00:00:00.000+05:30`);
      const end = new Date(`${endDate}T23:59:59.999+05:30`);
      query.createdAt = { $gte: start, $lte: end };
    }
    
    const orders = await Order.find(query).sort({ createdAt: -1 });
    
    // Only calculate sales & product volumes from PAID orders
    const paidOrders = orders.filter(o => o.paymentStatus === "PAID");
    const totalSales = paidOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    
    // Get all active products to ensure even 0-sale products are listed
    const allProducts = await Product.find({ isActive: true });
    
    // Get best-selling products
    const productSales = {};
    
    // Initialize with 0
    allProducts.forEach(prod => {
      if (prod.sizes && prod.sizes.length > 0) {
        prod.sizes.forEach(size => {
          const key = `${prod.name || "Unknown Product"} - ${size.size || "N/A"}`;
          productSales[key] = { name: key, quantity: 0, revenue: 0 };
        });
      }
    });

    paidOrders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          const name = item.name || "Unknown Product";
          const size = item.size || "N/A";
          const key = `${name} - ${size}`;
          if (!productSales[key]) {
            productSales[key] = { name: key, quantity: 0, revenue: 0 };
          }
          const qty = Number(item.quantity) || 0;
          const price = Number(item.price) || 0;
          productSales[key].quantity += qty;
          productSales[key].revenue += price * qty;
        });
      }
    });
    
    const bestSelling = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity);
    
    res.json({
      success: true,
      report: {
        totalOrders: orders.length,
        paidOrdersCount: paidOrders.length,
        totalSales,
        bestSelling,
        orders
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all returned orders
exports.getReturnedOrders = async (req, res) => {
  try {
    const orders = await Order.find({ orderStatus: "Returned" }).sort({ returnedAt: -1, updatedAt: -1, createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get return reports and product return breakdown by variant/bottle size
exports.getReturnReports = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = { orderStatus: "Returned" };
    if (startDate && endDate) {
      const start = new Date(`${startDate}T00:00:00.000+05:30`);
      const end = new Date(`${endDate}T23:59:59.999+05:30`);
      // Match by returnedAt if available, otherwise createdAt
      query.$or = [
        { returnedAt: { $gte: start, $lte: end } },
        { returnedAt: null, updatedAt: { $gte: start, $lte: end } }
      ];
    }
    
    const orders = await Order.find(query).sort({ returnedAt: -1, updatedAt: -1, createdAt: -1 });
    
    const totalReturnedOrders = orders.length;
    const totalReturnedAmount = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    
    // Group returned items by Product and Bottle Size / Variant (e.g. 100ml = 2 bottles)
    const productReturns = {};
    let totalReturnedUnits = 0;

    orders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          const name = item.name || "Unknown Product";
          const size = item.size || "Standard";
          const key = `${name} - ${size}`;
          const qty = Number(item.quantity) || 0;
          const price = Number(item.price) || 0;
          const totalItemPrice = price * qty;

          totalReturnedUnits += qty;

          if (!productReturns[key]) {
            productReturns[key] = {
              key,
              productName: name,
              bottleSize: size,
              displayName: `${name} (${size})`,
              quantity: 0,
              totalAmount: 0,
              ordersCount: 0
            };
          }
          productReturns[key].quantity += qty;
          productReturns[key].totalAmount += totalItemPrice;
          productReturns[key].ordersCount += 1;
        });
      }
    });

    const returnedProductsBreakdown = Object.values(productReturns)
      .sort((a, b) => b.quantity - a.quantity);

    res.json({
      success: true,
      report: {
        totalReturnedOrders,
        totalReturnedAmount,
        totalReturnedUnits,
        returnedProductsBreakdown,
        orders
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

