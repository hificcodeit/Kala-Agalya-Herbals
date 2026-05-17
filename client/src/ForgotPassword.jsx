import { useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "./Alert";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("https://kala-agalya-herbals-production.up.railway.app/api/users/forgotpassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        addToast(data.message, "success");
        setSubmitted(true);
      } else {
        addToast(data.message || "Something went wrong", "error");
      }
    } catch (err) {
      addToast("Server error. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0b03] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-yellow-500/10 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-600/10 blur-[150px] rounded-full pointer-events-none"></div>

      <div className="relative bg-[#15120a] border border-yellow-900/40 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-md p-8 backdrop-blur-xl">
        <div className="text-center mb-8">
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 bg-yellow-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-yellow-900 to-[#0d0b03] w-20 h-20 rounded-2xl flex items-center justify-center shadow-2xl border border-yellow-500/30 transform rotate-3 p-3">
              <img src="/images/icons/logo.png" alt="Kala Agalya Herbals" className="w-full h-auto drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600 tracking-wide mb-2">
            Forgot Password
          </h1>
          <p className="text-gray-500 text-xs tracking-widest uppercase">
            {submitted ? "Check your inbox" : "Enter your email to receive a reset link"}
          </p>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="group">
              <label className="block text-[10px] font-semibold text-yellow-500/60 uppercase tracking-widest mb-2 ml-1">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-[#0d0b03] text-yellow-100 border border-yellow-900/40 rounded-xl focus:border-yellow-500 transition-all placeholder-gray-800"
                  placeholder="yourname@gmail.com"
                  required
                  autoComplete="email"
                  id="forgot-email"
                />
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              id="send-reset-link-btn"
              className="w-full py-4 bg-gradient-to-r from-yellow-600 to-amber-700 text-black rounded-xl font-bold uppercase tracking-wide shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_30px_rgba(234,179,8,0.5)] transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    Send Reset Link
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </form>
        ) : (
          /* Success State */
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-yellow-900/20 rounded-full flex items-center justify-center border border-yellow-500/30">
              <svg className="w-10 h-10 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
              </svg>
            </div>
            <div>
              <p className="text-gray-300 text-sm mb-2">
                If an account exists for <strong className="text-yellow-400">{email}</strong>, a password reset link has been sent.
              </p>
              <p className="text-gray-500 text-xs">
                Check your inbox and spam folder. The link expires in 5 minutes.
              </p>
            </div>
            <button
              onClick={() => { setSubmitted(false); setEmail(""); }}
              className="text-xs text-yellow-500/60 hover:text-yellow-500 uppercase tracking-widest transition-colors"
            >
              Try a different email
            </button>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-yellow-900/30 text-center">
          <p className="text-sm text-gray-500 uppercase tracking-widest">
            Back to <Link to="/login" className="text-yellow-500 border-b border-yellow-500/50 hover:border-yellow-400">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
