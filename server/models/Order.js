const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  customer: {
    name: String,
    email: String,
    phone: String,
    altPhone: String,
    address: {
      door: String,
      street: String,
      landmark: String,
      district: String,
      state: String,
      pincode: String
    }
  },
  items: [
    {
      name: String,
      size: String,
      price: Number,
      quantity: Number
    }
  ],
  totalAmount: Number,
  shippingAmount: { type: Number, default: 0 },
  paymentId: { type: String, default: "" },
  paymentStatus: { type: String, enum: ["PENDING", "PAID"], default: "PENDING" },
  orderStatus: { 
    type: String, 
    enum: ["Pending", "Packed", "Shipped", "Delivered", "Cancelled"], 
    default: "Pending" 
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Order", orderSchema);
