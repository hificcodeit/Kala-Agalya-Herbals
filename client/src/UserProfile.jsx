import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "./Alert";
import Avatar from "./Avatar";
import { API_URL } from "./services/api";

export default function UserProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [newProfilePic, setNewProfilePic] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "India",
    }
  });

  const navigate = useNavigate();
  const { addToast } = useToast();

  const fetchProfile = async () => {
    const token = localStorage.getItem("userToken");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/users/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setProfile(data.user);
        // Sync localStorage
        localStorage.setItem("userName", data.user.name);
        if (data.user.avatar) {
          localStorage.setItem("userAvatar", data.user.avatar);
        } else {
          localStorage.removeItem("userAvatar");
        }
        setFormData({
          name: data.user.name || "",
          email: data.user.email || "",
          phone: data.user.phone || "",
          password: "", // Don't pre-fill password
          address: {
            street: data.user.address?.street || "",
            city: data.user.address?.city || "",
            state: data.user.address?.state || "",
            zipCode: data.user.address?.zipCode || "",
            country: data.user.address?.country || "India",
          }
        });
      } else {
        addToast(data.message || "Failed to load profile", "error");
        if (response.status === 401) {
          localStorage.removeItem("userToken");
          navigate("/login");
        }
      }


    } catch (err) {
      addToast("Server error", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [navigate]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    const token = localStorage.getItem("userToken");

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("phone", formData.phone);
      formDataToSend.append("address", JSON.stringify(formData.address));
      if (formData.password) {
        formDataToSend.append("password", formData.password);
      }
      if (newProfilePic) {
        formDataToSend.append("avatar", newProfilePic);
      }

      const response = await fetch(`${API_URL}/users/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      const data = await response.json();
      if (data.success) {
        addToast("Profile updated successfully!", "success");
        setIsEditing(false);
        setNewProfilePic(null);
        setPhotoPreview(null);
        await fetchProfile(); // Ensure localStorage is updated before dispatching event
        document.dispatchEvent(new Event("profileUpdated"));
      } else {
        addToast(data.message || "Update failed", "error");
      }
    } catch (err) {
      addToast("Server error during update", "error");
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("adminToken"); // Also clear admin token if exists
    localStorage.removeItem("userAvatar");
    addToast("Logged out successfully", "success");
    document.dispatchEvent(new Event("profileUpdated"));
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0b03] flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-t-2 border-yellow-500 rounded-full"></div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-[#0d0b03] text-gray-200 font-sans selection:bg-yellow-500 selection:text-black">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-yellow-900/5 blur-[120px] pointer-events-none mix-blend-screen"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative group">
              <Avatar src={profile?.avatar} name={profile?.name} size="xl" className="shadow-2xl" />
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
                {profile?.name}
              </h1>
              <p className="text-yellow-500/60 uppercase tracking-[0.4em] text-[10px] font-bold">Verified Member</p>
            </div>
          </div>
          
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all duration-300 border ${
              isEditing 
              ? "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20" 
              : "bg-yellow-500/10 border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/20 shadow-[0_0_20px_rgba(234,179,8,0.1)]"
            }`}
          >
            {isEditing ? "Cancel" : "Edit Profile"}
          </button>
        </div>

        {isEditing ? (
          <form onSubmit={handleUpdate} className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-[#15120a] border border-yellow-900/20 p-8 rounded-3xl shadow-2xl">
                <h3 className="text-lg font-bold text-yellow-500 mb-8 uppercase tracking-widest flex items-center gap-3">
                  <span className="w-1 h-6 bg-yellow-500 rounded-full"></span>
                  Personal Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="group">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-4 bg-black/40 border border-yellow-900/40 rounded-xl focus:border-yellow-500 transition-all text-sm"
                      required
                    />
                  </div>
                  <div className="group">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Phone Number</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-4 py-4 bg-black/40 border border-yellow-900/40 rounded-xl focus:border-yellow-500 transition-all text-sm"
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="group">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Email (Read-only)</label>
                    <input
                      type="email"
                      value={formData.email}
                      className="w-full px-4 py-4 bg-black/20 border border-white/5 rounded-xl text-gray-600 text-sm cursor-not-allowed"
                      disabled
                    />
                  </div>
                  <div className="group">
                    <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ml-1 italic ${profile?.isGoogleUser ? 'text-gray-600' : 'text-yellow-500/60'}`}>
                      {profile?.isGoogleUser ? 'Password Managed by Google' : 'New Password (Optional)'}
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className={`w-full px-4 py-4 bg-black/40 border border-yellow-900/40 rounded-xl focus:border-yellow-500 transition-all text-sm ${profile?.isGoogleUser ? 'cursor-not-allowed opacity-50' : ''}`}
                      placeholder={profile?.isGoogleUser ? "••••••••" : "••••••••"}
                      disabled={profile?.isGoogleUser}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-[#15120a] border border-yellow-900/20 p-8 rounded-3xl shadow-2xl">
                <h3 className="text-lg font-bold text-yellow-500 mb-8 uppercase tracking-widest flex items-center gap-3">
                  <span className="w-1 h-6 bg-yellow-500 rounded-full"></span>
                  Profile Photo
                </h3>
                <div className="flex flex-col items-center gap-6">
                   <div className="relative group">
                      <Avatar src={photoPreview || profile?.avatar} name={profile?.name} size="xl" className="border-dashed" />
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setNewProfilePic(file);
                            setPhotoPreview(URL.createObjectURL(file));
                          }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        title="Change Profile Photo"
                      />
                    </div>
                    {photoPreview && (
                      <button 
                        type="button"
                        onClick={() => { setNewProfilePic(null); setPhotoPreview(null); }}
                        className="bg-red-500 text-white rounded-full px-3 py-1 text-[10px] font-bold uppercase"
                      >
                        Remove Selection
                      </button>
                    )}
                    {!photoPreview && <p className="text-[10px] text-gray-500 uppercase tracking-widest">{profile?.isGoogleUser && !profile?.avatar ? 'Linked Google Avatar' : 'Click to change identity photo'}</p>}
                </div>
              </div>

              <div className="bg-[#15120a] border border-yellow-900/20 p-8 rounded-3xl shadow-2xl">
                <h3 className="text-lg font-bold text-yellow-500 mb-8 uppercase tracking-widest flex items-center gap-3">
                  <span className="w-1 h-6 bg-yellow-500 rounded-full"></span>
                  Shipping Address
                </h3>
                <div className="space-y-6">
                  <div className="group">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Street Address</label>
                    <input
                      type="text"
                      value={formData.address.street}
                      onChange={(e) => setFormData({...formData, address: {...formData.address, street: e.target.value}})}
                      className="w-full px-4 py-4 bg-black/40 border border-yellow-900/40 rounded-xl focus:border-yellow-500 transition-all text-sm"
                      placeholder="House No, Building Name, Street"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="group">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">City</label>
                      <input
                        type="text"
                        value={formData.address.city}
                        onChange={(e) => setFormData({...formData, address: {...formData.address, city: e.target.value}})}
                        className="w-full px-4 py-4 bg-black/40 border border-yellow-900/40 rounded-xl focus:border-yellow-500 transition-all text-sm"
                        placeholder="City"
                      />
                    </div>
                    <div className="group">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">State</label>
                      <input
                        type="text"
                        value={formData.address.state}
                        onChange={(e) => setFormData({...formData, address: {...formData.address, state: e.target.value}})}
                        className="w-full px-4 py-4 bg-black/40 border border-yellow-900/40 rounded-xl focus:border-yellow-500 transition-all text-sm"
                        placeholder="State"
                      />
                    </div>
                    <div className="group">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Zip Code / Pin Code</label>
                      <input
                        type="text"
                        value={formData.address.zipCode}
                        onChange={(e) => setFormData({...formData, address: {...formData.address, zipCode: e.target.value}})}
                        className="w-full px-4 py-4 bg-black/40 border border-yellow-900/40 rounded-xl focus:border-yellow-500 transition-all text-sm"
                        placeholder="000000"
                      />
                    </div>
                    <div className="group">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Country</label>
                      <input
                        type="text"
                        value={formData.address.country}
                        onChange={(e) => setFormData({...formData, address: {...formData.address, country: e.target.value}})}
                        className="w-full px-4 py-4 bg-black/40 border border-yellow-900/40 rounded-xl focus:border-yellow-500 transition-all text-sm"
                        placeholder="India"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-24 bg-gradient-to-br from-yellow-700/20 to-[#15120a] border border-yellow-500/30 p-8 rounded-3xl shadow-2xl backdrop-blur-md">
                <h3 className="text-xl font-extrabold text-white mb-6 tracking-tight">Save Changes</h3>
                <p className="text-xs text-gray-400 mb-8 leading-relaxed uppercase tracking-widest">
                  Ensure all details are correct. Updating your address will affect future shipping.
                </p>
                <button
                  type="submit"
                  disabled={updating}
                  className="w-full py-4 bg-gradient-to-r from-yellow-600 to-amber-700 text-black rounded-xl font-bold uppercase tracking-widest text-sm shadow-[0_0_30px_rgba(234,179,8,0.2)] hover:shadow-[0_0_40px_rgba(234,179,8,0.4)] transition-all duration-300 transform hover:-translate-y-1 active:scale-95 disabled:opacity-50"
                >
                  {updating ? "Saving..." : "Update Profile"}
                </button>
                <p className="mt-6 text-[10px] text-gray-600 text-center uppercase tracking-widest font-bold">
                  Secure Encryption Active
                </p>
              </div>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fadeIn">
            {/* Display Mode */}
            <div className="space-y-8">
              <div className="scroll-animate scroll-fade-left bg-[#15120a] border border-yellow-900/30 p-8 rounded-3xl shadow-2xl relative group overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 -mr-16 -mt-16 rounded-full blur-3xl group-hover:bg-yellow-500/10 transition-colors"></div>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-yellow-500/10 rounded-2xl flex items-center justify-center border border-yellow-500/20 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <h3 className="text-sm font-bold text-yellow-500/80 uppercase tracking-[0.3em]">Contact Center</h3>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1">Registered Email</label>
                    <p className="text-white text-lg font-medium tracking-tight break-all">{profile?.email}</p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1">Mobile Primary</label>
                    <p className="text-white text-lg font-medium tracking-tight whitespace-nowrap">{profile?.phone || <span className="text-gray-700 italic">Not Added</span>}</p>
                  </div>
                </div>
              </div>

              <div className="p-8 text-center text-xs text-gray-600 uppercase tracking-[0.4em] font-bold">
                Account ID: {profile?._id?.toUpperCase()}
              </div>
            </div>

            <div className="space-y-8">
              <div className="scroll-animate scroll-fade-right bg-[#15120a] border border-yellow-900/30 p-8 rounded-3xl shadow-2xl relative group overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 -mr-16 -mt-16 rounded-full blur-3xl group-hover:bg-amber-500/10 transition-colors"></div>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-yellow-500/10 rounded-2xl flex items-center justify-center border border-yellow-500/20 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                  <h3 className="text-sm font-bold text-yellow-500/80 uppercase tracking-[0.3em]">Vault Address</h3>
                </div>
                <div className="min-h-[140px] flex flex-col justify-center">
                  {profile?.address?.street ? (
                    <div className="space-y-3">
                      <p className="text-white text-xl font-bold tracking-tight leading-tight">{profile.address.street}</p>
                      <p className="text-gray-400 text-sm font-medium uppercase tracking-[0.2em]">{profile.address.city}, {profile.address.state}</p>
                      <p className="text-gray-500 text-xs font-bold tracking-[0.3em]">{profile.address.zipCode} • {profile.address.country}</p>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-700 italic text-sm uppercase tracking-widest mb-4">No shipping address stored</p>
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="text-[10px] text-yellow-500 border-b border-yellow-500/30 hover:border-yellow-500 font-bold uppercase tracking-widest"
                      >
                        Add Address Now
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                 <button
                   onClick={handleLogout}
                   className="flex-1 px-8 py-5 bg-[#0a0802] border border-red-900/30 text-red-500/70 rounded-3xl font-bold uppercase tracking-widest text-[10px] hover:bg-red-900/20 hover:text-red-400 transition-all flex items-center justify-center gap-2 group"
                 >
                   Logout
                   <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                 </button>
              </div>
            </div>
            
            {/* My Orders Link */}
            <div className="md:col-span-2 mt-4">
              <Link to="/my-orders" className="block scroll-animate bg-[#15120a] border border-yellow-900/30 p-8 rounded-3xl shadow-2xl relative overflow-hidden group hover:border-yellow-500/30 transition-all">
                <div className="absolute top-0 left-0 w-32 h-32 bg-yellow-500/5 -ml-16 -mt-16 rounded-full blur-3xl group-hover:bg-yellow-500/10 transition-colors"></div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-yellow-500/10 rounded-2xl flex items-center justify-center border border-yellow-500/20 group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-yellow-500/80 uppercase tracking-[0.3em]">My Orders</h3>
                      <p className="text-xs text-gray-500 mt-1">View order history, track deliveries & download invoices</p>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-600 group-hover:text-yellow-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
              </Link>
            </div>
          </div>
        )}

        <div className="mt-16 pt-8 border-t border-yellow-900/10 flex flex-col md:flex-row items-center justify-between text-[10px] text-gray-700 font-bold uppercase tracking-[0.3em]">
          <p>Member since {new Date(profile?.createdAt).getFullYear()} • Kala Agalya Herbals</p>
          <p className="mt-4 md:mt-0">Premium Account Encryption Verified</p>
        </div>
      </div>
    </div>
  );
}
