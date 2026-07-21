/**
 * ============================================================================
 * BACKEND SERVER — KPI DASHBOARD WITEL PEKALONGAN
 * Tech Stack: Node.js + Express + MySQL
 * ============================================================================
 *
 * Fitur:
 *   - GET /api/kpi/summary          → Ambil ringkasan 8 KPI per batch/area
 *   - GET /api/kpi/overview         → Statistik overview KPI
 *   - GET /api/kpi/trend            → Trend satu KPI (5 batch terakhir)
 *   - GET /api/kpi/compare          → Bandingkan 2 batch (delta)
 *   - GET /api/kpi/problems         → Drill-down trouble_no bermasalah
 *
 *   - POST /api/upload/validate     → Validasi file CSV tanpa commit
 *   - POST /api/upload/commit       → Upload + load + hitung KPI summary
 *   - GET /api/batches              → Daftar semua batch
 *   - GET /api/batches/:id          → Detail metadata batch
 *
 * Environment Variables (lihat .env.example):
 *   DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
 *   PORT, CORS_ORIGIN, MAX_FILE_SIZE, UPLOAD_DIR
 *
 * Cara menjalankan:
 *   1. npm install
 *   2. cp .env.example .env (sesuaikan konfigurasi DB)
 *   3. npm run dev      (development dengan nodemon)
 *   4. npm start        (production)
 *
 * Struktur project:
 *   server.js
 *   package.json
 *   .env, .env.example
 *   config/
 *     ├─ database.js          → pool connection, query helpers
 *   services/
 *     ├─ kpiService.js        → business logic KPI queries
 *     ├─ uploadService.js     → handle file upload & ETL logic
 *   routes/
 *     ├─ kpiRoutes.js         → GET endpoints KPI
 *     ├─ uploadRoutes.js      → POST/GET endpoints upload
 *   middleware/
 *     ├─ errorHandler.js      → error handling middleware
 *
 * ============================================================================
 */

require("dotenv").config();
require("express-async-errors");

const express = require("express");
const cors = require("cors");
const path = require("path");

const db = require("./config/database");
const authMiddleware = require("./middleware/auth");
const kpiRoutes = require("./routes/kpiRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================================================
// MIDDLEWARE
// ============================================================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : "http://localhost:5173",
  credentials: true,
}));

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} → ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// ============================================================================
// ROUTES
// ============================================================================

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/kpi", authMiddleware, kpiRoutes);
app.use("/api/upload", authMiddleware, uploadRoutes);
app.use("/api/auth", authRoutes);

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  console.error(err.stack);

  if (err.name === "ValidationError") {
    return res.status(400).json({ error: err.message });
  }

  if (err.message.includes("Kolom wajib hilang")) {
    return res.status(400).json({ error: err.message });
  }

  if (err.message.includes("File CSV kosong")) {
    return res.status(400).json({ error: err.message });
  }

  if (err.message.includes("Tidak ada baris yang cocok")) {
    return res.status(400).json({ error: err.message });
  }

  if (err.message.includes("Bind parameters must not contain undefined")) {
    return res.status(400).json({ error: "Format data tidak valid — ada kolom wajib yang kosong atau bernilai null" });
  }

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: `File terlalu besar. Maksimum ${Math.round((parseInt(process.env.MAX_FILE_SIZE)||26214400)/1024/1024)} MB` });
  }

  if (err.message.includes("tidak ditemukan")) {
    return res.status(404).json({ error: err.message });
  }

  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : "Silakan hubungi administrator",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route tidak ditemukan" });
});

// ============================================================================
// SERVER START
// ============================================================================

async function startServer() {
  try {
    // Test database connection
    const dbConnected = await db.testConnection();
    if (!dbConnected) {
      console.error("✗ Tidak bisa terhubung ke database. Periksa konfigurasi di .env");
      process.exit(1);
    }

    // Start server
    app.listen(PORT, () => {
      console.log("\n" + "=".repeat(70));
      console.log("KPI DASHBOARD BACKEND — WITEL PEKALONGAN");
      console.log("=".repeat(70));
      console.log(`✓ Server running on http://localhost:${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`✓ CORS origin: ${process.env.CORS_ORIGIN || "any"}`);
      console.log("\nAvailable endpoints:");
      console.log("  GET  /health                          → Health check");
      console.log("  GET  /api/kpi/summary?batchId=X      → Ringkasan KPI");
      console.log("  GET  /api/kpi/overview?batchId=X     → Statistik overview");
      console.log("  GET  /api/kpi/trend?kpiName=X&area=Y → Trend KPI");
      console.log("  GET  /api/kpi/compare?batchOld=X&batchNew=Y → Bandingkan batch");
      console.log("  GET  /api/kpi/problems?batchId=X&kpiName=Y&area=Z → Drill-down");
      console.log("  GET  /api/kpi/summary-by-sto?batchId=X&area=Y → STO breakdown");
      console.log("  POST /api/upload/validate             → Validasi file");
      console.log("  POST /api/upload/commit               → Upload & commit");
      console.log("  GET  /api/upload                      → Daftar batch");
      console.log("  GET  /api/upload/:id                  → Detail batch");
      console.log("  POST /api/auth/register               → Registrasi user");
      console.log("  POST /api/auth/login                  → Login");
      console.log("  GET  /api/auth/me                     → Info user dari token");
      console.log("  POST /api/auth/forgot-password        → Request reset");
      console.log("  POST /api/auth/reset-password         → Set password baru");
      console.log("=".repeat(70) + "\n");
    });
  } catch (error) {
    console.error("✗ Gagal menjalankan server:", error.message);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("\n✓ SIGTERM diterima, menutup server...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("\n✓ SIGINT diterima, menutup server...");
  process.exit(0);
});
