/**
 * Routes untuk Upload & Batch Management
 * POST/GET endpoints untuk file upload, validasi, dan batch queries
 */

const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const uploadService = require("../services/uploadService");
const db = require("../config/database");
const { requireRole } = require("../middleware/auth");

// Konfigurasi multer
const uploadDir = process.env.UPLOAD_DIR || "./uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${timestamp}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== ".csv") {
      return cb(new Error("Hanya file CSV yang diizinkan"));
    }
    cb(null, true);
  },
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 26214400,
  },
});

/**
 * POST /api/upload/validate
 * Validasi file CSV tanpa menulis ke database
 * Berguna untuk preview sebelum commit
 *
 * Form data:
 *   - file: file CSV
 *   - type: tipe file ("tiket_close" atau "sqm")
 *
 * Response:
 *   { success, valid_rows, total_rows, message }
 */
router.post("/validate", requireRole("admin"), upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "File tidak diunggah" });
    }

    const fileType = req.body.type?.toLowerCase();
    if (!fileType) {
      return res.status(400).json({ error: "Form param 'type' harus diisi (tiket_close atau sqm)" });
    }

    const filePath = req.file.path;
    let validation;

    if (fileType === "tiket_close") {
      validation = await uploadService.validateTicketCloseFile(filePath);
    } else if (fileType === "sqm") {
      validation = await uploadService.validateSqmFile(filePath);
    } else {
      return res.status(400).json({ error: "Type harus 'tiket_close' atau 'sqm'" });
    }

    fs.unlink(filePath, () => {}); // Hapus file temporary

    res.json({
      success: true,
      message: `Validasi berhasil: ${validation.valid_rows} dari ${validation.total_rows} baris cocok dengan 19 STO target`,
      data: validation,
    });
  } catch (error) {
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    next(error);
  }
});

/**
 * POST /api/upload/commit
 * Upload file + create batch + load data + hitung KPI
 *
 * Form data:
 *   - tiketCloseFile (optional): file CSV TIKET CLOSE
 *   - sqmFile (optional): file CSV SQM
 *   - periodeAwal: YYYY-MM-DD
 *   - periodeAkhir: YYYY-MM-DD
 *   - sourceFilename: label nama file untuk pencatatan
 *
 * Response:
 *   { success, batchId, message, summary: [ { area, kpi_name, achieved_pct, ... }, ... ] }
 */
router.post("/commit", requireRole("admin"), upload.fields([
  { name: "tiketCloseFile", maxCount: 1 },
  { name: "sqmFile", maxCount: 1 },
]), async (req, res, next) => {
  try {
    const { periodeAwal, periodeAkhir, sourceFilename } = req.body;

    if (!periodeAwal || !periodeAkhir) {
      return res.status(400).json({ error: "Form params 'periodeAwal' dan 'periodeAkhir' wajib diisi (YYYY-MM-DD)" });
    }

    if (!req.files?.tiketCloseFile && !req.files?.sqmFile) {
      return res.status(400).json({ error: "Minimal salah satu file (tiketCloseFile atau sqmFile) harus diunggah" });
    }

    const dateStart = new Date(periodeAwal);
    const dateEnd = new Date(periodeAkhir);
    if (isNaN(dateStart) || isNaN(dateEnd)) {
      return res.status(400).json({ error: "Format tanggal tidak valid (harus YYYY-MM-DD)" });
    }
    if (dateStart > dateEnd) {
      return res.status(400).json({ error: "periodeAwal harus lebih kecil atau sama dengan periodeAkhir" });
    }

    const jumlahHari = Math.floor((dateEnd - dateStart) / (1000 * 60 * 60 * 24)) + 1;

    // Create upload_batch
    const batchResult = await db.query(`
      INSERT INTO upload_batch
        (source_filename, file_type, periode_awal, periode_akhir, jumlah_hari_periode, period_type, row_count_ttr, row_count_sqm, status)
      VALUES (?, 'GABUNGAN', ?, ?, ?, 'daily', 0, 0, 'PROCESSING')
    `, [sourceFilename || "unknown.csv", periodeAwal, periodeAkhir, jumlahHari]);

    const batchId = batchResult.insertId;

    try {
      let ttrRowCount = 0;
      let sqmRowCount = 0;

      // Load TIKET CLOSE
      if (req.files?.tiketCloseFile?.[0]) {
        const ttrFile = req.files.tiketCloseFile[0];
        ttrRowCount = await uploadService.loadTicketCloseData(ttrFile.path, batchId);
        fs.unlink(ttrFile.path, () => {});
      }

      // Load SQM
      if (req.files?.sqmFile?.[0]) {
        const sqmFile = req.files.sqmFile[0];
        sqmRowCount = await uploadService.loadSqmData(sqmFile.path, batchId);
        fs.unlink(sqmFile.path, () => {});
      }

      // Hitung KPI summary
      const summary = await uploadService.computeKpiSummary(batchId);

      // Mark batch ready with row counts
      await db.query(
        "UPDATE upload_batch SET status='READY', row_count_ttr=?, row_count_sqm=? WHERE id=?",
        [ttrRowCount, sqmRowCount, batchId]
      );

      res.json({
        success: true,
        batchId,
        message: `Upload berhasil. Batch #${batchId} siap digunakan dashboard.`,
        data: {
          ttrRowCount,
          sqmRowCount,
          periode: { awal: periodeAwal, akhir: periodeAkhir, jumlahHari },
          summary,
        },
      });
    } catch (error) {
      // Rollback: delete data and mark batch FAILED
      try {
        await db.query("DELETE FROM tickets_ttr WHERE upload_batch_id=?", [batchId]);
        await db.query("DELETE FROM tickets_sqm WHERE upload_batch_id=?", [batchId]);
        await db.query("DELETE FROM kpi_summary_snapshot WHERE upload_batch_id=?", [batchId]);
        await db.query("UPDATE upload_batch SET status='FAILED' WHERE id=?", [batchId]);
      } catch (_) {
        // ignore rollback errors
      }
      throw error;
    }
  } catch (error) {
    // Cleanup temp files
    if (req.files) {
      for (const fileArray of Object.values(req.files)) {
        for (const file of fileArray) {
          fs.unlink(file.path, () => {});
        }
      }
    }
    next(error);
  }
});

/**
 * GET /api/batches
 * Daftar semua batch yang sudah diupload (dengan pagination)
 *
 * Query params:
 *   - limit (optional): default 20
 *   - offset (optional): default 0
 *
 * Response:
 *   [
 *     { id, source_filename, periode_awal, periode_akhir, row_count_ttr, row_count_sqm, status, uploaded_at },
 *     ...
 *   ]
 */
router.get("/", async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const batches = await db.query(`
      SELECT 
        id, source_filename, periode_awal, periode_akhir,
        row_count_ttr, row_count_sqm, status, uploaded_at
      FROM upload_batch
      ORDER BY uploaded_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    res.json({ success: true, data: batches });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/batches/:id
 * Hapus batch beserta data tiket dan summary yang terkait
 */
router.delete("/:id", requireRole("admin"), async (req, res, next) => {
  try {
    const batchId = parseInt(req.params.id);
    if (isNaN(batchId)) {
      return res.status(400).json({ error: "ID batch tidak valid" });
    }

    await uploadService.deleteBatch(batchId);
    res.json({ success: true, message: `Batch ${batchId} berhasil dihapus` });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/batches/:id
 * Ambil detail metadata satu batch
 *
 * Response:
 *   { id, source_filename, periode_awal, periode_akhir, ... }
 */
router.get("/:id", async (req, res, next) => {
  try {
    const batchId = parseInt(req.params.id);
    if (isNaN(batchId)) {
      return res.status(404).json({ error: "Batch tidak ditemukan" });
    }
    const batch = await db.query(
      "SELECT * FROM upload_batch WHERE id=?",
      [batchId]
    );

    if (batch.length === 0) {
      return res.status(404).json({ error: `Batch ${batchId} tidak ditemukan` });
    }

    res.json({ success: true, data: batch[0] });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
