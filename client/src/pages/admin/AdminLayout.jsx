import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useToast } from "../../components/Alert";
import Avatar from "../../components/Avatar";

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
      className={`flex items-center gap-3.5 px-6 py-3.5 transition-all duration-300 relative group overflow-hidden rounded-xl mx-3 my-1 font-grotesk font-medium text-sm ${
        active 
        ? "text-yellow-900 bg-gradient-to-r from-yellow-500/15 to-amber-500/10 border-l-4 border-yellow-600 font-bold shadow-sm" 
        : "text-[#6C685F] hover:text-yellow-800 hover:bg-yellow-500/8"
      }`}
    >
      <div className={`relative z-10 transition-transform duration-300 ${active ? 'scale-110 text-yellow-700' : 'group-hover:scale-110 text-[#6C685F]'}`}>
        {icon}
      </div>
      <span className="relative z-10 tracking-wide">{label}</span>
      {active && <div className="absolute right-4 w-2 h-2 rounded-full bg-yellow-600 shadow-[0_0_8px_rgba(217,119,6,0.5)]"></div>}
    </Link>
  );

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1C1A16] flex font-inter selection:bg-yellow-500 selection:text-black">
      
      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed lg:sticky top-0 h-screen shrink-0 inset-y-0 left-0 z-50 w-72 bg-white border-r border-yellow-500/15 shadow-sm flex flex-col justify-between transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div>
          <div className="h-24 flex flex-col items-center justify-center border-b border-yellow-500/12 relative overflow-hidden px-4">
             <Link to="/" className="flex items-center gap-2.5 mb-0.5 relative z-10 group" aria-label="Back to store">
               <img src="/images/icons/logo.png" alt="Logo" className="h-9 w-auto drop-shadow-[0_0_8px_rgba(217,119,6,0.3)] group-hover:scale-105 transition-transform" />
               <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-700 via-amber-800 to-yellow-800 font-soria tracking-wide">
                 Kala Agalya Herbals
               </h1>
             </Link>
             <span className="block text-[10px] text-yellow-800/70 font-bold tracking-[0.3em] uppercase font-grotesk">ADMIN DASHBOARD</span>
          </div>

          <nav className="mt-6 space-y-1 overflow-y-auto max-h-[calc(100vh-180px)] custom-scrollbar px-1">
            <SidebarItem 
              to="/admin/dashboard" 
              active={location.pathname === "/admin/dashboard"}
              label="Dashboard"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              }
            />
            <SidebarItem 
              to="/admin/orders" 
              active={location.pathname === "/admin/orders" || (location.pathname.startsWith("/admin/orders") && !location.pathname.includes("/admin/returns"))}
              label="Orders"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              }
            />
            <SidebarItem 
              to="/admin/returns" 
              active={location.pathname.includes("/admin/returns")}
              label="Return Orders"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              }
            />
            <SidebarItem 
              to="/admin/products" 
              active={location.pathname.includes("/admin/products")}
              label="Products"
              icon={
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
              }
            />
            <SidebarItem 
              to="/admin/banners" 
              active={location.pathname.includes("/admin/banners")}
              label="Banners"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            />
            <SidebarItem 
              to="/admin/reviews" 
              active={location.pathname.includes("/admin/reviews")}
              label="Reviews"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              }
            />
            <SidebarItem 
              to="/admin/reports" 
              active={location.pathname.includes("/admin/reports")}
              label="Reports"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
            />
            <SidebarItem 
              to="/admin/users" 
              active={location.pathname.includes("/admin/users")}
              label="Users"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              }
            />
            <SidebarItem 
              to="/admin/queries" 
              active={location.pathname.includes("/admin/queries")}
              label="Queries"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              }
            />
          </nav>
        </div>

        <div className="p-4 border-t border-yellow-500/12 bg-[#FDFBF7]">
          <button 
            onClick={handleLogout}
            className="w-full py-3 px-4 bg-red-50 text-red-700 rounded-xl border border-red-200 hover:bg-red-100 transition-all duration-300 flex items-center justify-center gap-2 group font-grotesk font-bold text-xs uppercase tracking-wider shadow-xs"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative min-h-screen min-w-0 overflow-x-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden h-16 bg-white/95 border-b border-yellow-500/15 flex items-center justify-between px-4 sticky top-0 z-40 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <img src="/images/icons/logo.png" alt="Logo" className="h-7 w-auto" />
            <h1 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-700 to-amber-800 font-soria">Kala Agalya Herbals</h1>
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-[#6C685F] hover:text-yellow-700 p-2">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        
        {/* Background Ambient Glow */}
        <div className="absolute top-0 left-0 w-full h-[400px] bg-yellow-500/4 blur-[120px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 relative z-10">
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
          background: #d9770633;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d9770666;
        }
      `}</style>
    </div>
  );
}
