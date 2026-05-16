import React, { useEffect } from 'react';
import { Helmet } from "react-helmet-async";

export default function Contact() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const contactSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "mainEntity": {
      "@type": "LocalBusiness",
      "name": "Kala Agalya Herbals",
      "image": "https://kalaagalyaherbals.com/images/icons/logo.png",
      "telephone": "+91-7338758727",
      "email": "kalaagalyaherbals@gmail.com",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Ayyapakkam",
        "addressLocality": "Chennai",
        "addressRegion": "Tamil Nadu",
        "postalCode": "600077",
        "addressCountry": "IN"
      }
    }
  };

  return (
    <div className="bg-[#0d0b03] min-h-screen relative overflow-hidden text-gray-300">
      <Helmet>
        <title>Contact Kala Agalya Herbals | Ayurvedic Hair Oil Customer Support</title>
        <meta name="description" content="Get in touch with Kala Agalya Herbals for queries about our natural hair growth oils. We provide support for organic hair care products in Chennai and across India." />
        <meta name="keywords" content="contact Kala Agalya Herbals, herbal hair oil support, hair oil customer service Chennai, ayurvedic oil online support" />
        <link rel="canonical" href="https://kalaagalyaherbals.com/contact" />
        <script type="application/ld+json">
          {JSON.stringify(contactSchema)}
        </script>
      </Helmet>
      {/* Background Glows */}
      <div className="fixed top-0 left-0 w-96 h-96 bg-yellow-500/10 rounded-full mix-blend-screen filter blur-[100px] animate-blob pointer-events-none"></div>
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">

        {/* Header */}
        <div className="text-center mb-16 animate-[fadeIn_0.5s_ease-out]">
          <h1 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 mb-6 drop-shadow-[0_0_15px_rgba(234,179,8,0.3)]">
            Get in Touch
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
            Have questions about our herbal oils? We're here to help you on your journey to natural hair wellness.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Contact Card 1: Address */}
          <div className="scroll-animate scroll-delay-1 bg-[#1c1b1b]/60 backdrop-blur-xl p-8 rounded-3xl border border-yellow-900/30 hover:border-yellow-500/50 transition-all duration-300 hover:-translate-y-2 group shadow-lg">
            <div className="w-16 h-16 bg-yellow-900/20 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-yellow-500/20 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Visit Us</h3>
            <div className="space-y-2 text-gray-400">
              <p className="font-semibold text-green-200">Kala Agalya Herbals Hair Oils</p>
              <p>Ayyapakkam,</p>
              <p>Chennai, Tamil Nadu</p>
              <p>India – 600077</p>
            </div>
          </div>

          {/* Contact Card 2: Phone */}
          <div className="scroll-animate scroll-delay-2 bg-[#1c1b1b]/60 backdrop-blur-xl p-8 rounded-3xl border border-yellow-900/30 hover:border-yellow-500/50 transition-all duration-300 hover:-translate-y-2 group shadow-lg">
            <div className="w-16 h-16 bg-yellow-900/20 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-yellow-500/20 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Call Us</h3>
            <p className="text-gray-400 mb-6">Mon-Sat from 9am to 6pm.</p>
            <a href="tel:+917010558722" className="inline-block text-xl font-bold text-yellow-400 hover:text-green-300 group-hover:scale-105 transition-transform">
              +91 7338758727
            </a>
          </div>

          {/* Contact Card 3: Email */}
          <div className="scroll-animate scroll-delay-3 bg-[#1c1b1b]/60 backdrop-blur-xl p-8 rounded-3xl border border-yellow-900/30 hover:border-yellow-500/50 transition-all duration-300 hover:-translate-y-2 group shadow-lg">
            <div className="w-16 h-16 bg-yellow-900/20 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-yellow-500/20 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Email Us</h3>
            <p className="text-gray-400 mb-6">We'll get back to you within 24h.</p>
            <a href="mailto:kalaagalyaherbals@gmail.com" className="inline-block text-lg font-bold text-yellow-400 hover:text-green-300 break-all group-hover:scale-105 transition-transform">
              kalaagalyaherbals@gmail.com
            </a>
          </div>

        </div>

        {/* Map Placeholder or Extra Info */}
        <div className="scroll-animate mt-16 p-1 rounded-3xl bg-gradient-to-r from-green-900/30 to-emerald-900/30">
          <div className="bg-[#0a100a] rounded-[22px] p-8 md:p-12 text-center">
            <h3 className="text-2xl font-bold text-white mb-4">Need Support?</h3>
            <p className="text-gray-400 max-w-2xl mx-auto mb-8">
              Connect with us on WhatsApp for instant support regarding your order, shipping status, or product queries.
            </p>
            <a
              href="https://wa.me/917338758727?text=Hi%20Kala%20Agalya%20Herbals,%20I%20would%20like%20to%20connect%20with%20you."
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] text-white px-8 py-3 rounded-full font-bold hover:bg-[#20bd5a] transition-colors shadow-[0_0_20px_rgba(37,211,102,0.3)] hover:shadow-[0_0_30px_rgba(37,211,102,0.5)] transform hover:scale-105 duration-300"
            >
              <span>Chat on WhatsApp</span>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}



