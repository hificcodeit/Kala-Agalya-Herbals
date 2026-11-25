import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../../services/api";
import { Helmet } from "react-helmet-async";
import { sanitizeCartItems, syncCartWithProducts } from "../../utils/cartUtils";

export default function Cart() {
  const [cart, setCart] = useState([]);

  /* ── Load & sync cart ────────────────────────────────── */
  useEffect(() => {
    let saved = [];
    try {
      saved = JSON.parse(localStorage.getItem("cart")) || [];
    } catch {
      saved = [];
    }
    const stripped = sanitizeCartItems(saved);
    try { localStorage.setItem("cart", JSON.stringify(stripped)); } catch {
      localStorage.removeItem("cart");
    }
    setCart(stripped);

    fetch(`${API_URL}/products`)
      .then(r => r.json())
      .then(data => {
        if (data.success && Array.isArray(data.products) && data.products.length > 0) {
          const updated = syncCartWithProducts(stripped, data.products, { includeImage: true });
          const light = updated.map(({ img, ...rest }) => rest);
          try { localStorage.setItem("cart", JSON.stringify(light)); } catch { /* ignore */ }
          document.dispatchEvent(new Event("cartUpdated"));
          setCart(updated);
        }
      })
      .catch(() => {});
  }, []);

  /* ── Cart mutations ──────────────────────────────────── */
  const persist = (updated) => {
    setCart(updated);
    const light = updated.map(({ img, ...rest }) => rest);
    try { localStorage.setItem("cart", JSON.stringify(light)); } catch { /* ignore */ }
    document.dispatchEvent(new Event("cartUpdated"));
  };

  const clearCart = () => {
    localStorage.removeItem("cart");
    setCart([]);
    document.dispatchEvent(new Event("cartUpdated"));
  };

  const removeItem  = (i) => persist(cart.filter((_, idx) => idx !== i));
  const increaseQty = (i) => { const c = [...cart]; c[i].quantity += 1; persist(c); };
  const decreaseQty = (i) => { const c = [...cart]; if (c[i].quantity > 1) { c[i].quantity -= 1; persist(c); } };

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  /* ════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[#FDFBF7] pt-10 pb-24 relative overflow-hidden text-[#1C1A16]">
      <Helmet>
        <title>Cart | Kala Agalya Herbals</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* Ambient */}
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-yellow-500/4 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/4 rounded-full blur-[130px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 relative z-10">

        {/* Header */}
        <div className="mb-10" style={{ animation: "fadeInUp 0.4s ease-out both" }}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Link to="/#product" className="inline-flex items-center gap-2 text-[#9A9690] hover:text-yellow-700 transition-colors group text-sm font-inter mb-4">
                <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Continue Shopping
              </Link>
              <h1 className="text-4xl md:text-5xl font-extrabold text-[#1C1A16] font-soria">
                Your Cart
                {cart.length > 0 && (
                  <span className="ml-3 text-xl font-normal text-[#9A9690] font-inter">({cart.length} item{cart.length > 1 ? "s" : ""})</span>
                )}
              </h1>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-red-600 hover:text-red-700 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-all font-grotesk"
              >
                Clear Cart
              </button>
            )}
          </div>
        </div>

        {cart.length === 0 ? (
          /* ── Empty State ──────────────────────────────── */
          <div className="text-center py-24 bg-white rounded-3xl border border-yellow-500/10 shadow-card" style={{ animation: "fadeInUp 0.5s ease-out both" }}>
            <div className="text-7xl mb-5 opacity-25" aria-hidden="true">🛒</div>
            <h2 className="text-2xl font-bold text-[#2C2921] mb-2 font-grotesk">Your cart is empty</h2>
            <p className="text-[#6C685F] mb-8 font-inter">Add some products to get started</p>
            <a href="/#product">
              <button className="px-9 py-3.5 bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-bold rounded-xl shadow-gold hover:shadow-gold-lg hover:scale-105 transition-all duration-300 font-grotesk">
                Browse Products
              </button>
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* ── Items ───────────────────────────────────── */}
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row items-center gap-5 bg-white p-5 rounded-3xl border border-yellow-500/10 hover:border-yellow-500/30 shadow-card hover:shadow-card-hover transition-all duration-400 group"
                  style={{ animation: `fadeInUp 0.4s ease-out ${index * 0.08}s both` }}
                >
                  {/* Product image */}
                  <div className="w-24 h-24 shrink-0 bg-gradient-to-b from-[#FDFBF7] to-[#F5F2EB] rounded-2xl p-2 border border-yellow-500/8 group-hover:border-yellow-500/25 transition-colors flex items-center justify-center overflow-hidden">
                    <img
                      src={item.img || "/images/icons/logo.webp"}
                      alt={`${item.name} ${item.size}`}
                      className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                      onError={e => { e.currentTarget.src = "/images/icons/logo.webp"; }}
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 text-center sm:text-left">
                    <p className="font-bold text-[#1C1A16] text-lg mb-0.5 group-hover:text-yellow-700 transition-colors font-grotesk">{item.name}</p>
                    <p className="text-[#9A9690] text-sm mb-1.5 font-inter">Size: <span className="font-medium text-[#6C685F]">{item.size}</span></p>
                    <p className="font-bold text-yellow-600 text-xl font-soria">₹{(item.price * item.quantity).toLocaleString("en-IN")}</p>
                    {item.quantity > 1 && (
                      <p className="text-xs text-[#9A9690] font-inter">₹{item.price} × {item.quantity}</p>
                    )}
                  </div>

                  {/* Quantity + Remove */}
                  <div className="flex flex-col items-center sm:items-end gap-3">
                    <div className="flex items-center bg-[#F5F2EB] rounded-xl border border-yellow-500/10 overflow-hidden" role="group" aria-label={`Quantity for ${item.name}`}>
                      <button
                        onClick={() => decreaseQty(index)}
                        aria-label="Decrease quantity"
                        className="w-9 h-9 flex items-center justify-center text-[#6C685F] hover:text-yellow-700 hover:bg-yellow-500/10 transition-all text-lg font-bold"
                      >
                        −
                      </button>
                      <span className="w-9 text-center font-bold text-[#1C1A16] text-sm font-grotesk" aria-live="polite">{item.quantity}</span>
                      <button
                        onClick={() => increaseQty(index)}
                        aria-label="Increase quantity"
                        className="w-9 h-9 flex items-center justify-center text-[#6C685F] hover:text-yellow-700 hover:bg-yellow-500/10 transition-all text-lg font-bold"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(index)}
                      className="text-xs font-semibold text-red-500/70 hover:text-red-500 uppercase tracking-wider transition-colors flex items-center gap-1 font-grotesk"
                      aria-label={`Remove ${item.name} from cart`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Order Summary ────────────────────────────── */}
            <div className="lg:col-span-1">
              <div className="bg-white p-7 rounded-3xl border border-yellow-500/10 shadow-card sticky top-24" style={{ animation: "fadeInUp 0.5s ease-out 0.2s both" }}>
                <h2 className="text-xl font-bold text-[#1C1A16] mb-6 border-b border-yellow-500/10 pb-4 font-grotesk">Order Summary</h2>

                <div className="space-y-3 mb-6 font-inter text-sm">
                  {cart.map((item, i) => (
                    <div key={i} className="flex justify-between text-[#6C685F]">
                      <span className="truncate max-w-[60%]">{item.name} · {item.size} × {item.quantity}</span>
                      <span className="font-medium text-[#2C2921]">₹{(item.price * item.quantity).toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-[#6C685F] pt-1">
                    <span>Shipping</span>
                    <span className="text-emerald-600 font-medium text-xs">Calculated at checkout</span>
                  </div>
                </div>

                <div className="flex justify-between items-center py-4 border-t border-yellow-500/10 mb-6">
                  <span className="text-lg font-bold text-[#1C1A16] font-grotesk">Total</span>
                  <span className="text-3xl font-black text-yellow-600 font-soria">₹{total.toLocaleString("en-IN")}</span>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => window.location.href = "/checkout"}
                    className="ripple-container w-full py-4 rounded-xl font-bold text-black bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 shadow-gold hover:shadow-gold-lg hover:-translate-y-0.5 transition-all duration-300 font-grotesk tracking-wide relative overflow-hidden flex items-center justify-center gap-2"
                    aria-label="Proceed to checkout"
                  >
                    Continue to Checkout
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  </button>

                  <a href="/#product" className="w-full py-3.5 rounded-xl font-semibold text-[#6C685F] border border-[#e8e4dc] hover:border-yellow-500/30 hover:text-[#2C2921] transition-all text-center block font-inter text-sm">
                    ← Continue Shopping
                  </a>
                </div>

                {/* Trust micro-badges */}
                <div className="mt-5 flex flex-wrap justify-center gap-2 pt-4 border-t border-yellow-500/8">
                  {["🔒 Secure Checkout", "↩ Easy Returns", "🚚 Fast Delivery"].map(t => (
                    <span key={t} className="text-[10px] text-[#B0ABA3] font-inter">{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
