import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { API_URL } from "./services/api";
import { openInvoice } from "./services/invoiceGenerator";

// ─── Success Page ─────────────────────────────────────────────────────────────
export default function Success() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading"); // "loading" | "success" | "failed"
  const [message, setMessage] = useState("");
  const [order, setOrder] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  useEffect(() => {
    const transactionId = searchParams.get("transactionId");

    if (!transactionId) {
      setStatus("failed");
      setMessage("No transaction ID found. Please contact support.");
      return;
    }

    const verifyPayment = async () => {
      try {
        // 1. Verify payment status
        const res = await fetch(`${API_URL}/orders/status/${transactionId}`);
        const data = await res.json();

        if (data.success) {
          // 2. Fetch order details for invoice
          try {
            const orderRes = await fetch(`${API_URL}/orders/${transactionId}`);
            const orderData = await orderRes.json();
            if (orderData.success) setOrder(orderData.order);
          } catch (_) {
            // Invoice won't be available but page still works
          }
          setStatus("success");
          setMessage("Your payment was successful! We are preparing your order.");
          localStorage.removeItem("lastOrderId");
        } else {
          setStatus("failed");
          setMessage(data.message || "Payment was not completed. Please try again.");
        }
      } catch (err) {
        setStatus("failed");
        setMessage("Could not verify payment. Please contact support with your transaction ID.");
      }
    };

    verifyPayment();
  }, [searchParams]);

  const handleInvoice = () => {
    if (!order) return;
    setInvoiceLoading(true);
    setTimeout(() => {
      openInvoice(order);
      setInvoiceLoading(false);
    }, 200);
  };

  // ── Loading ──
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#0a0802] flex items-center justify-center">
        <Helmet>
          <title>Verifying Payment | Kala Agalya Herbals</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-yellow-400 font-bold uppercase tracking-widest text-sm animate-pulse">
            Verifying your payment...
          </p>
          <p className="text-gray-600 text-xs mt-3 uppercase tracking-widest">Please do not close this window</p>
        </div>
      </div>
    );
  }

  // ── Success ──
  if (status === "success") {
    return (
      <div className="min-h-screen bg-[#0a0802] flex items-center justify-center px-4 py-12">
        <Helmet>
          <title>Payment Successful | Kala Agalya Herbals</title>
          <meta name="description" content="Thank you for your order! Your payment was successful." />
          <meta name="robots" content="noindex" />
        </Helmet>

        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-500/5 rounded-full blur-[120px]"></div>
        </div>

        <div className="relative z-10 max-w-lg w-full text-center">
          {/* Success icon */}
          <div className="w-28 h-28 mx-auto mb-8 relative">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-yellow-500/20 to-amber-500/10 border-2 border-yellow-500/40 flex items-center justify-center shadow-[0_0_60px_rgba(234,179,8,0.3)]">
              <svg className="w-14 h-14 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="absolute inset-0 rounded-full border-2 border-yellow-500/20 animate-ping"></div>
          </div>

          <div className="bg-[#15120a] border border-yellow-500/20 rounded-3xl p-10 shadow-2xl">
            <div className="inline-block bg-yellow-500/10 border border-yellow-500/20 rounded-full px-4 py-1 mb-6">
              <span className="text-yellow-500 text-[10px] font-black uppercase tracking-[0.4em]">Payment Successful</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
              🎉 Order Placed!
            </h1>
            <p className="text-gray-400 mb-3 leading-relaxed">{message}</p>
            <p className="text-gray-500 text-sm mb-8">
              Your <span className="text-yellow-400 font-medium">Kala Agalya Herbals</span> Naturopathy Oil is on its way!
            </p>

            {/* Invoice Button */}
            {order && (
              <button
                onClick={handleInvoice}
                disabled={invoiceLoading}
                className="w-full mb-6 py-4 flex items-center justify-center gap-3 bg-gradient-to-r from-yellow-600 to-amber-700 text-black rounded-xl font-black uppercase tracking-widest text-xs shadow-[0_0_25px_rgba(234,179,8,0.25)] hover:shadow-[0_0_40px_rgba(234,179,8,0.45)] transform hover:-translate-y-0.5 active:scale-95 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {invoiceLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                    <span>Generating Invoice...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Download Invoice (PDF)</span>
                  </>
                )}
              </button>
            )}

            <div className="border-t border-yellow-900/20 mb-6"></div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/product"
                className="flex-1 py-4 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-yellow-500/20 transition-all"
              >
                Continue Shopping
              </Link>
              <Link
                to="/profile"
                className="flex-1 py-4 bg-[#0d0b03] border border-yellow-900/30 text-gray-400 rounded-xl font-bold uppercase tracking-widest text-xs hover:border-yellow-500/30 hover:text-yellow-400 transition-all"
              >
                My Profile
              </Link>
            </div>
          </div>

          <p className="mt-6 text-[10px] text-gray-700 uppercase tracking-[0.3em] font-bold">
            Secured by PhonePe • 256-bit SSL Encrypted
          </p>
        </div>
      </div>
    );
  }

  // ── Failed ──
  return (
    <div className="min-h-screen bg-[#0a0802] flex items-center justify-center px-4">
      <Helmet>
        <title>Payment Failed | Kala Agalya Herbals</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/5 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 max-w-lg w-full text-center">
        <div className="w-28 h-28 mx-auto mb-8 relative">
          <div className="w-full h-full rounded-full bg-gradient-to-br from-red-500/20 to-red-900/10 border-2 border-red-500/40 flex items-center justify-center shadow-[0_0_60px_rgba(239,68,68,0.2)]">
            <svg className="w-14 h-14 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>

        <div className="bg-[#15120a] border border-red-500/20 rounded-3xl p-10 shadow-2xl">
          <div className="inline-block bg-red-500/10 border border-red-500/20 rounded-full px-4 py-1 mb-6">
            <span className="text-red-400 text-[10px] font-black uppercase tracking-[0.4em]">Payment Failed</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
            ❌ Payment Failed
          </h1>
          <p className="text-gray-400 mb-3 leading-relaxed">{message}</p>
          <p className="text-gray-500 text-sm mb-10">
            Don't worry — your cart is safe. You can try again from the payment page.
          </p>

          <div className="border-t border-red-900/20 mb-8"></div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/cart"
              className="flex-1 py-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-red-500/20 transition-all"
            >
              Back to Cart
            </Link>
            <Link
              to="/payment"
              className="flex-1 py-4 bg-gradient-to-r from-indigo-700 to-purple-800 text-white rounded-xl font-bold uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(107,33,168,0.2)] hover:shadow-[0_0_30px_rgba(107,33,168,0.4)] transition-all"
            >
              Try Again
            </Link>
          </div>
        </div>

        <p className="mt-6 text-[10px] text-gray-700 uppercase tracking-[0.3em] font-bold">
          Need help? Contact us at kalaagalyaherbals@gmail.com
        </p>
      </div>
    </div>
  );
}
