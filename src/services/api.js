/* =========================================================================
   API SERVICE LAYER
   Ganti BASE_URL sesuai alamat backend Spring Boot kamu.
   Sesuaikan juga nama endpoint & bentuk response-nya kalau beda dari contoh ini.
   ========================================================================= */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${body || res.statusText}`);
  }

  // Response 204 (No Content) gak punya body buat di-parse
  if (res.status === 204) return null;
  return res.json();
}

/* --- KPI data ------------------------------------------------------- */

// GET /api/kpi/witel?year=2024&month=Januari
// Contoh response yang diharapkan sama bentuknya kayak WITEL_DATA di mockData.js
export function fetchWitelData({ year, month } = {}) {
  const params = new URLSearchParams();
  if (year) params.set("year", year);
  if (month) params.set("month", month);
  return request(`/kpi/witel?${params.toString()}`);
}

// GET /api/kpi/trend?metric=ttr3
export function fetchTrendData(metric = "ttr3") {
  return request(`/kpi/trend?metric=${metric}`);
}

/* --- Upload Excel ---------------------------------------------------- */

// POST /api/kpi/upload (multipart/form-data)
export async function uploadKpiExcel(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/kpi/upload`, {
    method: "POST",
    body: formData, // JANGAN set Content-Type manual, browser yang atur boundary-nya
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Upload gagal (${res.status}): ${body || res.statusText}`);
  }
  return res.json(); // { rows: number, status: "success" | "error", message?: string }
}

// GET /api/uploads/recent
export function fetchRecentUploads() {
  return request(`/uploads/recent`);
}

/* --- Auth (kalau backend sudah ada endpoint login JWT) --------------- */

// POST /api/auth/login  body: { email, password }
export function login(email, password) {
  return request(`/auth/login`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}
