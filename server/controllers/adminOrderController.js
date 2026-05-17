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
    const { orderStatus } = req.body;
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { orderStatus, updatedAt: Date.now() },
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

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const totalSales = await Order.aggregate([
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayOrders = await Order.countDocuments({
      createdAt: { $gte: today }
    });
    
    const pendingOrders = await Order.countDocuments({
      orderStatus: "Pending"
    });
    
    res.json({
      success: true,
      stats: {
        totalOrders,
        totalSales: totalSales[0]?.total || 0,
        todayOrders,
        pendingOrders
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
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" }
      };
    } else {
      groupBy = {
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" },
        day: { $dayOfMonth: "$createdAt" }
      };
    }
    
    const salesData = await Order.aggregate([
      {
        $group: {
          _id: groupBy,
          totalSales: { $sum: "$totalAmount" },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
      { $limit: 30 }
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
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const orders = await Order.find(query).sort({ createdAt: -1 });
    
    const totalSales = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    
    // Get all active products to ensure even 0-sale products are listed
    const allProducts = await Product.find({ isActive: true });
    
    // Get best-selling products
    const productSales = {};
    
    // Initialize with 0
    allProducts.forEach(prod => {
      if (prod.sizes && prod.sizes.length > 0) {
        prod.sizes.forEach(size => {
          const key = `${prod.name} - ${size.size}`;
          productSales[key] = { name: key, quantity: 0, revenue: 0 };
        });
      }
    });

    orders.forEach(order => {
      order.items.forEach(item => {
        const key = `${item.name} - ${item.size}`;
        if (!productSales[key]) {
          productSales[key] = { name: key, quantity: 0, revenue: 0 };
        }
        productSales[key].quantity += item.quantity;
        productSales[key].revenue += item.price * item.quantity;
      });
    });
    
    const bestSelling = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity);
    
    res.json({
      success: true,
      report: {
        totalOrders: orders.length,
        totalSales,
        bestSelling,
        orders
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
