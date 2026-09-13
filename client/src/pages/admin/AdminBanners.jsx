import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import { useToast } from "../../components/Alert";
import { API_URL, BASE_URL } from "../../services/api";
import { compressImageFile } from "../../utils/imageCompressor";

export default function AdminBanners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  // Section Header Settings State
  const [bannerSettings, setBannerSettings] = useState({
    badge: "",
    title: "",
    highlightText: "",
    subtitle: "",
  });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Multi-Image Banner Upload State
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [isSubmittingBanner, setIsSubmittingBanner] = useState(false);
  const [bannerFormData, setBannerFormData] = useState({
    title: "",
    subtitle: "",
    linkUrl: "#product",
  });
  const [bannerFiles, setBannerFiles] = useState([]);
  const [bannerPreviews, setBannerPreviews] = useState([]);

  const navigate = useNavigate();
  const { addToast } = useToast();

  const fetchBanners = useCallback(async () => {
    const token = localStorage.getItem("adminToken");
    try {
      const response = await fetch(`${API_URL}/banners/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setBanners(data.banners || []);
        if (data.settings) {
          setBannerSettings(data.settings);
        }
      }
    } catch (error) {
      console.error("Error fetching banners:", error);
      addToast("Failed to load banners", "error");
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
    fetchBanners();
  }, [navigate, fetchBanners]);

  const handleBannerFilesChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    setBannerFiles((prev) => [...prev, ...selectedFiles]);

    selectedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreviews((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeBannerFile = (index) => {
    setBannerFiles((prev) => prev.filter((_, i) => i !== index));
    setBannerPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleBannerSubmit = async (e) => {
    e.preventDefault();
    if (bannerFiles.length === 0) {
      addToast("Please select at least one offer banner image to upload", "warning");
      return;
    }

    const token = localStorage.getItem("adminToken");
    if (!token) {
      addToast("Session expired, please login again", "error");
      navigate("/admin/login");
      return;
    }

    setIsSubmittingBanner(true);
    try {
      // Compress all banner images concurrently (max 1920x1080, WebP 80%)
      const compressedFiles = await Promise.all(
        bannerFiles.map((file) => compressImageFile(file, 1920, 1080, 0.8))
      );

      const fd = new FormData();
      fd.append("title", bannerFormData.title);
      fd.append("subtitle", bannerFormData.subtitle);
      fd.append("linkUrl", bannerFormData.linkUrl);

      compressedFiles.forEach((file) => {
        fd.append("images", file);
      });

      const res = await fetch(`${API_URL}/banners`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (data.success) {
        addToast(data.message || "Offer banners uploaded & published! 🚀", "success");
        setShowBannerModal(false);
        setBannerFiles([]);
        setBannerPreviews([]);
        setBannerFormData({ title: "", subtitle: "", linkUrl: "#product" });
        fetchBanners();
      } else {
        addToast(data.message || "Failed to upload banner(s)", "error");
      }
    } catch (err) {
      console.error("Banner upload error:", err);
      addToast(err.message || "Failed to upload offer banner(s)", "error");
    } finally {
      setIsSubmittingBanner(false);
    }
  };

  const handleSaveBannerSettings = async (e) => {
    e.preventDefault();
    setIsSavingSettings(true);
    const token = localStorage.getItem("adminToken");

    try {
      const res = await fetch(`${API_URL}/banners/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bannerSettings),
      });
      const data = await res.json();
      if (data.success) {
        addToast("Section title & header updated successfully! ✨", "success");
        setShowSettingsModal(false);
        if (data.settings) setBannerSettings(data.settings);
        fetchBanners();
      } else {
        addToast(data.message || "Failed to update settings", "error");
      }
    } catch (err) {
      console.error("Settings update error:", err);
      addToast("Failed to save banner section settings", "error");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleToggleBanner = async (id) => {
    const token = localStorage.getItem("adminToken");
    try {
      const res = await fetch(`${API_URL}/banners/${id}/toggle`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        addToast(data.message, "success");
        fetchBanners();
      } else {
        addToast("Failed to update status", "error");
      }
    } catch {
      addToast("Error updating banner status", "error");
    }
  };

  const handleDeleteBanner = async (id) => {
    if (!window.confirm("Are you sure you want to delete this offer banner?")) return;
    const token = localStorage.getItem("adminToken");
    try {
      const res = await fetch(`${API_URL}/banners/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        addToast("Offer banner deleted successfully", "success");
        fetchBanners();
      } else {
        addToast("Failed to delete banner", "error");
      }
    } catch {
      addToast("Error deleting banner", "error");
    }
  };

  const activeCount = banners.filter((b) => b.isActive).length;

  return (
    <AdminLayout>
      {loading ? (
        <div className="py-24 text-center">
          <div className="animate-spin h-10 w-10 border-4 border-yellow-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-[#6C685F] font-inter text-sm">Loading banners & offers...</p>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1C1A16] mb-1 font-soria whitespace-nowrap">
                Promotional Banners
              </h1>
              <p className="text-[#6C685F] text-xs sm:text-sm font-inter">
                Manage website launch offers, promotional banner images, and section titles
              </p>
            </div>
            <div className="flex flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
              <button
                onClick={() => setShowSettingsModal(true)}
                className="flex-1 sm:flex-initial px-4 py-3 bg-yellow-50 hover:bg-yellow-100 text-yellow-900 border border-yellow-500/30 font-extrabold font-grotesk rounded-xl transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-xs whitespace-nowrap"
              >
                <span>⚙️ Edit Section Title</span>
              </button>
              <button
                onClick={() => setShowBannerModal(true)}
                className="flex-1 sm:flex-initial px-5 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-extrabold font-grotesk rounded-xl shadow-gold hover:shadow-gold-lg transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-xs whitespace-nowrap"
              >
                <span>+ Upload Offer Image(s)</span>
              </button>
            </div>
          </div>

          {/* Statistics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white p-5 rounded-2xl border border-yellow-500/15 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#9A9690] font-bold font-grotesk">Total Banners</p>
                <p className="text-2xl font-bold text-[#1C1A16] font-soria mt-0.5">{banners.length}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-yellow-500/10 text-yellow-700 flex items-center justify-center font-bold">
                🖼️
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-emerald-500/20 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-emerald-800 font-bold font-grotesk">Active on Website</p>
                <p className="text-2xl font-bold text-emerald-700 font-soria mt-0.5">{activeCount}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                ✓
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-yellow-500/15 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#9A9690] font-bold font-grotesk">Hidden / Inactive</p>
                <p className="text-2xl font-bold text-[#6C685F] font-soria mt-0.5">{banners.length - activeCount}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center font-bold">
                ○
              </div>
            </div>
          </div>

          {/* Live Section Header Overview */}
          <div className="mb-8 bg-gradient-to-r from-[#FAF7F0] via-white to-[#FAF7F0] p-6 rounded-3xl border border-yellow-500/20 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              {bannerSettings.badge && (
                <span className="px-3 py-1 rounded-full bg-yellow-500/15 text-yellow-900 text-[10px] font-black uppercase font-grotesk tracking-wider inline-block">
                  {bannerSettings.badge}
                </span>
              )}
              <h3 className="text-xl font-bold font-soria text-[#1C1A16]">
                {bannerSettings.title ? (
                  <>
                    {bannerSettings.title}{" "}
                    {bannerSettings.highlightText && (
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-amber-700">
                        {bannerSettings.highlightText}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-[#9A9690] text-sm italic font-inter">No custom section title configured (Will use uploaded banner title or remain clean)</span>
                )}
              </h3>
              {bannerSettings.subtitle && (
                <p className="text-xs text-[#6C685F] font-inter max-w-2xl">{bannerSettings.subtitle}</p>
              )}
            </div>
            <button
              onClick={() => setShowSettingsModal(true)}
              className="px-4 py-2 bg-white text-yellow-800 border border-yellow-500/30 rounded-xl text-xs font-bold font-grotesk uppercase tracking-wider hover:bg-yellow-50 transition-all shrink-0 shadow-xs"
            >
              Customize Titles
            </button>
          </div>

          {/* Banners Grid */}
          <div className="bg-white p-7 rounded-3xl border border-yellow-500/20 shadow-card">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-yellow-500/12 pb-5 mb-6">
              <div>
                <h3 className="text-2xl font-bold text-[#1C1A16] font-soria">Offer Banner Posters</h3>
                <p className="text-[#6C685F] text-xs font-inter mt-0.5">
                  Uploaded banners will scroll horizontally on the live website (or display centered if single)
                </p>
              </div>
              <button
                onClick={() => setShowBannerModal(true)}
                className="px-4 py-2 bg-yellow-500/15 text-yellow-900 border border-yellow-500/30 rounded-xl font-bold font-grotesk text-xs uppercase tracking-wider hover:bg-yellow-500/25 transition-colors"
              >
                + Add Offer Poster(s)
              </button>
            </div>

            {banners.length === 0 ? (
              <div className="text-center py-16 bg-[#FDFBF7] rounded-2xl border border-dashed border-yellow-500/30">
                <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                  🖼️
                </div>
                <p className="text-base font-bold text-[#1C1A16] font-soria mb-1">No promotional offer banners uploaded yet</p>
                <p className="text-xs text-[#6C685F] font-inter mb-4">
                  Upload multiple offer banners to activate the homepage promotional slider.
                </p>
                <button
                  onClick={() => setShowBannerModal(true)}
                  className="px-6 py-2.5 bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-bold font-grotesk text-xs uppercase tracking-wider rounded-xl shadow-gold hover:from-yellow-400 hover:to-amber-500 transition-all"
                >
                  Upload Offer Poster(s) Now
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {banners.map((b) => (
                  <div
                    key={b._id}
                    className="bg-[#FDFBF7] rounded-2xl border border-yellow-500/20 overflow-hidden shadow-sm flex flex-col justify-between group hover:shadow-card transition-all"
                  >
                    <div className="relative h-52 bg-black/5 overflow-hidden p-3 flex items-center justify-center">
                      <img
                        src={b.image.startsWith("data:") || b.image.startsWith("http") ? b.image : `${BASE_URL.replace(/\/api$/, "")}${b.image}`}
                        alt={b.title}
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500"
                      />
                      <span
                        className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase font-grotesk tracking-wider border shadow-xs ${
                          b.isActive ? "bg-emerald-100 text-emerald-800 border-emerald-300" : "bg-gray-100 text-gray-700 border-gray-300"
                        }`}
                      >
                        {b.isActive ? "● Live on Website" : "○ Hidden"}
                      </span>
                    </div>

                    <div className="p-4 space-y-2 font-inter border-t border-yellow-500/10 bg-white">
                      <h4 className="font-bold text-[#1C1A16] text-base font-grotesk leading-snug">{b.title}</h4>
                      <p className="text-xs text-[#6C685F] line-clamp-2">{b.subtitle}</p>

                      <div className="text-[11px] text-[#9A9690] flex items-center justify-between pt-1">
                        <span className="truncate max-w-[150px]">🔗 {b.linkUrl || "#product"}</span>
                        <span>{new Date(b.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>
                      </div>

                      <div className="pt-3 flex items-center justify-between gap-2 border-t border-yellow-500/10">
                        <button
                          onClick={() => handleToggleBanner(b._id)}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold font-grotesk uppercase tracking-wider transition-colors ${
                            b.isActive
                              ? "bg-amber-100 text-amber-900 hover:bg-amber-200"
                              : "bg-emerald-100 text-emerald-900 hover:bg-emerald-200"
                          }`}
                        >
                          {b.isActive ? "Hide Banner" : "Show on Website"}
                        </button>

                        <button
                          onClick={() => handleDeleteBanner(b._id)}
                          className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-[11px] font-bold font-grotesk uppercase tracking-wider transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Edit Section Header Settings Modal */}
          {showSettingsModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 z-[60] animate-fadeIn overflow-y-auto">
              <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full my-auto border border-yellow-500/20 relative overflow-hidden">
                <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-yellow-500/12 px-6 py-4 flex justify-between items-center z-10">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full bg-yellow-500/15 text-yellow-800 text-[10px] font-extrabold font-grotesk uppercase tracking-wider inline-block mb-1">
                      ⚙️ Section Customizer
                    </span>
                    <h2 className="text-xl font-bold text-[#1C1A16] font-grotesk tracking-wide">
                      Edit Offer Section Titles
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowSettingsModal(false)}
                    className="text-[#9A9690] hover:text-red-600 transition-colors p-2"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSaveBannerSettings} className="p-6 sm:p-8 space-y-5 font-inter">
                  <div>
                    <label className="block text-xs font-bold text-yellow-800 uppercase tracking-wider mb-2 font-grotesk">
                      Badge Pill Text (Optional)
                    </label>
                    <input
                      type="text"
                      value={bannerSettings.badge || ""}
                      onChange={(e) => setBannerSettings({ ...bannerSettings, badge: e.target.value })}
                      className="w-full px-4 py-3 bg-[#FDFBF7] border border-yellow-500/20 rounded-xl text-sm font-medium focus:border-yellow-600 focus:bg-white outline-none transition-all"
                      placeholder="e.g. 🔥 Limited Time Special Offer"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-yellow-800 uppercase tracking-wider mb-2 font-grotesk">
                        Main Title Prefix (Optional)
                      </label>
                      <input
                        type="text"
                        value={bannerSettings.title || ""}
                        onChange={(e) => setBannerSettings({ ...bannerSettings, title: e.target.value })}
                        className="w-full px-4 py-3 bg-[#FDFBF7] border border-yellow-500/20 rounded-xl text-sm font-medium focus:border-yellow-600 focus:bg-white outline-none transition-all"
                        placeholder="e.g. Month End"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-yellow-800 uppercase tracking-wider mb-2 font-grotesk">
                        Highlighted Text (Gradient) (Optional)
                      </label>
                      <input
                        type="text"
                        value={bannerSettings.highlightText || ""}
                        onChange={(e) => setBannerSettings({ ...bannerSettings, highlightText: e.target.value })}
                        className="w-full px-4 py-3 bg-[#FDFBF7] border border-yellow-500/20 rounded-xl text-sm font-medium focus:border-yellow-600 focus:bg-white outline-none transition-all"
                        placeholder="e.g. Special Offer"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-yellow-800 uppercase tracking-wider mb-2 font-grotesk">
                      Subtitle / Description (Optional)
                    </label>
                    <textarea
                      value={bannerSettings.subtitle || ""}
                      onChange={(e) => setBannerSettings({ ...bannerSettings, subtitle: e.target.value })}
                      className="w-full px-4 py-3 bg-[#FDFBF7] border border-yellow-500/20 rounded-xl text-sm font-medium focus:border-yellow-600 focus:bg-white outline-none transition-all resize-none h-20"
                      placeholder="e.g. Grab Your Favorite Products for Less and Healthy Choices, Happy Savings!"
                    />
                  </div>

                  {/* Live Preview Box */}
                  <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-yellow-500/20">
                    <span className="text-[10px] font-extrabold uppercase font-grotesk text-yellow-800 tracking-wider block mb-2">
                      Live Header Preview:
                    </span>
                    <div className="text-center p-3 bg-white rounded-xl border border-yellow-500/10">
                      {bannerSettings.badge && (
                        <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-yellow-500/15 text-yellow-900 mb-2">
                          {bannerSettings.badge}
                        </span>
                      )}
                      <h4 className="text-xl font-bold font-soria text-[#1C1A16]">
                        {bannerSettings.title || bannerSettings.highlightText ? (
                          <>
                            {bannerSettings.title}{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-amber-700">
                              {bannerSettings.highlightText}
                            </span>
                          </>
                        ) : (
                          <span className="text-gray-400 text-sm italic font-inter font-normal">Section Title Preview (Empty)</span>
                        )}
                      </h4>
                      {bannerSettings.subtitle && (
                        <p className="text-xs text-[#6C685F] mt-1">{bannerSettings.subtitle}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2 font-grotesk">
                    <button
                      type="button"
                      onClick={() => setShowSettingsModal(false)}
                      className="flex-1 px-4 py-3 bg-[#F5F2EB] text-[#6C685F] border border-yellow-500/20 rounded-xl font-bold hover:bg-yellow-500/10 transition-colors text-xs uppercase tracking-wider"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingSettings}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 text-black rounded-xl font-bold hover:from-yellow-400 hover:to-amber-500 transition-all text-xs uppercase tracking-wider shadow-gold flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSavingSettings ? (
                        <>
                          <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <span>💾 Save Section Titles</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Multi-Image Upload Offer Banner Modal */}
          {showBannerModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 z-[60] animate-fadeIn overflow-y-auto">
              <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full my-auto border border-yellow-500/20 relative overflow-hidden">
                {/* Modal Header */}
                <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-yellow-500/12 px-6 py-4 flex justify-between items-center z-10">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full bg-yellow-500/15 text-yellow-800 text-[10px] font-extrabold font-grotesk uppercase tracking-wider inline-block mb-1">
                      🔥 Promotional Banners
                    </span>
                    <h2 className="text-xl font-bold text-[#1C1A16] font-grotesk tracking-wide">
                      Upload Offer Poster Images
                    </h2>
                  </div>
                  <button
                    onClick={() => {
                      setShowBannerModal(false);
                      setBannerFiles([]);
                      setBannerPreviews([]);
                    }}
                    className="text-[#9A9690] hover:text-red-600 transition-colors p-2"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Modal Form */}
                <form onSubmit={handleBannerSubmit} className="p-6 sm:p-8 space-y-5 font-inter max-h-[80vh] overflow-y-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-yellow-800 uppercase tracking-wider mb-2 font-grotesk">
                        Banner Title (Optional)
                      </label>
                      <input
                        type="text"
                        value={bannerFormData.title}
                        onChange={(e) => setBannerFormData({ ...bannerFormData, title: e.target.value })}
                        className="w-full px-4 py-3 bg-[#FDFBF7] border border-yellow-500/20 rounded-xl text-sm font-medium focus:border-yellow-600 focus:bg-white outline-none transition-all"
                        placeholder="e.g. Website Launching Offer"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-yellow-800 uppercase tracking-wider mb-2 font-grotesk">
                        Target Section Link URL
                      </label>
                      <input
                        type="text"
                        value={bannerFormData.linkUrl}
                        onChange={(e) => setBannerFormData({ ...bannerFormData, linkUrl: e.target.value })}
                        className="w-full px-4 py-3 bg-[#FDFBF7] border border-yellow-500/20 rounded-xl text-sm font-medium focus:border-yellow-600 focus:bg-white outline-none transition-all"
                        placeholder="e.g. #product"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-yellow-800 uppercase tracking-wider mb-2 font-grotesk">
                      Subtitle / Promo Text (Optional)
                    </label>
                    <input
                      type="text"
                      value={bannerFormData.subtitle}
                      onChange={(e) => setBannerFormData({ ...bannerFormData, subtitle: e.target.value })}
                      className="w-full px-4 py-3 bg-[#FDFBF7] border border-yellow-500/20 rounded-xl text-sm font-medium focus:border-yellow-600 focus:bg-white outline-none transition-all"
                      placeholder="e.g. 200ml Launch Deal - Save Big!"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold text-yellow-800 uppercase tracking-wider font-grotesk">
                        Select Multiple Banner Images *
                      </label>
                      {bannerFiles.length > 0 && (
                        <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          {bannerFiles.length} {bannerFiles.length === 1 ? "image" : "images"} selected
                        </span>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="relative border-2 border-dashed border-yellow-500/30 hover:border-yellow-500/60 rounded-2xl p-6 text-center bg-[#FDFBF7] transition-all group cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleBannerFilesChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                          <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-700 group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-sm font-bold text-[#1C1A16] font-grotesk">
                            Click or drag & drop one or multiple images
                          </p>
                          <p className="text-xs text-[#6C685F] font-inter">
                            Supports JPG, PNG, WEBP (Select multiple files together)
                          </p>
                        </div>
                      </div>

                      {/* Multiple Previews Grid */}
                      {bannerPreviews.length > 0 && (
                        <div className="rounded-2xl border border-yellow-500/20 bg-[#FDFBF7] p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-bold text-yellow-800 uppercase tracking-widest font-grotesk">
                              Selected Images ({bannerPreviews.length}):
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setBannerFiles([]);
                                setBannerPreviews([]);
                              }}
                              className="text-[11px] text-red-600 hover:text-red-800 font-bold underline"
                            >
                              Clear All
                            </button>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-56 overflow-y-auto p-1">
                            {bannerPreviews.map((preview, index) => (
                              <div
                                key={index}
                                className="relative group rounded-xl border border-yellow-500/20 bg-white p-2 h-28 flex items-center justify-center overflow-hidden shadow-xs"
                              >
                                <img
                                  src={preview}
                                  alt={`Banner ${index + 1}`}
                                  className="max-h-full max-w-full object-contain"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeBannerFile(index)}
                                  className="absolute top-1 right-1 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow hover:bg-red-700 transition-colors"
                                  title="Remove this image"
                                >
                                  ✕
                                </button>
                                <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 text-white rounded text-[9px] font-mono">
                                  #{index + 1}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4 font-grotesk sticky bottom-0 bg-white/95 backdrop-blur py-2 border-t border-yellow-500/10">
                    <button
                      type="button"
                      onClick={() => {
                        setShowBannerModal(false);
                        setBannerFiles([]);
                        setBannerPreviews([]);
                      }}
                      className="flex-1 px-4 py-3 bg-[#F5F2EB] text-[#6C685F] border border-yellow-500/20 rounded-xl font-bold hover:bg-yellow-500/10 transition-colors text-xs uppercase tracking-wider"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingBanner || bannerFiles.length === 0}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 text-black rounded-xl font-bold hover:from-yellow-400 hover:to-amber-500 transition-all text-xs uppercase tracking-wider shadow-gold flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSubmittingBanner ? (
                        <>
                          <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                          <span>Uploading {bannerFiles.length} Banners...</span>
                        </>
                      ) : (
                        <span>🚀 Publish {bannerFiles.length > 0 ? `${bannerFiles.length} ` : ""}Banner(s)</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
}
