const WhatsAppOrder = require("../models/WhatsAppOrder");
const Product = require("../models/Product");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

// Helper to generate unique orderId
async function generateUniqueOrderId() {
  let unique = false;
  let orderId = "";
  while (!unique) {
    orderId = "WA" + Math.floor(10000000 + Math.random() * 90000000).toString();
    const existing = await WhatsAppOrder.findOne({ orderId });
    if (!existing) {
      unique = true;
    }
  }
  return orderId;
}

// Helper to generate unique invoiceNumber
async function generateUniqueInvoiceNumber() {
  let unique = false;
  let invoiceNumber = "";
  const year = new Date().getFullYear();
  while (!unique) {
    const randomSuffix = Math.floor(100000 + Math.random() * 900000).toString();
    invoiceNumber = `KAH-WA-${year}-${randomSuffix}`;
    const existing = await WhatsAppOrder.findOne({ invoiceNumber });
    if (!existing) {
      unique = true;
    }
  }
  return invoiceNumber;
}

// Helper to sanitize and normalize phone numbers (10 digits)
function sanitizePhone(phone) {
  if (!phone) return "";
  const cleaned = String(phone).replace(/\D/g, "");
  if (cleaned.length === 10) return cleaned;
  if (cleaned.length === 12 && cleaned.startsWith("91")) return cleaned.slice(2);
  if (cleaned.length > 10) return cleaned.slice(-10);
  return cleaned;
}

// 1. Get all WhatsApp Orders with filters, search, and dashboard summary
exports.getAllWhatsAppOrders = async (req, res) => {
  try {
    const { status, search, startDate, endDate } = req.query;
    const query = {};

    if (status && status !== "all") {
      query.orderStatus = status;
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.orderDate = { $gte: start, $lte: end };
    }

    let orders = await WhatsAppOrder.find(query).sort({ orderDate: -1, createdAt: -1 });

    // In-memory multi-field search for instant fuzzy matching
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      orders = orders.filter((o) => {
        const name = o.customer?.name?.toLowerCase() || "";
        const mobile = o.customer?.mobileNumber || "";
        const wa = o.customer?.whatsappNumber || "";
        const addr = o.customer?.address?.fullAddress?.toLowerCase() || "";
        const oId = o.orderId?.toLowerCase() || "";
        const inv = o.invoiceNumber?.toLowerCase() || "";
        const itemsStr = (o.items || []).map((i) => i.name.toLowerCase()).join(" ");

        return (
          name.includes(q) ||
          mobile.includes(q) ||
          wa.includes(q) ||
          addr.includes(q) ||
          oId.includes(q) ||
          inv.includes(q) ||
          itemsStr.includes(q)
        );
      });
    }

    // Compute stats
    const allOrders = await WhatsAppOrder.find();
    const stats = {
      totalOrders: allOrders.length,
      totalRevenue: allOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0),
      pendingOrders: allOrders.filter((o) => o.orderStatus === "Pending").length,
      deliveredOrders: allOrders.filter((o) => o.orderStatus === "Delivered").length,
      shippedOrders: allOrders.filter((o) => o.orderStatus === "Shipped").length
    };

    res.json({
      success: true,
      count: orders.length,
      orders,
      stats
    });
  } catch (error) {
    console.error("Error fetching WhatsApp orders:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// 2. Get single WhatsApp Order
exports.getWhatsAppOrder = async (req, res) => {
  try {
    const order = await WhatsAppOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "WhatsApp Order not found" });
    }
    res.json({ success: true, order });
  } catch (error) {
    console.error("Error fetching WhatsApp order:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// 3. Create WhatsApp Order
exports.createWhatsAppOrder = async (req, res) => {
  try {
    const {
      customer,
      items,
      totalAmount,
      shippingAmount,
      orderStatus,
      paymentStatus,
      paymentMethod,
      invoiceNumber: customInvoiceNo,
      notes,
      orderDate
    } = req.body;

    // Validation
    if (!customer || !customer.name || !customer.name.trim()) {
      return res.status(400).json({ success: false, message: "Customer name is required" });
    }

    const cleanMobile = sanitizePhone(customer.mobileNumber);
    const cleanWhatsApp = sanitizePhone(customer.whatsappNumber || customer.mobileNumber);

    if (!cleanMobile || cleanMobile.length !== 10) {
      return res.status(400).json({ success: false, message: "A valid 10-digit mobile number is required" });
    }

    if (!cleanWhatsApp || cleanWhatsApp.length !== 10) {
      return res.status(400).json({ success: false, message: "A valid 10-digit WhatsApp number is required" });
    }

    const fullAddress =
      typeof customer.address === "string"
        ? customer.address.trim()
        : customer.address?.fullAddress ||
          [
            customer.address?.door,
            customer.address?.street,
            customer.address?.landmark,
            customer.address?.district,
            customer.address?.state,
            customer.address?.pincode
          ]
            .filter(Boolean)
            .join(", ");

    if (!fullAddress || !fullAddress.trim()) {
      return res.status(400).json({ success: false, message: "Customer address is required" });
    }

    // Validate items
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "At least one product item is required" });
    }

    const formattedItems = items.map((item) => {
      const price = Number(item.price) || 0;
      const quantity = Math.max(1, Number(item.quantity) || 1);
      return {
        productId: item.productId || null,
        name: item.name ? item.name.trim() : "Herbal Product",
        size: item.size ? item.size.trim() : "Standard",
        price,
        quantity,
        total: Number(item.total) || price * quantity
      };
    });

    const calculatedSubtotal = formattedItems.reduce((acc, curr) => acc + curr.total, 0);
    const finalShipping = Number(shippingAmount) || 0;
    const finalTotal = Number(totalAmount) || calculatedSubtotal + finalShipping;

    // Generate unique orderId
    const orderId = await generateUniqueOrderId();

    // Check or generate unique invoiceNumber
    let invoiceNumber = customInvoiceNo ? customInvoiceNo.trim() : null;
    if (invoiceNumber) {
      const existing = await WhatsAppOrder.findOne({ invoiceNumber });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `Invoice number "${invoiceNumber}" is already in use. Please use a unique invoice number or let the system generate one.`
        });
      }
    } else {
      invoiceNumber = await generateUniqueInvoiceNumber();
    }

    const newOrder = new WhatsAppOrder({
      orderId,
      invoiceNumber,
      invoiceStatus: "GENERATED",
      customer: {
        name: customer.name.trim(),
        mobileNumber: cleanMobile,
        whatsappNumber: cleanWhatsApp,
        email: customer.email ? customer.email.trim() : "",
        address: {
          door: customer.address?.door || "",
          street: customer.address?.street || "",
          landmark: customer.address?.landmark || "",
          district: customer.address?.district || "",
          state: customer.address?.state || "",
          pincode: customer.address?.pincode || "",
          fullAddress
        }
      },
      items: formattedItems,
      totalAmount: finalTotal,
      shippingAmount: finalShipping,
      orderStatus: orderStatus || "Pending",
      paymentStatus: paymentStatus || "PAID",
      paymentMethod: paymentMethod || "WhatsApp / Direct UPI",
      notes: notes ? notes.trim() : "",
      orderDate: orderDate ? new Date(orderDate) : new Date()
    });

    await newOrder.save();

    res.status(201).json({
      success: true,
      message: "WhatsApp order created successfully",
      order: newOrder
    });
  } catch (error) {
    console.error("Error creating WhatsApp order:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// 4. Update WhatsApp Order
exports.updateWhatsAppOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      customer,
      items,
      totalAmount,
      shippingAmount,
      orderStatus,
      paymentStatus,
      paymentMethod,
      invoiceNumber,
      invoiceStatus,
      notes,
      orderDate
    } = req.body;

    const existingOrder = await WhatsAppOrder.findById(id);
    if (!existingOrder) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Check if new invoiceNumber conflicts with another order
    if (invoiceNumber && invoiceNumber !== existingOrder.invoiceNumber) {
      const duplicateInv = await WhatsAppOrder.findOne({ invoiceNumber, _id: { $ne: id } });
      if (duplicateInv) {
        return res.status(400).json({
          success: false,
          message: `Invoice number "${invoiceNumber}" is already in use by another order.`
        });
      }
      existingOrder.invoiceNumber = invoiceNumber.trim();
    }

    if (customer) {
      if (customer.name) existingOrder.customer.name = customer.name.trim();
      if (customer.mobileNumber) existingOrder.customer.mobileNumber = sanitizePhone(customer.mobileNumber);
      if (customer.whatsappNumber) existingOrder.customer.whatsappNumber = sanitizePhone(customer.whatsappNumber);
      if (customer.email !== undefined) existingOrder.customer.email = customer.email ? customer.email.trim() : "";

      const fullAddress =
        typeof customer.address === "string"
          ? customer.address.trim()
          : customer.address?.fullAddress ||
            [
              customer.address?.door,
              customer.address?.street,
              customer.address?.landmark,
              customer.address?.district,
              customer.address?.state,
              customer.address?.pincode
            ]
              .filter(Boolean)
              .join(", ");

      if (fullAddress) {
        existingOrder.customer.address.fullAddress = fullAddress;
      }
      if (typeof customer.address === "object") {
        if (customer.address.door !== undefined) existingOrder.customer.address.door = customer.address.door;
        if (customer.address.street !== undefined) existingOrder.customer.address.street = customer.address.street;
        if (customer.address.landmark !== undefined) existingOrder.customer.address.landmark = customer.address.landmark;
        if (customer.address.district !== undefined) existingOrder.customer.address.district = customer.address.district;
        if (customer.address.state !== undefined) existingOrder.customer.address.state = customer.address.state;
        if (customer.address.pincode !== undefined) existingOrder.customer.address.pincode = customer.address.pincode;
      }
    }

    if (Array.isArray(items) && items.length > 0) {
      existingOrder.items = items.map((item) => {
        const price = Number(item.price) || 0;
        const quantity = Math.max(1, Number(item.quantity) || 1);
        return {
          productId: item.productId || null,
          name: item.name ? item.name.trim() : "Herbal Product",
          size: item.size ? item.size.trim() : "Standard",
          price,
          quantity,
          total: Number(item.total) || price * quantity
        };
      });
    }

    if (shippingAmount !== undefined) existingOrder.shippingAmount = Number(shippingAmount) || 0;
    if (totalAmount !== undefined) {
      existingOrder.totalAmount = Number(totalAmount) || 0;
    } else if (items) {
      existingOrder.totalAmount =
        existingOrder.items.reduce((acc, curr) => acc + curr.total, 0) + existingOrder.shippingAmount;
    }

    if (orderStatus) existingOrder.orderStatus = orderStatus;
    if (paymentStatus) existingOrder.paymentStatus = paymentStatus;
    if (paymentMethod) existingOrder.paymentMethod = paymentMethod;
    if (invoiceStatus) existingOrder.invoiceStatus = invoiceStatus;
    if (notes !== undefined) existingOrder.notes = notes ? notes.trim() : "";
    if (orderDate) existingOrder.orderDate = new Date(orderDate);

    await existingOrder.save();

    res.json({
      success: true,
      message: "WhatsApp order updated successfully",
      order: existingOrder
    });
  } catch (error) {
    console.error("Error updating WhatsApp order:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// 5. Delete WhatsApp Order
exports.deleteWhatsAppOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await WhatsAppOrder.findByIdAndDelete(id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    res.json({ success: true, message: `Order #${order.orderId} deleted successfully` });
  } catch (error) {
    console.error("Error deleting WhatsApp order:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// 6. Bulk Import: Validation Preview & Commit
exports.bulkImportWhatsAppOrders = async (req, res) => {
  try {
    const { action, records } = req.body;

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, message: "No records provided for import" });
    }

    // Existing invoice numbers and mobile numbers to prevent accidental duplication
    const existingOrders = await WhatsAppOrder.find({}, { invoiceNumber: 1, orderId: 1, "customer.mobileNumber": 1 });
    const existingInvoices = new Set(existingOrders.map((o) => o.invoiceNumber.toLowerCase()));
    const seenBatchInvoices = new Set();
    const seenBatchPhones = new Set();

    const validatedRows = [];
    let validCount = 0;
    let invalidCount = 0;

    for (let index = 0; index < records.length; index++) {
      const row = records[index];
      const errors = [];

      const customerName = (row["Customer Name"] || row["customerName"] || row["name"] || "").toString().trim();
      const rawAddress = (row["Address"] || row["address"] || row["Customer Address"] || "").toString().trim();
      const rawMobile = (row["Mobile Number"] || row["mobileNumber"] || row["mobile"] || row["Phone"] || "").toString().trim();
      const rawWhatsApp = (
        row["WhatsApp Number"] ||
        row["whatsappNumber"] ||
        row["whatsapp"] ||
        rawMobile
      ).toString().trim();
      const rawPlacedOrder = (
        row["Placed Order"] ||
        row["placedOrder"] ||
        row["Items"] ||
        row["products"] ||
        ""
      ).toString().trim();
      const rawTotal = row["Total Amount"] || row["totalAmount"] || row["Amount"] || row["total"];
      const rawOrderDate = row["Order Date"] || row["orderDate"] || row["Date"];
      const rawInvoiceNo = (row["Invoice Number"] || row["invoiceNumber"] || "").toString().trim();
      const invoiceStatus = (row["Invoice Status"] || row["invoiceStatus"] || "GENERATED").toString().trim();

      // 1. Validate Customer Name
      if (!customerName) {
        errors.push("Customer Name is missing");
      }

      // 2. Validate Address
      if (!rawAddress) {
        errors.push("Address is missing");
      }

      // 3. Validate Mobile Number (10 digits)
      const cleanMobile = sanitizePhone(rawMobile);
      if (!cleanMobile || cleanMobile.length !== 10) {
        errors.push(`Invalid Mobile Number (${rawMobile || "blank"}). Must be 10 digits`);
      }

      // 4. Validate WhatsApp Number
      const cleanWhatsApp = sanitizePhone(rawWhatsApp);
      if (!cleanWhatsApp || cleanWhatsApp.length !== 10) {
        errors.push(`Invalid WhatsApp Number (${rawWhatsApp || "blank"}). Must be 10 digits`);
      }

      // 5. Validate Total Amount
      const parsedTotal = Number(String(rawTotal).replace(/[^0-9.]/g, ""));
      if (isNaN(parsedTotal) || parsedTotal < 0) {
        errors.push(`Invalid Total Amount (${rawTotal || "blank"})`);
      }

      // 6. Validate Invoice Number Uniqueness
      if (rawInvoiceNo) {
        const lowerInv = rawInvoiceNo.toLowerCase();
        if (existingInvoices.has(lowerInv)) {
          errors.push(`Invoice #${rawInvoiceNo} already exists in database`);
        } else if (seenBatchInvoices.has(lowerInv)) {
          errors.push(`Duplicate Invoice #${rawInvoiceNo} within upload file`);
        } else {
          seenBatchInvoices.add(lowerInv);
        }
      }

      // 7. Parse Placed Order items or provide standard item fallback
      const parsedItems = [];
      if (rawPlacedOrder) {
        // Support syntax like: "Herbal Oil (200ml) x2 @ 450 | Shampoo (100ml) x1 @ 250"
        const segments = rawPlacedOrder.split(/\||\n/).map((s) => s.trim()).filter(Boolean);
        segments.forEach((seg) => {
          const match = seg.match(/^(.+?)(?:\s*\((.*?)\))?(?:\s*x(\d+))?(?:\s*@?\s*₹?(\d+(?:\.\d+)?))?$/i);
          if (match) {
            const name = match[1]?.trim() || "Herbal Product";
            const size = match[2]?.trim() || "Standard";
            const qty = Number(match[3]) || 1;
            const price = Number(match[4]) || Math.round((parsedTotal || 0) / Math.max(1, segments.length));
            parsedItems.push({
              name,
              size,
              quantity: qty,
              price,
              total: qty * price
            });
          } else {
            parsedItems.push({
              name: seg,
              size: "Standard",
              quantity: 1,
              price: parsedTotal || 0,
              total: parsedTotal || 0
            });
          }
        });
      }

      if (parsedItems.length === 0) {
        parsedItems.push({
          name: "Herbal Care Order",
          size: "Standard",
          quantity: 1,
          price: parsedTotal || 0,
          total: parsedTotal || 0
        });
      }

      // Check intra-file duplicate customer / mobile warnings
      if (cleanMobile) {
        if (seenBatchPhones.has(cleanMobile)) {
          // Warning or note for duplicate customer phone in same batch
          row.isDuplicateWarning = true;
        } else {
          seenBatchPhones.add(cleanMobile);
        }
      }

      const isValid = errors.length === 0;
      if (isValid) validCount++;
      else invalidCount++;

      validatedRows.push({
        rowIndex: index + 1,
        isValid,
        errors,
        customerName,
        address: rawAddress,
        mobileNumber: cleanMobile,
        whatsappNumber: cleanWhatsApp,
        placedOrder: rawPlacedOrder,
        items: parsedItems,
        totalAmount: isNaN(parsedTotal) ? 0 : parsedTotal,
        orderDate: rawOrderDate ? new Date(rawOrderDate) : new Date(),
        invoiceNumber: rawInvoiceNo,
        invoiceStatus: invoiceStatus || "GENERATED"
      });
    }

    // If action is preview/validate, return rows with validation statuses
    if (action !== "save") {
      return res.json({
        success: true,
        previewOnly: true,
        totalRecords: records.length,
        validCount,
        invalidCount,
        records: validatedRows
      });
    }

    // Action is "save" -> commit all valid records to DB
    const validRowsToInsert = validatedRows.filter((r) => r.isValid);
    if (validRowsToInsert.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid records to import. Please review validation errors."
      });
    }

    const docsToInsert = [];
    const year = new Date().getFullYear();

    for (let i = 0; i < validRowsToInsert.length; i++) {
      const item = validRowsToInsert[i];
      const orderId = "WA" + Math.floor(10000000 + Math.random() * 90000000).toString();
      const invNo = item.invoiceNumber || `KAH-WA-${year}-${Math.floor(100000 + Math.random() * 900000)}`;

      docsToInsert.push({
        orderId,
        invoiceNumber: invNo,
        invoiceStatus: item.invoiceStatus || "GENERATED",
        customer: {
          name: item.customerName,
          mobileNumber: item.mobileNumber,
          whatsappNumber: item.whatsappNumber,
          email: "",
          address: {
            fullAddress: item.address
          }
        },
        items: item.items,
        totalAmount: item.totalAmount,
        shippingAmount: 0,
        orderStatus: "Pending",
        paymentStatus: "PAID",
        paymentMethod: "Bulk Excel/CSV Import",
        orderDate: item.orderDate || new Date()
      });
    }

    const insertedOrders = await WhatsAppOrder.insertMany(docsToInsert);

    res.json({
      success: true,
      message: `Successfully imported and created ${insertedOrders.length} WhatsApp order(s)!`,
      importedCount: insertedOrders.length,
      orders: insertedOrders
    });
  } catch (error) {
    console.error("Error bulk importing WhatsApp orders:", error);
    res.status(500).json({ success: false, message: "Bulk import failed", error: error.message });
  }
};

// 7. Generate a 20-Minute Secure Expiring Token for WhatsApp Invoice Link
exports.getInvoiceShareToken = async (req, res) => {
  try {
    const { id } = req.params;
    let order;
    if (mongoose.Types.ObjectId.isValid(id)) {
      order = await WhatsAppOrder.findById(id);
    }
    if (!order) {
      order = (await WhatsAppOrder.findOne({ orderId: id })) || (await WhatsAppOrder.findOne({ invoiceNumber: id }));
    }

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const secret = process.env.JWT_SECRET || "kala_agalya_jwt_secret";
    // Sign token with 20 minutes validity
    const token = jwt.sign(
      {
        orderId: order.orderId,
        invoiceNumber: order.invoiceNumber,
        type: "whatsapp_invoice"
      },
      secret,
      { expiresIn: "20m" }
    );

    const expTime = Date.now() + 20 * 60 * 1000;

    res.json({
      success: true,
      token,
      expiresAt: expTime,
      expiresInMinutes: 20,
      orderId: order.orderId
    });
  } catch (error) {
    console.error("Error generating invoice share token:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

