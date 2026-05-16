import { Link } from 'react-router-dom';
import { FaYoutube, FaInstagram } from "react-icons/fa6";
// ============================================
// 👇 EDIT FOOTER CONTENT HERE
// ============================================
const footerContent = {
  about: {
    title: "Kala Agalya Herbals",
    description: "Experience the ancient power of 18+ rare herbs blended in pure coconut oil. 100% Naturopathy & Organic care for your hair.",
  },
  quickLinks: [
    { name: "Contact Information", path: "/contact" },
    { name: "Privacy Policy", path: "/privacy-policy" },
    { name: "Refund Policy", path: "/refund-policy" },
    { name: "Shipping Policy", path: "/shipping-policy" },
    { name: "Terms of Service", path: "/terms-of-service" },
  ],
  contact: {
    phone: "+91 7338758727",
    email: "kalaagalyaherbals@gmail.com",
    address: "Ayyapakkam, Chennai, Tamil Nadu, India – 600077"
  },

  socials: [
    {
      name: "YouTube",
      url: "https://youtube.com/@kala.agalya_vlogs5086?si=7WiaXavmEmhtjWz3",
      Icon: FaYoutube
    },
    {
      name: "Instagram",
      url: "https://www.instagram.com/kala.agalya_herbalhairoil?igsh=ZzRyN3d0ZmZnOTlk",
      Icon: FaInstagram
    }
  ],
  whatsapp: {
    number: "+91 733 875 8727", // Format: Country code + Number without + or spaces
    message: "Hello! I would like to know more about your products."
  },
  copyright: "© 2026, Kala Agalya Herbals Hair Oils. All rights reserved."
};
// ============================================

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative bg-[#0a0802] text-gray-300 pt-20 pb-10 overflow-hidden border-t border-yellow-900/30">

      {/* Background Glow Effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-yellow-900/10 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-900/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">

          {/* Brand Column */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <img src="/images/icons/logo.png" alt="Kala Agalya Herbals - Authentic Naturopathy Oil Logo" className="h-10 w-auto drop-shadow-[0_0_8px_rgba(234,179,8,0.4)]" />
              <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-amber-200 bg-clip-text text-transparent">
                Kala Agalya Herbals
              </h2>
            </div>
            <p className="text-gray-400 leading-relaxed text-sm">
              {footerContent.about.description}
            </p>
            <div className="flex gap-4">
              {footerContent.socials.map((social, idx) => (
                <a
                  key={idx}
                  href={social.url}
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full bg-yellow-900/30 flex items-center justify-center text-yellow-400 hover:bg-yellow-500 hover:text-black transition-all duration-300 hover:-translate-y-1 shadow-lg shadow-yellow-900/20"
                  aria-label={social.name}
                >
                  <social.Icon size={24} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6 relative inline-block">
              Quick Links
              <span className="absolute -bottom-2 left-0 w-1/2 h-0.5 bg-yellow-500 rounded-full"></span>
            </h3>
            <ul className="space-y-3">
              {footerContent.quickLinks.map((link, idx) => (
                <li key={idx}>
                  <Link
                    to={link.path}
                    onClick={scrollToTop}
                    className="flex items-center gap-2 group hover:text-yellow-400 transition-colors duration-200"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-lime-600 group-hover:bg-lime-400 transition-colors"></span>
                    <span className="relative overflow-hidden">
                      {link.name}
                      <span className="absolute bottom-0 left-0 w-full h-[1px] bg-yellow-400 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="lg:col-span-2">
            <h3 className="text-white font-bold text-lg mb-6 relative inline-block">
              Get in Touch
              <span className="absolute -bottom-2 left-0 w-1/2 h-0.5 bg-yellow-500 rounded-full"></span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-yellow-500/30 transition-colors">
                <div className="p-3 rounded-full bg-yellow-500/10 text-yellow-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">Visit Us</h4>
                  <p className="text-sm text-gray-400">{footerContent.contact.address}</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-yellow-500/30 transition-colors">
                <div className="p-3 rounded-full bg-yellow-500/10 text-yellow-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">Call Us</h4>
                  <p className="text-sm text-gray-400 mb-1">{footerContent.contact.phone}</p>
                  {/* <p className="text-sm text-gray-400">{footerContent.contact.email}</p> */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/917338758727?text=Hi%20Kala%20Agalya%20Herbals,%20I%20would%20like%20to%20connect%20with%20you."
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-8 right-8 z-50 group"
      >
        <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-4 py-2 bg-white text-green-600 text-sm font-bold rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none">
          Chat with us!
          <div className="absolute top-1/2 -right-2 -translate-y-1/2 border-8 border-transparent border-l-white"></div>
        </span>
        <div className="bg-[#25D366] p-4 rounded-full shadow-[0_0_20px_rgba(37,211,102,0.4)] animate-bounce hover:scale-110 transition-transform duration-300">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="white">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.463 1.065 2.876 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
          </svg>
        </div>
      </a>

    </footer>
  );
}

