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
      "TTR 3 Diamond": { col: "comply3", hvc: "HVC_DIAMOND" },
      "TTR 6 Platinum": { col: "comply6", hvc: "HVC_PLATINUM" },
      "TTR 12 Gold": { col: "comply12", hvc: "HVC_GOLD" },
      "TTR 24 Non HVC": { col: "comply24", hvc: "REGULER" },
      "TTR 3 Manja": { col: null, hvc: null },
    };

    const complyInfo = comply_map[kpiName];
    if (!complyInfo) throw new Error(`KPI ${kpiName} tidak dikenali`);

    if (kpiName === "TTR 3 Manja") {
      sql = `
        SELECT t.trouble_no, t.sto, t.trouble_opentime, t.trouble_closetime
        FROM tickets_ttr t
        WHERE t.upload_batch_id = ? 
          AND t.area = ?
          AND t.is_kpi_ttr = 1 AND t.comply3_manja = 0
        ORDER BY t.trouble_closetime DESC
        LIMIT 50
      `;
    } else {
      sql = `
        SELECT t.trouble_no, t.sto, t.trouble_opentime, t.trouble_closetime
        FROM tickets_ttr t
        WHERE t.upload_batch_id = ? 
          AND t.area = ?
          AND t.is_kpi_ttr = 1 AND t.${complyInfo.col} = 0 AND t.flag_hvc = ?
        ORDER BY t.trouble_closetime DESC
        LIMIT 50
      `;
      values.push(complyInfo.hvc);
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

/**
 * Ambil ringkasan KPI per STO untuk satu batch dan area
 * Digunakan untuk drill-down di tabel dashboard (expand area row)
 */
async function getKpiSummaryBySto(batchId, area) {
  const batchInfo = await db.query(
    "SELECT jumlah_hari_periode FROM upload_batch WHERE id = ?",
    [batchId]
  );
  if (batchInfo.length === 0) throw new Error(`Batch ${batchId} tidak ditemukan`);
  const jam_periode = batchInfo[0].jumlah_hari_periode * 24;

  // TTR + Assurance per STO
  const ttrRows = await db.query(`
    SELECT
      sto,
      COUNT(*) AS total,
      SUM(is_gamas) AS n_gamas,
      SUM(CASE WHEN is_kpi_ttr=1 THEN comply3 ELSE 0 END) AS c3,
      SUM(CASE WHEN is_kpi_ttr=1 THEN comply6 ELSE 0 END) AS c6,
      SUM(CASE WHEN is_kpi_ttr=1 THEN comply12 ELSE 0 END) AS c12,
      SUM(CASE WHEN is_kpi_ttr=1 THEN comply24 ELSE 0 END) AS c24,
      SUM(CASE WHEN is_kpi_ttr=1 THEN comply3_manja ELSE 0 END) AS c3m,
      SUM(CASE WHEN is_kpi_ttr=1 THEN 1 ELSE 0 END) AS kpi_total,
      SUM(downtime_hours) AS total_downtime,
      SUM(CASE WHEN wsa_exclude=0 THEN downtime_hours ELSE 0 END) AS downtime_excl
    FROM tickets_ttr
    WHERE upload_batch_id = ? AND area = ?
    GROUP BY sto
    ORDER BY sto
  `, [batchId, area]);

  // SQM per STO
  const sqmRows = await db.query(`
    SELECT
      sto,
      SUM(CASE WHEN mapping='Individual' AND is_assignment=1 AND is_hasil_ukur=1 THEN 1 ELSE 0 END) AS num,
      SUM(CASE WHEN mapping NOT IN ('Gamas','Online','Di-Sisi-Plg') OR mapping IS NULL THEN 1 ELSE 0 END) AS denom
    FROM tickets_sqm
    WHERE upload_batch_id = ? AND area = ?
    GROUP BY sto
    ORDER BY sto
  `, [batchId, area]);

  const sqmMap = {};
  for (const r of sqmRows) sqmMap[r.sto] = r;

  const targets = {};
  const targetRows = await db.query("SELECT kpi_name, target_pct FROM kpi_target");
  for (const r of targetRows) targets[r.kpi_name] = r.target_pct;

  const result = ttrRows.map((r) => {
    const sqm = sqmMap[r.sto] || { num: 0, denom: 0 };
    const availability = jam_periode > 0
      ? Math.min(100 * (1 - (r.downtime_excl || 0) / jam_periode), 100)
      : 100;
    const assurance = r.total > 0 ? 100 * (1 - (r.n_gamas || 0) / r.total) : 100;
    const kpiTotal = r.kpi_total || 0;
    const ttr3 = kpiTotal > 0 ? 100 * (r.c3 || 0) / kpiTotal : 0;
    const ttr6Jam = kpiTotal > 0 ? 100 * (r.c6 || 0) / kpiTotal : 0;
    const ttr12Jam = kpiTotal > 0 ? 100 * (r.c12 || 0) / kpiTotal : 0;
    const ttr24Jam = kpiTotal > 0 ? 100 * (r.c24 || 0) / kpiTotal : 0;
    const ttr3JamM = kpiTotal > 0 ? 100 * (r.c3m || 0) / kpiTotal : 0;
    const sqmPct = sqm.denom > 0 ? 100 * sqm.num / sqm.denom : 0;

    return {
      nama: `STO ${r.sto}`,
      sto: r.sto,
      metrics: {
        availability: parseFloat(availability.toFixed(2)),
        assurance: parseFloat(assurance.toFixed(2)),
        ttr3: parseFloat(ttr3.toFixed(2)),
        ttr6Jam: parseFloat(ttr6Jam.toFixed(2)),
        ttr12Jam: parseFloat(ttr12Jam.toFixed(2)),
        ttr24Jam: parseFloat(ttr24Jam.toFixed(2)),
        ttr3JamM: parseFloat(ttr3JamM.toFixed(2)),
        sqm: parseFloat(sqmPct.toFixed(2)),
      },
      trend: {},
    };
  });

  return result;
}

module.exports = {
  getKpiSummary,
  getBatchInfo,
  listBatches,
  compareBatches,
  getProblemTickets,
  getOverviewStats,
  getKpiTrend,
  getKpiSummaryBySto,
};
