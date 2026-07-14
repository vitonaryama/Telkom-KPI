import React, { useState } from "react";
import { Eye, EyeOff, Radio } from "lucide-react";
import loginImage from "../assets/LoginPage.jpg";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordValid = password.length >= 8;

  const emailError =
    touched && email.length === 0
      ? "Email tidak boleh kosong."
      : touched && !emailValid
      ? "Format email tidak valid."
      : "";

  const passwordError =
    touched && password.length === 0
      ? "Kata sandi tidak boleh kosong."
      : touched && !passwordValid
      ? "Kata sandi minimal 8 karakter."
      : "";

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched(true);

    if (!emailValid || !passwordValid) return;

    setSubmitting(true);

    setTimeout(() => {
      setSubmitting(false);

      onLogin({
        email,
        name: "Ops Manager",
        role: "Branch Pekalongan",
      });
    }, 500);
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* ================= LEFT PANEL ================= */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">

        {/* Background Image */}
        <img
          src={loginImage}
          alt="Background"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/30"></div>

        {/* Center Content */}
        <div className="relative z-10 flex items-center justify-center h-full w-full px-16">
          <div className="max-w-xl text-center">
            <h1 className="text-5xl font-bold text-white leading-tight mb-6">
              Telkom KPI Dashboard
            </h1>

            <p className="text-lg text-gray-200 leading-8">
              Pantau Service Availability, Assurance Guarantee,
              TTR, SQM, dan performa jaringan secara real-time
              melalui dashboard terintegrasi.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-6 left-6 text-xs text-gray-300">
          Version 2.4.1
        </div>

        <div className="absolute bottom-6 right-6 text-xs text-gray-300">
          © Telkom Indonesia
        </div>
      </div>

      {/* ================= RIGHT PANEL ================= */}
      <div className="flex-1 flex items-center justify-center px-6 sm:px-10 py-12">
        <div className="w-full max-w-sm">

          {/* Logo */}
          <div className="mb-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center">
              <Radio size={18} className="text-white" />
            </div>

            <div>
              <p className="font-bold text-gray-900">
                Telkom Network
              </p>
              <p className="text-xs text-gray-500 tracking-wider">
                OPERATIONS
              </p>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900">
            Masuk ke akun Anda
          </h1>

          <p className="text-gray-500 mt-2 mb-8">
            Pantau KPI IOAN Anda dari sini.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label className="block mb-2 font-medium text-gray-800">
                Email
              </label>

              <input
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full border rounded-lg px-4 py-3 outline-none transition ${
                  emailError
                    ? "border-red-500 focus:border-red-500"
                    : "border-gray-300 focus:border-red-500"
                }`}
              />

              {emailError && (
                <p className="text-xs text-red-500 mt-1">
                  {emailError}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block mb-2 font-medium text-gray-800">
                Kata Sandi
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimal 8 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full border rounded-lg px-4 py-3 pr-10 outline-none transition ${
                    passwordError
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-300 focus:border-red-500"
                  }`}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>

              {passwordError && (
                <p className="text-xs text-red-500 mt-1">
                  {passwordError}
                </p>
              )}
            </div>

            {/* Remember */}
            <div className="flex justify-between items-center text-sm">
              <label className="flex items-center gap-2 text-gray-600">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Ingat Saya
              </label>

              <a
                href="#"
                className="text-red-600 hover:underline"
              >
                Lupa Kata Sandi?
              </a>
            </div>

            {/* Login */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition disabled:opacity-60"
            >
              {submitting ? "Memproses..." : "Login"}
            </button>

            <p className="text-center text-sm text-gray-500">
              Belum punya akun?{" "}
              <a
                href="#"
                className="text-red-600 font-semibold hover:underline"
              >
                Daftar
              </a>
            </p>

          </form>
        </div>
      </div>
    </div>
  );
}