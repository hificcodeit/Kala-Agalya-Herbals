const Product = require("../models/Product");

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get single product
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Create product
exports.createProduct = async (req, res) => {
  try {
    console.log("Create Product Body:", req.body);
    console.log("Create Product Files:", req.files);
    const { name, description, sizes: sizesStr, category, isActive } = req.body;
    let images = [];

    if (req.files && req.files.length > 0) {
      images = req.files.map(file => {
        const b64 = Buffer.from(file.buffer).toString("base64");
        return `data:${file.mimetype};base64,${b64}`;
      });
    }

    // Sizes might come as a JSON string from FormData
    let sizes = typeof sizesStr === "string" ? JSON.parse(sizesStr) : sizesStr;
    
    // Clean sizes data
    if (Array.isArray(sizes)) {
      sizes = sizes.map(s => {
        const offerPrice = (s.offerPrice === "" || s.offerPrice === null || s.offerPrice === undefined) ? null : Number(s.offerPrice);
        return {
          ...s,
          offerPrice: isNaN(offerPrice) ? null : offerPrice
        };
      });
    }

    const product = new Product({
      name,
      description,
      sizes,
      images,
      category,
      isActive: isActive === "true" || isActive === true
    });

    await product.save();
    res.status(201).json({ success: true, product });
  } catch (error) {
    if (error.name === "ValidationError") {
      console.error("Validation Error:", JSON.stringify(error.errors, null, 2));
      return res.status(400).json({ success: false, message: "Validation Error", errors: error.errors });
    }
    console.error("Create Product Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    console.log("Update Product Body:", req.body);
    const { name, description, sizes: sizesStr, category, isActive } = req.body;
    const updateData = { name, description, category, isActive: isActive === "true" || isActive === true, updatedAt: Date.now() };

    if (req.files && req.files.length > 0) {
      updateData.images = req.files.map(file => {
        const b64 = Buffer.from(file.buffer).toString("base64");
        return `data:${file.mimetype};base64,${b64}`;
      });
    }

    if (sizesStr) {
      let sizes = typeof sizesStr === "string" ? JSON.parse(sizesStr) : sizesStr;
      if (Array.isArray(sizes)) {
        updateData.sizes = sizes.map(s => {
          const offerPrice = (s.offerPrice === "" || s.offerPrice === null || s.offerPrice === undefined) ? null : Number(s.offerPrice);
          return {
            ...s,
            offerPrice: isNaN(offerPrice) ? null : offerPrice
          };
        });
      }
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    res.json({ success: true, product });
  } catch (error) {
    if (error.name === "ValidationError") {
      console.error("Validation Error:", JSON.stringify(error.errors, null, 2));
      return res.status(400).json({ success: false, message: "Validation Error", errors: error.errors });
    }
    console.error("Update Product Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    res.json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
