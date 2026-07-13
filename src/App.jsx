import React, { useState } from "react";
import LoginPage from "./components/LoginPage.jsx";
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

  if (!authed) {
    return <LoginPage onLogin={(u) => { setUser(u); setAuthed(true); }} />;
  }

  return (
    <div className="min-h-screen flex bg-gray-50 font-sans">
      <Sidebar page={page} setPage={setPage} onLogout={() => setAuthed(false)} />
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
