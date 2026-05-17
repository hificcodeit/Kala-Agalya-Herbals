import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "./Alert";
import AdminLayout from "./AdminLayout";

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { addToast } = useToast();

  const fetchReviews = useCallback(async () => {
    const token = localStorage.getItem("adminToken");
    try {
      const response = await fetch("https://kala-agalya-herbals-production.up.railway.app/api/reviews", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setReviews(data.reviews);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      addToast("Failed to fetch reviews", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin/login");
      return;
    }
    fetchReviews();
  }, [navigate, fetchReviews]);

  const handleDelete = async (id) => {
    if (!window.confirm("CRITICAL: Are you sure you want to delete this review? This action cannot be undone.")) return;

    const token = localStorage.getItem("adminToken");
    try {
      const response = await fetch(`https://kala-agalya-herbals-production.up.railway.app/api/reviews/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        },
      });

      const data = await response.json();
      if (data.success) {
        addToast("Review deleted successfully", "success");
        fetchReviews();
      } else {
        addToast("Failed to delete review", "error");
      }
    } catch (error) {
      console.error("Error deleting review:", error);
      addToast("Failed to delete review", "error");
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Review Moderation</h1>
          <p className="text-gray-500 text-sm">Monitor and manage customer feedback across products</p>
        </div>
        <div className="bg-[#111a11] px-6 py-4 rounded-2xl border border-yellow-500/10 flex items-center gap-4">
          <div className="bg-yellow-900/20 p-2 rounded-xl border border-yellow-500/20">
            <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none mb-1">Total Submissions</p>
            <p className="text-2xl font-black text-white leading-none">{reviews.length}</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {loading ? (
          <div className="py-40 text-center">
            <div className="animate-spin h-10 w-10 border-4 border-yellow-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Scanning database...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-24 bg-[#111a11] rounded-3xl border border-dashed border-yellow-500/20">
            <svg className="w-16 h-16 text-gray-800 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            <p className="text-white text-lg font-bold mb-1">No feedback received yet</p>
            <p className="text-gray-500 text-sm">Customer reviews will appear here once submitted.</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review._id} className="bg-[#111a11] p-8 rounded-3xl border border-yellow-500/10 shadow-xl relative overflow-hidden group hover:border-yellow-500/30 transition-all duration-500">
              <div className="absolute top-0 right-0 w-40 h-40 bg-yellow-500/5 blur-[80px] rounded-full group-hover:bg-yellow-500/10 transition-colors"></div>

              <div className="flex flex-col md:flex-row justify-between gap-10 items-start">
                <div className="flex-1 space-y-6">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-yellow-900/20 rounded-2xl flex items-center justify-center text-yellow-500 text-xl font-black border border-yellow-500/20 shadow-inner group-hover:scale-105 transition-transform">
                      {review.name[0].toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-black text-white text-xl uppercase tracking-tight group-hover:text-yellow-400 transition-colors">{review.name}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex text-yellow-500 text-sm filter drop-shadow-[0_0_5px_rgba(234,179,8,0.3)]">
                          {[...Array(5)].map((_, i) => (
                            <svg key={i} className={`w-4 h-4 ${i < review.rating ? "fill-current" : "text-gray-700"}`} viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">• {new Date(review.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-500/40 mb-3 block">Customer Feedback</span>
                    <p className="text-gray-300 leading-relaxed text-lg font-medium">{review.comment}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 pt-6 border-t border-yellow-900/10">
                    <div className="bg-black/40 px-4 py-2 rounded-xl border border-yellow-900/20">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-1 block">Associated Product</span>
                      <span className="text-sm text-yellow-500 font-black uppercase tracking-tight">{review.product?.name || "Terminated SKU"}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-row md:flex-col gap-6 items-center md:items-end w-full md:w-auto">
                  {review.image && (
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl border border-yellow-500/10 overflow-hidden bg-black shadow-2xl flex-shrink-0 group/img cursor-zoom-in">
                      <img
                        src={`https://kala-agalya-herbals-production.up.railway.app${review.image}`}
                        alt="Review Attachment"
                        className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-700"
                      />
                    </div>
                  )}
                  <button
                    onClick={() => handleDelete(review._id)}
                    className="flex-1 md:flex-none px-8 py-4 bg-[#0d0b03] text-red-500 border border-red-500/30 rounded-2xl font-black uppercase text-[10px] tracking-[0.15em] hover:bg-red-600 hover:text-white hover:border-red-600 transition-all shadow-lg hover:shadow-red-500/20"
                  >
                    Delete Review
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </AdminLayout>
  );
}
