/**
 * KPI Service Layer
 * Business logic untuk perhitungan & agregasi KPI
 */

const db = require("../config/database");

/**
 * Ambil ringkasan KPI (semua 8 KPI x 4 area) untuk satu batch
 */
async function getKpiSummary(batchId, area = null) {
  let sql = `
    SELECT 
      area, kpi_name, numerator, denominator, achieved_pct, target_pct, is_achieved
    FROM kpi_summary_snapshot
    WHERE upload_batch_id = ?
  `;
  const values = [batchId];

  if (area) {
    sql += " AND area = ?";
    values.push(area);
  }

  sql += " ORDER BY area, kpi_name";
  return await db.query(sql, values);
}

/**
 * Ambil batch metadata (periode, jumlah row, status)
 */
async function getBatchInfo(batchId) {
  const sql = `
    SELECT 
      id, source_filename, periode_awal, periode_akhir,
      jumlah_hari_periode, row_count_ttr, row_count_sqm,
      status, uploaded_at
    FROM upload_batch
    WHERE id = ?
  `;
  const result = await db.query(sql, [batchId]);
  return result.length > 0 ? result[0] : null;
}

/**
 * Daftar semua batch (dengan pagination)
 */
async function listBatches(limit = 20, offset = 0) {
  const sql = `
    SELECT 
      id, source_filename, periode_awal, periode_akhir,
      row_count_ttr, row_count_sqm, status, uploaded_at
    FROM upload_batch
    ORDER BY uploaded_at DESC
    LIMIT ? OFFSET ?
  `;
  return await db.query(sql, [limit, offset]);
}

/**
 * Bandingkan 2 batch: delta KPI per area
 * @returns list of {area, kpi_name, pct_lama, pct_baru, delta}
 */
async function compareBatches(batchIdOld, batchIdNew) {
  const sql = `
    SELECT 
      n.area, n.kpi_name,
      o.achieved_pct AS pct_lama,
      n.achieved_pct AS pct_baru,
      (n.achieved_pct - o.achieved_pct) AS delta_pct,
      o.is_achieved AS achieved_lama,
      n.is_achieved AS achieved_baru
    FROM kpi_summary_snapshot n
    LEFT JOIN kpi_summary_snapshot o 
      ON o.area = n.area 
      AND o.kpi_name = n.kpi_name 
      AND o.upload_batch_id = ?
    WHERE n.upload_batch_id = ?
    ORDER BY n.area, n.kpi_name
  `;
  return await db.query(sql, [batchIdOld, batchIdNew]);
}

/**
 * Ambil daftar trouble_no bermasalah untuk satu KPI+area+batch
 * @param {number} batchId
 * @param {string} kpiName - nama KPI (mis. "TTR 12 Gold", "SQM Close")
 * @param {string} area
 * @returns list of {trouble_no, sto, detail...}
 */
async function getProblemTickets(batchId, kpiName, area) {
  const batchInfo = await getBatchInfo(batchId);
  if (!batchInfo) throw new Error(`Batch ${batchId} tidak ditemukan`);

  let sql = "";
  let values = [batchId, area];

  if (kpiName === "Assurance Guarantee") {
    sql = `
      SELECT t.trouble_no, t.sto, t.troubleno_parent, 
             t.trouble_opentime, t.trouble_closetime
      FROM tickets_ttr t
      WHERE t.upload_batch_id = ? 
        AND t.area = ? 
        AND t.is_gamas = 1
      ORDER BY t.trouble_closetime DESC
    `;
  } else if (kpiName === "Service Availability") {
    sql = `
      SELECT t.trouble_no, t.sto, t.trouble_opentime, t.trouble_closetime,
             t.downtime_hours, t.wsa_exclude, t.ket_exclude
      FROM tickets_ttr t
      WHERE t.upload_batch_id = ? 
        AND t.area = ?
        AND t.wsa_exclude = 0
      ORDER BY t.downtime_hours DESC
      LIMIT 50
    `;
  } else if (kpiName.startsWith("TTR")) {
    const comply_map = {
      "TTR 3 Diamond": "comply3",
      "TTR 6 Platinum": "comply6",
      "TTR 12 Gold": "comply12",
      "TTR 24 Non HVC": "comply24",
      "TTR 3 Manja": null,
    };
    const comply_col = comply_map[kpiName];
    if (!comply_col) throw new Error(`KPI ${kpiName} tidak dikenali`);

    const where = kpiName === "TTR 3 Manja"
      ? "t.is_kpi_ttr = 1 AND t.comply3_manja = 0"
      : `t.is_kpi_ttr = 1 AND t.${comply_col} = 0 AND t.flag_hvc = ?`;

    sql = `
      SELECT t.trouble_no, t.sto, t.trouble_opentime, t.trouble_closetime
      FROM tickets_ttr t
      WHERE t.upload_batch_id = ? 
        AND t.area = ?
        AND ${where}
      ORDER BY t.trouble_closetime DESC
      LIMIT 50
    `;

    if (kpiName !== "TTR 3 Manja") {
      const hvc_map = {
        "TTR 3 Diamond": "HVC_DIAMOND",
        "TTR 6 Platinum": "HVC_PLATINUM",
        "TTR 12 Gold": "HVC_GOLD",
        "TTR 24 Non HVC": "REGULER",
      };
      values.push(hvc_map[kpiName]);
    }
  } else if (kpiName === "SQM Close") {
    sql = `
      SELECT s.trouble_no, s.sto, s.status, s.mapping
      FROM tickets_sqm s
      WHERE s.upload_batch_id = ? 
        AND s.area = ?
        AND NOT (s.mapping = 'Individual' AND s.is_assignment = 1 AND s.is_hasil_ukur = 1)
        AND s.mapping NOT IN ('Gamas', 'Online', 'Di-Sisi-Plg')
      ORDER BY s.trouble_no DESC
      LIMIT 50
    `;
  } else {
    throw new Error(`KPI ${kpiName} tidak dikenali`);
  }

  return await db.query(sql, values);
}

/**
 * Ambil statistik overview semua KPI untuk satu batch
 * @returns {achieved_count, total_count, achievement_rate}
 */
async function getOverviewStats(batchId) {
  const sql = `
    SELECT 
      SUM(is_achieved) AS achieved_count,
      COUNT(*) AS total_count,
      ROUND(100.0 * SUM(is_achieved) / COUNT(*), 2) AS achievement_rate
    FROM kpi_summary_snapshot
    WHERE upload_batch_id = ?
  `;
  const result = await db.query(sql, [batchId]);
  return result[0] || { achieved_count: 0, total_count: 0, achievement_rate: 0 };
}

/**
 * Trend KPI: lihat perubahan satu KPI di 5 batch terakhir
 */
async function getKpiTrend(kpiName, area, limit = 5) {
  const sql = `
    SELECT 
      b.id, b.periode_awal, b.periode_akhir, ks.achieved_pct, ks.target_pct
    FROM kpi_summary_snapshot ks
    JOIN upload_batch b ON b.id = ks.upload_batch_id
    WHERE ks.kpi_name = ? AND ks.area = ?
    ORDER BY b.periode_akhir DESC
    LIMIT ?
  `;
  return await db.query(sql, [kpiName, area, limit]);
}

module.exports = {
  getKpiSummary,
  getBatchInfo,
  listBatches,
  compareBatches,
  getProblemTickets,
  getOverviewStats,
  getKpiTrend,
};
