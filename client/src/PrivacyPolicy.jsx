import React, { useEffect } from 'react';
import { Helmet } from "react-helmet-async";

export default function PrivacyPolicy() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-[#0d0b03] min-h-screen relative overflow-hidden text-gray-300 font-sans">
      <Helmet>
        <title>Privacy Policy | Kala Agalya Herbals</title>
        <meta name="description" content="Learn how Kala Agalya Herbals protects your personal data. We are committed to your privacy and secure herbal hair oil shopping." />
        <link rel="canonical" href="https://kalaagalyaherbals.com/privacy-policy" />
      </Helmet>
      {/* Background Elements */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-green-900/10 via-[#0d0b03] to-[#0d0b03] pointer-events-none"></div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10 transition-all duration-500">
        
        {/* Header */}
        <div className="text-center mb-16 animate-[fadeIn_0.5s_ease-out]">
          <span className="text-yellow-500 font-bold tracking-wider uppercase text-sm mb-2 block">Transparency First</span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 drop-shadow-[0_0_15px_rgba(234,179,8,0.3)]">
            Privacy Policy
          </h1>
          <p className="text-gray-400">Effective Date: January 2026</p>
        </div>

        <div className="bg-[#1c1b1b]/40 backdrop-blur-md rounded-3xl border border-yellow-900/30 p-8 md:p-12 shadow-2xl">
          
          {/* Intro */}
          <div className="mb-12 border-b border-yellow-900/30 pb-8">
            <p className="text-lg leading-relaxed text-gray-300">
              <strong className="text-yellow-400">Kala Agalya Herbals Hair Oils</strong> (“we”, “our”, “us”) respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, store, and protect your information when you use our website and services.
            </p>
          </div>

          <div className="space-y-12">
            {[
              {
                title: "1. Information We Collect",
                content: (
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {["Personal details (Name, Phone, Email)", "Shipping details (Address, City, Pincode)", "Payment Information (Securely processed)", "Device Info (IP, Browser Type)"].map((item, i) => (
                            <li key={i} className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/5 hover:border-yellow-500/30 transition-colors">
                                <div className="w-2 h-2 bg-yellow-500 rounded-full shadow-[0_0_8px_#22c55e]"></div>
                                <span className="text-gray-300 text-sm">{item}</span>
                            </li>
                        ))}
                    </ul>
                )
              },
              {
                title: "2. How We Use Your Information",
                content: (
                    <div className="pl-4 border-l-2 border-yellow-500/30 space-y-2 mt-4 text-gray-400">
                        <p>We use your data to process orders, deliver updates, provide support, and improve our services. We may send offers only if you've opted in.</p>
                    </div>
                )
              },
              {
                title: "3. Data Protection & Security",
                content: "We implement appropriate security measures to protect your data from unauthorized access, alteration, disclosure, or destruction. Payment transactions are processed through secure, encrypted gateways."
              },
              {
                 title: "4. Sharing of Information",
                 content: "We do not sell or trade your personal information. Data may only be shared with Delivery partners, Payment gateways, or Legal authorities if required by law."
              },
              {
                  title: "5. Cookies",
                  content: "We use cookies to improve user experience and website performance. You may choose to disable cookies in your browser settings."
              },
              {
                  title: "6. Your Rights",
                  content: (
                      <div className="flex flex-wrap gap-3 mt-4">
                          {["Access Data", "Request Correction", "Request Deletion", "Withdraw Consent"].map((right, i) => (
                              <span key={i} className="px-4 py-2 rounded-full bg-green-900/20 text-green-300 text-sm font-medium border border-yellow-500/20 hover:bg-yellow-500/20 transition-colors">
                                  {right}
                              </span>
                          ))}
                      </div>
                  )
              },
              {
                  title: "7. Policy Updates",
                  content: "We may update this Privacy Policy from time to time. Updates will be posted on this page."
              },
              {
                  title: "8. Contact for Privacy",
                  content: (
                      <div className="mt-4 bg-green-900/10 p-6 rounded-2xl border border-yellow-500/20 flex flex-col md:flex-row gap-8 items-start md:items-center">
                          <div>
                              <p className="text-sm text-gray-400 uppercase tracking-widest mb-1">Email Us</p>
                              <a href="mailto:client-email@example.com" className="text-lg text-white font-medium hover:text-yellow-400 transition-colors">kalaagalyaherbals@gmail.com</a>
                          </div>
                          <div className="hidden md:block w-px h-12 bg-yellow-500/20"></div>
                           <div>
                              <p className="text-sm text-gray-400 uppercase tracking-widest mb-1">Call Us</p>
                              <a href="tel:7010558722" className="text-lg text-white font-medium hover:text-yellow-400 transition-colors">70105 58722</a>
                          </div>
                      </div>
                  )
              }
            ].map((section, idx) => (
              <section key={idx} className="group animate-[fadeIn_0.5s_ease-out]" style={{ animationDelay: `${idx * 0.1}s` }}>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-4 group-hover:text-yellow-400 transition-colors duration-300">
                  {section.title}
                </h2>
                <div className="text-gray-400 leading-relaxed text-base md:text-lg">
                  {section.content}
                </div>
              </section>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}



