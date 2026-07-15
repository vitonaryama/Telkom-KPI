import React, { useState } from "react";
import LoginPage from "./components/LoginPage.jsx";
import RegisterPage from "./components/RegisterPage.jsx";
import ForgotPasswordPage from "./components/ForgotPasswordPage.jsx";
import Sidebar from "./components/Sidebar.jsx";
import Navbar from "./components/Navbar.jsx";
import DashboardPage from "./components/DashboardPage.jsx";
import UploadExcelPage from "./components/UploadExcelPage.jsx";

/* =========================================================================
   ROOT APP
   ========================================================================= */

export default function App() {
  const [authed, setAuthed] = useState(false);
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  // FIX: state baru buat nentuin lagi di layar Login atau Register
  // selama belum authed.
  const [authView, setAuthView] = useState("login"); // "login" | "register" | "forgot"
  // Nampung email dari form Register, biar pas balik ke Login gak perlu ngetik ulang.
  const [prefillEmail, setPrefillEmail] = useState("");

  if (!authed) {
    if (authView === "register") {
      return (
        <RegisterPage
          // FIX: Daftar cuma "bikin akun", BUKAN langsung login.
          // Setelah sukses daftar, lempar balik ke Login dengan email udah keisi,
          // user tetap wajib masukin ulang email + password buat masuk.
          onRegister={(u) => {
            setPrefillEmail(u.email);
            setAuthView("login");
          }}
          onBackToLogin={() => setAuthView("login")}
        />
      );
    }
    if (authView === "forgot") {
      return <ForgotPasswordPage onBackToLogin={() => setAuthView("login")} />;
    }
    return (
      <LoginPage
        onLogin={(u) => { setUser(u); setAuthed(true); }}
        onGoToRegister={() => setAuthView("register")}
        onGoToForgotPassword={() => setAuthView("forgot")}
        initialEmail={prefillEmail}
      />
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50 font-sans">
      <Sidebar page={page} setPage={setPage} onLogout={() => { setAuthed(false); setAuthView("login"); }} />
      <div className="flex-1 flex flex-col min-h-screen">
        <Navbar
          title={page === "dashboard" ? "Dashboard KPI Branch Pekalongan" : "Upload Excel"}
          subtitle={page === "dashboard" ? new Date().toDateString() : null}
          user={user}
        />
        {page === "dashboard" ? <DashboardPage /> : <UploadExcelPage />}
      </div>
    </div>
  );
}
