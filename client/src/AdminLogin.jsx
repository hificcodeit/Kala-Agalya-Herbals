import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "./Alert";
import { API_URL } from "./services/api";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useToast();

  // Forgot password state
  const [forgotMode, setForgotMode] = useState(null); // null | "email" | "otp" | "newpass" | "done"
  const [fpEmail, setFpEmail] = useState("");
  const [fpOtp, setFpOtp] = useState("");
  const [fpPassword, setFpPassword] = useState("");
  const [fpConfirm, setFpConfirm] = useState("");
  const [fpLoading, setFpLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem("adminToken", data.token);
        localStorage.setItem("adminEmail", data.admin.email);
        localStorage.setItem("adminName", data.admin.name);
        addToast("Welcome back! Redirecting to dashboard...", "success");
        navigate("/admin/dashboard");
      } else {
        addToast(data.message || "Invalid credentials", "error");
      }
    } catch (err) {
      addToast("Server error. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setFpLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fpEmail }),
      });
      const data = await res.json();
      if (data.success) {
        addToast("OTP sent to your email!", "success");
        setForgotMode("otp");
      } else {
        addToast(data.message || "Failed to send OTP", "error");
      }
    } catch { addToast("Server error", "error"); }
    finally { setFpLoading(false); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (fpPassword !== fpConfirm) {
      addToast("Passwords do not match", "error");
      return;
    }
    if (fpPassword.length < 6) {
      addToast("Password must be at least 6 characters", "error");
      return;
    }
    setFpLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fpEmail, otp: fpOtp, password: fpPassword }),
      });
      const data = await res.json();
      if (data.success) {
        addToast("Password reset successful!", "success");
        setForgotMode("done");
      } else {
        addToast(data.message || "Reset failed", "error");
      }
    } catch { addToast("Server error", "error"); }
    finally { setFpLoading(false); }
  };

  const resetForgotState = () => {
    setForgotMode(null);
    setFpEmail("");
    setFpOtp("");
    setFpPassword("");
    setFpConfirm("");
  };

  // Shared input style
  const inputClass = "w-full pl-12 pr-4 py-4 bg-[#0d0b03] text-yellow-100 border border-yellow-900/50 rounded-xl focus:ring-0 focus:border-yellow-500 transition-all placeholder-gray-700 shadow-inner";
  const labelClass = "block text-xs font-semibold text-yellow-500/80 uppercase tracking-wider mb-2 ml-1";

  return (
    <div className="min-h-screen bg-[#0d0b03] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-yellow-500/20 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-600/10 blur-[150px] rounded-full pointer-events-none"></div>

      <div className="relative bg-[#15120a] border border-yellow-900/40 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-md p-8 backdrop-blur-xl">
        <div className="text-center mb-10">
          <div className="relative inline-block mb-6">
             <div className="absolute inset-0 bg-yellow-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
             <div className="relative bg-gradient-to-br from-yellow-900 to-[#0d0b03] w-24 h-24 rounded-2xl flex items-center justify-center shadow-2xl border border-yellow-500/30 transform rotate-3 hover:rotate-6 transition-transform duration-500 p-4">
                <img src="/images/icons/logo.png" alt="Kala Agalya Herbals" className="w-full h-auto drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
             </div>
          </div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600 tracking-wide mb-2">
            {forgotMode ? "Reset Password" : "Admin Access"}
          </h1>
          <p className="text-gray-500 text-sm tracking-widest uppercase">
            {forgotMode === "email" && "Enter your admin email"}
            {forgotMode === "otp" && "Enter the OTP sent to your email"}
            {forgotMode === "newpass" && "Set your new password"}
            {forgotMode === "done" && "Password updated successfully"}
            {!forgotMode && "Kala Agalya Herbals Secure Portal"}
          </p>
        </div>

        {/* ── LOGIN FORM ── */}
        {!forgotMode && (
          <>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-4">
                <div className="group">
                  <label className={labelClass}>Email Address</label>
                  <div className="relative">
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      className={inputClass} placeholder="admin@kalaagalya.com" required />
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="group">
                  <label className={labelClass}>Password</label>
                  <div className="relative">
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                      className={inputClass} placeholder="••••••••" required />
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-yellow-600 to-amber-700 text-black rounded-xl font-bold tracking-wide uppercase shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_30px_rgba(234,179,8,0.5)] transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group">
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Authenticating...
                    </>
                  ) : (
                    <>
                      Enter Dashboard
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            </form>

            <div className="mt-6 text-center">
              <button onClick={() => setForgotMode("email")}
                className="text-xs text-yellow-500/50 hover:text-yellow-400 uppercase tracking-widest transition-colors border-b border-yellow-500/20 hover:border-yellow-500/50 pb-0.5">
                Forgot Password?
              </button>
            </div>
          </>
        )}

        {/* ── STEP 1: ENTER EMAIL ── */}
        {forgotMode === "email" && (
          <form onSubmit={handleSendOtp} className="space-y-6 animate-fadeIn">
            <div className="group">
              <label className={labelClass}>Admin Email</label>
              <div className="relative">
                <input type="email" value={fpEmail} onChange={(e) => setFpEmail(e.target.value)}
                  className={inputClass} placeholder="admin@kalaagalya.com" required autoFocus />
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
              </div>
            </div>

            <button type="submit" disabled={fpLoading}
              className="w-full py-4 bg-gradient-to-r from-yellow-600 to-amber-700 text-black rounded-xl font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_30px_rgba(234,179,8,0.5)] transition-all disabled:opacity-50 relative overflow-hidden group">
              <span className="relative z-10 flex items-center justify-center gap-2">
                {fpLoading ? "Sending OTP..." : "Send OTP"}
                {!fpLoading && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>

            <div className="text-center">
              <button type="button" onClick={resetForgotState} className="text-xs text-gray-500 hover:text-yellow-500 uppercase tracking-widest transition-colors">
                ← Back to Login
              </button>
            </div>
          </form>
        )}

        {/* ── STEP 2: ENTER OTP ── */}
        {forgotMode === "otp" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-[#0d0b03] border border-yellow-900/30 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-400">OTP sent to <strong className="text-yellow-400">{fpEmail}</strong></p>
              <p className="text-[10px] text-gray-600 mt-1">Check inbox & spam. Expires in 5 minutes.</p>
            </div>

            <div className="group">
              <label className={labelClass}>Enter 6-Digit OTP</label>
              <div className="relative">
                <input type="text" value={fpOtp} onChange={(e) => setFpOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="w-full text-center text-3xl tracking-[0.5em] py-4 bg-[#0d0b03] text-yellow-400 border border-yellow-900/50 rounded-xl focus:border-yellow-500 transition-all font-mono font-bold placeholder-gray-800"
                  placeholder="••••••" maxLength={6} required autoFocus />
              </div>
            </div>

            <button onClick={() => { if (fpOtp.length === 6) setForgotMode("newpass"); else addToast("Enter a 6-digit OTP", "error"); }}
              className="w-full py-4 bg-gradient-to-r from-yellow-600 to-amber-700 text-black rounded-xl font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_30px_rgba(234,179,8,0.5)] transition-all relative overflow-hidden group">
              <span className="relative z-10 flex items-center justify-center gap-2">
                Verify & Continue
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>

            <div className="flex justify-between">
              <button onClick={() => setForgotMode("email")} className="text-xs text-gray-500 hover:text-yellow-500 uppercase tracking-widest transition-colors">← Change Email</button>
              <button onClick={handleSendOtp} className="text-xs text-yellow-500/50 hover:text-yellow-400 uppercase tracking-widest transition-colors">Resend OTP</button>
            </div>
          </div>
        )}

        {/* ── STEP 3: NEW PASSWORD ── */}
        {forgotMode === "newpass" && (
          <form onSubmit={handleResetPassword} className="space-y-6 animate-fadeIn">
            <div className="group">
              <label className={labelClass}>New Password</label>
              <div className="relative">
                <input type="password" value={fpPassword} onChange={(e) => setFpPassword(e.target.value)}
                  className={inputClass} placeholder="Min 6 characters" required minLength={6} autoFocus />
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="group">
              <label className={labelClass}>Confirm Password</label>
              <div className="relative">
                <input type="password" value={fpConfirm} onChange={(e) => setFpConfirm(e.target.value)}
                  className={inputClass} placeholder="Re-enter password" required minLength={6} />
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
            </div>

            <button type="submit" disabled={fpLoading}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-xl font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all disabled:opacity-50 relative overflow-hidden group">
              <span className="relative z-10 flex items-center justify-center gap-2">
                {fpLoading ? "Resetting..." : "Reset Password"}
                {!fpLoading && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>

            <div className="text-center">
              <button type="button" onClick={() => setForgotMode("otp")} className="text-xs text-gray-500 hover:text-yellow-500 uppercase tracking-widest transition-colors">← Back to OTP</button>
            </div>
          </form>
        )}

        {/* ── SUCCESS STATE ── */}
        {forgotMode === "done" && (
          <div className="text-center space-y-6 animate-fadeIn">
            <div className="w-20 h-20 mx-auto bg-green-900/20 rounded-full flex items-center justify-center border border-green-500/30">
              <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gray-300 text-sm">Your admin password has been reset. You can now login.</p>
            <button onClick={resetForgotState}
              className="w-full py-4 bg-gradient-to-r from-yellow-600 to-amber-700 text-black rounded-xl font-bold uppercase tracking-widest transition-all relative overflow-hidden group">
              <span className="relative z-10">Back to Login</span>
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-yellow-900/30 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-widest">
            Protected • 256-bit Encryption • Secure Access
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
      `}</style>
    </div>
  );
}
