import { API_URL, BASE_URL } from "../../services/api";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../components/Alert";
import AdminLayout from "./AdminLayout";
import { compressImageFile } from "../../utils/imageCompressor";

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    gstPercentage: 0,
    sizes: [
      { size: "100ml", mrp: 0, price: 0, stock: 0 },
      { size: "200ml", mrp: 0, price: 0, stock: 0 },
      { size: "500ml", mrp: 0, price: 0, stock: 0 },
    ],
    images: [], // Array of File objects
    imageUrls: [], // Array of display URLs
    isActive: true,
  });

  const navigate = useNavigate();
  const { addToast } = useToast();

  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/products`);
      const data = await response.json();
      if (data.success) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      addToast("Failed to fetch products", "error");
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
    fetchProducts();
  }, [navigate, fetchProducts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("adminToken");
    if (!token) {
      addToast("Session expired, please login again", "error");
      navigate("/admin/login");
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData = new FormData();
      submitData.append("name", formData.name);
      submitData.append("description", formData.description);
      submitData.append("sizes", JSON.stringify(formData.sizes));
      submitData.append("gstPercentage", formData.gstPercentage);
      submitData.append("isActive", formData.isActive);

      if (formData.images && formData.images.length > 0) {
        const compressedImages = await Promise.all(
          formData.images.map((file) => compressImageFile(file, 1200, 1200, 0.8))
        );
        compressedImages.forEach((file) => {
          submitData.append("images", file);
        });
      }

      const url = editingProduct
        ? `${API_URL}/products/${editingProduct._id}`
        : `${API_URL}/products`;

      const response = await fetch(url, {
        method: editingProduct ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: submitData,
      });

      const data = await response.json();
      if (data.success) {
        addToast(
          editingProduct ? "Product updated successfully ✨" : "Product created successfully 🚀",
          "success"
        );
        setShowModal(false);
        resetForm();
        fetchProducts();
      } else {
        addToast(data.message || "Operation failed", "error");
      }
    } catch (error) {
      console.error("Error saving product:", error);
      addToast(error.message || "Failed to save product", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    const token = localStorage.getItem("adminToken");
    try {
      const response = await fetch(`${API_URL}/products/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        addToast("Product deleted successfully", "success");
        fetchProducts();
      } else {
        addToast("Failed to delete product", "error");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      addToast("Failed to delete product", "error");
    }
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      gstPercentage: product.gstPercentage ?? 0,
      sizes: product.sizes || [],
      images: [],
      imageUrls: product.images || [],
      isActive: product.isActive,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      description: "",
      gstPercentage: 0,
      sizes: [
        { size: "100ml", mrp: 0, price: 0, stock: 0 },
        { size: "200ml", mrp: 0, price: 0, stock: 0 },
        { size: "500ml", mrp: 0, price: 0, stock: 0 },
      ],
      images: [],
      imageUrls: [],
      isActive: true,
    });
  };

  const updateSize = (index, field, value) => {
    const newSizes = [...formData.sizes];
    newSizes[index][field] = field === "size" || value === "" ? value : Number(value);
    setFormData({ ...formData, sizes: newSizes });
  };

  const addSize = () => {
    setFormData({
      ...formData,
      sizes: [...formData.sizes, { size: "", mrp: 0, price: 0, offerPrice: null, stock: 0 }],
    });
  };

  const removeSize = (index) => {
    const newSizes = formData.sizes.filter((_, i) => i !== index);
    setFormData({ ...formData, sizes: newSizes });
  };

  return (
    <AdminLayout>
      {loading ? (
        <div className="py-24 text-center">
          <div className="animate-spin h-10 w-10 border-4 border-yellow-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-[#6C685F] font-inter text-sm">Loading product catalog...</p>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1C1A16] mb-1 font-soria whitespace-nowrap">
                Product Inventory
              </h1>
              <p className="text-[#6C685F] text-xs sm:text-sm font-inter">
                Manage herbal oil catalog items, bottle sizes, pricing, MRP, and stock inventory
              </p>
            </div>
            <div className="flex flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="flex-1 sm:flex-initial px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-extrabold font-grotesk rounded-xl shadow-gold hover:shadow-gold-lg transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-xs whitespace-nowrap"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add New Product</span>
              </button>
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <div
                key={product._id}
                className={`bg-white rounded-3xl border overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between ${
                  !product.isActive ? "opacity-75 border-gray-200" : "border-yellow-500/12"
                }`}
              >
                <div>
                  <div className="relative h-64 bg-gradient-to-b from-[#FDFBF7] to-[#F5F2EB] p-4 flex items-center justify-center border-b border-yellow-500/10 group">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={
                          product.images[0].startsWith("data:") || product.images[0].startsWith("http")
                            ? product.images[0]
                            : `${BASE_URL.replace(/\/api$/, "")}${product.images[0]}`
                        }
                        alt={product.name}
                        className="max-h-full max-w-full object-contain transform group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="text-4xl text-yellow-600/30 font-soria">Kala Agalya</div>
                    )}
                    <div className="absolute top-4 right-4 flex gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase font-grotesk tracking-widest ${
                          product.isActive
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : "bg-gray-100 text-gray-600 border border-gray-200"
                        }`}
                      >
                        {product.isActive ? "Active" : "Disabled"}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-bold text-[#1C1A16] font-grotesk mb-2">{product.name}</h3>
                    <p className="text-[#6C685F] text-xs font-inter line-clamp-2 mb-4 leading-relaxed">
                      {product.description}
                    </p>

                    <div className="space-y-2 border-t border-yellow-500/10 pt-4">
                      <span className="text-[10px] font-extrabold text-yellow-800 uppercase tracking-widest block font-grotesk">
                        Sizes & Pricing
                      </span>
                      <div className="grid grid-cols-1 gap-2">
                        {product.sizes.map((s, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center bg-[#FDFBF7] px-3.5 py-2 rounded-xl text-xs font-inter border border-yellow-500/10"
                          >
                            <span className="font-bold text-[#1C1A16] font-grotesk">{s.size}</span>
                            <div className="flex items-center gap-2">
                              {s.mrp && s.mrp > s.price && (
                                <span className="line-through text-[#9A9690] text-[11px]">₹{s.mrp}</span>
                              )}
                              <span className="font-bold text-yellow-800 font-grotesk text-sm">₹{s.price}</span>
                              <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md font-grotesk">
                                Stock: {s.stock}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0 flex gap-3">
                  <button
                    onClick={() => openEditModal(product)}
                    className="flex-1 px-4 py-2.5 bg-yellow-50 text-yellow-900 border border-yellow-200 rounded-xl text-xs font-bold font-grotesk uppercase tracking-wider hover:bg-yellow-100 transition-colors text-center"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product._id)}
                    className="px-4 py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-bold font-grotesk uppercase tracking-wider hover:bg-red-100 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {products.length === 0 && (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-yellow-500/30">
              <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <p className="text-[#6C685F] mb-3 font-inter text-sm">No products found in inventory.</p>
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="text-yellow-800 font-bold underline font-grotesk uppercase tracking-wider text-xs"
              >
                Add your first product
              </button>
            </div>
          )}

          {/* Add/Edit Product Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 z-[60] animate-fadeIn overflow-y-auto">
              <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full my-auto border border-yellow-500/20 relative overflow-hidden">
                <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-yellow-500/12 px-6 py-4 flex justify-between items-center z-10">
                  <h2 className="text-xl font-bold text-[#1C1A16] font-grotesk tracking-wide">
                    {editingProduct ? "Edit Product" : "Add New Product"}
                  </h2>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="text-[#9A9690] hover:text-red-600 transition-colors p-2"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 font-inter">
                  <div>
                    <label className="block text-xs font-bold text-yellow-800 uppercase tracking-wider mb-2 font-grotesk">
                      Product Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input-premium"
                      placeholder="e.g. Kala Agalya Herbal Hair Oil"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-yellow-800 uppercase tracking-wider mb-2 font-grotesk">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="input-premium h-24 resize-none"
                      placeholder="Describe the product benefits..."
                      required
                    />
                  </div>

                  {/* GST Percentage */}
                  <div className="bg-[#FDFBF7] p-5 rounded-2xl border border-yellow-500/12">
                    <label className="block text-xs font-bold text-yellow-800 uppercase tracking-wider mb-3 font-grotesk">
                      GST Percentage (%)
                    </label>
                    <div className="flex gap-2.5 flex-wrap">
                      {[0, 5, 12, 18, 28].map((gst) => (
                        <button
                          key={gst}
                          type="button"
                          onClick={() => setFormData({ ...formData, gstPercentage: gst })}
                          className={`px-4 py-2 rounded-xl text-xs font-bold font-grotesk border transition-all ${
                            formData.gstPercentage === gst
                              ? "bg-gradient-to-r from-yellow-500 to-amber-600 text-black border-yellow-500 shadow-gold"
                              : "bg-white text-[#6C685F] border-yellow-500/20 hover:border-yellow-500/50 hover:text-[#1C1A16]"
                          }`}
                        >
                          {gst}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sizes and Pricing */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-bold text-yellow-800 uppercase tracking-wider font-grotesk">
                        Sizes & Pricing
                      </label>
                      <button
                        type="button"
                        onClick={addSize}
                        className="text-xs font-bold text-yellow-800 hover:text-yellow-600 flex items-center gap-1 font-grotesk uppercase tracking-wider"
                      >
                        + Add Size
                      </button>
                    </div>

                    <div className="space-y-3">
                      {formData.sizes.map((s, index) => (
                        <div
                          key={index}
                          className="flex flex-wrap sm:flex-nowrap gap-3 items-center bg-[#FDFBF7] p-4 rounded-2xl border border-yellow-500/12"
                        >
                          <input
                            type="text"
                            value={s.size}
                            onChange={(e) => updateSize(index, "size", e.target.value)}
                            placeholder="Size (e.g. 100ml)"
                            className="input-premium py-2 text-xs flex-1 min-w-[100px]"
                            required
                          />
                          <input
                            type="number"
                            value={s.mrp || ""}
                            onChange={(e) => updateSize(index, "mrp", e.target.value)}
                            placeholder="MRP (₹)"
                            className="input-premium py-2 text-xs w-24"
                          />
                          <input
                            type="number"
                            value={s.price || ""}
                            onChange={(e) => updateSize(index, "price", e.target.value)}
                            placeholder="Price (₹)"
                            className="input-premium py-2 text-xs w-24"
                            required
                          />
                          <input
                            type="number"
                            value={s.stock || ""}
                            onChange={(e) => updateSize(index, "stock", e.target.value)}
                            placeholder="Stock"
                            className="input-premium py-2 text-xs w-20"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => removeSize(index)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Images */}
                  <div>
                    <label className="block text-xs font-bold text-yellow-800 uppercase tracking-wider mb-2 font-grotesk">
                      Product Images
                    </label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        const files = Array.from(e.target.files);
                        setFormData({
                          ...formData,
                          images: files,
                          imageUrls: files.map((file) => URL.createObjectURL(file)),
                        });
                      }}
                      className="w-full text-xs text-[#6C685F] file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-yellow-50 file:text-yellow-900 hover:file:bg-yellow-100 cursor-pointer"
                    />
                    {formData.imageUrls && formData.imageUrls.length > 0 && (
                      <div className="flex gap-3 mt-3 overflow-x-auto py-2">
                        {formData.imageUrls.map((url, idx) => (
                          <div
                            key={idx}
                            className="relative w-16 h-16 rounded-xl border border-yellow-500/20 overflow-hidden bg-[#FDFBF7] shrink-0"
                          >
                            <img
                              src={
                                url.startsWith("blob:") || url.startsWith("data:") || url.startsWith("http")
                                  ? url
                                  : `${BASE_URL.replace(/\/api$/, "")}${url}`
                              }
                              alt="Preview"
                              className="w-full h-full object-contain p-1"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Status Toggle */}
                  <div className="flex items-center gap-3 pt-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 text-yellow-600 rounded border-yellow-300 focus:ring-yellow-500"
                    />
                    <label htmlFor="isActive" className="text-xs font-bold text-[#1C1A16] font-grotesk">
                      Active (Visible on website)
                    </label>
                  </div>

                  <div className="flex gap-4 pt-4 border-t border-yellow-500/10 font-grotesk">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        resetForm();
                      }}
                      className="flex-1 px-4 py-3 bg-[#F5F2EB] text-[#6C685F] border border-yellow-500/20 rounded-xl font-bold hover:bg-yellow-500/10 transition-colors text-xs uppercase tracking-wider"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 text-black rounded-xl font-bold hover:from-yellow-400 hover:to-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs uppercase tracking-wider shadow-gold flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                          <span>Saving...</span>
                        </>
                      ) : (
                        editingProduct ? "Save Changes" : "Create Product"
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
