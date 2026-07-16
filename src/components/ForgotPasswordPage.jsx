import { useState } from "react";
import { Radio, Wifi, Gauge, MailCheck, ArrowLeft } from "lucide-react";
import { forgotPassword } from "../services/api.js";

export default function ForgotPasswordPage({ onBackToLogin }) {
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState("");

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const emailError = touched && email.length === 0
    ? "Email tidak boleh kosong."
    : touched && !emailValid ? "Format email tidak valid." : "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    setServerError("");
    if (!emailValid) return;
    setSubmitting(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setServerError(err.message || "Gagal mengirim permintaan. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white">
      {/* Left illustration panel — konsisten sama Login & Register */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-950">
        <svg className="absolute inset-0 w-full h-full opacity-40" viewBox="0 0 800 900" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="gridFadeForgot" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>
          {Array.from({ length: 18 }).map((_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 50} x2="800" y2={i * 50} stroke="url(#gridFadeForgot)" strokeWidth="1" />
          ))}
          {Array.from({ length: 16 }).map((_, i) => (
            <line key={`v${i}`} x1={i * 50} y1="0" x2={i * 50} y2="900" stroke="url(#gridFadeForgot)" strokeWidth="1" />
          ))}
        </svg>
        <div className="relative z-10 m-auto flex flex-col items-center gap-8 px-12">
          <div className="relative">
            <Radio size={64} className="text-red-500" strokeWidth={1.5} />
            <span className="absolute -top-2 -right-2 w-3 h-3 rounded-full bg-red-500 animate-pulse" />
          </div>
          <div className="text-center space-y-3">
            <h2 className="text-white text-2xl font-bold leading-snug">
              Akses Aman ke Data<br />Kinerja Jaringan Anda
            </h2>
            <p className="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed">
              Kami akan kirim link reset kata sandi ke email yang terdaftar
              agar Anda bisa masuk kembali dengan aman.
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

          {sent ? (
            <>
              <div className="w-11 h-11 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <MailCheck size={20} className="text-emerald-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Cek email Anda</h1>
              <p className="text-sm text-gray-500 mb-8">
                Kalau <span className="font-medium text-gray-700">{email}</span> terdaftar, kami sudah kirim link reset kata sandi ke sana. Cek juga folder spam kalau belum masuk.
              </p>
              <button
                type="button"
                onClick={onBackToLogin}
                className="w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors shadow-sm flex items-center justify-center gap-1.5"
              >
                <ArrowLeft size={15} /> Kembali ke Login
              </button>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Lupa kata sandi?</h1>
              <p className="text-sm text-gray-500 mb-8">Masukkan email yang terdaftar, kami kirim link buat reset kata sandi Anda.</p>

              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                {serverError && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs text-red-600">
                    {serverError}
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

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors shadow-sm"
                >
                  {submitting ? "Mengirim..." : "Kirim Link Reset"}
                </button>

                <p className="text-center text-sm text-gray-500">
                  <button
                    type="button"
                    onClick={onBackToLogin}
                    className="text-red-600 font-medium hover:underline inline-flex items-center gap-1"
                  >
                    <ArrowLeft size={13} /> Kembali ke Login
                  </button>
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
