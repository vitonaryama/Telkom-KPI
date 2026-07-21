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

      // Sanitasi timestamp: normalisasi berbagai format datetime ke MySQL DATETIME (YYYY-MM-DD HH:MM:SS)
      // Format yang diketahui dari file produksi:
      //   "2026-07-02 11:37:32.0"  → strip fractional seconds
      //   "2026-07-02 11:37:32"    → sudah benar
      //   "7/15/26 6:18"           → format pendek M/D/YY H:MM dari Excel (perlu konversi)
      //   "7/15/2026 6:18:00"      → format M/D/YYYY H:MM:SS dari Excel
      const sanitizeTs = (ts) => {
        if (!ts || typeof ts !== "string") return null;
        const s = ts.trim();
        if (!s) return null;

        // 1. Format ISO dengan fractional seconds: "2026-07-02 11:37:32.0" atau "2026-07-02T11:37:32.000Z"
        //    Cukup strip suffix dan normalisasi T ke spasi
        if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(s)) {
          return s.replace("T", " ").replace(/\.\d+Z?$/, "").slice(0, 19);
        }

        // 2. Format Excel pendek: "M/D/YY H:MM" atau "M/D/YY H:MM:SS"
        //    Contoh: "7/15/26 6:18" atau "12/31/25 23:59:59"
        const excelShort = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
        if (excelShort) {
          let [, month, day, year, hour, min, sec] = excelShort;
          // Tahun 2 digit: asumsikan 2000-an (26 → 2026, 99 → 2099)
          if (year.length === 2) year = "20" + year;
          const mm  = month.padStart(2, "0");
          const dd  = day.padStart(2, "0");
          const hh  = hour.padStart(2, "0");
          const ss  = (sec || "00").padStart(2, "0");
          return `${year}-${mm}-${dd} ${hh}:${min}:${ss}`;
        }

        // 3. Format Excel lengkap tanpa detik: "M/D/YYYY H:MM"
        const excelFull = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
        if (excelFull) {
          let [, month, day, year, hour, min, sec] = excelFull;
          const mm = month.padStart(2, "0");
          const dd = day.padStart(2, "0");
          const hh = hour.padStart(2, "0");
          const ss = (sec || "00").padStart(2, "0");
          return `${year}-${mm}-${dd} ${hh}:${min}:${ss}`;
        }

        // 4. Fallback: coba parse via Date, kembalikan null jika tidak valid
        try {
          const d = new Date(s);
          if (!isNaN(d)) {
            const pad = n => String(n).padStart(2, "0");
            return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
          }
        } catch (_) { /* jatuh ke null */ }

        return null;
      };

      const openTs  = sanitizeTs(rec.TROUBLE_OPENTIME);
      const closeTs = sanitizeTs(rec.TROUBLE_CLOSETIME);

      // Skip baris yang TROUBLE_CLOSETIME kosong — tiket belum closed, tidak bisa dihitung KPI
      if (!closeTs) continue;

      try {
        const open_time  = new Date(openTs);
        const close_time = new Date(closeTs);
        if (!isNaN(open_time) && !isNaN(close_time)) {
          const duration_ms = close_time - open_time;
          downtime_hours = Math.max(duration_ms / (1000 * 3600) - hour_adj, 0);
        }
      } catch (_) {
        // invalid dates, biarkan downtime_hours = 0
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
        openTs, closeTs,
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
 * 
 * AGREGASI POLICY (alignment dengan etl_kpi_pipeline_3.py):
 * - Service Availability: Average downtime per tiket, menggunakan TROUBLE_CLOSETIME
 *   untuk perhitungan downtime_hours = (TROUBLE_CLOSETIME - TROUBLE_OPENTIME - HOUR_ADJ)
 * - Assurance Guarantee: POOLED RATIO (total non-gamas / total tiket per area)
 * - TTR 3/6/12/24: POOLED RATIO per HVC category (total comply / total count per area)
 * - TTR 3 Manja: Average per STO (formula belum fully validated, tapi tetap ditampilkan)
 * - SQM Close: POOLED RATIO (total eligible / total denominator per area)
 * 
 * Overall WITEL KPI (di getOverviewStats): Average dari 4 service area
 * 
 * Rujukan: etl_kpi_pipeline_3.py dengan penyesuaian untuk Service Availability
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
    // SA% per area = 100 * (1 - AVG(downtime) / jam_periode) pada seluruh tiket di area
    const sa_rows = await db.query(`
      SELECT AVG(downtime_hours) as avg_downtime
      FROM tickets_ttr
      WHERE upload_batch_id = ? AND area = ? AND wsa_exclude = 0
    `, [batchId, area]);
    
    if (sa_rows.length > 0 && sa_rows[0].avg_downtime !== null) {
      const avg_downtime = Number(sa_rows[0].avg_downtime) || 0;
      const sa_pct = Math.max(0, Math.min(100, 100.0 * (1 - avg_downtime / jam_periode)));
      
      const target = targets["Service Availability"];
      summary.push({
        area, kpi_name: "Service Availability",
        numerator: parseFloat(avg_downtime.toFixed(4)),  // Average downtime in hours
        denominator: jam_periode,
        achieved_pct: parseFloat(sa_pct.toFixed(2)),
        target_pct: target,
        is_achieved: sa_pct >= target ? 1 : 0,
      });
    }

    // Assurance Guarantee
    // AG% per area = pooled ratio (total non-gamas / total tiket)
    const ag_rows = await db.query(`
      SELECT COUNT(*) as total, SUM(is_gamas) as n_gamas
      FROM tickets_ttr
      WHERE upload_batch_id = ? AND area = ?
    `, [batchId, area]);
    
    if (ag_rows.length > 0 && ag_rows[0].total > 0) {
      const total = Number(ag_rows[0].total) || 0;
      const n_gamas = Number(ag_rows[0].n_gamas) || 0;
      const ag_pct = total > 0 ? 100.0 * (1 - n_gamas / total) : 100;
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

    // TTR 3/6/12/24 per HVC category
    // TTR% per area = pooled ratio (total comply / total count per HVC)
    const ttr_rows = await db.query(`
      SELECT flag_hvc, COUNT(*) as cnt,
             SUM(comply3) as c3, SUM(comply6) as c6,
             SUM(comply12) as c12, SUM(comply24) as c24
      FROM tickets_ttr
      WHERE upload_batch_id = ? AND area = ? AND is_kpi_ttr = 1
      GROUP BY flag_hvc
    `, [batchId, area]);

    // Group by HVC category
    const hvcGroups = {};
    for (const row of ttr_rows) {
      const hvc = row.flag_hvc;
      if (!hvcGroups[hvc]) hvcGroups[hvc] = [];
      hvcGroups[hvc].push(row);
    }

    for (const [hvc, rows] of Object.entries(hvcGroups)) {
      if (hvc_to_comply[hvc]) {
        const [kpi_name, comply_col] = hvc_to_comply[hvc];
        const colMap = {
          "comply3": "c3",
          "comply6": "c6",
          "comply12": "c12",
          "comply24": "c24",
        };
        
        // Pooled ratio: total comply / total count
        const total_comply = rows.reduce((a, r) => {
          const val = Number(r[colMap[comply_col]]);
          return a + (isNaN(val) ? 0 : val);
        }, 0);
        
        const total_cnt = rows.reduce((a, r) => {
          const val = Number(r.cnt);
          return a + (isNaN(val) ? 0 : val);
        }, 0);
        
        const pct = total_cnt > 0 ? 100.0 * total_comply / total_cnt : 0;
        const target = targets[kpi_name];
        
        summary.push({
          area, kpi_name,
          numerator: parseInt(total_comply),
          denominator: total_cnt,
          achieved_pct: parseFloat(pct.toFixed(2)),
          target_pct: target,
          is_achieved: pct >= target ? 1 : 0,
        });
      }
    }

    // TTR 3 Jam Manja (lintas semua kategori HVC)
    // TTR 3 Manja% per area = Pooled Ratio
    const manja_rows = await db.query(`
      SELECT COUNT(*) as cnt, SUM(comply3_manja) as c3m
      FROM tickets_ttr
      WHERE upload_batch_id = ? AND area = ? AND is_kpi_ttr = 1
    `, [batchId, area]);
    
    if (manja_rows.length > 0 && manja_rows[0].cnt > 0) {
      const total_cnt = Number(manja_rows[0].cnt) || 0;
      const total_c3m = Number(manja_rows[0].c3m) || 0;
      const pct = total_cnt > 0 ? 100.0 * total_c3m / total_cnt : 0;
      
      const target = targets["TTR 3 Manja"];
      summary.push({
        area, kpi_name: "TTR 3 Manja",
        numerator: parseInt(total_c3m),
        denominator: total_cnt,
        achieved_pct: parseFloat(pct.toFixed(2)),
        target_pct: target,
        is_achieved: pct >= target ? 1 : 0,
      });
    }

    // SQM Close
    // SQM% per area = pooled ratio (total eligible / total denominator)
    // Numerator: MAPPING IS NULL ATAU 'Individual' dengan IS_ASSIGNMENT=1 DAN IS_HASIL_UKUR=1
    // Denominator: Total - Gamas - Gamas-non-sqm - Online - Di-Sisi-Plg
    const sqm_rows = await db.query(`
      SELECT SUM(CASE WHEN (mapping IS NULL OR mapping='Individual') AND is_assignment=1 AND is_hasil_ukur=1 THEN 1 ELSE 0 END) as num,
             SUM(CASE WHEN mapping NOT IN ('Gamas','Online','Di-Sisi-Plg','Gamas-non-sqm') OR mapping IS NULL THEN 1 ELSE 0 END) as denom
      FROM tickets_sqm
      WHERE upload_batch_id = ? AND area = ?
    `, [batchId, area]);
    
    if (sqm_rows.length > 0) {
      const total_num = Number(sqm_rows[0].num) || 0;
      const total_denom = Number(sqm_rows[0].denom) || 0;
      
      if (total_denom > 0) {
        const pct = 100.0 * total_num / total_denom;
        const target = targets["SQM Close"];
        summary.push({
          area, kpi_name: "SQM Close",
          numerator: parseInt(total_num),
          denominator: parseInt(total_denom),
          achieved_pct: parseFloat(pct.toFixed(2)),
          target_pct: target,
          is_achieved: pct >= target ? 1 : 0,
        });
      }
    }
  }

  // Debug: Log summary sebelum insert
  console.log(`\nKPI Summary untuk Batch ${batchId} (${summary.length} rows):`);
  summary.forEach(row => {
    console.log(`  ${row.area} - ${row.kpi_name}: ${row.numerator}/${row.denominator} = ${row.achieved_pct}%`);
  });

  // Insert into kpi_summary_snapshot
  await db.transaction(async (connection) => {
    for (const row of summary) {
      // Validasi dan sanitasi nilai sebelum insert
      const numerator = isNaN(row.numerator) || row.numerator === null ? 0 : parseFloat(row.numerator);
      const denominator = isNaN(row.denominator) || row.denominator === null ? 1 : parseFloat(row.denominator);
      const achieved_pct = isNaN(row.achieved_pct) || row.achieved_pct === null ? 0 : parseFloat(row.achieved_pct);
      const target_pct = isNaN(row.target_pct) || row.target_pct === null ? 0 : parseFloat(row.target_pct);
      const is_achieved = row.is_achieved ? 1 : 0;

      // Debug logging
      if (Math.abs(numerator) > 99999999 || Math.abs(denominator) > 99999999) {
        console.error(`ERROR - Out of range values detected:`);
        console.error(`  KPI: ${row.kpi_name}, Area: ${row.area}`);
        console.error(`  numerator: ${numerator} (original: ${row.numerator})`);
        console.error(`  denominator: ${denominator} (original: ${row.denominator})`);
        console.error(`  achieved_pct: ${achieved_pct}, target_pct: ${target_pct}`);
        throw new Error(`Numerator or Denominator out of range for ${row.kpi_name} in ${row.area}`);
      }

      await connection.execute(`
        INSERT INTO kpi_summary_snapshot
          (upload_batch_id, area, kpi_name, numerator, denominator, achieved_pct, target_pct, is_achieved)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [batchId, row.area, row.kpi_name, numerator, denominator, achieved_pct, target_pct, is_achieved]);
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
