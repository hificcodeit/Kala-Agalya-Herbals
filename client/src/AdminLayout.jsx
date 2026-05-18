import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

export default function AdminLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminEmail");
    localStorage.removeItem("adminName");
    navigate("/admin/login");
  };

  const SidebarItem = ({ to, icon, label, active }) => (
    <Link
      to={to}
      onClick={() => setIsSidebarOpen(false)}
      className={`flex items-center gap-4 px-6 py-4 transition-all duration-300 relative group overflow-hidden ${
        active 
        ? "text-yellow-400 bg-yellow-900/10 border-r-4 border-yellow-500" 
        : "text-gray-400 hover:text-yellow-300 hover:bg-white/5"
      }`}
    >
      <div className={`absolute inset-0 bg-yellow-500/10 transition-transform duration-300 origin-left ${active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></div>
      <div className={`relative z-10 transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
        {icon}
      </div>
      <span className="relative z-10 font-medium tracking-wide">{label}</span>
      {active && <div className="absolute right-4 w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_10px_#facc15]"></div>}
    </Link>
  );

  return (
    <div className="min-h-screen bg-[#0d0b03] text-gray-200 flex font-sans selection:bg-yellow-500 selection:text-black">
      
      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed lg:sticky top-0 h-screen shrink-0 inset-y-0 left-0 z-50 w-72 bg-[#0a0802] border-r border-yellow-900/30 transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="h-28 flex flex-col items-center justify-center border-b border-yellow-900/30 relative overflow-hidden px-4">
           <div className="absolute inset-0 bg-yellow-500/5 bg-[radial-gradient(circle_at_top,_transparent_0%,_#0a0802_70%)]"></div>
           <Link to="/" className="flex items-center gap-2 mb-1 relative z-10">
             <img src="/images/icons/logo.png" alt="Logo" className="h-8 w-auto drop-shadow-[0_0_5px_rgba(234,179,8,0.4)]" />
             <h1 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600 tracking-tight">
               Kala Agalya Herbals
             </h1>
           </Link>
           <span className="block text-[10px] text-gray-500 font-bold tracking-[0.4em] relative z-10">ADMIN PANEL</span>
        </div>

        <nav className="mt-8 space-y-1 overflow-y-auto h-[calc(100vh-250px)] custom-scrollbar">
          <SidebarItem 
            to="/admin/dashboard" 
            active={location.pathname === "/admin/dashboard"}
            label="Dashboard"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            }
          />
          <SidebarItem 
            to="/admin/orders" 
            active={location.pathname.includes("/admin/orders")}
            label="Orders"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            }
          />
          <SidebarItem 
            to="/admin/products" 
            active={location.pathname.includes("/admin/products")}
            label="Products"
            icon={
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
            }
          />
          <SidebarItem 
            to="/admin/reviews" 
            active={location.pathname.includes("/admin/reviews")}
            label="Reviews"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            }
          />
          <SidebarItem 
            to="/admin/reports" 
            active={location.pathname.includes("/admin/reports")}
            label="Reports"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />
          <SidebarItem 
            to="/admin/users" 
            active={location.pathname.includes("/admin/users")}
            label="Users"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
          />
        </nav>

        <div className="absolute bottom-0 w-full p-6 bg-gradient-to-t from-[#0a0802] to-transparent">
          <button 
            onClick={handleLogout}
            className="w-full py-3 px-4 bg-red-900/20 text-red-400 rounded-xl border border-red-900/30 hover:bg-red-900/40 hover:text-red-300 hover:shadow-[0_0_15px_rgba(220,38,38,0.2)] transition-all duration-300 flex items-center justify-center gap-2 group"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative min-h-screen">
        {/* Mobile Header */}
        <div className="lg:hidden h-16 bg-[#0a0802] border-b border-yellow-900/30 flex items-center justify-between px-4 sticky top-0 z-40 backdrop-blur-md bg-opacity-80">
          <h1 className="text-xl font-bold text-yellow-400">Kala Agalya Herbals</h1>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-gray-400 hover:text-white">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        
        {/* Background Ambient Glow */}
        <div className="absolute top-0 left-0 w-full h-[500px] bg-yellow-900/5 blur-[120px] pointer-events-none mix-blend-screen"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 relative z-10 font-sans">
          {children}
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #eab30833;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #eab30866;
        }
      `}</style>
    </div>
  );
}
