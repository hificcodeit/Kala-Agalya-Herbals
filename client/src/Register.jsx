import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "./Alert";
import Avatar from "./Avatar";
/**
 * Password policy rules — must stay in sync with server-side validatePassword.js
 */
const PASSWORD_RULES = [
  { id: "length", label: "At least 8 characters", test: (p) => p.length >= 8 },
  { id: "uppercase", label: "At least 1 uppercase letter (A-Z)", test: (p) => /[A-Z]/.test(p) },
  { id: "number", label: "At least 1 number (0-9)", test: (p) => /[0-9]/.test(p) },
  { id: "symbol", label: "At least 1 symbol (!@& etc.)", test: (p) => /[!@&#$%^*()\-_+=\[\]{}|;:'",.<>?/~`]/.test(p) },
];

/**
 * Registration component
 */

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  // Real-time password policy check
  const policyResults = useMemo(() => {
    return PASSWORD_RULES.map((rule) => ({
      ...rule,
      passed: rule.test(password),
    }));
  }, [password]);

  const allPoliciesPassed = policyResults.every((r) => r.passed);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!allPoliciesPassed) {
      return addToast("Password does not meet all security requirements", "error");
    }
    if (!passwordsMatch) {
      return addToast("Passwords do not match", "error");
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("phone", phone);
      if (profilePic) {
        formData.append("avatar", profilePic);
      }

      const response = await fetch("https://kala-agalya-herbals-production.up.railway.app/api/users/register", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem("userToken", data.token);
        localStorage.setItem("userEmail", data.user.email);
        localStorage.setItem("userName", data.user.name);
        if (data.user.avatar) {
          localStorage.setItem("userAvatar", data.user.avatar);
        }
        addToast("Registration Successful! Welcome to Kala Agalya Herbals", "success");
        document.dispatchEvent(new Event("profileUpdated"));
        navigate("/");
      } else {
        addToast(data.message || "Registration failed", "error");
      }
    } catch (err) {
      addToast("Server error. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0b03] text-gray-200 font-sans selection:bg-yellow-500 selection:text-black pt-12">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-yellow-900/5 blur-[120px] pointer-events-none mix-blend-screen"></div>

      <div className="relative min-h-[80vh] flex items-center justify-center p-6 font-sans">
        <div className="relative bg-[#15120a] border border-yellow-900/40 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-md p-8 backdrop-blur-xl">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600 tracking-wide mb-2">
              Create Account
            </h1>
            <p className="text-gray-500 text-[10px] tracking-[0.2em] uppercase">Start Your Herbal Journey Today</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            <div className="flex flex-col items-center mb-8">
              <div className="relative group">
                <Avatar src={preview} name={name} size="lg" className="border-dashed" />
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setProfilePic(file);
                      setPreview(URL.createObjectURL(file));
                    }
                  }}
                />
                {preview && (
                  <button
                    type="button"
                    onClick={() => { setProfilePic(null); setPreview(null); }}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </div>
              <p className="text-[10px] text-gray-500 mt-3 uppercase tracking-widest font-bold">Upload Identity Photo</p>
            </div>

            <div className="space-y-4">
              <div className="group">
                <label className="block text-[10px] font-bold text-yellow-500/60 uppercase tracking-widest mb-2 ml-1 group-focus-within:text-yellow-400 transition-colors">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-[#0d0b03] text-yellow-100 border border-yellow-900/40 rounded-xl focus:border-yellow-500 transition-all placeholder-gray-800 text-sm shadow-inner"
                    placeholder="John Doe"
                    required
                  />
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-yellow-800 group-focus-within:text-yellow-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="group">
                <label className="block text-[10px] font-bold text-yellow-500/60 uppercase tracking-widest mb-2 ml-1 group-focus-within:text-yellow-400 transition-colors">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-[#0d0b03] text-yellow-100 border border-yellow-900/40 rounded-xl focus:border-yellow-500 transition-all placeholder-gray-800 text-sm shadow-inner"
                    placeholder="john@example.com"
                    required
                  />
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-yellow-800 group-focus-within:text-yellow-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="group">
                <label className="block text-[10px] font-bold text-yellow-500/60 uppercase tracking-widest mb-2 ml-1 group-focus-within:text-yellow-400 transition-colors">
                  Phone Number
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-[#0d0b03] text-yellow-100 border border-yellow-900/40 rounded-xl focus:border-yellow-500 transition-all placeholder-gray-800 text-sm shadow-inner"
                    placeholder="+91 98765 43210"
                  />
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-yellow-800 group-focus-within:text-yellow-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="group">
                <label className="block text-[10px] font-bold text-yellow-500/60 uppercase tracking-widest mb-2 ml-1 group-focus-within:text-yellow-400 transition-colors">
                  Create Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full pl-12 pr-12 py-4 bg-[#0d0b03] text-yellow-100 border rounded-xl transition-all placeholder-gray-800 text-sm shadow-inner ${password.length > 0
                        ? allPoliciesPassed
                          ? "border-green-500/50 focus:border-green-500"
                          : "border-red-500/50 focus:border-red-500"
                        : "border-yellow-900/40 focus:border-yellow-500"
                      }`}
                    placeholder="••••••••"
                    required
                  />
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-yellow-800 group-focus-within:text-yellow-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-yellow-700 hover:text-yellow-500 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268-2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>

                {/* Password Policy Checklist - Visible Always but dynamic colors */}
                <div className="mt-4 bg-black/30 border border-yellow-900/20 rounded-xl p-4 space-y-2">
                  <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3">Security Checklist</p>
                  {policyResults.map((rule) => (
                    <div key={rule.id} className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${password.length === 0
                          ? "bg-white/5 border border-white/10"
                          : rule.passed
                            ? "bg-green-500/20 border border-green-500/40"
                            : "bg-red-500/10 border border-red-500/20"
                        }`}>
                        {password.length > 0 && (
                          rule.passed ? (
                            <svg className="w-2.5 h-2.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                          ) : (
                            <svg className="w-2.5 h-2.5 text-red-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                          )
                        )}
                      </div>
                      <span className={`text-xs transition-colors duration-300 ${password.length === 0
                          ? "text-gray-700"
                          : rule.passed
                            ? "text-green-400/70"
                            : "text-gray-500"
                        }`}>
                        {rule.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="group">
                <label className="block text-[10px] font-bold text-yellow-500/60 uppercase tracking-widest mb-2 ml-1 group-focus-within:text-yellow-400 transition-colors">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full pl-12 pr-12 py-4 bg-[#0d0b03] text-yellow-100 border rounded-xl transition-all placeholder-gray-800 text-sm shadow-inner ${confirmPassword.length > 0
                        ? passwordsMatch
                          ? "border-green-500/50 focus:border-green-500"
                          : "border-red-500/50 focus:border-red-500"
                        : "border-yellow-900/40 focus:border-yellow-500"
                      }`}
                    placeholder="Re-enter password"
                    required
                  />
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-yellow-800 group-focus-within:text-yellow-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-yellow-700 hover:text-yellow-500 transition-colors"
                  >
                    {showConfirm ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268-2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>
                {confirmPassword.length > 0 && (
                  <p className={`text-[10px] mt-2 ml-1 flex items-center gap-1.5 font-bold uppercase tracking-wider ${passwordsMatch ? "text-green-500/60" : "text-red-500/60"
                    }`}>
                    {passwordsMatch ? "Passwords Secured" : "Passwords mismatch"}
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !allPoliciesPassed || !passwordsMatch}
              className="w-full py-4 bg-gradient-to-r from-yellow-600 to-amber-700 text-black rounded-xl font-bold tracking-wide uppercase shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_30px_rgba(234,179,8,0.5)] transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group text-sm mt-6"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Initializing...
                  </>
                ) : (
                  <>
                    Establish Account
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </form>

          <div className="mt-10 pt-6 border-t border-yellow-900/30 text-center">
            <p className="text-sm text-gray-500 uppercase tracking-widest mb-4">
              Already registered? <Link to="/login" className="text-yellow-500 border-b border-yellow-500/50 hover:border-yellow-400 transition-colors">Login Vault</Link>
            </p>
            <p className="text-[10px] text-gray-600 uppercase tracking-[0.2em] font-bold">
              Nature's Secret • Purest Quality • Bio-Active
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
