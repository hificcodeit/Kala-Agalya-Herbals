import React, { useEffect } from 'react';
import { Helmet } from "react-helmet-async";

export default function TermsOfService() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-[#0d0b03] min-h-screen relative overflow-hidden text-gray-300">
      <Helmet>
        <title>Terms of Service | Kala Agalya Herbals</title>
        <meta name="description" content="Read the terms and conditions for using Kala Agalya Herbals website and purchasing our Naturopathy hair growth products." />
        <link rel="canonical" href="https://kalaagalyaherbals.com/terms-of-service" />
      </Helmet>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-16 animate-[fadeIn_0.5s_ease-out]">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 drop-shadow-[0_0_15px_rgba(234,179,8,0.3)]">
            Terms of Service
          </h1>
          <p className="text-gray-400">Last Updated: January 2026</p>
        </div>

        <div className="bg-[#1c1b1b]/40 backdrop-blur-md rounded-3xl border border-yellow-900/30 p-8 md:p-12 shadow-2xl space-y-12">
            
            <p className="text-lg leading-relaxed text-gray-300 border-b border-yellow-900/30 pb-8">
              By accessing and using the website of <strong className="text-yellow-400">KALA AGALYA HERBALSKALAVATHI H</strong>, you agree to be bound by the following Terms and Conditions. Please read them carefully.
            </p>

            <div className="grid gap-10">
                {[
                    { title: "1. Use of Website", content: "You agree to use this website only for lawful purposes. Any activity that harms the website, business, or its users is strictly prohibited." },
                    { title: "2. Product Information", content: "We strive for accuracy but do not guarantee that all descriptions, images, or details are 100% error-free. Natural products may vary slightly in color or texture." },
                    { title: "3. Orders & Payments", content: "All orders are subject to availability. Prices may change without notice. We reserve the right to cancel orders due to fraud, pricing errors, or stock issues." },
                    { title: "4. Intellectual Property", content: "All content (logos, images, text) belongs to Kala Agalya Herbals Hair Oils. Unauthorized copying or reuse is prohibited." },
                    { title: "5. Limitation of Liability", content: "We are not responsible for allergic reactions or individual sensitivities. Always patch test before use. We are not liable for delays caused by logistics partners." },
                    { title: "6. Account Responsibility", content: "You are responsible for maintaining the confidentiality of your account credentials and activities." },
                    { title: "7. Termination", content: "We reserve the right to suspend access to our services if any violation of these terms is detected." },
                    { title: "8. Governing Law", content: "These terms are governed by the laws of India." }
                ].map((term, idx) => (
                    <div key={idx} className="group">
                        <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-3">
                            <span className="text-yellow-500 font-mono opacity-50">0{idx + 1}</span>
                            {term.title.split('. ')[1]}
                        </h2>
                        <p className="text-gray-400 leading-relaxed pl-9 border-l-2 border-yellow-500/10 group-hover:border-yellow-500/50 transition-colors duration-300">
                             {term.content}
                        </p>
                    </div>
                ))}
            </div>

        </div>

      </div>
    </div>
  );
}



