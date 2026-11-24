const mongoose = require("mongoose");

const whatsappOrderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true,
      required: true,
      index: true
    },
    invoiceNumber: {
      type: String,
      unique: true,
      required: true,
      index: true
    },
    invoiceStatus: {
      type: String,
      enum: ["GENERATED", "PENDING", "SENT"],
      default: "GENERATED"
    },
    customer: {
      name: {
        type: String,
        required: [true, "Customer name is required"],
        trim: true
      },
      mobileNumber: {
        type: String,
        required: [true, "Mobile number is required"],
        trim: true
      },
      whatsappNumber: {
        type: String,
        required: [true, "WhatsApp number is required"],
        trim: true
      },
      email: {
        type: String,
        trim: true,
        default: ""
      },
      address: {
        door: { type: String, default: "" },
        street: { type: String, default: "" },
        landmark: { type: String, default: "" },
        district: { type: String, default: "" },
        state: { type: String, default: "" },
        pincode: { type: String, default: "" },
        fullAddress: { type: String, required: [true, "Customer address is required"] }
      }
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          default: null
        },
        name: {
          type: String,
          required: [true, "Item name is required"]
        },
        size: {
          type: String,
          default: "Standard"
        },
        quantity: {
          type: Number,
          required: [true, "Quantity is required"],
          min: [1, "Quantity must be at least 1"],
          default: 1
        },
        price: {
          type: Number,
          required: [true, "Price is required"],
          min: [0, "Price cannot be negative"]
        },
        total: {
          type: Number,
          required: true
        }
      }
    ],
    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [0, "Total amount cannot be negative"]
    },
    shippingAmount: {
      type: Number,
      default: 0
    },
    orderStatus: {
      type: String,
      enum: ["Pending", "Packed", "Shipped", "Delivered", "Cancelled", "Returned"],
      default: "Pending"
    },
    paymentStatus: {
      type: String,
      enum: ["PAID", "PENDING"],
      default: "PAID"
    },
    paymentMethod: {
      type: String,
      default: "WhatsApp / Direct UPI"
    },
    notes: {
      type: String,
      default: ""
    },
    orderDate: {
      type: Date,
      default: Date.now
    },

    // Dispatch & Invoice Print/Share Tracking
    invoiceSent: {
      type: Boolean,
      default: false
    },
    invoiceSentAt: {
      type: Date,
      default: null
    },
    isPrinted: {
      type: Boolean,
      default: false
    },
    printedAt: {
      type: Date,
      default: null
    },

    // Return Order & Refund / Re-Order Management
    returnDetails: {
      returnType: {
        type: String,
        enum: ["Refund", "Re-Order", "None"],
        default: "None"
      },
      refundAmount: {
        type: Number,
        default: 0
      },
      refundStatus: {
        type: String,
        enum: ["Pending", "Completed", "N/A"],
        default: "Pending"
      },
      reorderNotes: {
        type: String,
        default: ""
      },
      returnReason: {
        type: String,
        default: ""
      },
      returnNotes: {
        type: String,
        default: ""
      },
      returnedAt: {
        type: Date,
        default: null
      }
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for searching and sorting
whatsappOrderSchema.index({ orderDate: -1 });
whatsappOrderSchema.index({ "customer.name": "text", "customer.mobileNumber": "text", "customer.whatsappNumber": "text" });

module.exports = mongoose.model("WhatsAppOrder", whatsappOrderSchema);

