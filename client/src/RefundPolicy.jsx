import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from "react-helmet-async";

export default function RefundPolicy() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-[#0d0b03] min-h-screen relative overflow-hidden text-gray-300">
      <Helmet>
        <title>Refund & Return Policy | Kala Agalya Herbals</title>
        <meta name="description" content="Read our transparent refund and return policy for Kala Agalya Herbals. We ensure a fair process for damaged or incorrect deliveries." />
        <link rel="canonical" href="https://kalaagalyaherbals.com/refund-policy" />
      </Helmet>
       <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-900/20 via-[#0d0b03] to-[#0d0b03] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-16 animate-[fadeIn_0.5s_ease-out]">
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 drop-shadow-[0_0_15px_rgba(234,179,8,0.3)]">
            Refund & Return
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Our commitment to quality means we want you to be happy. Here's how our fair and transparent refund process works.
          </p>
        </div>

        {/* Highlight Cards - Top Section */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
            
            {/* Accepted Card */}
            <div className="bg-gradient-to-br from-green-900/20 to-[#0f1a0f] p-8 rounded-3xl border border-yellow-500/30 hover:shadow-[0_0_30px_rgba(234,179,8,0.15)] transition-all duration-300 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-40 w-40 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                 </div>
                 <div className="relative z-10">
                    <h3 className="text-2xl font-bold text-yellow-400 mb-6 flex items-center gap-3">
                        <span className="bg-yellow-500 text-black rounded-full p-1"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></span>
                        Refunds Applicable
                    </h3>
                    <ul className="space-y-4">
                        {["Damaged during transit", "Wrong product delivered", "Package is tampered", "Manufacturing defect", "Product leakage"].map((item, i) => (
                            <li key={i} className="flex items-center gap-3 text-gray-300">
                                <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
                                {item}
                            </li>
                        ))}
                    </ul>
                 </div>
            </div>

            {/* Not Accepted Card */}
             <div className="bg-gradient-to-br from-red-900/10 to-[#120505] p-8 rounded-3xl border border-red-500/20 hover:shadow-[0_0_30px_rgba(239,68,68,0.1)] transition-all duration-300 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-40 w-40 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                 </div>
                 <div className="relative z-10">
                    <h3 className="text-2xl font-bold text-red-400 mb-6 flex items-center gap-3">
                        <span className="bg-red-500 text-black rounded-full p-1"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></span>
                        Refunds Not Applicable
                    </h3>
                    <ul className="space-y-4">
                        {["Product is opened/used", "Seal is broken", "Change of mind", "Personal dislike", "Courier delays"].map((item, i) => (
                             <li key={i} className="flex items-center gap-3 text-gray-400">
                                <span className="w-1.5 h-1.5 bg-red-500/50 rounded-full"></span>
                                {item}
                            </li>
                        ))}
                    </ul>
                 </div>
            </div>
        </div>

        {/* Process Steps */}
        <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-10 text-center">How to Request a Refund</h2>
            
            <div className="relative">
                {/* Connecting Line */}
                <div className="absolute left-[28px] top-0 bottom-0 w-1 bg-yellow-900/20 rounded-full md:left-1/2 md:-ml-0.5"></div>

                {/* Step 1 */}
                <div className="relative flex flex-col md:flex-row items-start md:items-center mb-12 animate-[fadeIn_0.5s_ease-out]">
                    <div className="flex-1 md:text-right md:pr-12 order-2 md:order-1 pl-16 md:pl-0">
                        <h3 className="text-xl font-bold text-yellow-400 mb-2">Step 1: Contact Us</h3>
                        <p className="text-gray-400">Reach out within 48 hours of delivery.</p>
                    </div>
                    <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 w-14 h-14 bg-[#1c1b1b] border-2 border-yellow-500 rounded-full flex items-center justify-center z-10 text-xl font-bold text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.4)] order-1">1</div>
                    <div className="flex-1 md:pl-12 order-3 hidden md:block"></div>
                </div>

                {/* Step 2 */}
                <div className="relative flex flex-col md:flex-row items-start md:items-center mb-12 animate-[fadeIn_0.5s_ease-out] animation-delay-200">
                    <div className="flex-1 md:pr-12 order-2 md:order-1 hidden md:block"></div>
                    <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 w-14 h-14 bg-[#1c1b1b] border-2 border-yellow-500 rounded-full flex items-center justify-center z-10 text-xl font-bold text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.4)] order-1">2</div>
                    <div className="flex-1 md:pl-12 order-2 pl-16 md:pl-0">
                         <h3 className="text-xl font-bold text-yellow-400 mb-2">Step 2: Share Details</h3>
                        <p className="text-gray-400">Order ID, Photos, & Unboxing Video (for damage).</p>
                    </div>
                </div>

                 {/* Step 3 */}
                <div className="relative flex flex-col md:flex-row items-start md:items-center animate-[fadeIn_0.5s_ease-out] animation-delay-400">
                    <div className="flex-1 md:text-right md:pr-12 order-2 md:order-1 pl-16 md:pl-0">
                        <h3 className="text-xl font-bold text-yellow-400 mb-2">Step 3: Approval & Refund</h3>
                        <p className="text-gray-400"> We have a 3 day return policy , Once approved the refund will be issued within 7 business days .</p>
                    </div>
                    <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 w-14 h-14 bg-[#1c1b1b] border-2 border-yellow-500 rounded-full flex items-center justify-center z-10 text-xl font-bold text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.4)] order-1">3</div>
                     <div className="flex-1 md:pl-12 order-3 hidden md:block"></div>
                </div>

            </div>

             <div className="mt-16 text-center">
                 <Link to="/contact">
                    <button className="px-8 py-3 bg-yellow-600 text-white rounded-full font-bold hover:bg-yellow-500 transition-colors shadow-lg shadow-yellow-900/50">
                        Contact Support
                    </button>
                 </Link>
            </div>
        </div>

      </div>
    </div>
  );
}


