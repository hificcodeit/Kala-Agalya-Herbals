import { Link, useNavigate } from "react-router-dom";
import { useToast } from "../../components/Alert";
import { useState, useEffect } from "react";
import { API_URL } from "../../services/api";

export default function Payment() {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [orderLoading, setOrderLoading] = useState(true);
  const [orderTotal, setOrderTotal] = useState(null);

  useEffect(() => {
    const lastOrderId = localStorage.getItem("lastOrderId");
    if (!lastOrderId) {
      setOrderLoading(false);
      return;
    }

    let active = true;
    fetch(`${API_URL}/orders/${lastOrderId}`)
      .then(res => res.json())
      .then(data => {
        if (!active) return;
        if (data.success && data.order) {
          if (data.order.paymentStatus === "PAID") {
            navigate(`/success?transactionId=T${data.order._id}`);
            return;
          }
          setOrderTotal(Number(data.order.totalAmount));
          localStorage.setItem("lastOrderTotal", String(data.order.totalAmount));
        } else {
          addToast("Order not found. Please complete checkout again.", "warning");
        }
      })
      .catch(() => {
        if (active) addToast("Could not verify order amount from server.", "error");
      })
      .finally(() => {
        if (active) setOrderLoading(false);
      });

    return () => { active = false; };
  }, [addToast, navigate]);

  const handlePhonePePay = async () => {
    // 1. Get the order that was just created in Checkout
    const lastOrderId = localStorage.getItem("lastOrderId");
    const token = localStorage.getItem("userToken");

    if (!lastOrderId) {
      return addToast("Please complete the checkout step again", "warning");
    }
    if (!token) {
      navigate("/login?redirect=payment");
      return;
    }
    if (!orderTotal || orderTotal <= 0) {
      return addToast("Invalid order amount. Please return to checkout.", "error");
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/orders/initiate-phonepe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ orderId: lastOrderId })
      });

      const data = await response.json();

      if (data.success && data.redirectUrl) {
        localStorage.removeItem("cart");
        document.dispatchEvent(new Event("cartUpdated"));
        window.location.href = data.redirectUrl;
      } else {
        console.error("PhonePe error details:", data);
        addToast(`PhonePe Error: ${data.message || "Unknown"} (code: ${data.code || "?"})`, "error");
      }
    } catch (err) {
      console.error("Payment Initiation Error:", err);
      addToast("Server connection error during payment", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] pt-10 pb-20 relative overflow-hidden text-[#2C2921]">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-yellow-500/2 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-3xl mx-auto px-4 relative z-10">
        {/* Back Button */}
        <div className="mb-8">
          <Link 
            to="/checkout" 
            className="inline-flex items-center gap-2 text-[#7C786E] hover:text-yellow-600 transition-colors group px-4 py-2 rounded-lg hover:bg-black/5 font-bold uppercase tracking-widest text-[10px] font-sans"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Logistics
          </Link>
        </div>

        <div className="bg-white p-10 md:p-16 rounded-3xl border border-yellow-500/10 shadow-lg text-center relative overflow-hidden group">
          {/* Top accent */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500"></div>
          
          <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
            <span className="text-4xl">🔐</span>
          </div>
          
          <h2 className="text-4xl font-bold mb-4 text-[#2C2921] uppercase tracking-wider font-soria">Secure Payment</h2>
          <p className="text-[#6C685F] mb-10 max-w-sm mx-auto leading-relaxed font-playfair">
            Final Step: Complete your transaction via <span className="text-yellow-600 font-bold border-b border-yellow-500/30">PhonePe</span> secure layer.
          </p>

          <div className="bg-[#F5F2EB] p-8 rounded-2xl border border-yellow-500/10 mb-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-left font-sans">
              <p className="text-[10px] text-[#7C786E] uppercase font-black tracking-[0.2em] mb-1">Verified Order Total</p>
              <h3 className="text-5xl font-black text-yellow-600 tracking-tighter font-soria">
                {orderLoading ? "..." : orderTotal !== null ? `₹${orderTotal}` : "—"}
              </h3>
            </div>
            <div className="flex flex-col items-center gap-2">
               <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl border border-yellow-500/10 transform transition-transform hover:scale-105 duration-300 shadow-sm">
                  <span className="text-xs text-indigo-600 font-black uppercase tracking-widest font-sans">PhonePe</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping"></div>
               </div>
               <p className="text-[8px] text-[#7C786E] uppercase font-bold tracking-widest font-sans">NPCI UPI Verified</p>
            </div>
          </div>

          <button
            onClick={handlePhonePePay}
            disabled={loading || orderLoading || !orderTotal || orderTotal <= 0}
            className="w-full py-5 bg-gradient-to-r from-indigo-700 to-purple-800 text-white font-black text-xl rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 uppercase tracking-widest flex items-center justify-center gap-4 font-sans disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  <span>Enroute...</span>
                </>
            ) : (
                <>
                  Proceed with PhonePe
                  <svg className="w-6 h-6 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </>
            )}
          </button>
          
          <div className="mt-10 flex items-center justify-center gap-8 border-t border-yellow-500/10 pt-8 opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 font-sans">
             <span className="text-xs font-bold text-[#7C786E]">UPI</span>
             <span className="text-xs font-bold text-[#7C786E]">CARDS</span>
             <span className="text-xs font-bold text-[#7C786E]">NETBANK</span>
          </div>
          
          <p className="mt-8 text-[9px] text-[#7C786E] uppercase tracking-[0.3em] font-black font-sans">
            256-Bit SSL Encryption Active
          </p>
        </div>
      </div>
    </div>
  );
}
