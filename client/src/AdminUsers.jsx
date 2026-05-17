import { useState, useEffect } from "react";
import { useToast } from "./Alert";
import AdminLayout from "./AdminLayout";
import Avatar from "./Avatar";
import { API_URL } from "./services/api";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [search, setSearch] = useState("");
  const { addToast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`${API_URL}/users/admin/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (err) {
      addToast("Failed to fetch users", "error");
    } finally {
      setLoading(false);
    }
  };

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.phone?.includes(search)
  );

  const formatAddress = (addr) => {
    if (!addr) return null;
    const parts = [addr.street, addr.city, addr.state, addr.zipCode, addr.country].filter(Boolean);
    return parts.length ? parts.join(", ") : null;
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
          <p className="text-gray-500 text-sm">View and manage registered customer information</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-yellow-500">{users.length}</div>
            <div className="text-[10px] text-gray-600 uppercase tracking-widest">Total Customers</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-[#15120a] border border-yellow-900/30 rounded-xl text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#15120a] border border-yellow-900/20 rounded-2xl overflow-hidden shadow-2xl">
        {loading ? (
          <div className="p-20 text-center">
            <div className="animate-spin h-10 w-10 border-4 border-yellow-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Loading customer data...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-20 text-center text-gray-600 text-sm">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#0d0b03] border-b border-yellow-900/10">
                  <th className="px-6 py-4 text-[10px] font-bold text-yellow-500/60 uppercase tracking-widest whitespace-nowrap">User</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-yellow-500/60 uppercase tracking-widest whitespace-nowrap">Contact Info</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-yellow-500/60 uppercase tracking-widest whitespace-nowrap">Address</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-yellow-500/60 uppercase tracking-widest whitespace-nowrap">Joined</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-yellow-500/60 uppercase tracking-widest whitespace-nowrap text-center">Type</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-yellow-500/60 uppercase tracking-widest whitespace-nowrap text-right">Role</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-yellow-500/60 uppercase tracking-widest whitespace-nowrap text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-yellow-900/10">
                {filtered.map((user) => (
                  <tr key={user._id} className="hover:bg-yellow-500/[0.02] transition-colors group">
                    {/* User */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar src={user.avatar} name={user.name} size="sm" />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-white group-hover:text-yellow-400 transition-colors truncate max-w-[140px]">{user.name}</div>
                          <div className="text-xs text-gray-500 truncate max-w-[140px]">{user.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-300 whitespace-nowrap">
                        {user.phone || <span className="text-gray-600 italic">No phone</span>}
                      </div>
                      {user.phone && (
                        <div className="text-[10px] text-gray-600 mt-0.5">Mobile</div>
                      )}
                    </td>

                    {/* Address */}
                    <td className="px-6 py-4">
                      {formatAddress(user.address) ? (
                        <div className="text-xs text-gray-400 max-w-[200px] leading-relaxed">
                          {formatAddress(user.address)}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-600 italic">No address saved</span>
                      )}
                    </td>

                    {/* Joined */}
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-400 whitespace-nowrap">
                        {new Date(user.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit", month: "short", year: "numeric"
                        })}
                      </div>
                    </td>

                    {/* Account Type */}
                    <td className="px-6 py-4 text-center">
                      {user.isGoogleUser ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 whitespace-nowrap">
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                          </svg>
                          Google
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 whitespace-nowrap">
                          🔑 Local
                        </span>
                      )}
                    </td>

                    {/* Role */}
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${
                        user.role === "admin"
                          ? "bg-red-500/10 text-red-500 border border-red-500/20"
                          : "bg-green-500/10 text-green-500 border border-green-500/20"
                      }`}>
                        {user.role}
                      </span>
                    </td>

                    {/* View Details */}
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="text-[10px] font-bold uppercase tracking-widest text-yellow-500/60 hover:text-yellow-400 border border-yellow-900/30 hover:border-yellow-500/40 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="bg-[#15120a] border border-yellow-900/30 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#0d0b03] px-8 py-6 border-b border-yellow-900/20 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white uppercase tracking-widest">User Profile</h2>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-500 hover:text-white transition-colors p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Avatar + Name */}
              <div className="flex items-center gap-4">
                <Avatar src={selectedUser.avatar} name={selectedUser.name} size="lg" />
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedUser.name}</h3>
                  <p className="text-sm text-gray-500">{selectedUser.email}</p>
                  <div className="flex gap-2 mt-2">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      selectedUser.role === "admin"
                        ? "bg-red-500/10 text-red-400 border border-red-500/20"
                        : "bg-green-500/10 text-green-400 border border-green-500/20"
                    }`}>{selectedUser.role}</span>
                    {selectedUser.isGoogleUser ? (
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">Google Account</span>
                    ) : (
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">Local Account</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Info Rows */}
              {[
                { label: "Account ID", value: selectedUser._id },
                { label: "Phone", value: selectedUser.phone || "Not added" },
                {
                  label: "Joined On",
                  value: new Date(selectedUser.createdAt).toLocaleDateString("en-IN", {
                    day: "2-digit", month: "long", year: "numeric"
                  })
                },
              ].map(({ label, value }) => (
                <div key={label} className="border-b border-yellow-900/10 pb-4">
                  <div className="text-[10px] font-bold text-yellow-900 uppercase tracking-widest mb-1">{label}</div>
                  <div className="text-sm text-gray-300 break-all">{value}</div>
                </div>
              ))}

              {/* Address */}
              <div className="border-b border-yellow-900/10 pb-4">
                <div className="text-[10px] font-bold text-yellow-900 uppercase tracking-widest mb-2">Saved Address</div>
                {formatAddress(selectedUser.address) ? (
                  <div className="text-sm text-gray-300 leading-relaxed">{formatAddress(selectedUser.address)}</div>
                ) : (
                  <div className="text-sm text-gray-600 italic">No address saved</div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-4 bg-[#0d0b03] border-t border-yellow-900/20">
              <button
                onClick={() => setSelectedUser(null)}
                className="w-full py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-white border border-yellow-900/20 hover:border-yellow-500/30 rounded-xl transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
