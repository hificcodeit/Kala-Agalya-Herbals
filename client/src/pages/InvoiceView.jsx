import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { API_URL } from "../services/api";
import { generateInvoiceHTML } from "../services/invoiceGenerator";

export default function InvoiceView() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`${API_URL}/orders/${id}`);
        const data = await res.json();
        if (data.success && data.order) {
          setOrder(data.order);
        } else {
          setError(data.message || "Order invoice not found");
        }
      } catch (err) {
        setError("Error loading invoice");
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [id]);

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
