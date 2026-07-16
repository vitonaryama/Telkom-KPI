import { useState } from "react";
import { Eye, EyeOff, Radio, KeyRound, ArrowLeft, CheckCircle2 } from "lucide-react";
import { resetPassword } from "../services/api.js";

export default function ResetPasswordPage({ token, onBackToLogin }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState("");

  const passwordValid = password.length >= 8;
  const confirmValid = confirmPassword === password && confirmPassword.length > 0;

  const passwordError = touched && !passwordValid ? "Password minimal 8 karakter." : "";
  const confirmError = touched && !confirmValid ? "Konfirmasi password tidak cocok." : "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    setServerError("");
    if (!passwordValid || !confirmValid) return;
    setSubmitting(true);
    try {
      await resetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      setServerError(err.message || "Gagal mereset password. Token mungkin sudah kadaluarsa.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-950">
        <svg className="absolute inset-0 w-full h-full opacity-40" viewBox="0 0 800 900" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="gridFadeReset" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>
          {Array.from({ length: 18 }).map((_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 50} x2="800" y2={i * 50} stroke="url(#gridFadeReset)" strokeWidth="1" />
          ))}
          {Array.from({ length: 16 }).map((_, i) => (
            <line key={`v${i}`} x1={i * 50} y1="0" x2={i * 50} y2="900" stroke="url(#gridFadeReset)" strokeWidth="1" />
          ))}
        </svg>
        <div className="relative z-10 m-auto flex flex-col items-center gap-8 px-12 text-center">
          <Radio size={64} className="text-red-500" strokeWidth={1.5} />
          <h2 className="text-white text-2xl font-bold">Buat Password Baru</h2>
          <p className="text-slate-400 text-sm max-w-sm">Masukkan password baru yang kuat untuk melindungi akun Anda.</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 sm:px-10 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-10 flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center">
              <Radio size={18} className="text-white" />
            </div>
            <div className="leading-tight">
              <p className="font-bold text-gray-900 text-sm">Telkom Network</p>
              <p className="text-[11px] text-gray-400 tracking-wide">OPERATIONS</p>
            </div>
          </div>

          {success ? (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={24} className="text-emerald-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Password Diperbarui</h1>
              <p className="text-sm text-gray-500 mb-6">Password baru Anda sudah aktif. Silakan login.</p>
              <button
                onClick={onBackToLogin}
                className="w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
              >
                Login Sekarang
              </button>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mb-6">
                <KeyRound size={18} className="text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Reset Password</h1>
              <p className="text-sm text-gray-500 mb-6">Masukkan password baru untuk akun Anda.</p>

              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                {serverError && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs text-red-600">
                    {serverError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1.5">Password Baru</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimal 8 karakter"
                      className={`w-full px-3.5 py-2.5 pr-10 rounded-lg border text-sm outline-none transition-colors ${
                        passwordError ? "border-red-400" : "border-gray-300 focus:border-red-500"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {passwordError && <p className="mt-1 text-xs text-red-600">{passwordError}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1.5">Konfirmasi Password</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi password baru"
                    className={`w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none transition-colors ${
                      confirmError ? "border-red-400" : "border-gray-300 focus:border-red-500"
                    }`}
                  />
                  {confirmError && <p className="mt-1 text-xs text-red-600">{confirmError}</p>}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
                >
                  {submitting ? "Menyimpan..." : "Simpan Password Baru"}
                </button>

                <button
                  type="button"
                  onClick={onBackToLogin}
                  className="w-full text-center text-sm text-red-600 hover:underline inline-flex items-center justify-center gap-1"
                >
                  <ArrowLeft size={13} /> Kembali ke Login
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
