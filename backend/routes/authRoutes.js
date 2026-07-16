/**
 * Auth Routes
 * POST /api/auth/register   — daftar akun baru
 * POST /api/auth/login      — login, dapat JWT
 * GET  /api/auth/me         — info user dari token
 * POST /api/auth/forgot-password  — request reset token
 * POST /api/auth/reset-password   — set password baru
 */

const express = require("express");
const router = express.Router();
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const db = require("../config/database");
const authMiddleware = require("../middleware/auth");

const JWT_SECRET = process.env.JWT_SECRET || "kpi-dashboard-secret-key-change-in-production";
const JWT_EXPIRES = process.env.JWT_EXPIRES || "24h";

// ─── Validation Schemas ───────────────────────────────────────────────────

const registerSchema = Joi.object({
  name: Joi.string().min(3).max(100).required().messages({
    "string.min": "Nama minimal 3 karakter",
    "string.max": "Nama maksimal 100 karakter",
    "any.required": "Nama wajib diisi",
  }),
  email: Joi.string().email().max(150).required().messages({
    "string.email": "Format email tidak valid",
    "any.required": "Email wajib diisi",
  }),
  password: Joi.string().min(8).max(128).required().messages({
    "string.min": "Password minimal 8 karakter",
    "any.required": "Password wajib diisi",
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Format email tidak valid",
    "any.required": "Email wajib diisi",
  }),
  password: Joi.string().min(8).required().messages({
    "string.min": "Password minimal 8 karakter",
    "any.required": "Password wajib diisi",
  }),
});

// ─── Helpers ─────────────────────────────────────────────────────────────

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

// ─── Routes ──────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 */
router.post("/register", async (req, res, next) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, error: error.details[0].message });
    }

    const { name, email, password } = value;

    // Cek email sudah terdaftar
    const existing = await db.query("SELECT id FROM users WHERE email = ?", [email.toLowerCase()]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, error: "Email sudah terdaftar" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Simpan user
    const result = await db.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email.toLowerCase(), hashedPassword, "Branch Pekalongan"]
    );

    const token = generateToken({ id: result.insertId, email: email.toLowerCase(), name, role: "Branch Pekalongan" });

    res.status(201).json({
      success: true,
      data: {
        id: result.insertId,
        email: email.toLowerCase(),
        name,
        role: "Branch Pekalongan",
        token,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/login
 */
router.post("/login", async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, error: error.details[0].message });
    }

    const { email, password } = value;

    // Cari user di database
    const users = await db.query(
      "SELECT id, name, email, password, role, is_active FROM users WHERE email = ?",
      [email.toLowerCase()]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, error: "Email atau password salah" });
    }

    const user = users[0];

    if (!user.is_active) {
      return res.status(403).json({ success: false, error: "Akun tidak aktif. Hubungi administrator." });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, error: "Email atau password salah" });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        token,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/me
 */
router.get("/me", authMiddleware, async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: { id: req.user.id, email: req.user.email, name: req.user.name, role: req.user.role },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/forgot-password
 * Membuat token reset, menyimpan ke DB.
 * Selalu response sukses untuk mencegah user enumeration.
 */
router.post("/forgot-password", async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, error: "Format email tidak valid" });
    }

    const users = await db.query("SELECT id FROM users WHERE email = ?", [email.toLowerCase()]);

    if (users.length > 0) {
      // Generate token reset (hex 32 byte = 64 karakter)
      const resetToken = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 jam

      await db.query(
        "UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?",
        [resetToken, expiresAt, email.toLowerCase()]
      );

      // Di production: kirim email dengan nodemailer
      // Untuk development: tampilkan token di console sebagai gantinya
      if (process.env.NODE_ENV === "development") {
        console.log(`\n[DEV] Reset token for ${email}: ${resetToken}`);
        console.log(`[DEV] Reset URL: http://localhost:5173/reset-password?token=${resetToken}\n`);
      }
    }

    // Selalu response sama (anti user enumeration)
    res.json({
      success: true,
      message: "Jika email terdaftar, link reset kata sandi telah dikirim.",
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/reset-password
 * Body: { token, newPassword }
 */
router.post("/reset-password", async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || typeof token !== "string") {
      return res.status(400).json({ success: false, error: "Token tidak valid" });
    }
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ success: false, error: "Password baru minimal 8 karakter" });
    }

    // Cari user dengan token yang masih valid
    const users = await db.query(
      "SELECT id, email FROM users WHERE reset_token = ? AND reset_token_expires > NOW()",
      [token]
    );

    if (users.length === 0) {
      return res.status(400).json({ success: false, error: "Token tidak valid atau sudah kadaluarsa" });
    }

    const user = users[0];
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await db.query(
      "UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?",
      [hashedPassword, user.id]
    );

    res.json({ success: true, message: "Password berhasil diperbarui. Silakan login." });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
