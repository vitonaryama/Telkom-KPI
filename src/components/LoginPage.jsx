import { useState } from "react";
import { Eye, EyeOff, Radio, Wifi, Gauge } from "lucide-react";
import heroImage from "../assets/hero.png";
import { login } from "../services/api.js";

/* =========================================================================
   LOGIN PAGE
   ========================================================================= */

export default function LoginPage({ onLogin, onGoToRegister, onGoToForgotPassword, initialEmail = "" }) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordValid = password.length >= 8;
  const emailError = touched && email.length === 0
    ? "Email tidak boleh kosong."
    : touched && !emailValid
    ? "Format email tidak valid."
    : "";
  const passwordError = touched && password.length === 0
    ? "Kata sandi tidak boleh kosong."
    : touched && !passwordValid
    ? "Kata sandi minimal 8 karakter."
    : "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    setError("");
    if (!emailValid || !passwordValid) return;
    setSubmitting(true);
    try {
      const result = await login(email, password);
      onLogin(result.data);
    } catch (err) {
      setError(err.message || "Login gagal. Periksa email dan password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white">
      {/* Left illustration panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-950">
        {/* Foto background dari src/assets/hero.png */}
        <img
          src={heroImage}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Overlay gelap gradasi biar teks di atasnya tetap kebaca jelas */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/50 to-slate-950/90" />
        {/* Signal tower motif */}
        <div className="relative z-10 m-auto flex flex-col items-center gap-8 px-12">
          <div className="relative">
            <Radio size={64} className="text-red-500" strokeWidth={1.5} />
            <span className="absolute -top-2 -right-2 w-3 h-3 rounded-full bg-red-500 animate-pulse" />
          </div>
          <div className="text-center space-y-3">
            <h2 className="text-white text-2xl font-bold leading-snug">
              Monitoring Kinerja Jaringan<br />Secara Real-Time
            </h2>
            <p className="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed">
              Pantau Service Availability, Assurance Guarantee, TTR, dan SQM
              di seluruh Service Area Jawa Tengah dalam satu dashboard terpadu.
            </p>
          </div>
          <div className="flex items-center gap-6 text-slate-500 text-xs pt-4">
            <div className="flex items-center gap-1.5"><Wifi size={14} /> 4 Service Area</div>
            <div className="w-1 h-1 rounded-full bg-slate-700" />
            <div className="flex items-center gap-1.5"><Gauge size={14} /> 19 STO Terpantau</div>
          </div>
        </div>
        <div className="absolute bottom-6 left-8 text-slate-600 text-xs">
          System Version 2.4.1-stable
        </div>
        <div className="absolute bottom-6 right-8 text-slate-600 text-xs">
          © Telkom Indonesia
        </div>
      </div>

      {/* Right form panel */}
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

          <h1 className="text-2xl font-bold text-gray-900 mb-1">Masuk ke akun Anda</h1>
          <p className="text-sm text-gray-500 mb-6">Pantau KPI IOAN Anda dari sini.</p>

          {initialEmail && (
            <div className="mb-6 rounded-lg bg-emerald-50 border border-emerald-100 px-3.5 py-2.5 text-xs text-emerald-700">
              Akun berhasil dibuat. Silakan masuk dengan kata sandi yang baru saja Anda buat.
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs text-red-600">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@gmail.com"
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none transition-colors ${
                  emailError ? "border-red-400 focus:border-red-500" : "border-gray-300 focus:border-red-500"
                }`}
              />
              {emailError && <p className="mt-1 text-xs text-red-600">{emailError}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">Kata Sandi</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Kata Sandi Minimal 8 Karakter"
                  className={`w-full px-3.5 py-2.5 pr-10 rounded-lg border text-sm outline-none transition-colors ${
                    passwordError ? "border-red-400 focus:border-red-500" : "border-gray-300 focus:border-red-500"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                  aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {passwordError && <p className="mt-1 text-xs text-red-600">{passwordError}</p>}
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                Ingat Saya
              </label>
              {/* FIX: sebelumnya <a href="#">, gak ngapa-ngapain pas diklik.
                  Sekarang manggil onGoToForgotPassword buat pindah ke ForgotPasswordPage. */}
              <button type="button" onClick={onGoToForgotPassword} className="text-red-600 font-medium hover:underline">
                Lupa Kata Sandi?
              </button>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors shadow-sm"
            >
              {submitting ? "Memproses..." : "Login"}
            </button>

            <p className="text-center text-sm text-gray-500">
              Belum punya akun?{" "}
              {/* FIX: sebelumnya <a href="#">, gak ngapa-ngapain pas diklik.
                  Sekarang manggil onGoToRegister buat pindah ke RegisterPage. */}
              <button
                type="button"
                onClick={onGoToRegister}
                className="text-red-600 font-medium hover:underline"
              >
                Daftar
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
