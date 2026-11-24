import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { API_URL } from "../services/api";
import { generateInvoiceHTML } from "../services/invoiceGenerator";

export default function InvoiceView() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExpired, setIsExpired] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchOrder() {
      try {
        const adminToken = localStorage.getItem("adminToken");
        const headers = {};
        if (adminToken) {
          headers["Authorization"] = `Bearer ${adminToken}`;
        }

        const res = await fetch(`${API_URL}/orders/${id}?token=${encodeURIComponent(token)}`, {
          headers
        });
        const data = await res.json();

        if (res.status === 410 || data.expired) {
          setIsExpired(true);
          setError(data.message || "This invoice link has expired for your security.");
          return;
        }

        if (data.success && data.order) {
          setOrder(data.order);
        } else {
          setError(data.message || "Order invoice not found or link has expired.");
        }
      } catch (err) {
        console.error("Error loading invoice:", err);
        setError("Unable to connect to invoice server. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [id, token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0b06] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-yellow-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-yellow-100 font-sans text-sm tracking-wide">
            Loading Official Tax Invoice...
          </p>
        </div>
      </div>
    );
  }

  // ── Expired Link Security Screen (10-20 Mins Protection) ─────────────────
  if (isExpired) {
    const waText = encodeURIComponent(
      `Hello Kala Agalya Herbals, my invoice link for Order #${id} has expired (20-min security expiry). Please send me a fresh invoice link. Thank you!`
    );
    const waUrl = `https://wa.me/919942761668?text=${waText}`;

    return (
      <div className="min-h-screen bg-[#090804] flex items-center justify-center p-4 text-center selection:bg-amber-500 selection:text-black">
        <div className="max-w-md w-full bg-[#141108] border border-amber-500/30 p-8 sm:p-10 rounded-3xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600"></div>
          
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/25 text-amber-400 flex items-center justify-center mx-auto mb-5 text-3xl shadow-inner">
            ⏳
          </div>

          <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-amber-500 font-mono block mb-1">
            Privacy & Security Protection
          </span>
          <h2 className="text-2xl font-bold text-white mb-3 font-soria">
            Invoice Link Expired
          </h2>

          <p className="text-gray-300 text-xs mb-4 font-inter leading-relaxed">
            For your privacy and order security, official invoice links remain active for <strong>20 minutes</strong> from generation.
          </p>

          <div className="bg-[#1e190b] border border-amber-500/20 rounded-2xl p-4 mb-6 text-left text-[11px] text-amber-200/80 space-y-1">
            <p>• <strong>Order ID:</strong> #{id}</p>
            <p>• <strong>Status:</strong> Security Session Expired</p>
            <p>• <strong>Action:</strong> Click below to receive a new link immediately on WhatsApp.</p>
          </div>

          <div className="space-y-3">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-xs uppercase tracking-wider font-grotesk shadow-md active:scale-95 transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
              </svg>
              <span>Request New Link on WhatsApp</span>
            </a>

            <Link
              to="/"
              className="w-full inline-block text-center text-xs text-amber-500/80 hover:text-amber-400 font-grotesk font-bold py-2 transition-colors"
            >
              Return to Kala Agalya Herbals Store
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // General Error / Not Found Screen
  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#0d0b06] flex items-center justify-center p-4 text-center">
        <div className="max-w-md bg-[#141108] border border-[#2e2410] p-8 rounded-2xl shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-yellow-500/10 text-yellow-500 flex items-center justify-center mx-auto mb-4 text-xl">
            📄
          </div>
          <h2 className="text-xl font-bold text-yellow-500 mb-2 font-soria">Invoice Not Found</h2>
          <p className="text-gray-400 text-xs mb-6">
            {error || "We could not find an invoice matching this order reference."}
          </p>
          <Link
            to="/"
            className="inline-block px-5 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-bold text-xs uppercase tracking-wider font-grotesk shadow-md"
          >
            Visit Kala Agalya Herbals
          </Link>
        </div>
      </div>
    );
  }

  const invoiceHtml = generateInvoiceHTML(order);

  return (
    <div className="w-full min-h-screen bg-[#090804]">
      <iframe
        srcDoc={invoiceHtml}
        title={`Tax Invoice #${order.invoiceNumber || order.orderId}`}
        className="w-full h-screen border-none"
      />
    </div>
  );
}
