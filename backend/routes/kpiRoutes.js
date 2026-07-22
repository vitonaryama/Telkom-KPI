/**
 * Routes untuk KPI Queries
 * GET endpoints untuk dashboard frontend React
 */

const express = require("express");
const router = express.Router();
const kpiService = require("../services/kpiService");

/**
 * GET /api/kpi/summary
 * Ambil ringkasan 8 KPI untuk satu batch, optional filter by area
 *
 * Query params:
 *   - batchId (required): upload_batch.id
 *   - area (optional): filter by area (PEKALONGAN, PEMALANG, TEGAL, BREBES)
 *
 * Response:
 *   [
 *     { area, kpi_name, numerator, denominator, achieved_pct, target_pct, is_achieved },
 *     ...
 *   ]
 */
router.get("/summary", async (req, res, next) => {
  try {
    const { batchId, area } = req.query;
    if (!batchId) {
      return res.status(400).json({ error: "Query param 'batchId' wajib diisi" });
    }

    const summary = await kpiService.getKpiSummary(parseInt(batchId), area);
    res.json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/kpi/overview
 * Statistik overview: berapa KPI yang achieve, berapa total
 *
 * Query params:
 *   - batchId (required): upload_batch.id
 *
 * Response:
 *   { achieved_count, total_count, achievement_rate }
 */
router.get("/overview", async (req, res, next) => {
  try {
    const { batchId } = req.query;
    if (!batchId) {
      return res.status(400).json({ error: "Query param 'batchId' wajib diisi" });
    }

    const stats = await kpiService.getOverviewStats(parseInt(batchId));
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/kpi/trend
 * Trend satu KPI di area tertentu, bisa difilter by tahun/bulan
 *
 * Query params:
 *   - kpiName      (required): nama KPI
 *   - area         (required): area uppercase
 *   - granularity  (optional): "weekly" | "monthly" | "all" (default "all")
 *   - year         (optional): filter tahun (0 = semua)
 *   - month        (optional): filter bulan 1-12 (0 = semua)
 *   - limit        (optional): max rows (default 24)
 */
router.get("/trend", async (req, res, next) => {
  try {
    const { kpiName, area, granularity, year, month, limit } = req.query;
    if (!kpiName || !area) {
      return res.status(400).json({ error: "Query params 'kpiName' dan 'area' wajib diisi" });
    }
    const trend = await kpiService.getKpiTrend(
      kpiName, area,
      granularity || "all",
      parseInt(year)  || 0,
      parseInt(month) || 0,
      parseInt(limit) || 24
    );
    res.json({ success: true, data: trend });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/kpi/trend-all
 * Trend satu KPI untuk semua 4 area sekaligus
 *
 * Query params:
 *   - kpiName      (required): nama KPI
 *   - granularity  (optional): "weekly" | "monthly" | "all"
 *   - year         (optional): filter tahun
 *   - month        (optional): filter bulan
 *   - limit        (optional): max batch per area (default 24)
 */
router.get("/trend-all", async (req, res, next) => {
  try {
    const { kpiName, granularity, year, month, limit } = req.query;
    if (!kpiName) {
      return res.status(400).json({ error: "Query param 'kpiName' wajib diisi" });
    }
    const trend = await kpiService.getKpiTrendAllAreas(
      kpiName,
      granularity || "all",
      parseInt(year)  || 0,
      parseInt(month) || 0,
      parseInt(limit) || 24
    );
    res.json({ success: true, data: trend });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/kpi/periods
 * Ambil daftar tahun dan bulan yang tersedia di DB
 * Dipakai untuk populate dropdown filter di frontend
 */
router.get("/periods", async (req, res, next) => {
  try {
    const periods = await kpiService.getAvailablePeriods();
    res.json({ success: true, data: periods });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/kpi/compare
 * Bandingkan 2 batch: delta KPI per area
 *
 * Query params:
 *   - batchOld (required): upload_batch.id batch lama
 *   - batchNew (required): upload_batch.id batch baru
 *
 * Response:
 *   [
 *     {
 *       area, kpi_name,
 *       pct_lama, pct_baru, delta_pct,
 *       achieved_lama, achieved_baru
 *     },
 *     ...
 *   ]
 */
router.get("/compare", async (req, res, next) => {
  try {
    const { batchOld, batchNew } = req.query;
    if (!batchOld || !batchNew) {
      return res.status(400).json({ error: "Query params 'batchOld' dan 'batchNew' wajib diisi" });
    }

    const comparison = await kpiService.compareBatches(
      parseInt(batchOld),
      parseInt(batchNew)
    );
    res.json({ success: true, data: comparison });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/kpi/problems
 * Ambil daftar trouble_no bermasalah untuk satu KPI+area
 * (drill-down: tampilkan trouble_no saat KPI tidak tercapai)
 *
 * Query params:
 *   - batchId (required): upload_batch.id
 *   - kpiName (required): nama KPI
 *   - area (required): area
 *
 * Response:
 *   [
 *     { trouble_no, sto, ... (detail tergantung KPI) },
 *     ...
 *   ]
 */
router.get("/problems", async (req, res, next) => {
  try {
    const { batchId, kpiName, area, sto } = req.query;
    if (!batchId || !kpiName || !area) {
      return res.status(400).json({
        error: "Query params 'batchId', 'kpiName', 'area' wajib diisi",
      });
    }

    const problems = await kpiService.getProblemTickets(
      parseInt(batchId),
      kpiName,
      area,
      sto
    );
    res.json({ success: true, data: problems });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/kpi/summary-by-sto
 * Ambil ringkasan KPI per STO untuk satu batch dan area tertentu
 * (dipakai saat user expand area row di dashboard)
 *
 * Query params:
 *   - batchId (required): upload_batch.id
 *   - area (required): area (PEKALONGAN, PEMALANG, TEGAL, BREBES)
 */
router.get("/summary-by-sto", async (req, res, next) => {
  try {
    const { batchId, area } = req.query;
    if (!batchId || !area) {
      return res.status(400).json({ error: "Query params 'batchId' dan 'area' wajib diisi" });
    }
    const data = await kpiService.getKpiSummaryBySto(parseInt(batchId), area);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
