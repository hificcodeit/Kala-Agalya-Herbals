const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  sizes: [
    {
      size: {
        type: String,
        required: true
      },
      mrp: {
        type: Number,
        default: null
      },
      price: {
        type: Number,
        required: true
      },
      offerPrice: {
        type: Number,
        default: null
      },
      stock: {
        type: Number,
        default: 0
      }
    }
  ],
  gstPercentage: {
    type: Number,
    default: 0
  },
  images: {
    type: [String],
    default: []
  },
  category: {
    type: String,
    default: "Hair Oil"
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Product", productSchema);
