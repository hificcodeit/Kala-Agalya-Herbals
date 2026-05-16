import React, { useState, useEffect } from "react";
import { useToast } from "./Alert";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { API_URL, BASE_URL } from "./services/api";

export default function Product() {
  const [dbProduct, setDbProduct] = useState(null);
  const [dbProducts, setDbProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({
    name: "",
    rating: 5,
    comment: ""
  });
  const [reviewImage, setReviewImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();

  const getImg = (images, sizeIdx) => {
    if (!images || images.length === 0) return "/images/icons/logo.png";
    // 1st image -> 100ml, 2nd -> 200ml, 3rd -> 500ml
    const img = images[sizeIdx] || images[0]; 
    if (img.startsWith("http")) return img;
    if (img.startsWith("data:image")) return img;
    if (img.startsWith("/images/")) return img;
    return `${BASE_URL.replace(/\/api$/, "")}${img.startsWith("/") ? img : `/${img}`}`;
  };

  const products = dbProducts.filter(p => p.isActive).flatMap(prod => 
    prod.sizes.map((s, idx) => ({
       ...s,
       id: `${prod._id}-${s.size}`,
       name: prod.name,
       description: prod.description,
       img: getImg(prod.images, idx),
       ml: s.size,
       price: s.offerPrice || s.price,
       originalPrice: s.offerPrice ? s.price : null,
       stock: s.stock > 0,
       savings: (s.offerPrice && s.offerPrice < s.price) ? `Save ₹${s.price - s.offerPrice}` : null
    }))
  );

  // Fetch product from DB to attach data to
  useEffect(() => {
    fetch(`${API_URL}/products`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.products.length > 0) {
          setDbProducts(data.products);
          const master = data.products[0]; 
          setDbProduct(master);
          fetchReviews(master._id);
        }
      })
      .catch(err => console.error("Error fetching product:", err));
  }, []);

  const fetchReviews = (productId) => {
    fetch(`${API_URL}/reviews/${productId}`)
      .then(res => res.json())
      .then(data => setReviews(data))
      .catch(err => console.error("Error fetching reviews:", err));
  };

  const addToCart = (product) => {
    if (!product.stock) {
      addToast("This size is currently Out of Stock!", "error");
      return;
    }

    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const existing = cart.find(item => item.size === product.ml);

    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        name: product.name,
        size: product.ml,
        price: product.price,
        quantity: 1,
        img: product.img
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    document.dispatchEvent(new Event("cartUpdated"));
    addToast("Product added to cart successfully!", "success");
  };

  const buyNow = (product) => {
    if (!product.stock) {
      addToast("This size is currently Out of Stock!", "error");
      return;
    }
    addToCart(product);
    window.location.href = "/cart";
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!dbProduct) {
      addToast("Unable to submit review. Product not found.", "error");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("productId", dbProduct._id);
    formData.append("name", reviewForm.name);
    formData.append("rating", reviewForm.rating);
    formData.append("comment", reviewForm.comment);
    if (reviewImage) {
      formData.append("image", reviewImage);
    }

    try {
      const res = await fetch(`${API_URL}/reviews`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      
      if (res.ok) {
        addToast("Review submitted successfully!", "success");
        setReviewForm({ name: "", rating: 5, comment: "" });
        setReviewImage(null);
        fetchReviews(dbProduct._id);
        // Reset file input
        document.getElementById("review-image").value = "";
      } else {
        addToast(data.message || "Failed to submit review", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Error submitting review", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate average rating
  const avgRating = reviews.length 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
    : "5.0";
    
  // Calculate stats
  const stats = [5, 4, 3, 2, 1].map(stars => {
    const count = reviews.filter(r => r.rating === stars).length;
    const pct = reviews.length ? ((count / reviews.length) * 100).toFixed(0) + "%" : "0%";
    return { stars, pct };
  });

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Kala Agalya Herbals Herbal Organic Hair Oil",
    "image": "https://kalaagalyaherbals.com/images/bottle-200.png",
    "description": "Authentic Naturopathy Herbal Hair Oil with 18+ rare herbs. No chemicals, pure organic care.",
    "brand": {
      "@type": "Brand",
      "name": "Kala Agalya Herbals"
    },
    "offers": {
      "@type": "AggregateOffer",
      "lowPrice": "299",
      "highPrice": "1199",
      "priceCurrency": "INR"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": avgRating,
      "reviewCount": reviews.length || 1
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0802] relative overflow-hidden text-gray-200">
      <Helmet>
        <title>Shop Kala Agalya Naturopathy Hair Oil | Natural Growth & Hair Fall Care</title>
        <meta name="description" content="Choose your perfect size of Kala Agalya Herbals organic hair oil. 100ml, 200ml, and 500ml bottles available. Infused with 18+ Naturopathy herbs for hair growth." />
        <meta name="keywords" content="buy herbal hair oil, natural hair growth oil, Naturopathy hair treatment, organic hair oil price, Kala Agalya Herbals shop" />
        <link rel="canonical" href="https://kalaagalyaherbals.com/product" />
        <script type="application/ld+json">
          {JSON.stringify(productSchema)}
        </script>
      </Helmet>

      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-yellow-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px]"></div>
      </div>

      {/* Hero Banner Section */}
      <header className="relative bg-[#0d0b03] border-b border-yellow-900/30 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0802] to-transparent"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 py-20 sm:py-32">
          <div className="text-center animate-[fadeIn_1s_ease-out]">
            <div className="flex flex-col items-center gap-4 mb-6">
               <img src="/images/icons/logo.png" alt="Kala Agalya Herbals Logo" className="h-20 w-auto drop-shadow-[0_0_20px_rgba(234,179,8,0.5)] mb-2" />
               <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-200 to-yellow-400 drop-shadow-[0_0_15px_rgba(234,179,8,0.3)]">
                 Kala Agalya Herbals <br/> Naturopathy Herbal Hair Oil
               </h1>
            </div>
            <p className="text-xl sm:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto font-light">
              100% Pure Herbal • No Chemicals • <span className="text-yellow-400 font-medium">Natural Hair Growth Formula</span>
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm sm:text-base text-white">
              <span className="bg-yellow-900/10 border border-yellow-500/20 backdrop-blur-sm px-6 py-2 rounded-full shadow-[0_0_15px_rgba(234,179,8,0.05)] text-yellow-100">
                ✨ Strengthens Roots
              </span>
              <span className="bg-lime-900/10 border border-lime-500/20 backdrop-blur-sm px-6 py-2 rounded-full shadow-[0_0_15px_rgba(163,230,53,0.05)] text-lime-100">
                🌿 18+ Natural Herbs
              </span>
              <span className="bg-yellow-900/10 border border-yellow-500/20 backdrop-blur-sm px-6 py-2 rounded-full shadow-[0_0_15px_rgba(234,179,8,0.05)] text-yellow-100">
                💛 Stops Hair Fall
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Products Section */}
      <section className="max-w-7xl mx-auto px-4 py-16 relative z-10">
        <div className="text-center mb-16">
          <h2 className="scroll-animate text-3xl sm:text-5xl font-bold text-white mb-4 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
            Choose Your Naturopathy Hair Growth Bottle
          </h2>
          <p className="text-lg text-gray-400">
            Select the bottle size that suits your herbal hair care needs
          </p>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
          {products.map((product) => (
            <div 
              key={product.id}
              className={`scroll-animate scroll-delay-${(products.indexOf(product) % 3) + 1} group relative bg-[#15120a]/80 backdrop-blur-md rounded-3xl shadow-[0_0_30px_rgba(0,0,0,0.6)] hover:shadow-[0_0_40px_rgba(234,179,8,0.2)] transition-all duration-300 transform hover:-translate-y-2 overflow-hidden border border-yellow-500/10 hover:border-yellow-500/40`}
            >
              {/* Savings Badge */}
              {product.savings && (
                <div className="absolute top-4 right-4 bg-gradient-to-r from-orange-500 to-red-600 text-white px-3 py-1 rounded-full text-sm font-bold z-20 shadow-lg border border-white/10">
                  {product.savings}
                </div>
              )}

              {/* Popular Badge */}
              {product.ml === "200 ml" && (
                <div className="absolute top-4 left-4 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-3 py-1 rounded-full text-sm font-bold z-20 shadow-[0_0_15px_rgba(234,179,8,0.5)]">
                  ⭐ Most Popular
                </div>
              )}

              {/* Product Image Area */}
              <div className="relative bg-[#0d0b03] p-10 flex items-center justify-center h-80 group-hover:bg-[#121005] transition-colors duration-500">
                 {/* Glow behind bottle */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-yellow-500/20 rounded-full blur-[50px] group-hover:bg-yellow-500/30 transition-all duration-500"></div>
                <img
                  src={product.img}
                  alt={`Kala Agalya Herbal Organic Hair Oil - ${product.ml} bottle`}
                  className="relative h-full w-auto object-contain transform group-hover:scale-110 transition-transform duration-500 filter drop-shadow-[0_0_15px_rgba(0,0,0,0.7)]"
                />
              </div>

              {/* Product Details */}
              <div className="p-8">
                {/* Size */}
                <div className="text-center mb-6">
                  <h3 className="text-3xl font-bold text-white mb-2 group-hover:text-yellow-400 transition-colors">
                    {product.ml}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {product.description}
                  </p>
                </div>

                {/* Price */}
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center gap-3 mb-1">
                    {product.originalPrice && (
                      <span className="text-lg text-gray-500 line-through decoration-red-500/50">
                        ₹{product.originalPrice}
                      </span>
                    )}
                    <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-300 drop-shadow-[0_0_10px_rgba(234,179,8,0.3)]">
                      ₹{product.price}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    Inclusive of all taxes
                  </div>
                </div>

                {/* Stock Status */}
                <div className="text-center mb-8">
                  <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                    product.stock 
                      ? "bg-lime-900/10 text-lime-400 border-lime-500/30" 
                      : "bg-red-900/20 text-red-400 border-red-500/30"
                  }`}>
                    {product.stock ? "● In Stock" : "● Out of Stock"}
                  </span>
                </div>

                {/* Buttons */}
                <div className="space-y-4">
                  <button
                    onClick={() => addToCart(product)}
                    disabled={!product.stock}
                    className={`w-full py-3 px-6 rounded-xl font-bold uppercase tracking-wide transition-all duration-300 transform hover:scale-[1.02] ${
                      product.stock
                        ? "bg-[#251e0a] text-yellow-400 border border-yellow-500/40 hover:bg-yellow-900/30 hover:shadow-[0_0_15px_rgba(234,179,8,0.2)]"
                        : "bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700"
                    }`}
                  >
                    Add to Cart
                  </button>
                  <button
                    onClick={() => buyNow(product)}
                    disabled={!product.stock}
                    className={`w-full py-3 px-6 rounded-xl font-bold uppercase tracking-wide transition-all duration-300 transform hover:scale-[1.02] ${
                      product.stock
                        ? "bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black shadow-[0_0_25px_rgba(234,179,8,0.5)] hover:shadow-[0_0_35px_rgba(234,179,8,0.6)]"
                        : "bg-gray-700 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Features Section */}
        <section className="mt-24 p-12 bg-[#15120a]/50 backdrop-blur-md rounded-3xl border border-yellow-500/10 relative overflow-hidden">
           <div className="absolute inset-0 bg-yellow-500/5 mix-blend-overlay"></div>
          <h3 className="scroll-animate text-3xl font-bold text-center mb-12 text-white relative z-10">Why Choose Kala Agalya Herbals?</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
            <article className="text-center group">
              <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform duration-300">🌿</div>
              <h4 className="text-lg font-bold text-yellow-500 mb-2">100% Natural</h4>
              <p className="text-sm text-gray-400">Pure herbal ingredients</p>
            </article>
            <article className="text-center group">
              <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform duration-300">🚫</div>
              <h4 className="text-lg font-bold text-yellow-500 mb-2">No Chemicals</h4>
              <p className="text-sm text-gray-400">Free from harmful additives</p>
            </article>
            <article className="text-center group">
              <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform duration-300">💪</div>
              <h4 className="text-lg font-bold text-yellow-500 mb-2">Strengthens Hair</h4>
              <p className="text-sm text-gray-400">From root to tip</p>
            </article>
            <article className="text-center group">
              <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform duration-300">✨</div>
              <h4 className="text-lg font-bold text-yellow-500 mb-2">Visible Results</h4>
              <p className="text-sm text-gray-400">In just 4-6 weeks</p>
            </article>
          </div>
        </section>

        {/* Reviews Section */}
        <div className="mt-24 pb-20">
          <h2 className="scroll-animate text-3xl sm:text-4xl font-bold text-white text-center mb-12 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">Customer Ratings & Reviews</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Rating Summary */}
            <div className="bg-[#15120a]/80 backdrop-blur-md p-8 rounded-3xl border border-yellow-500/20 shadow-lg h-fit">
              <div className="text-center">
                <div className="text-7xl font-extrabold text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">{avgRating}</div>
                <div className="flex justify-center text-yellow-400 text-2xl my-4 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]">
                  ★★★★★
                </div>
                <p className="text-gray-400">Based on {reviews.length} reviews</p>
              </div>

              <div className="mt-8 space-y-4">
                {stats.map((row) => (
                  <div key={row.stars} className="flex items-center gap-3 text-sm font-medium">
                    <span className="w-8 text-yellow-400">{row.stars} ★</span>
                    <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-500 rounded-full shadow-[0_0_10px_#facc15]" style={{ width: row.pct }}></div>
                    </div>
                    <span className="w-10 text-right text-gray-400">{row.pct}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Write a Review & Review List */}
            <div className="lg:col-span-2 space-y-10">
              {/* Review Form */}
              <div className="bg-[#111a11]/60 p-8 rounded-3xl border border-yellow-500/10">
                <h3 className="text-2xl font-bold text-white mb-6">Write a Review</h3>
                <form onSubmit={handleReviewSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Your Name</label>
                      <input
                        type="text"
                        required
                        className="w-full bg-[#0d0b03] border border-yellow-900/40 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none transition-colors"
                        value={reviewForm.name}
                        onChange={(e) => setReviewForm({...reviewForm, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Rating</label>
                      <select
                        className="w-full bg-[#0d0b03] border border-yellow-900/40 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none transition-colors"
                        value={reviewForm.rating}
                        onChange={(e) => setReviewForm({...reviewForm, rating: Number(e.target.value)})}
                      >
                        <option value="5">5 - Excellent</option>
                        <option value="4">4 - Good</option>
                        <option value="3">3 - Average</option>
                        <option value="2">2 - Fair</option>
                        <option value="1">1 - Poor</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Your Review</label>
                    <textarea
                      required
                      className="w-full bg-[#0d0b03] border border-yellow-900/40 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none transition-colors h-32 resize-none"
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm({...reviewForm, comment: e.target.value})}
                    ></textarea>
                  </div>
                  <div>
                     <label className="block text-gray-400 text-sm mb-2">Add a Photo (Optional)</label>
                     <input 
                       id="review-image"
                       type="file" 
                       accept="image/*"
                       className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100"
                       onChange={(e) => setReviewImage(e.target.files[0])}
                     />
                  </div>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="bg-yellow-600 text-black px-8 py-3 rounded-xl font-bold hover:bg-yellow-500 transition-all shadow-lg disabled:opacity-50"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Review"}
                  </button>
                </form>
              </div>

              {/* Display Reviews */}
              <div className="space-y-6">
                {reviews.length === 0 ? (
                   <p className="text-gray-400 text-center py-6">No reviews yet. Be the first to review!</p>
                ) : (
                  reviews.map((review, i) => (
                    <div key={review._id || i} className="bg-[#111a11]/60 p-8 rounded-3xl border border-yellow-500/10 shadow hover:shadow-[0_0_20px_rgba(234,179,8,0.1)] transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-green-900/40 rounded-full flex items-center justify-center text-yellow-400 font-bold border border-yellow-500/30">
                            {review.name ? review.name[0].toUpperCase() : "A"}
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-lg">{review.name}</h4>
                            <div className="flex text-yellow-400 text-sm mt-1">
                              {[...Array(5)].map((_, starI) => (
                                <span key={starI}>{starI < review.rating ? "★" : "☆"}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <p className="text-gray-300 leading-relaxed mb-4">{review.comment}</p>
                      
                      {review.image && (
                        <div className="mt-4">
                          <img 
                            src={review.image.startsWith("data:image") ? review.image : `${BASE_URL.replace(/\/api$/, "")}${review.image.startsWith("/") ? review.image : `/${review.image}`}`} 
                            alt={`Customer review photo for Kala Agalya Herbal Hair Oil by ${review.name}`} 
                            className="w-32 h-32 object-cover rounded-xl border border-yellow-500/20"
                          />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}



