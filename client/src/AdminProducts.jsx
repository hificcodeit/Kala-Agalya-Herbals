import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "./Alert";
import AdminLayout from "./AdminLayout";

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sizes: [
      { size: "100ml", price: 0, stock: 0 },
      { size: "200ml", price: 0, stock: 0 },
      { size: "500ml", price: 0, stock: 0 },
    ],
    images: [],      // Array of File objects
    imageUrls: [],   // Array of display URLs
    isActive: true,
  });
  const navigate = useNavigate();
  const { addToast } = useToast();

  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch("https://kala-agalya-herbals.onrender.com/api/products");
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

    const submitData = new FormData();
    submitData.append("name", formData.name);
    submitData.append("description", formData.description);
    submitData.append("sizes", JSON.stringify(formData.sizes));
    submitData.append("isActive", formData.isActive);
    
    if (formData.images && formData.images.length > 0) {
      formData.images.forEach(file => {
        submitData.append("images", file);
      });
    }

    try {
      const url = editingProduct
        ? `https://kala-agalya-herbals.onrender.com/api/products/${editingProduct._id}`
        : "https://kala-agalya-herbals.onrender.com/api/products";

      const response = await fetch(url, {
        method: editingProduct ? "PUT" : "POST",
        headers: {
          "Authorization": `Bearer ${token}` 
        },
        body: submitData,
      });

      const data = await response.json();
      if (data.success) {
        addToast(editingProduct ? "Product updated successfully" : "Product created successfully", "success");
        setShowModal(false);
        resetForm();
        fetchProducts();
      } else {
        addToast(data.message || "Operation failed", "error");
      }
    } catch (error) {
      console.error("Error saving product:", error);
      addToast("Failed to save product", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    const token = localStorage.getItem("adminToken");
    try {
      const response = await fetch(`https://kala-agalya-herbals.onrender.com/api/products/${id}`, {
        method: "DELETE",
        headers: { 
          "Authorization": `Bearer ${token}` 
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
      sizes: product.sizes,
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
      sizes: [
        { size: "100ml", price: 0, stock: 0 },
        { size: "200ml", price: 0, stock: 0 },
        { size: "500ml", price: 0, stock: 0 },
      ],
      images: [],
      imageUrls: [],
      isActive: true,
    });
  };

  const updateSize = (index, field, value) => {
    const newSizes = [...formData.sizes];
    newSizes[index][field] = (field === "size" || value === "") ? value : Number(value);
    setFormData({ ...formData, sizes: newSizes });
  };

  const addSize = () => {
    setFormData({
      ...formData,
      sizes: [...formData.sizes, { size: "", price: 0, offerPrice: null, stock: 0 }]
    });
  };

  const removeSize = (index) => {
    const newSizes = formData.sizes.filter((_, i) => i !== index);
    setFormData({ ...formData, sizes: newSizes });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0b03]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)]"></div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Product Management</h1>
          <p className="text-gray-500 text-sm">Create and update your herbal oil inventory</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="group relative px-6 py-3 bg-gradient-to-r from-yellow-600 to-amber-500 text-black font-extrabold rounded-xl shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_35px_rgba(234,179,8,0.5)] transform hover:-translate-y-1 transition-all duration-300 flex items-center gap-2 overflow-hidden w-full sm:w-auto justify-center"
        >
          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none skew-x-12 -translate-x-full group-hover:translate-x-full duration-1000"></div>
          <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="relative z-10 text-sm uppercase">Add New Product</span>
        </button>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {products.map((product) => (
          <div key={product._id} className="bg-[#111a11] rounded-2xl border border-yellow-500/10 overflow-hidden shadow-xl hover:shadow-[0_0_30px_rgba(234,179,8,0.1)] hover:-translate-y-2 transition-all duration-300 group">
            <div className="h-56 bg-gradient-to-br from-green-900/40 to-[#0a0f0a] flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-black/20 z-10 transition-opacity group-hover:opacity-0"></div>
              {product.images && product.images.length > 0 ? (
                <img 
                  src={product.images[0].startsWith("http") || product.images[0].startsWith("data:image") ? product.images[0] : `https://kala-agalya-herbals.onrender.com${product.images[0]}`} 
                  alt={product.name} 
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" 
                />
              ) : (
                <svg className="w-20 h-20 text-green-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
              <div className="absolute top-4 right-4 z-20">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-bold shadow-lg ${
                        product.isActive ? "bg-yellow-500 text-black" : "bg-red-500 text-white"
                      }`}
                    >
                      {product.isActive ? "ACTIVE" : "INACTIVE"}
                    </span>
              </div>
            </div>
            <div className="p-6 relative">
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-yellow-400 transition-colors">{product.name}</h3>
              <p className="text-sm text-gray-400 mb-6 line-clamp-2 h-10">{product.description}</p>
              
              <div className="space-y-3 mb-6 bg-black/20 p-4 rounded-xl border border-white/5">
                {product.sizes.map((sizeInfo, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span className="text-gray-300 font-medium bg-white/5 px-2 py-0.5 rounded text-xs">{sizeInfo.size}</span>
                    <div className="flex gap-4 items-center">
                      <span className="text-yellow-400 font-bold font-mono">₹{sizeInfo.price}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${sizeInfo.stock < 10 ? 'bg-red-900/50 text-red-400' : 'bg-yellow-900/20 text-yellow-500'}`}>
                         {sizeInfo.stock} left
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-2 border-t border-white/5">
                <button
                  onClick={() => openEditModal(product)}
                  className="flex-1 py-2.5 bg-blue-900/20 text-blue-400 border border-blue-500/30 rounded-xl text-sm font-bold hover:bg-blue-600 hover:text-white transition-all duration-300"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(product._id)}
                  className="flex-1 py-2.5 bg-red-900/20 text-red-400 border border-red-500/30 rounded-xl text-sm font-bold hover:bg-red-600 hover:text-white transition-all duration-300"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-20 bg-[#111a11] rounded-3xl border border-dashed border-yellow-500/20">
          <div className="w-16 h-16 bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
               <svg className="w-8 h-8 text-yellow-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
          </div>
          <p className="text-gray-400 mb-4">No products found in inventory.</p>
          <button
             onClick={() => {
                 resetForm();
                 setShowModal(true);
             }}
             className="text-yellow-400 font-bold hover:underline"
          >
             Add your first product
          </button>
        </div>
      )}

      {/* Add/Edit Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 z-[60] animate-fadeIn overflow-y-auto">
          <div className="bg-[#111a11] rounded-2xl shadow-2xl max-w-2xl w-full my-auto border border-yellow-500/20 relative">
            <div className="sticky top-0 bg-[#111a11]/95 backdrop-blur border-b border-yellow-900/30 px-6 py-4 flex justify-between items-center z-10">
              <h2 className="text-xl font-bold text-white tracking-wide">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-red-400 transition-colors p-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-yellow-500 uppercase tracking-widest mb-2">Product Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0d0b03] border border-yellow-900/40 rounded-xl focus:ring-1 focus:ring-yellow-500/50 focus:border-yellow-500 text-white placeholder-gray-600 outline-none transition-all"
                  placeholder="e.g. Herbal Essence Oil"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-yellow-500 uppercase tracking-widest mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0d0b03] border border-yellow-900/40 rounded-xl focus:ring-1 focus:ring-yellow-500/50 focus:border-yellow-500 text-white placeholder-gray-600 outline-none transition-all"
                  rows="3"
                  placeholder="Describe the benefits..."
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-yellow-500 uppercase tracking-widest mb-2">Product Images (Up to 5)</label>
                <div className="space-y-4">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files);
                      if (files.length > 0) {
                        setFormData({ 
                          ...formData, 
                          images: [...formData.images, ...files].slice(0, 5), 
                          imageUrls: [...formData.imageUrls, ...files.map(f => URL.createObjectURL(f))].slice(0, 5)
                        });
                      }
                    }}
                    className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:bg-yellow-900/20 file:text-yellow-500 hover:file:bg-yellow-900/40 transition-all cursor-pointer"
                  />
                  {(formData.imageUrls.length > 0) && (
                    <div className="flex flex-wrap gap-3">
                      {formData.imageUrls.map((url, idx) => (
                        <div key={idx} className="relative w-20 h-20 rounded-xl border border-yellow-500/20 overflow-hidden bg-black flex-shrink-0 group">
                          <img 
                            src={url.startsWith("blob") || url.startsWith("http") || url.startsWith("data:image") ? url : `https://kala-agalya-herbals.onrender.com${url}`} 
                            alt={`Preview ${idx}`} 
                            className="w-full h-full object-cover" 
                          />
                          <div className="absolute top-0 left-0 right-0 bg-yellow-500 text-black text-[8px] font-black text-center py-0.5 uppercase">
                             IMG {idx + 1}
                          </div>
                          <button 
                            type="button"
                            onClick={() => {
                               const newUrls = formData.imageUrls.filter((_, i) => i !== idx);
                               const newImages = formData.images.filter((_, i) => i !== idx);
                               setFormData({...formData, imageUrls: newUrls, images: newImages});
                            }}
                            className="absolute inset-0 bg-red-600/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                          >
                             <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <div className="flex justify-between items-center mb-4">
                   <label className="block text-[10px] font-bold text-yellow-500 uppercase tracking-widest">Pricing & Inventory</label>
                   <button 
                     type="button" 
                     onClick={addSize}
                     className="text-[9px] bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 px-2 py-1 rounded hover:bg-yellow-500 hover:text-black transition-all font-bold uppercase"
                   >
                     + Add Size
                   </button>
                </div>
                <div className="space-y-4">
                  {formData.sizes.map((sizeInfo, index) => (
                    <div key={index} className="space-y-4 p-4 bg-black/40 border border-yellow-900/20 rounded-xl relative group/size">
                      {formData.sizes.length > 1 && (
                        <button 
                          type="button"
                          onClick={() => removeSize(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center transition-transform hover:scale-110 shadow-lg z-10"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      )}
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[9px] text-gray-500 uppercase font-black">Size (e.g. 100ml)</label>
                            <input
                              type="text"
                              value={sizeInfo.size}
                              onChange={(e) => updateSize(index, "size", e.target.value)}
                              className="w-full px-3 py-2 bg-[#0d0b03] border border-yellow-900/30 rounded-lg text-white text-xs outline-none focus:border-yellow-500"
                              required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] text-gray-500 uppercase font-black">Price (₹)</label>
                            <input
                              type="number"
                              value={sizeInfo.price}
                              onChange={(e) => updateSize(index, "price", e.target.value)}
                              className="w-full px-3 py-2 bg-[#0d0b03] border border-yellow-900/30 rounded-lg text-white text-xs outline-none focus:border-yellow-500"
                              required
                            />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[9px] text-yellow-600/80 uppercase font-black">Offer Price (Optional)</label>
                            <input
                              type="number"
                              value={sizeInfo.offerPrice || ""}
                              onChange={(e) => updateSize(index, "offerPrice", e.target.value)}
                              className="w-full px-3 py-2 bg-[#0d0b03] border border-yellow-900/30 rounded-lg text-white text-xs outline-none focus:border-yellow-500"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] text-gray-500 uppercase font-black">Stock</label>
                            <input
                              type="number"
                              value={sizeInfo.stock}
                              onChange={(e) => updateSize(index, "stock", e.target.value)}
                              className="w-full px-3 py-2 bg-[#0d0b03] border border-yellow-900/30 rounded-lg text-white text-xs outline-none focus:border-yellow-500"
                              required
                            />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
                <input
                  type="checkbox"
                  id="active-check"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5 accent-yellow-500 rounded cursor-pointer"
                />
                <label htmlFor="active-check" className="text-xs font-bold text-gray-300 cursor-pointer uppercase tracking-tight">Set Product as Active</label>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-3 bg-gray-800 text-gray-400 rounded-xl font-bold hover:bg-gray-700 hover:text-white transition-colors text-xs uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-yellow-600 text-black rounded-xl font-bold hover:bg-yellow-500 transition-all text-xs uppercase tracking-widest shadow-lg shadow-yellow-900/20"
                >
                  {editingProduct ? "Save Changes" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}


