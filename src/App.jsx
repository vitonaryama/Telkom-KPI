import { useState, useEffect } from "react";
import LoginPage from "./components/LoginPage.jsx";
import RegisterPage from "./components/RegisterPage.jsx";
import ForgotPasswordPage from "./components/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./components/ResetPasswordPage.jsx";
import Sidebar from "./components/Sidebar.jsx";
import Navbar from "./components/Navbar.jsx";
import DashboardPage from "./components/DashboardPage.jsx";
import UploadExcelPage from "./components/UploadExcelPage.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";

export default function App() {
  const [authed, setAuthed] = useState(false);
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [authView, setAuthView] = useState("login");
  const [prefillEmail, setPrefillEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [notifications, setNotifications] = useState([]);

  const addNotification = (msg, type = "success") => {
    const id = Date.now();
    const time = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    setNotifications((prev) => [{ id, msg, type, time }, ...prev].slice(0, 20));
  };

  useEffect(() => {
    // Cek query param ?token= untuk reset password flow
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      setResetToken(token);
      setAuthView("reset");
      // Bersihkan URL tanpa reload
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const savedUser = localStorage.getItem("kpi_user");
    const savedToken = localStorage.getItem("kpi_token");
    if (savedUser && savedToken) {
      // Validate token with backend before restoring auth state
      import("./services/api.js").then(({ getMe }) => {
        getMe()
          .then((result) => {
            if (result.success && result.data) {
              // Token valid, restore auth state
              setUser(result.data);
              setAuthed(true);
            } else {
              // Token invalid, clear storage
              localStorage.removeItem("kpi_user");
              localStorage.removeItem("kpi_token");
            }
          })
          .catch(() => {
            // Token expired or network error, clear storage
            localStorage.removeItem("kpi_user");
            localStorage.removeItem("kpi_token");
          });
      });
    }
  }, []);

  const handleLogin = (data) => {
    if (data.token) {
      localStorage.setItem("kpi_token", data.token);
    }
    const userData = { email: data.email, name: data.name, role: data.role };
    localStorage.setItem("kpi_user", JSON.stringify(userData));
    setUser(userData);
    setAuthed(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("kpi_user");
    localStorage.removeItem("kpi_token");
    setUser(null);
    setAuthed(false);
    setAuthView("login");
  };

  if (!authed) {
    if (authView === "register") {
      return (
        <RegisterPage
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
    if (authView === "reset") {
      return (
        <ResetPasswordPage
          token={resetToken}
          onBackToLogin={() => setAuthView("login")}
        />
      );
    }
    return (
      <LoginPage
        onLogin={handleLogin}
        onGoToRegister={() => setAuthView("register")}
        onGoToForgotPassword={() => setAuthView("forgot")}
        initialEmail={prefillEmail}
      />
    );
  }

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen flex bg-gray-50 font-sans">
      <Sidebar page={page} setPage={setPage} onLogout={handleLogout} />
      <div className="flex-1 flex flex-col min-h-screen">
        <Navbar
          title={page === "dashboard" ? "Dashboard KPI Branch Pekalongan" : "Upload Excel"}
          subtitle={page === "dashboard" ? today : null}
          user={user}
          notifications={notifications}
        />
        <ErrorBoundary>
          {page === "dashboard"
            ? <DashboardPage />
            : <UploadExcelPage onUploadSuccess={(msg) => addNotification(msg)} onUploadError={(msg) => addNotification(msg, "error")} />
          }
        </ErrorBoundary>
      </div>
    </div>
  );
}
