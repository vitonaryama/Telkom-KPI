const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "kpi-dashboard-secret-key-change-in-production";

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

module.exports = authMiddleware;
