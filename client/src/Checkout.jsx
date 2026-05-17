import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createOrder } from "./services/api";

export default function Checkout() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const navigate = useNavigate();

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  const [form, setForm] = useState({
    name: localStorage.getItem("userName") || "",
    email: localStorage.getItem("userEmail") || "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: ""
  });

  const handleChange = e =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    const orderData = {
      customer: {
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: {
          street: form.address,
          district: form.city,
          state: form.state,
          pincode: form.pincode
        }
      },
      items: cart.map(item => ({
        name: item.name,
        size: item.size,
        price: item.price,
        quantity: item.quantity
      })),
      totalAmount: total
    };

    try {
      const data = await createOrder(orderData);
      if (data.success && data.order && data.order._id) {
        // Store order ID for payment step
        localStorage.setItem("lastOrderId", data.order._id);
        navigate("/payment");
      } else {
        console.error("Order creation returned no ID:", data);
        alert("Could not create order. Please check the form and try again.");
      }
    } catch (err) {
      console.error("Order creation failed", err);
      alert("Server error. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0802] pt-10 pb-20 relative overflow-hidden text-gray-200">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-yellow-900/5 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Back Button */}
        <div className="mb-8">
          <Link
            to="/cart"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-yellow-500 transition-colors group px-4 py-2 rounded-lg hover:bg-white/5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Cart
          </Link>
        </div>

        <h2 className="text-4xl md:text-5xl font-bold mb-12 text-yellow-500 text-center drop-shadow-[0_0_15px_rgba(234,179,8,0.3)]">
          Checkout
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Shipping Form */}
          <div className="lg:col-span-2">
            <div className="bg-[#15120a]/80 backdrop-blur-xl p-8 md:p-10 rounded-3xl border border-yellow-500/10 shadow-2xl">
              <h3 className="text-2xl font-bold text-white mb-8">Shipping Address</h3>

              <form id="checkout-form" onSubmit={onSubmit} className="space-y-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Full Name</label>
                  <input
                    required
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full bg-[#0d0b03] border border-yellow-500/10 text-white p-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all placeholder:text-gray-700"
                    placeholder="Enter full name"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Email</label>
                    <input
                      required
                      type="email"
                      name="email"
                      value={form.email}
                      readOnly
                      className="w-full bg-[#0d0b03] border border-yellow-500/10 text-white/60 p-4 rounded-xl focus:outline-none transition-all placeholder:text-gray-700 cursor-not-allowed"
                      placeholder="Enter email address"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Phone</label>
                    <input
                      required
                      type="tel"
                      pattern="[0-9]{10}"
                      title="Please enter a valid 10-digit phone number"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      className="w-full bg-[#0d0b03] border border-yellow-500/10 text-white p-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all placeholder:text-gray-700"
                      placeholder="Enter 10-digit phone number"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Address</label>
                  <textarea
                    required
                    rows="3"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    className="w-full bg-[#0d0b03] border border-yellow-500/10 text-white p-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all resize-none placeholder:text-gray-700"
                    placeholder="Enter complete address"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">City</label>
                    <input
                      required
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      className="w-full bg-[#0d0b03] border border-yellow-500/10 text-white p-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all placeholder:text-gray-700"
                      placeholder="City"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">State</label>
                    <input
                      required
                      name="state"
                      value={form.state}
                      onChange={handleChange}
                      className="w-full bg-[#0d0b03] border border-yellow-500/10 text-white p-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all placeholder:text-gray-700"
                      placeholder="State"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Pincode</label>
                    <input
                      required
                      pattern="[0-9]{6}"
                      title="Please enter a valid 6-digit pincode"
                      name="pincode"
                      value={form.pincode}
                      onChange={handleChange}
                      className="w-full bg-[#0d0b03] border border-yellow-500/10 text-white p-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all placeholder:text-gray-700"
                      placeholder="Pincode"
                    />
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Checkout Summary */}
          <div className="lg:col-span-1">
            <div className="bg-[#15120a] p-8 rounded-3xl border border-yellow-500/10 shadow-2xl sticky top-24">
              <h3 className="text-2xl font-bold text-white mb-8 border-b border-yellow-500/10 pb-4">Order Summary</h3>

              <div className="space-y-4 mb-8 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start text-sm">
                    <div className="flex-1 pr-4">
                      <p className="text-gray-300 font-medium">{item.name} ({item.size})</p>
                      <p className="text-gray-500 italic">x {item.quantity}</p>
                    </div>
                    <span className="text-yellow-500 font-bold">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center mb-10 pt-4 border-t border-yellow-500/10">
                <span className="text-xl font-bold text-white">Total</span>
                <span className="text-3xl font-bold text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.3)]">₹ {total}</span>
              </div>

              <button
                type="submit"
                form="checkout-form"
                className="w-full group relative py-5 bg-gradient-to-r from-yellow-600 via-amber-500 to-yellow-600 bg-size-200 hover:bg-pos-100 text-black font-extrabold text-lg rounded-xl shadow-[0_0_25px_rgba(234,179,8,0.4)] hover:shadow-[0_0_40px_rgba(234,179,8,0.6)] transform hover:-translate-y-1 active:scale-[0.98] transition-all duration-500 uppercase tracking-widest overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none skew-x-12 -translate-x-full group-hover:translate-x-full duration-1000"></div>
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Continue to Payment
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #eab30833; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #eab30866; }
        .bg-size-200 { background-size: 200% auto; }
        .hover\\:bg-pos-100:hover { background-position: right center; }
      `}</style>
    </div>
  );
}



