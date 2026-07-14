/**
 * Upload Service Layer
 * Handle file upload, parsing, validasi, dan trigger ETL
 */

const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const db = require("../config/database");

const REQUIRED_TIKET_CLOSE_COLS = [
  "TROUBLE_NO", "STO", "FLAG_HVC", "IS_KPI_TTR", "WSA_EXCLUDE", "KET_EXCLUDE",
  "IS_GAMAS", "TROUBLENO_PARENT", "TROUBLE_OPENTIME", "TROUBLE_CLOSETIME",
  "HOUR_ADJ", "COMPLY3", "COMPLY6", "COMPLY12", "COMPLY24", "COMPLY3_MANJA",
];

const REQUIRED_SQM_COLS = [
  "TROUBLE_NO", "STO", "STATUS", "MAPPING", "IS_ASSIGNMENT", "IS_HASIL_UKUR",
];

const STO_AREA_MAP = {
  "ADW": "TEGAL", "BDY": "PEKALONGAN", "BKA": "BREBES", "BLU": "TEGAL",
  "BRB": "BREBES", "BMU": "BREBES", "BTG": "PEKALONGAN", "CMA": "PEMALANG",
  "KDW": "PEMALANG", "KJE": "PEMALANG", "KTM": "BREBES", "MGN": "TEGAL",
  "PKL": "PEKALONGAN", "PML": "PEMALANG", "RDD": "PEMALANG", "SBA": "PEKALONGAN",
  "SLW": "TEGAL", "TEG": "TEGAL", "TTL": "BREBES",
};
const TARGET_STO = new Set(Object.keys(STO_AREA_MAP));
const AREAS = ["PEKALONGAN", "PEMALANG", "TEGAL", "BREBES"];

/**
 * Parse CSV file, return array of records
 */
function parseCsv(filePath) {
  return new Promise((resolve, reject) => {
    const records = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        const normalized = {};
        for (const [k, v] of Object.entries(row)) {
          normalized[k.trim().toUpperCase()] = v;
        }
        records.push(normalized);
      })
      .on("end", () => resolve(records))
      .on("error", (err) => reject(err));
  });
}

/**
 * Validasi file TIKET_CLOSE: cek kolom, STO, tipe data
 */
async function validateTicketCloseFile(filePath) {
  const records = await parseCsv(filePath);
  if (records.length === 0) throw new Error("File CSV kosong");

  // Check kolom
  const headers = Object.keys(records[0]);
  const missing = REQUIRED_TIKET_CLOSE_COLS.filter(c => !headers.includes(c));
  if (missing.length > 0) {
    throw new Error(`Kolom wajib hilang: ${missing.join(", ")}`);
  }

  // Check STO
  const sto_values = new Set();
  let valid_sto_count = 0;
  for (const rec of records) {
    sto_values.add(rec.STO);
    if (TARGET_STO.has(rec.STO)) valid_sto_count++;
  }
  if (valid_sto_count === 0) {
    throw new Error(`Tidak ada baris yang cocok dengan 19 STO target. STO yang ditemukan: ${Array.from(sto_values).join(", ")}`);
  }

  return { valid_rows: valid_sto_count, total_rows: records.length };
}

/**
 * Validasi file SQM
 */
async function validateSqmFile(filePath) {
  const records = await parseCsv(filePath);
  if (records.length === 0) throw new Error("File CSV kosong");

  const headers = Object.keys(records[0]);
  const missing = REQUIRED_SQM_COLS.filter(c => !headers.includes(c));
  if (missing.length > 0) {
    throw new Error(`Kolom wajib hilang: ${missing.join(", ")}`);
  }

  let valid_sto_count = 0;
  for (const rec of records) {
    if (TARGET_STO.has(rec.STO)) valid_sto_count++;
  }

  return { valid_rows: valid_sto_count, total_rows: records.length };
}

/**
 * Transform & load TIKET_CLOSE data ke database
 * Panggil ini setelah validasi dan create upload_batch
 */
async function loadTicketCloseData(filePath, batchId) {
  const records = await parseCsv(filePath);
  let processed = 0;

  await db.transaction(async (connection) => {
    for (const rec of records) {
      if (!TARGET_STO.has(rec.STO)) continue;

      const area = STO_AREA_MAP[rec.STO];
      const hour_adj = parseFloat(rec.HOUR_ADJ) || 0;
      let downtime_hours = 0;

      try {
        const open_time = new Date(rec.TROUBLE_OPENTIME);
        const close_time = new Date(rec.TROUBLE_CLOSETIME);
        if (!isNaN(open_time) && !isNaN(close_time)) {
          const duration_ms = close_time - open_time;
          downtime_hours = Math.max(duration_ms / (1000 * 3600) - hour_adj, 0);
        }
      } catch (_) {
        // invalid dates, skip
      }

      const sql = `
        INSERT INTO tickets_ttr (
          upload_batch_id, trouble_no, sto, area, flag_hvc, is_kpi_ttr,
          wsa_exclude, ket_exclude, is_gamas, troubleno_parent,
          trouble_opentime, trouble_closetime, hour_adj, downtime_hours,
          comply3, comply6, comply12, comply24, comply3_manja
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        batchId, rec.TROUBLE_NO, rec.STO, area, rec.FLAG_HVC,
        parseInt(rec.IS_KPI_TTR) || 0,
        parseInt(rec.WSA_EXCLUDE) || 0,
        rec.KET_EXCLUDE || null,
        parseInt(rec.IS_GAMAS) || 0,
        rec.TROUBLENO_PARENT || null,
        rec.TROUBLE_OPENTIME, rec.TROUBLE_CLOSETIME,
        hour_adj, downtime_hours,
        parseInt(rec.COMPLY3) || 0,
        parseInt(rec.COMPLY6) || 0,
        parseInt(rec.COMPLY12) || 0,
        parseInt(rec.COMPLY24) || 0,
        parseInt(rec.COMPLY3_MANJA) || 0,
      ];

      await connection.execute(sql, values);
      processed++;
    }
  });

  return processed;
}

/**
 * Transform & load SQM data ke database
 */
async function loadSqmData(filePath, batchId) {
  const records = await parseCsv(filePath);
  let processed = 0;

  await db.transaction(async (connection) => {
    for (const rec of records) {
      if (!TARGET_STO.has(rec.STO)) continue;

      const area = STO_AREA_MAP[rec.STO];
      const sql = `
        INSERT INTO tickets_sqm (
          upload_batch_id, trouble_no, sto, area, status, mapping,
          is_assignment, is_hasil_ukur
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        batchId, rec.TROUBLE_NO, rec.STO, area, rec.STATUS,
        rec.MAPPING || null,
        parseInt(rec.IS_ASSIGNMENT) || 0,
        parseInt(rec.IS_HASIL_UKUR) || 0,
      ];

      await connection.execute(sql, values);
      processed++;
    }
  });

  return processed;
}

/**
 * Hitung 8 KPI summary per area untuk satu batch
 */
async function computeKpiSummary(batchId) {
  const batchInfo = await db.query(
    "SELECT jumlah_hari_periode FROM upload_batch WHERE id = ?",
    [batchId]
  );
  if (batchInfo.length === 0) throw new Error(`Batch ${batchId} tidak ditemukan`);

  const jam_periode = batchInfo[0].jumlah_hari_periode * 24;
  const targets = {};
  const target_rows = await db.query("SELECT kpi_name, target_pct FROM kpi_target");
  for (const row of target_rows) {
    targets[row.kpi_name] = row.target_pct;
  }

  const hvc_to_comply = {
    "HVC_DIAMOND": ["TTR 3 Diamond", "comply3"],
    "HVC_PLATINUM": ["TTR 6 Platinum", "comply6"],
    "HVC_GOLD": ["TTR 12 Gold", "comply12"],
    "REGULER": ["TTR 24 Non HVC", "comply24"],
  };

  const summary = [];

  for (const area of AREAS) {
    // Service Availability
    const sa_rows = await db.query(`
      SELECT AVG(downtime_hours) as avg_downtime FROM tickets_ttr
      WHERE upload_batch_id = ? AND area = ? AND wsa_exclude = 0
    `, [batchId, area]);
    if (sa_rows[0]?.avg_downtime !== null) {
      const avg_downtime = sa_rows[0].avg_downtime || 0;
      const sa_pct = 100.0 * (1 - avg_downtime / jam_periode);
      const target = targets["Service Availability"];
      summary.push({
        area, kpi_name: "Service Availability",
        numerator: parseFloat(avg_downtime.toFixed(4)),
        denominator: jam_periode,
        achieved_pct: parseFloat(sa_pct.toFixed(2)),
        target_pct: target,
        is_achieved: sa_pct >= target ? 1 : 0,
      });
    }

    // Assurance Guarantee
    const ag_rows = await db.query(`
      SELECT COUNT(*) as total, SUM(is_gamas) as n_gamas FROM tickets_ttr
      WHERE upload_batch_id = ? AND area = ?
    `, [batchId, area]);
    if (ag_rows[0]?.total > 0) {
      const total = ag_rows[0].total;
      const n_gamas = ag_rows[0].n_gamas || 0;
      const ag_pct = 100.0 * (1 - n_gamas / total);
      const target = targets["Assurance Guarantee"];
      summary.push({
        area, kpi_name: "Assurance Guarantee",
        numerator: total - n_gamas,
        denominator: total,
        achieved_pct: parseFloat(ag_pct.toFixed(2)),
        target_pct: target,
        is_achieved: ag_pct >= target ? 1 : 0,
      });
    }

    // TTR 3/6/12/24 & TTR 3 Manja
    const kpi_rows = await db.query(`
      SELECT FLAG_HVC, COUNT(*) as cnt,
             SUM(comply3) as c3, SUM(comply6) as c6,
             SUM(comply12) as c12, SUM(comply24) as c24,
             SUM(comply3_manja) as c3m
      FROM tickets_ttr
      WHERE upload_batch_id = ? AND area = ? AND is_kpi_ttr = 1
      GROUP BY FLAG_HVC
    `, [batchId, area]);

    for (const row of kpi_rows) {
      const hvc = row.FLAG_HVC;
      if (hvc_to_comply[hvc]) {
        const [kpi_name, comply_col] = hvc_to_comply[hvc];
        const comply_sum = row[`c${comply_col.slice(-1)}`] || row["c" + comply_col.slice(-2)] || 0;
        const pct = 100.0 * comply_sum / row.cnt;
        const target = targets[kpi_name];
        summary.push({
          area, kpi_name,
          numerator: parseInt(comply_sum),
          denominator: row.cnt,
          achieved_pct: parseFloat(pct.toFixed(2)),
          target_pct: target,
          is_achieved: pct >= target ? 1 : 0,
        });
      }
    }

    // TTR 3 Manja (all HVC)
    const manja_rows = await db.query(`
      SELECT COUNT(*) as cnt, SUM(comply3_manja) as c3m
      FROM tickets_ttr
      WHERE upload_batch_id = ? AND area = ? AND is_kpi_ttr = 1
    `, [batchId, area]);
    if (manja_rows[0]?.cnt > 0) {
      const cnt = manja_rows[0].cnt;
      const c3m = manja_rows[0].c3m || 0;
      const pct = 100.0 * c3m / cnt;
      const target = targets["TTR 3 Manja"];
      summary.push({
        area, kpi_name: "TTR 3 Manja",
        numerator: parseInt(c3m),
        denominator: cnt,
        achieved_pct: parseFloat(pct.toFixed(2)),
        target_pct: target,
        is_achieved: pct >= target ? 1 : 0,
      });
    }

    // SQM Close
    const sqm_rows = await db.query(`
      SELECT COUNT(*) as total,
             SUM(CASE WHEN mapping='Individual' AND is_assignment=1 AND is_hasil_ukur=1 THEN 1 ELSE 0 END) as num,
             SUM(CASE WHEN mapping NOT IN ('Gamas','Online','Di-Sisi-Plg') OR mapping IS NULL THEN 1 ELSE 0 END) as denom
      FROM tickets_sqm
      WHERE upload_batch_id = ? AND area = ?
    `, [batchId, area]);
    if (sqm_rows[0]?.denom > 0) {
      const num = sqm_rows[0].num || 0;
      const denom = sqm_rows[0].denom;
      const pct = 100.0 * num / denom;
      const target = targets["SQM Close"];
      summary.push({
        area, kpi_name: "SQM Close",
        numerator: parseInt(num),
        denominator: parseInt(denom),
        achieved_pct: parseFloat(pct.toFixed(2)),
        target_pct: target,
        is_achieved: pct >= target ? 1 : 0,
      });
    }
  }

  // Insert into kpi_summary_snapshot
  await db.transaction(async (connection) => {
    for (const row of summary) {
      await connection.execute(`
        INSERT INTO kpi_summary_snapshot
          (upload_batch_id, area, kpi_name, numerator, denominator, achieved_pct, target_pct, is_achieved)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [batchId, row.area, row.kpi_name, row.numerator, row.denominator, row.achieved_pct, row.target_pct, row.is_achieved]);
    }
  });

  return summary;
}

module.exports = {
  parseCsv,
  validateTicketCloseFile,
  validateSqmFile,
  loadTicketCloseData,
  loadSqmData,
  computeKpiSummary,
};
