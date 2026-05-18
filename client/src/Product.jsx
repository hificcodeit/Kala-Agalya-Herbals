import React, { useState, useEffect } from "react";
import { useToast } from "./Alert";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { API_URL, BASE_URL } from "./services/api";

const staticReviews = [
  {
    _id: "static_1",
    name: "Ananya S.",
    rating: 5,
    comment: "This hair oil is a miracle! I've been suffering from severe hair fall for months, but within just two weeks of using Kala Agalya, my hair fall has completely stopped. My roots feel stronger, and my hair is noticeably thicker. Highly recommended!",
    image: "/images/Home 4.png",
    createdAt: "2024-05-10T10:00:00.000Z"
  },
  {
    _id: "static_2",
    name: "Priya Menon",
    rating: 5,
    comment: "The cooling effect on the scalp is so relaxing. I use it twice a week, and not only has it cured my dandruff, but it has also given my hair a beautiful natural shine. It truly feels like an authentic ayurvedic remedy.",
    image: "/images/home 2.png",
    createdAt: "2024-04-22T14:30:00.000Z"
  },
  {
    _id: "static_3",
    name: "Lakshmi R.",
    rating: 4,
    comment: "I love the smell and texture. It's not too sticky compared to other herbal oils. I can already see baby hairs growing at my hairline. Will definitely purchase the 500ml bottle next time!",
    image: "/images/Home 5.png",
    createdAt: "2024-03-15T09:15:00.000Z"
  }
];

export default function Product() {
  const [dbProduct, setDbProduct] = useState(null);
  const [dbProducts, setDbProducts] = useState([]);
  const [reviews, setReviews] = useState(staticReviews);
  const [loading, setLoading] = useState(true);
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
    const img = images[sizeIdx] || images[0]; 
    if (img.startsWith("http")) return img;
    if (img.startsWith("data:image")) return img;
    if (img.startsWith("/images/")) return img;
    return `${BASE_URL.replace(/\/api$/, "")}${img.startsWith("/") ? img : `/${img}`}`;
  };

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
      .catch(err => console.error("Error fetching product:", err))
      .finally(() => setLoading(false));
  }, []);

  const fetchReviews = (productId) => {
    fetch(`${API_URL}/reviews/${productId}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setReviews([...staticReviews, ...data]);
        }
      })
      .catch(err => console.error("Error fetching reviews:", err));
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
    if (reviewImage) formData.append("image", reviewImage);

    try {
      const res = await fetch(`${API_URL}/reviews`, { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) {
        addToast("Review submitted successfully!", "success");
        setReviewForm({ name: "", rating: 5, comment: "" });
        setReviewImage(null);
        fetchReviews(dbProduct._id);
        const fileInput = document.getElementById("review-image");
        if (fileInput) fileInput.value = "";
      } else {
        addToast(data.message || "Failed to submit review", "error");
      }
    } catch (err) {
      addToast("Error submitting review", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const avgRating = reviews.length 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
    : "5.0";
    
  const stats = [5, 4, 3, 2, 1].map(stars => {
    const count = reviews.filter(r => r.rating === stars).length;
    const pct = reviews.length ? ((count / reviews.length) * 100).toFixed(0) + "%" : "0%";
    return { stars, pct };
  });

  return (
    <div className="min-h-screen bg-[#060502] text-gray-200 relative overflow-hidden font-sans">
      <Helmet>
        <title>Shop Kala Agalya Naturopathy Herbal Products | Natural Wellness</title>
      </Helmet>

      {/* Global CSS for Animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes floatImage {
          0% { transform: translateY(0px) rotate(0deg) scale(1); filter: drop-shadow(0 10px 15px rgba(234,179,8,0.2)); }
          50% { transform: translateY(-15px) rotate(2deg) scale(1.05); filter: drop-shadow(0 25px 35px rgba(234,179,8,0.5)); }
          100% { transform: translateY(0px) rotate(0deg) scale(1); filter: drop-shadow(0 10px 15px rgba(234,179,8,0.2)); }
        }
        @keyframes shimmerGlow {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        @keyframes revealUp {
          0% { opacity: 0; transform: translateY(50px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-float {
          animation: floatImage 6s ease-in-out infinite;
        }
        .glass-card {
          background: linear-gradient(145deg, rgba(30,28,20,0.8) 0%, rgba(15,13,5,0.95) 100%);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(234,179,8,0.15);
          box-shadow: 0 8px 32px rgba(0,0,0,0.5);
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .glass-card:hover {
          transform: translateY(-8px) scale(1.02);
          border-color: rgba(234,179,8,0.5);
          box-shadow: 0 15px 45px rgba(234,179,8,0.2);
        }
        .text-shimmer {
          background: linear-gradient(to right, #facc15 20%, #fff 40%, #facc15 60%, #facc15 80%);
          background-size: 200% auto;
          color: #000;
          background-clip: text;
          text-fill-color: transparent;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmerGlow 4s linear infinite;
        }
        .reveal-delay-1 { animation: revealUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards; opacity: 0; }
        .reveal-delay-2 { animation: revealUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards; opacity: 0; }
        .reveal-delay-3 { animation: revealUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.5s forwards; opacity: 0; }
        
        .pulse-border {
          position: relative;
        }
        .pulse-border::before {
          content: "";
          position: absolute;
          inset: -2px;
          border-radius: inherit;
          background: linear-gradient(45deg, transparent, rgba(234,179,8,0.4), transparent);
          z-index: -1;
          animation: shimmerGlow 3s linear infinite;
        }
      `}} />

      {/* Hero Section */}
      <header className="relative pt-32 pb-20 px-4 overflow-hidden min-h-[60vh] flex items-center border-b border-yellow-900/20">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-screen"></div>
        
        {/* Dynamic Glow Backgrounds */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-600/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10 w-full text-center reveal-delay-1">
          <div className="inline-block p-4 mb-6 rounded-full bg-yellow-950/30 border border-yellow-500/20 backdrop-blur-md pulse-border">
            <img src="/images/icons/logo.png" alt="Logo" className="h-16 w-auto" />
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight leading-tight">
            Naturopathy <span className="text-shimmer block md:inline">Herbal Products</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto font-light mb-10">
            Revitalize your wellness with our 100% organic, chemical-free herbal formulations. 
            Experience the pure power of nature.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 text-sm font-medium">
            <span className="px-5 py-2 rounded-full bg-lime-900/30 border border-lime-500/30 text-lime-300 shadow-[0_0_15px_rgba(132,204,22,0.1)]">🌿 100% Organic</span>
            <span className="px-5 py-2 rounded-full bg-yellow-900/30 border border-yellow-500/30 text-yellow-300 shadow-[0_0_15px_rgba(234,179,8,0.1)]">✨ Pure & Natural</span>
            <span className="px-5 py-2 rounded-full bg-orange-900/30 border border-orange-500/30 text-orange-300 shadow-[0_0_15px_rgba(249,115,22,0.1)]">💪 Holistic Wellness</span>
          </div>
        </div>
      </header>

      {/* Products Section */}
      <section className="max-w-7xl mx-auto px-4 py-24 relative z-10" id="shop">
        <div className="text-center mb-16 reveal-delay-2">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Select Your Bottle Size</h2>
          <div className="h-1 w-24 bg-gradient-to-r from-transparent via-yellow-500 to-transparent mx-auto rounded-full"></div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20 reveal-delay-3">
             <div className="w-16 h-16 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-gray-400 reveal-delay-3 bg-[#110e05] rounded-3xl border border-yellow-900/30">
            Products are currently being restocked. Please check back later.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {products.map((product, index) => (
              <div 
                key={product.id}
                className={`glass-card rounded-3xl overflow-hidden relative reveal-delay-${(index % 3) + 1}`}
              >
                {product.savings && (
                  <div className="absolute top-5 right-5 bg-gradient-to-r from-red-600 to-orange-500 text-white px-4 py-1 rounded-full text-sm font-bold z-20 shadow-lg tracking-wider">
                    {product.savings}
                  </div>
                )}
                
                {product.ml === "200 ml" && (
                  <div className="absolute top-5 left-5 bg-yellow-500 text-black px-4 py-1 rounded-full text-sm font-bold z-20 shadow-[0_0_15px_rgba(234,179,8,0.5)]">
                    ★ Popular
                  </div>
                )}

                <div className="h-80 bg-gradient-to-b from-[#15120a] to-[#0a0802] relative flex items-center justify-center p-8 group">
                  <div className="absolute inset-0 bg-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="w-48 h-48 bg-yellow-500/10 rounded-full absolute blur-[40px] group-hover:bg-yellow-500/20 transition-all duration-500"></div>
                  
                  <img
                    src={product.img}
                    alt={`${product.ml} bottle`}
                    className="relative z-10 h-full w-auto object-contain animate-float"
                  />
                </div>

                <div className="p-8 relative">
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-yellow-900/50 to-transparent"></div>
                  
                  <div className="text-center mb-6">
                    <h3 className="text-3xl font-black text-white mb-2">{product.ml}</h3>
                    <p className="text-gray-400 text-sm">{product.description}</p>
                  </div>

                  <div className="flex justify-center items-center gap-4 mb-8">
                    {product.originalPrice && (
                      <span className="text-xl text-gray-500 line-through decoration-red-500/50">₹{product.originalPrice}</span>
                    )}
                    <span className="text-5xl font-extrabold text-shimmer">₹{product.price}</span>
                  </div>

                  <div className="flex items-center justify-center mb-8">
                     <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                        product.stock ? "bg-lime-900/20 text-lime-400 border-lime-500/30" : "bg-red-900/20 text-red-400 border-red-500/30"
                     }`}>
                       {product.stock ? "In Stock" : "Out of Stock"}
                     </span>
                  </div>

                  <div className="space-y-4">
                    <button
                      onClick={() => addToCart(product)}
                      disabled={!product.stock}
                      className="w-full py-4 rounded-xl font-bold uppercase tracking-wide transition-all bg-[#1a170d] text-yellow-500 border border-yellow-500/30 hover:bg-yellow-500/10 hover:border-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add to Cart
                    </button>
                    <button
                      onClick={() => buyNow(product)}
                      disabled={!product.stock}
                      className="w-full py-4 rounded-xl font-bold uppercase tracking-wide transition-all bg-gradient-to-r from-yellow-500 to-amber-600 text-black hover:from-yellow-400 hover:to-amber-500 shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_30px_rgba(234,179,8,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Reviews Section */}
      <section className="py-24 bg-[#0a0802] border-t border-yellow-900/20 relative z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16 reveal-delay-1">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Customer Experience</h2>
            <div className="h-1 w-24 bg-gradient-to-r from-transparent via-yellow-500 to-transparent mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Rating Summary */}
            <div className="glass-card p-10 rounded-3xl h-fit reveal-delay-2 text-center">
              <div className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 drop-shadow-lg">{avgRating}</div>
              <div className="text-yellow-400 text-3xl tracking-widest my-4">★★★★★</div>
              <p className="text-gray-400 font-medium mb-8">Based on {reviews.length} reviews</p>
              
              <div className="space-y-3">
                {stats.map((row) => (
                  <div key={row.stars} className="flex items-center gap-4 text-sm font-medium">
                    <span className="w-12 text-gray-300 text-right">{row.stars} ★</span>
                    <div className="flex-1 h-2.5 bg-gray-800/80 rounded-full overflow-hidden border border-gray-700/50">
                      <div className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-full" style={{ width: row.pct }}></div>
                    </div>
                    <span className="w-12 text-left text-gray-400">{row.pct}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews Form & List */}
            <div className="lg:col-span-2 space-y-12 reveal-delay-3">
              <div className="glass-card p-8 md:p-10 rounded-3xl">
                <h3 className="text-2xl font-bold text-white mb-8 border-b border-yellow-900/30 pb-4">Share Your Experience</h3>
                <form onSubmit={handleReviewSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-400 text-sm mb-2 font-medium">Your Name</label>
                      <input type="text" required className="w-full bg-[#0a0802]/80 border border-yellow-900/50 rounded-xl px-5 py-3.5 text-white focus:border-yellow-500 outline-none transition-colors" value={reviewForm.name} onChange={e => setReviewForm({...reviewForm, name: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2 font-medium">Rating</label>
                      <select className="w-full bg-[#0a0802]/80 border border-yellow-900/50 rounded-xl px-5 py-3.5 text-white focus:border-yellow-500 outline-none transition-colors appearance-none" value={reviewForm.rating} onChange={e => setReviewForm({...reviewForm, rating: Number(e.target.value)})}>
                        <option value="5">5 - Excellent (Highly Recommended)</option>
                        <option value="4">4 - Good</option>
                        <option value="3">3 - Average</option>
                        <option value="2">2 - Fair</option>
                        <option value="1">1 - Poor</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2 font-medium">Your Review</label>
                    <textarea required className="w-full bg-[#0a0802]/80 border border-yellow-900/50 rounded-xl px-5 py-4 text-white focus:border-yellow-500 outline-none transition-colors h-32 resize-none" value={reviewForm.comment} onChange={e => setReviewForm({...reviewForm, comment: e.target.value})}></textarea>
                  </div>
                  <div>
                     <label className="block text-gray-400 text-sm mb-2 font-medium">Add a Photo (Optional)</label>
                     <input id="review-image" type="file" accept="image/*" className="block w-full text-sm text-gray-400 file:mr-4 file:py-2.5 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-yellow-500/10 file:text-yellow-500 hover:file:bg-yellow-500/20 file:transition-colors cursor-pointer" onChange={e => setReviewImage(e.target.files[0])} />
                  </div>
                  <button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-yellow-500 to-amber-600 text-black px-10 py-4 rounded-xl font-bold hover:from-yellow-400 hover:to-amber-500 transition-all shadow-[0_0_15px_rgba(234,179,8,0.2)] disabled:opacity-50 text-lg w-full md:w-auto">
                    {isSubmitting ? "Submitting..." : "Submit Review"}
                  </button>
                </form>
              </div>

              <div className="space-y-6">
                {reviews.length === 0 ? (
                   <div className="text-center py-10 glass-card rounded-3xl text-gray-400">No reviews yet. Be the first to share your results!</div>
                ) : (
                  reviews.map((review, i) => (
                    <div key={review._id || i} className="glass-card p-8 rounded-3xl">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-gradient-to-br from-yellow-600 to-amber-800 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg border border-yellow-500/30">
                            {review.name ? review.name[0].toUpperCase() : "U"}
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-lg">{review.name}</h4>
                            <div className="flex text-yellow-500 text-sm mt-1 tracking-wider">
                              {[...Array(5)].map((_, starI) => (
                                <span key={starI}>{starI < review.rating ? "★" : "☆"}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <span className="text-sm text-gray-500 font-medium">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <p className="text-gray-300 leading-relaxed text-lg mb-4">{review.comment}</p>
                      
                      {review.image && (
                        <div className="mt-6 rounded-2xl overflow-hidden border border-yellow-500/20 inline-block relative group">
                          <img 
                            src={review.image.startsWith("data:image") || review.image.startsWith("http") || review.image.startsWith("/images/") ? review.image : `${BASE_URL.replace(/\/api$/, "")}${review.image.startsWith("/") ? review.image : `/${review.image}`}`} 
                            alt={`Review photo by ${review.name}`} 
                            className="w-40 h-40 object-cover transform group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500"></div>
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
