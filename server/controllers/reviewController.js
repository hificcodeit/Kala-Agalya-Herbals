const Review = require("../models/Review");
const Product = require("../models/Product");

// Get all reviews for a product
exports.getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Add a new review
exports.addReview = async (req, res) => {
  try {
    const { productId, name, rating, comment } = req.body;
    let image = "";

    if (req.file) {
      const b64 = Buffer.from(req.file.buffer).toString("base64");
      image = `data:${req.file.mimetype};base64,${b64}`;
    }

    const review = new Review({
      product: productId,
      name,
      rating,
      comment,
      image
    });

    await review.save();
    res.status(201).json({ message: "Review added successfully", review });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Get all reviews (for Admin)
exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("product", "name")
      .sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// Delete review (for Admin)
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    await review.deleteOne();
    res.json({ success: true, message: "Review deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};
