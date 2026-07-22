const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "kpi-dashboard-secret-key-change-in-production";

/**
 * Middleware: verifikasi JWT dan isi req.user
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "Token tidak diberikan" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, error: "Token sudah kedaluwarsa" });
    }
    return res.status(401).json({ success: false, error: "Token tidak valid" });
  }
}

/**
 * Middleware: pastikan user sudah login DAN memiliki salah satu role yang diizinkan.
 * Gunakan setelah authMiddleware, atau sebagai middleware chain mandiri.
 *
 * Contoh pemakaian:
 *   router.post("/commit", authMiddleware, requireRole("admin"), handler);
 *
 * @param  {...string} roles - role yang diizinkan, misal "admin"
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Token tidak diberikan" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: "Akses ditolak. Fitur ini hanya tersedia untuk Administrator.",
      });
    }
    next();
  };
}

module.exports = { authMiddleware, requireRole };
