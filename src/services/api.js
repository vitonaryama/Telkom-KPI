const BASE_URL = "/api";

function getToken() {
  return localStorage.getItem("kpi_token");
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(options.body);
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    localStorage.removeItem("kpi_token");
    localStorage.removeItem("kpi_user");
    window.location.reload();
    throw new Error("Sesi berakhir, silakan login kembali");
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request gagal: ${res.status}`);
  }

  return data;
}

/* ─── Auth ─────────────────────────────────────────────────────────────── */

export function register(name, email, password) {
  return request("/auth/register", {
    method: "POST",
    body: { name, email, password },
  });
}

export function login(email, password) {
  return request("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export function getMe() {
  return request("/auth/me");
}

export function forgotPassword(email) {
  return request("/auth/forgot-password", {
    method: "POST",
    body: { email },
  });
}

export function resetPassword(token, newPassword) {
  return request("/auth/reset-password", {
    method: "POST",
    body: { token, newPassword },
  });
}

export function getKpiSummaryBySto(batchId, area) {
  const params = new URLSearchParams({ batchId, area });
  return request(`/kpi/summary-by-sto?${params}`);
}

/* ─── KPI ──────────────────────────────────────────────────────────────── */

export function getKpiSummary(batchId, area = null) {
  const params = new URLSearchParams({ batchId });
  if (area) params.set("area", area);
  return request(`/kpi/summary?${params}`);
}

export function getKpiOverview(batchId) {
  return request(`/kpi/overview?batchId=${batchId}`);
}

export function getKpiTrend(kpiName, area, granularity = "all", year = 0, month = 0, limit = 24) {
  const params = new URLSearchParams({ kpiName, area, granularity, year, month, limit });
  return request(`/kpi/trend?${params}`);
}

export function getKpiTrendAll(kpiName, granularity = "all", year = 0, month = 0, limit = 24) {
  const params = new URLSearchParams({ kpiName, granularity, year, month, limit });
  return request(`/kpi/trend-all?${params}`);
}

export function getAvailablePeriods() {
  return request("/kpi/periods");
}

export function compareBatches(batchOld, batchNew) {
  const params = new URLSearchParams({ batchOld, batchNew });
  return request(`/kpi/compare?${params}`);
}

export function getProblemTickets(batchId, kpiName, area, sto = null) {
  const params = new URLSearchParams({ batchId, kpiName, area });
  if (sto) params.set("sto", sto);
  return request(`/kpi/problems?${params}`);
}

/* ─── Batches ──────────────────────────────────────────────────────────── */

export function getBatches(limit = 20, offset = 0) {
  const params = new URLSearchParams({ limit, offset });
  return request(`/upload?${params}`);
}

export function getBatchById(id) {
  return request(`/upload/${id}`);
}

export function deleteBatch(id) {
  return request(`/upload/${id}`, {
    method: "DELETE",
  });
}

/* ─── Upload ───────────────────────────────────────────────────────────── */

export function validateFile(file, type) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", type);
  return request("/upload/validate", {
    method: "POST",
    body: formData,
  });
}

export function uploadCommit({ tiketCloseFile, sqmFile, periodeAwal, periodeAkhir, sourceFilename }) {
  const formData = new FormData();
  if (tiketCloseFile) formData.append("tiketCloseFile", tiketCloseFile);
  if (sqmFile) formData.append("sqmFile", sqmFile);
  formData.append("periodeAwal", periodeAwal);
  formData.append("periodeAkhir", periodeAkhir);
  if (sourceFilename) formData.append("sourceFilename", sourceFilename);
  return request("/upload/commit", {
    method: "POST",
    body: formData,
  });
}
