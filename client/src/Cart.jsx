import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { API_URL, BASE_URL } from "./services/api";

export default function Cart() {
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("cart")) || [];
    setCart(saved);

    // Sync with backend to ensure price and image are up-to-date
    fetch(`${API_URL}/products`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.products) {
          const updatedCart = saved.map(item => {
            const dbProduct = data.products.find(p => {
              if (item.productId) return p._id === item.productId;
              if (item.id) return item.id.startsWith(p._id);
              return p.name === item.name;
            });
            if (dbProduct) {
              const sizeIdx = dbProduct.sizes.findIndex(s => s.size === item.size);
              if (sizeIdx !== -1) {
                const dbSize = dbProduct.sizes[sizeIdx];
                const newPrice = dbSize.offerPrice || dbSize.price;
                
                let newImg = dbProduct.images && (dbProduct.images[sizeIdx] || dbProduct.images[0]);
                if (newImg && !newImg.startsWith("http") && !newImg.startsWith("data:") && !newImg.startsWith("/images/")) {
                  newImg = `${BASE_URL.replace(/\/api$/, "")}${newImg.startsWith("/") ? newImg : `/${newImg}`}`;
                }
                
                return { ...item, price: newPrice, img: newImg || item.img };
              }
            }
            return item;
          });
          setCart(updatedCart);
          localStorage.setItem("cart", JSON.stringify(updatedCart));
          document.dispatchEvent(new Event("cartUpdated"));
        }
      })
      .catch(err => console.error("Error syncing cart data:", err));
  }, []);

  const updateCart = (updated) => {
    setCart(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
    document.dispatchEvent(new Event("cartUpdated"));
  };

  const removeItem = (index) => {
    const updated = cart.filter((_, i) => i !== index);
    updateCart(updated);
  };

  const increaseQty = (index) => {
    const updated = [...cart];
    updated[index].quantity += 1;
    updateCart(updated);
  };

  const decreaseQty = (index) => {
    const updated = [...cart];
    if (updated[index].quantity > 1) {
      updated[index].quantity -= 1;
      updateCart(updated);
    }
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const checkout = () => {
    window.location.href = "/checkout";
  };

  return (
    <div className="min-h-screen bg-[#0a0802] pt-10 pb-20 relative overflow-hidden text-gray-200">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-yellow-500/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Back Button */}
        <div className="mb-8">
          <Link 
            to="/product" 
            className="inline-flex items-center gap-2 text-gray-400 hover:text-yellow-500 transition-colors group px-4 py-2 rounded-lg hover:bg-white/5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Products
          </Link>
        </div>

        <h2 className="text-4xl md:text-5xl font-bold mb-12 text-yellow-500 text-center drop-shadow-[0_0_15px_rgba(234,179,8,0.3)]">
          Your Shopping Cart
        </h2>

        {cart.length === 0 ? (
          <div className="text-center py-24 bg-[#15120a]/80 rounded-3xl border border-yellow-500/10 shadow-2xl backdrop-blur-md">
            <div className="text-8xl mb-6 opacity-20">🛒</div>
            <p className="text-2xl text-gray-500 mb-8 font-light italic">Your cart is feeling a bit light...</p>
            <Link to="/product" className="inline-block px-10 py-4 bg-yellow-600 text-black font-bold rounded-xl shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:bg-yellow-500 transition-all duration-300">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Cart Items List */}
            <div className="lg:col-span-2 space-y-6">
              {cart.map((item, index) => (
                <div key={index} className="flex flex-col sm:flex-row items-center gap-6 bg-[#15120a]/80 backdrop-blur-md p-6 rounded-3xl border border-yellow-500/10 hover:border-yellow-500/30 shadow-xl transition-all duration-300 group">
                  {/* Image */}
                  <div className="w-24 h-24 bg-[#0d0b03] rounded-2xl p-2 border border-yellow-500/5 group-hover:border-yellow-500/20 transition-colors flex items-center justify-center">
                    <img src={item.img} alt={item.name} className="max-h-full max-w-full object-contain filter drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]" />
                  </div>
                  
                  {/* Details */}
                  <div className="flex-1 text-center sm:text-left">
                    <p className="font-bold text-xl text-white mb-1 group-hover:text-yellow-400 transition-colors uppercase tracking-tight">{item.name}</p>
                    <p className="text-gray-500 text-sm mb-2">Size: {item.size}</p>
                    <p className="font-bold text-yellow-500 text-lg">₹ {item.price * item.quantity}</p>
                  </div>

                  {/* Quantity & Remove */}
                  <div className="flex flex-col items-center sm:items-end gap-3">
                    <div className="flex items-center bg-[#0d0b03] rounded-xl border border-yellow-500/10 p-1">
                      <button onClick={() => decreaseQty(index)} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-yellow-400 transition-colors text-xl">−</button>
                      <span className="w-10 text-center font-bold text-white">{item.quantity}</span>
                      <button onClick={() => increaseQty(index)} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-yellow-400 transition-colors text-xl">+</button>
                    </div>
                    <button onClick={() => removeItem(index)} className="text-red-500/70 hover:text-red-400 text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-1 group/remove">
                       <span className="group-hover/remove:underline">Remove</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-[#15120a] p-8 rounded-3xl border border-yellow-500/10 shadow-2xl sticky top-24">
                <h3 className="text-2xl font-bold text-white mb-8 border-b border-yellow-500/10 pb-4">Order Summary</h3>
                
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-gray-400">
                    <span>Subtotal</span>
                    <span className="text-white">₹ {total}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Shipping</span>
                    <span className="text-lime-500/80 text-sm">Calculated at checkout</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mb-10 pt-4 border-t border-yellow-500/10">
                  <span className="text-xl font-bold text-white">Total</span>
                  <span className="text-3xl font-bold text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.3)]">₹ {total}</span>
                </div>
                
                <div className="space-y-4">
                  <button
                    onClick={checkout}
                    className="w-full group relative py-5 bg-gradient-to-r from-yellow-600 via-amber-500 to-yellow-600 bg-size-200 hover:bg-pos-100 text-black font-extrabold text-xl rounded-2xl shadow-[0_0_25px_rgba(234,179,8,0.4)] hover:shadow-[0_0_40px_rgba(234,179,8,0.6)] transform hover:-translate-y-1 transition-all duration-500 uppercase tracking-widest overflow-hidden"
                  >
                     <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none skew-x-12 -translate-x-full group-hover:translate-x-full duration-1000"></div>
                     <span className="relative z-10 flex items-center justify-center gap-2">
                        Proceed to Checkout
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                     </span>
                  </button>
                  
                  <Link
                    to="/product"
                    className="w-full py-4 bg-transparent border border-gray-800 text-gray-500 hover:text-white hover:bg-white/5 transition-all text-center block rounded-xl font-bold uppercase tracking-tight"
                  >
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <style>{`
        .bg-size-200 { background-size: 200% auto; }
        .hover\\:bg-pos-100:hover { background-position: right center; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}



