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
  const results = await db.query(sql, values);
  
  // Konversi tipe decimal (string dari mysql2) ke Number agar frontend tidak bingung
  return results.map(r => ({
    ...r,
    numerator: Number(r.numerator),
    denominator: Number(r.denominator),
    achieved_pct: Number(r.achieved_pct),
    target_pct: Number(r.target_pct)
  }));
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
      COALESCE(o.achieved_pct, 0) AS pct_lama,
      n.achieved_pct AS pct_baru,
      (n.achieved_pct - COALESCE(o.achieved_pct, 0)) AS delta_pct,
      COALESCE(o.is_achieved, 0) AS achieved_lama,
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
async function getProblemTickets(batchId, kpiName, area, sto = null) {
  // Validate batch exists lightly
  const [{ cnt }] = await db.query(
    "SELECT COUNT(*) as cnt FROM upload_batch WHERE id = ?", [batchId]
  );
  if (cnt === 0) throw new Error(`Batch ${batchId} tidak ditemukan`);

  let sql = "";
  let values = [batchId, area];
  const stoClauseT = sto ? " AND t.sto = ?" : "";
  const stoClauseS = sto ? " AND s.sto = ?" : "";
  if (sto) values.push(sto);

  if (kpiName === "Assurance Guarantee") {
    sql = `
      SELECT t.trouble_no, t.sto, t.troubleno_parent, 
             t.trouble_opentime, t.trouble_closetime
      FROM tickets_ttr t
      WHERE t.upload_batch_id = ? 
        AND t.area = ? 
        AND t.is_gamas = 1
        ${stoClauseT}
      ORDER BY t.trouble_closetime DESC
      LIMIT 50
    `;
  } else if (kpiName === "Service Availability") {
    sql = `
      SELECT t.trouble_no, t.sto, t.trouble_opentime, t.trouble_closetime,
             t.downtime_hours, t.wsa_exclude, t.ket_exclude
      FROM tickets_ttr t
      WHERE t.upload_batch_id = ? 
        AND t.area = ?
        AND t.wsa_exclude = 0
        ${stoClauseT}
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
          AND t.is_kpi_ttr = 1 AND t.comply3_manja = 1 AND t.downtime_hours > 3
          ${stoClauseT}
        ORDER BY t.trouble_closetime DESC
        LIMIT 50
      `;
    } else {
      const validCols = new Set(["comply3", "comply6", "comply12", "comply24"]);
      if (!validCols.has(complyInfo.col)) {
        throw new Error(`Invalid comply column: ${complyInfo.col}`);
      }
      sql = `
        SELECT t.trouble_no, t.sto, t.trouble_opentime, t.trouble_closetime
        FROM tickets_ttr t
        WHERE t.upload_batch_id = ? 
          AND t.area = ?
          AND t.is_kpi_ttr = 1 AND t.${complyInfo.col} = 0 AND t.flag_hvc = ?
          ${stoClauseT}
        ORDER BY t.trouble_closetime DESC
        LIMIT 50
      `;
      // We need to order values properly since sto is pushed last, but flag_hvc should be before sto
      values = [batchId, area, complyInfo.hvc];
      if (sto) values.push(sto);
    }
  } else if (kpiName === "SQM Close") {
    sql = `
      SELECT s.trouble_no, s.sto, s.status, s.mapping
      FROM tickets_sqm s
      WHERE s.upload_batch_id = ? 
        AND s.area = ?
        AND NOT ((s.mapping IS NULL OR s.mapping='Individual') AND s.is_assignment = 1 AND s.is_hasil_ukur = 1)
        AND (s.mapping NOT IN ('Gamas', 'Online', 'Di-Sisi-Plg', 'Gamas-non-sqm') OR s.mapping IS NULL)
        ${stoClauseS}
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
 * Overall KPI = average dari KPI 4 area
 * @returns {overall_kpis: {kpi_name: achieved_pct}, achieved_count, total_count, achievement_rate}
 */
async function getOverviewStats(batchId) {
  // Ambil semua KPI summary per area
  const summary = await db.query(`
    SELECT area, kpi_name, achieved_pct, target_pct, is_achieved
    FROM kpi_summary_snapshot
    WHERE upload_batch_id = ?
  `, [batchId]);

  if (summary.length === 0) {
    return {
      overall_kpis: {},
      achieved_count: 0,
      total_count: 0,
      achievement_rate: 0,
    };
  }

  // Group by KPI name
  const kpiGroups = {};
  for (const row of summary) {
    if (!kpiGroups[row.kpi_name]) {
      kpiGroups[row.kpi_name] = [];
    }
    kpiGroups[row.kpi_name].push(row);
  }

  // Hitung average per KPI (average dari 4 area)
  const overall_kpis = {};
  for (const [kpiName, rows] of Object.entries(kpiGroups)) {
    const avgPct = rows.reduce((sum, r) => sum + Number(r.achieved_pct), 0) / rows.length;
    overall_kpis[kpiName] = parseFloat(avgPct.toFixed(2));
  }

  // Hitung achievement count (berapa KPI yang achieve)
  let achieved_count = 0;
  let total_count = 0;
  for (const [kpiName, rows] of Object.entries(kpiGroups)) {
    total_count++;
    const avgPct = rows.reduce((sum, r) => sum + Number(r.achieved_pct), 0) / rows.length;
    const target = Number(rows[0]?.target_pct) || 0;
    if (avgPct >= target) achieved_count++;
  }

  const achievement_rate = total_count > 0
    ? parseFloat((100.0 * achieved_count / total_count).toFixed(2))
    : 0;

  return {
    overall_kpis,
    achieved_count,
    total_count,
    achievement_rate,
  };
}

/**
 * Trend KPI: lihat perubahan satu KPI di area tertentu lintas batch, beserta STO-nya
 * @param {string} kpiName
 * @param {string} area        - uppercase area name (PEKALONGAN, dll)
 * @param {string} granularity - "weekly" | "monthly" | "all"
 * @param {number} year        - filter tahun, 0 = semua tahun
 * @param {number} month       - filter bulan (1-12), 0 = semua bulan
 * @param {number} limit       - max rows dikembalikan
 */
async function getKpiTrend(kpiName, area, granularity = "all", year = 0, month = 0, limit = 24) {
  let yearCond  = year  > 0 ? "AND YEAR(b.periode_akhir) = ?"  : "";
  let monthCond = month > 0 ? "AND MONTH(b.periode_akhir) = ?" : "";

  let sql, params;
  
  if (granularity === "weekly") {
    // Aggregate by week (YEARWEEK): average achieved_pct per week
    sql = `
      SELECT
        YEARWEEK(b.periode_akhir, 1) as week_key,
        MIN(b.periode_awal) as periode_awal,
        MAX(b.periode_akhir) as periode_akhir,
        GROUP_CONCAT(b.id ORDER BY b.id) as batch_ids,
        COUNT(*) as batch_count,
        AVG(ks.achieved_pct) as achieved_pct,
        AVG(ks.target_pct) as target_pct,
        CASE WHEN AVG(ks.achieved_pct) >= AVG(ks.target_pct) THEN 1 ELSE 0 END as is_achieved
      FROM kpi_summary_snapshot ks
      JOIN upload_batch b ON b.id = ks.upload_batch_id
      WHERE ks.kpi_name = ? AND ks.area = ? AND b.status = 'READY'
        ${yearCond} ${monthCond}
      GROUP BY YEARWEEK(b.periode_akhir, 1)
      ORDER BY week_key ASC
      LIMIT ?
    `;
    params = [kpiName, area];
    if (year  > 0) params.push(year);
    if (month > 0) params.push(month);
    params.push(limit);
    
  } else if (granularity === "monthly") {
    // Aggregate by month: average achieved_pct per month
    sql = `
      SELECT
        CONCAT(YEAR(b.periode_akhir), '-', LPAD(MONTH(b.periode_akhir), 2, '0')) as month_key,
        MIN(b.periode_awal) as periode_awal,
        MAX(b.periode_akhir) as periode_akhir,
        GROUP_CONCAT(b.id ORDER BY b.id) as batch_ids,
        COUNT(*) as batch_count,
        AVG(ks.achieved_pct) as achieved_pct,
        AVG(ks.target_pct) as target_pct,
        CASE WHEN AVG(ks.achieved_pct) >= AVG(ks.target_pct) THEN 1 ELSE 0 END as is_achieved
      FROM kpi_summary_snapshot ks
      JOIN upload_batch b ON b.id = ks.upload_batch_id
      WHERE ks.kpi_name = ? AND ks.area = ? AND b.status = 'READY'
        ${yearCond} ${monthCond}
      GROUP BY YEAR(b.periode_akhir), MONTH(b.periode_akhir)
      ORDER BY month_key ASC
      LIMIT ?
    `;
    params = [kpiName, area];
    if (year  > 0) params.push(year);
    if (month > 0) params.push(month);
    params.push(limit);
    
  } else {
    // Default: "all" - return all batches individually
    sql = `
      SELECT
        b.id, b.periode_awal, b.periode_akhir,
        b.source_filename, b.jumlah_hari_periode,
        ks.achieved_pct, ks.target_pct, ks.is_achieved
      FROM kpi_summary_snapshot ks
      JOIN upload_batch b ON b.id = ks.upload_batch_id
      WHERE ks.kpi_name = ? AND ks.area = ? AND b.status = 'READY'
        ${yearCond} ${monthCond}
      ORDER BY b.periode_akhir ASC, b.id ASC
      LIMIT ?
    `;
    params = [kpiName, area];
    if (year  > 0) params.push(year);
    if (month > 0) params.push(month);
    params.push(limit);
  }

  let area_results = await db.query(sql, params);
  
  // Ambil STO data dan gabungkan
  let sto_sql;
  
  if (granularity === "weekly") {
    sto_sql = `
      SELECT
        YEARWEEK(b.periode_akhir, 1) as week_key,
        ks.sto,
        AVG(ks.achieved_pct) as achieved_pct
      FROM kpi_summary_sto_snapshot ks
      JOIN upload_batch b ON b.id = ks.upload_batch_id
      WHERE ks.kpi_name = ? AND ks.area = ? AND b.status = 'READY'
        ${yearCond} ${monthCond}
      GROUP BY YEARWEEK(b.periode_akhir, 1), ks.sto
    `;
  } else if (granularity === "monthly") {
    sto_sql = `
      SELECT
        CONCAT(YEAR(b.periode_akhir), '-', LPAD(MONTH(b.periode_akhir), 2, '0')) as month_key,
        ks.sto,
        AVG(ks.achieved_pct) as achieved_pct
      FROM kpi_summary_sto_snapshot ks
      JOIN upload_batch b ON b.id = ks.upload_batch_id
      WHERE ks.kpi_name = ? AND ks.area = ? AND b.status = 'READY'
        ${yearCond} ${monthCond}
      GROUP BY YEAR(b.periode_akhir), MONTH(b.periode_akhir), ks.sto
    `;
  } else {
    sto_sql = `
      SELECT
        b.id, ks.sto, ks.achieved_pct
      FROM kpi_summary_sto_snapshot ks
      JOIN upload_batch b ON b.id = ks.upload_batch_id
      WHERE ks.kpi_name = ? AND ks.area = ? AND b.status = 'READY'
        ${yearCond} ${monthCond}
    `;
  }
  
  // Karena parameter filter-nya sama persis
  const sto_params = [kpiName, area];
  if (year > 0) sto_params.push(year);
  if (month > 0) sto_params.push(month);
  
  const sto_results = await db.query(sto_sql, sto_params);
  
  // Mapping STO data ke Area result
  area_results = area_results.map(row => {
    // Cari data STO yang cocok dengan baris ini
    const stos = sto_results.filter(sto_row => {
      if (granularity === "weekly") return sto_row.week_key === row.week_key;
      if (granularity === "monthly") return sto_row.month_key === row.month_key;
      return sto_row.id === row.id;
    });
    
    // Assign setiap STO sebagai property di dalam object row
    // Format property: huruf awal kapital (e.g., WIRADESA -> Wiradesa)
    stos.forEach(sto_row => {
      const stoName = sto_row.sto.charAt(0) + sto_row.sto.slice(1).toLowerCase();
      row[stoName] = sto_row.achieved_pct;
    });
    
    // Kumpulkan daftar nama STO yang ada di baris ini
    row.available_stos = stos.map(s => s.sto.charAt(0) + s.sto.slice(1).toLowerCase());
    return row;
  });

  return area_results;
}

/**
 * Trend multi-area: semua 4 area untuk satu KPI, lintas batch
 * @param {string} kpiName
 * @param {string} granularity - "weekly" | "monthly" | "all"
 * @param {number} year        - filter tahun, 0 = semua
 * @param {number} month       - filter bulan, 0 = semua
 * @param {number} limit       - max batch
 */
async function getKpiTrendAllAreas(kpiName, granularity = "all", year = 0, month = 0, limit = 24) {
  let yearCond  = year  > 0 ? "AND YEAR(b.periode_akhir) = ?"  : "";
  let monthCond = month > 0 ? "AND MONTH(b.periode_akhir) = ?" : "";

  let sql, params;
  
  if (granularity === "weekly") {
    // Aggregate by week (YEARWEEK): average achieved_pct per week per area
    sql = `
      SELECT
        YEARWEEK(b.periode_akhir, 1) as week_key,
        MIN(b.periode_awal) as periode_awal,
        MAX(b.periode_akhir) as periode_akhir,
        ks.area,
        GROUP_CONCAT(DISTINCT b.id ORDER BY b.id) as batch_ids,
        COUNT(DISTINCT b.id) as batch_count,
        AVG(ks.achieved_pct) as achieved_pct,
        AVG(ks.target_pct) as target_pct,
        CASE WHEN AVG(ks.achieved_pct) >= AVG(ks.target_pct) THEN 1 ELSE 0 END as is_achieved
      FROM kpi_summary_snapshot ks
      JOIN upload_batch b ON b.id = ks.upload_batch_id
      WHERE ks.kpi_name = ? AND b.status = 'READY'
        ${yearCond} ${monthCond}
      GROUP BY YEARWEEK(b.periode_akhir, 1), ks.area
      ORDER BY week_key ASC, ks.area ASC
      LIMIT ?
    `;
    params = [kpiName];
    if (year  > 0) params.push(year);
    if (month > 0) params.push(month);
    params.push(limit * 4); // 4 areas
    
  } else if (granularity === "monthly") {
    // Aggregate by month: average achieved_pct per month per area
    sql = `
      SELECT
        CONCAT(YEAR(b.periode_akhir), '-', LPAD(MONTH(b.periode_akhir), 2, '0')) as month_key,
        MIN(b.periode_awal) as periode_awal,
        MAX(b.periode_akhir) as periode_akhir,
        ks.area,
        GROUP_CONCAT(DISTINCT b.id ORDER BY b.id) as batch_ids,
        COUNT(DISTINCT b.id) as batch_count,
        AVG(ks.achieved_pct) as achieved_pct,
        AVG(ks.target_pct) as target_pct,
        CASE WHEN AVG(ks.achieved_pct) >= AVG(ks.target_pct) THEN 1 ELSE 0 END as is_achieved
      FROM kpi_summary_snapshot ks
      JOIN upload_batch b ON b.id = ks.upload_batch_id
      WHERE ks.kpi_name = ? AND b.status = 'READY'
        ${yearCond} ${monthCond}
      GROUP BY YEAR(b.periode_akhir), MONTH(b.periode_akhir), ks.area
      ORDER BY month_key ASC, ks.area ASC
      LIMIT ?
    `;
    params = [kpiName];
    if (year  > 0) params.push(year);
    if (month > 0) params.push(month);
    params.push(limit * 4); // 4 areas
    
  } else {
    // Default: "all" - return all batches individually
    sql = `
      SELECT
        b.id, b.periode_awal, b.periode_akhir,
        b.source_filename, b.jumlah_hari_periode,
        ks.area, ks.achieved_pct, ks.target_pct, ks.is_achieved
      FROM kpi_summary_snapshot ks
      JOIN upload_batch b ON b.id = ks.upload_batch_id
      WHERE ks.kpi_name = ? AND b.status = 'READY'
        ${yearCond} ${monthCond}
      ORDER BY b.periode_akhir ASC, b.id ASC, ks.area ASC
      LIMIT ?
    `;
    params = [kpiName];
    if (year  > 0) params.push(year);
    if (month > 0) params.push(month);
    params.push(limit * 4);
  }

  return await db.query(sql, params);
}

/**
 * Ambil daftar tahun dan bulan yang tersedia di DB (untuk filter dropdown)
 */
async function getAvailablePeriods() {
  const sql = `
    SELECT DISTINCT
      YEAR(periode_akhir)  AS year,
      MONTH(periode_akhir) AS month
    FROM upload_batch
    WHERE status = 'READY'
    ORDER BY year DESC, month DESC
  `;
  return await db.query(sql, []);
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
      AVG(CASE WHEN wsa_exclude=0 THEN downtime_hours ELSE NULL END) AS avg_downtime_excl
    FROM tickets_ttr
    WHERE upload_batch_id = ? AND area = ?
    GROUP BY sto
    ORDER BY sto
  `, [batchId, area]);

  // TTR KPI per STO (hanya untuk is_kpi_ttr=1)
  const ttrKpiRows = await db.query(`
    SELECT
      sto,
      flag_hvc,
      COUNT(*) AS cnt,
      SUM(comply3) AS c3,
      SUM(comply6) AS c6,
      SUM(comply12) AS c12,
      SUM(comply24) AS c24,
      SUM(comply3_manja) AS c3m
    FROM tickets_ttr
    WHERE upload_batch_id = ? AND area = ? AND is_kpi_ttr = 1
    GROUP BY sto, flag_hvc
  `, [batchId, area]);

  // TTR 3 Manja per STO (gabungan)
  const ttrManjaRows = await db.query(`
    SELECT
      sto,
      COUNT(*) AS cnt,
      SUM(CASE WHEN downtime_hours <= 3 THEN 1 ELSE 0 END) AS c3m
    FROM tickets_ttr
    WHERE upload_batch_id = ? AND area = ? 
      AND is_kpi_ttr = 1 
      AND comply3_manja = 1
    GROUP BY sto
  `, [batchId, area]);

  // SQM per STO
  const sqmRows = await db.query(`
    SELECT
      sto,
      SUM(CASE WHEN (mapping IS NULL OR mapping='Individual') AND is_assignment=1 AND is_hasil_ukur=1 THEN 1 ELSE 0 END) AS num,
      SUM(CASE WHEN mapping NOT IN ('Gamas','Online','Di-Sisi-Plg','Gamas-non-sqm') OR mapping IS NULL THEN 1 ELSE 0 END) AS denom
    FROM tickets_sqm
    WHERE upload_batch_id = ? AND area = ?
    GROUP BY sto
  `, [batchId, area]);

  const sqmMap = {};
  for (const r of sqmRows) sqmMap[r.sto] = r;

  const ttrKpiMap = {};
  for (const r of ttrKpiRows) {
    if (!ttrKpiMap[r.sto]) ttrKpiMap[r.sto] = {};
    ttrKpiMap[r.sto][r.flag_hvc] = r;
  }
  
  const ttrManjaMap = {};
  for (const r of ttrManjaRows) ttrManjaMap[r.sto] = r;

  const targets = {};
  const targetRows = await db.query("SELECT kpi_name, target_pct FROM kpi_target");
  for (const r of targetRows) targets[r.kpi_name] = r.target_pct;

  // Gabungkan semua STO unik
  const allStos = new Set([
    ...ttrRows.map(r => r.sto),
    ...sqmRows.map(r => r.sto),
  ]);

  const result = [...allStos].sort().map((sto) => {
    const r = ttrRows.find(row => row.sto === sto) || { total: 0, n_gamas: 0, avg_downtime_excl: null };
    const sqm = sqmMap[sto] || { num: 0, denom: 0 };
    const ttrHvc = ttrKpiMap[sto] || {};
    const ttrManja = ttrManjaMap[sto] || { cnt: 0, c3m: 0 };
    
    // Service Availability: 100 * (1 - AVG(downtime_hours) / jam_periode)
    const availability = jam_periode > 0 && r.avg_downtime_excl !== null
      ? Math.min(100 * (1 - (r.avg_downtime_excl || 0) / jam_periode), 100)
      : 100;
    
    const assurance = r.total > 0 ? 100 * (1 - (r.n_gamas || 0) / r.total) : 100;
    
    const getTtr = (hvcFlag, complyCol) => {
      const row = ttrHvc[hvcFlag];
      if (!row || row.cnt <= 0) return 0;
      return 100 * (row[complyCol] || 0) / row.cnt;
    };

    const ttr3 = getTtr('HVC_DIAMOND', 'c3');
    const ttr6Jam = getTtr('HVC_PLATINUM', 'c6');
    const ttr12Jam = getTtr('HVC_GOLD', 'c12');
    const ttr24Jam = getTtr('REGULER', 'c24');
    
    const ttr3JamM = ttrManja.cnt > 0 ? 100 * (ttrManja.c3m || 0) / ttrManja.cnt : 0;
    const sqmPct = sqm.denom > 0 ? 100 * sqm.num / sqm.denom : 0;

    return {
      nama: `STO ${sto}`,
      sto: sto,
      metrics: {
        availability: parseFloat(Math.max(0, availability).toFixed(2)),
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
  getKpiTrendAllAreas,
  getAvailablePeriods,
  getKpiSummaryBySto,
};
