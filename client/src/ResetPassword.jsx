import { API_URL, BASE_URL } from "./services/api";
import { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useToast } from "./Alert";

/**
 * Password policy rules — must stay in sync with server-side validatePassword.js
 */
const PASSWORD_RULES = [
  { id: "length", label: "At least 8 characters", test: (p) => p.length >= 8 },
  { id: "uppercase", label: "At least 1 uppercase letter (A-Z)", test: (p) => /[A-Z]/.test(p) },
  { id: "number", label: "At least 1 number (0-9)", test: (p) => /[0-9]/.test(p) },
  { id: "symbol", label: "At least 1 symbol (!@& etc.)", test: (p) => /[!@&#$%^*()\-_+=\[\]{}|;:'",.<>?/~`]/.test(p) },
];

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);
  const { token } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  // Real-time password policy check
  const policyResults = useMemo(() => {
    return PASSWORD_RULES.map((rule) => ({
      ...rule,
      passed: rule.test(password),
    }));
  }, [password]);

  const allPoliciesPassed = policyResults.every((r) => r.passed);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  // Validate token is not empty on mount
  useEffect(() => {
    if (!token || token.length < 32) {
      setTokenValid(false);
    }
  }, [token]);

  const handleReset = async (e) => {
    e.preventDefault();

    if (!allPoliciesPassed) {
      return addToast("Password does not meet all security requirements", "error");
    }

    if (!passwordsMatch) {
      return addToast("Passwords do not match", "error");
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/users/resetpassword/${token}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        addToast("Password reset successful! You can now login.", "success");
        navigate("/login");
      } else {
        // Show specific validation errors from server
        if (data.errors && data.errors.length > 0) {
          data.errors.forEach((err) => addToast(err, "error"));
        } else {
          addToast(data.message || "Reset failed", "error");
        }

        // Token-related errors
        if (data.message && data.message.toLowerCase().includes("expired")) {
          setTokenValid(false);
        }
      }
    } catch (err) {
      addToast("Server error. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Invalid/expired token state
  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-[#0d0b03] flex items-center justify-center p-6 relative overflow-hidden font-sans">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-yellow-500/10 blur-[150px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-600/10 blur-[150px] rounded-full pointer-events-none"></div>

        <div className="relative bg-[#15120a] border border-yellow-900/40 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-md p-8 backdrop-blur-xl text-center">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-red-500 blur-xl opacity-20 rounded-full"></div>
            <div className="relative bg-gradient-to-br from-red-900/50 to-[#0d0b03] w-20 h-20 rounded-2xl flex items-center justify-center shadow-2xl border border-red-500/30 p-3">
              <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600 tracking-wide mb-3">
            Link Expired
          </h1>
          <p className="text-gray-400 text-sm mb-6 leading-relaxed">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <Link
            to="/forgot-password"
            className="inline-block w-full py-4 bg-gradient-to-r from-yellow-600 to-amber-700 text-black rounded-xl font-bold uppercase tracking-wide shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_30px_rgba(234,179,8,0.5)] transition-all duration-300"
          >
            Request New Link
          </Link>
          <div className="mt-6 pt-4 border-t border-yellow-900/30">
            <Link to="/login" className="text-sm text-yellow-500/60 hover:text-yellow-500 uppercase tracking-widest transition-colors">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0b03] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-yellow-500/10 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-600/10 blur-[150px] rounded-full pointer-events-none"></div>

      <div className="relative bg-[#15120a] border border-yellow-900/40 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-md p-8 backdrop-blur-xl">
        {/* Logo + Header */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 bg-yellow-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-yellow-900 to-[#0d0b03] w-20 h-20 rounded-2xl flex items-center justify-center shadow-2xl border border-yellow-500/30 transform rotate-3 p-3">
              <img src="/images/icons/logo.png" alt="Kala Agalya Herbals" className="w-full h-auto drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600 tracking-wide mb-2">
            Reset Password
          </h1>
          <p className="text-gray-500 text-xs tracking-widest uppercase">Create a new secure password</p>
        </div>

        <form onSubmit={handleReset} className="space-y-5">
          {/* New Password Field */}
          <div className="group">
            <label htmlFor="new-password" className="block text-[10px] font-semibold text-yellow-500/60 uppercase tracking-widest mb-2 ml-1">New Password</label>
            <div className="relative">
              <input
                id="new-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-4 bg-[#0d0b03] text-yellow-100 border border-yellow-900/40 rounded-xl focus:border-yellow-500 transition-all placeholder-gray-800"
                placeholder="Enter new password"
                required
                autoComplete="new-password"
              />
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-yellow-700 hover:text-yellow-500 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                )}
              </button>
            </div>
          </div>

          {/* Password Policy Checklist */}
          {password.length > 0 && (
            <div className="bg-black/30 border border-yellow-900/20 rounded-xl p-4 space-y-2">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Password Requirements</p>
              {policyResults.map((rule) => (
                <div key={rule.id} className="flex items-center gap-2.5">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${rule.passed
                      ? "bg-green-500/20 border border-green-500/50"
                      : "bg-red-500/10 border border-red-500/30"
                    }`}>
                    {rule.passed ? (
                      <svg className="w-2.5 h-2.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    ) : (
                      <svg className="w-2.5 h-2.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                    )}
                  </div>
                  <span className={`text-xs transition-colors duration-300 ${rule.passed ? "text-green-400/80" : "text-gray-500"
                    }`}>
                    {rule.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Confirm Password Field */}
          <div className="group">
            <label htmlFor="confirm-password" className="block text-[10px] font-semibold text-yellow-500/60 uppercase tracking-widest mb-2 ml-1">Confirm Password</label>
            <div className="relative">
              <input
                id="confirm-password"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full pl-12 pr-12 py-4 bg-[#0d0b03] text-yellow-100 border rounded-xl transition-all placeholder-gray-800 ${confirmPassword.length > 0
                    ? passwordsMatch
                      ? "border-green-500/50 focus:border-green-500"
                      : "border-red-500/50 focus:border-red-500"
                    : "border-yellow-900/40 focus:border-yellow-500"
                  }`}
                placeholder="Re-enter your password"
                required
                autoComplete="new-password"
              />
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-yellow-700 hover:text-yellow-500 transition-colors"
                tabIndex={-1}
              >
                {showConfirm ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                )}
              </button>
            </div>
            {/* Match indicator */}
            {confirmPassword.length > 0 && (
              <p className={`text-xs mt-2 ml-1 flex items-center gap-1.5 transition-colors ${passwordsMatch ? "text-green-400/70" : "text-red-400/70"
                }`}>
                {passwordsMatch ? (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Passwords match
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    Passwords do not match
                  </>
                )}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !allPoliciesPassed || !passwordsMatch}
            id="reset-password-btn"
            className="w-full py-4 bg-gradient-to-r from-yellow-600 to-amber-700 text-black rounded-xl font-bold uppercase tracking-wide shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_30px_rgba(234,179,8,0.5)] transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none relative overflow-hidden group"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Updating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  Update Password
                </>
              )}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-yellow-900/30 text-center">
          <Link to="/login" className="text-sm text-gray-500 uppercase tracking-widest hover:text-yellow-500 transition-colors">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
