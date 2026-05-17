import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Avatar from "./Avatar";

export default function Navbar() {
  const [count, setCount] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [avatar, setAvatar] = useState(localStorage.getItem("userAvatar"));
  const [userName, setUserName] = useState(localStorage.getItem("userName"));

  useEffect(() => {
    const updateCart = () => {
      const cart = JSON.parse(localStorage.getItem("cart")) || [];
      const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
      setCount(totalItems);
    };

    const updateProfile = () => {
      setAvatar(localStorage.getItem("userAvatar"));
      setUserName(localStorage.getItem("userName"));
    };

    updateCart();
    updateProfile();

    window.addEventListener("storage", () => {
      updateCart();
      updateProfile();
    });
    document.addEventListener("cartUpdated", updateCart);
    document.addEventListener("profileUpdated", updateProfile);

    return () => {
      window.removeEventListener("storage", updateCart);
      window.removeEventListener("storage", updateProfile);
      document.removeEventListener("cartUpdated", updateCart);
      document.removeEventListener("profileUpdated", updateProfile);
    };
  }, []);

  // Close menu when clicking a link
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <>
      <nav className="sticky top-0 z-50 w-full bg-[#0a0802]/80 backdrop-blur-md text-white shadow-[0_4px_30px_rgba(0,0,0,0.5)] border-b border-yellow-500/20 transition-all duration-300 animate-[slideDown_0.5s_ease-out]">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">

        <Link to="/" onClick={closeMenu} className="flex items-center gap-3 group transition-all duration-300">
          <img 
            src="/images/icons/logo.png"
            alt="Kala Agalya Herbals - Premium Naturopathy Herbal Hair Oil"
            className="h-10 w-auto group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(234,179,8,0.4)]"
          />
          <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-200 tracking-wide group-hover:to-white transition-colors">
            Kala Agalya Herbals
          </span>
        </Link>


        {/* Desktop Links */}
        <div className="hidden md:flex space-x-8 items-center font-medium">
          <Link to="/" className="relative group overflow-hidden py-2">
            <span className="relative z-10 group-hover:text-yellow-300 transition-colors duration-300">Home</span>
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-yellow-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left shadow-[0_0_10px_#facc15]"></span>
          </Link>
          
          <Link to="/product" className="relative group overflow-hidden py-2">
            <span className="relative z-10 group-hover:text-yellow-300 transition-colors duration-300">Product</span>
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-yellow-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left shadow-[0_0_10px_#facc15]"></span>
          </Link>

          <Link to="/my-orders" className="relative group overflow-hidden py-2">
            <span className="relative z-10 group-hover:text-yellow-300 transition-colors duration-300">My Orders</span>
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-yellow-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left shadow-[0_0_10px_#facc15]"></span>
          </Link>

          <Link to="/profile" className="relative hover:scale-110 transition-transform duration-300 group">
             <Avatar src={avatar} name={userName} size="sm" />
          </Link>

          <Link to="/cart" className="relative hover:scale-110 transition-transform duration-300 group">
            <div className="relative p-2 bg-yellow-900/20 rounded-full border border-yellow-500/20 group-hover:border-yellow-500/50 group-hover:shadow-[0_0_15px_rgba(234,179,8,0.3)] transition-all">
              <img src="/images/icons/cart.svg" className="w-6 h-6 invert opacity-90 group-hover:opacity-100 transition-opacity" alt="cart" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-lime-400 text-black font-bold px-1.5 py-0.5 rounded-full text-xs shadow-[0_0_10px_rgba(163,230,53,0.6)] animate-pulse">
                  {count}
                </span>
              )}
            </div>
          </Link>
        </div>
        
        {/* Mobile controls */}
        <div className="flex items-center gap-4 shrink-0 md:hidden">
          <Link to="/profile" onClick={closeMenu} className="relative hover:scale-110 transition-transform">
             <Avatar src={avatar} name={userName} size="sm" />
          </Link>
          <Link to="/cart" onClick={closeMenu} className="relative hover:scale-110 transition-transform">
             <div className="relative p-2 bg-yellow-900/20 rounded-full border border-yellow-500/20">
               <img src="/images/icons/cart.svg" className="w-5 h-5 invert" alt="cart" />
               {count > 0 && (
                 <span className="absolute -top-1 -right-1 bg-lime-400 text-black font-bold px-1 py-0.5 rounded-full text-[10px] animate-pulse">
                   {count}
                 </span>
               )}
             </div>
          </Link>
          
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 text-yellow-500 hover:text-yellow-400 transition-colors focus:outline-none"
            aria-label="Toggle Menu"
          >
            <div className="w-6 h-5 relative flex flex-col justify-between">
              <span className={`w-full h-0.5 bg-current rounded-full transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
              <span className={`w-full h-0.5 bg-current rounded-full transition-opacity duration-300 ${isMenuOpen ? 'opacity-0' : ''}`}></span>
              <span className={`w-full h-0.5 bg-current rounded-full transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-2.5' : ''}`}></span>
            </div>
          </button>
        </div>

      </div>

      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </nav>

    {/* Mobile Menu Overlay */}
    <div className={`fixed inset-0 z-40 md:hidden transition-all duration-500 ease-in-out ${isMenuOpen ? 'visible opacity-100' : 'invisible opacity-0'}`}>
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={closeMenu}></div>
        
        {/* Menu Content */}
        <div className={`relative h-full flex flex-col items-center justify-center space-y-8 transition-transform duration-500 ${isMenuOpen ? 'translate-y-0' : '-translate-y-full'}`}>
          <Link to="/" onClick={closeMenu} className="text-3xl font-bold text-white hover:text-yellow-400 transition-colors">Home</Link>
          <Link to="/product" onClick={closeMenu} className="text-3xl font-bold text-white hover:text-yellow-400 transition-colors">Product</Link>
          <Link to="/my-orders" onClick={closeMenu} className="text-3xl font-bold text-white hover:text-yellow-400 transition-colors">My Orders</Link>
          <Link to="/profile" onClick={closeMenu} className="text-3xl font-bold text-white hover:text-yellow-400 transition-colors">Profile</Link>
          <Link to="/cart" onClick={closeMenu} className="text-3xl font-bold text-white hover:text-yellow-400 transition-colors">Cart ({count})</Link>
          <Link to="/contact" onClick={closeMenu} className="text-3xl font-bold text-white hover:text-yellow-400 transition-colors">Contact</Link>
          
          <div className="absolute bottom-10 flex gap-6">
            <a href="https://instagram.com" className="text-gray-400 hover:text-yellow-500 transition-colors text-sm">Instagram</a>
            <a href="https://youtube.com" className="text-gray-400 hover:text-yellow-500 transition-colors text-sm">YouTube</a>
          </div>
        </div>
      </div>
    </>
  );
}
