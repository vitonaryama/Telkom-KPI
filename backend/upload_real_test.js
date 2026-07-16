/**
 * E2E Upload Test — Real Files
 * Files: KPI Dashboard - TIKET CLOSE.csv & KPI Dashboard - SQM.csv
 */
require("dotenv").config();
const http = require("http");
const fs   = require("fs");
const path = require("path");

const BASE       = "http://localhost:5000";
const TIKET_FILE = "D:/Magang/Telkom-KPI/KPI Dashboard - TIKET CLOSE.csv";
const SQM_FILE   = "D:/Magang/Telkom-KPI/KPI Dashboard - SQM.csv";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function httpReq(method, urlPath, body, token, contentType) {
  return new Promise((resolve) => {
    const hdrs = {};
    if (token)       hdrs["Authorization"] = "Bearer " + token;
    if (contentType) hdrs["Content-Type"]  = contentType;
    const opts = { hostname: "localhost", port: 5000, path: urlPath, method, headers: hdrs };
    const r = http.request(opts, (res) => {
      let d = "";
      res.on("data", c => d += c);
      res.on("end", () => {
        let parsed;
        try { parsed = JSON.parse(d); } catch { parsed = { raw: d }; }
        resolve({ s: res.statusCode, b: parsed });
      });
    });
    r.on("error", e => resolve({ s: 0, b: { error: e.message } }));
    if (body) r.write(body);
    r.end();
  });
}

function buildForm(fields = {}, files = {}) {
  const boundary = "Boundary" + Date.now();
  const LF  = "\r\n";
  const enc = s => Buffer.from(s, "utf8");
  const parts = [];

  for (const [k, v] of Object.entries(fields)) {
    parts.push(enc(`--${boundary}${LF}Content-Disposition: form-data; name="${k}"${LF}${LF}${v}${LF}`));
  }
  for (const [k, fp] of Object.entries(files)) {
    const fn = path.basename(fp);
    parts.push(enc(`--${boundary}${LF}Content-Disposition: form-data; name="${k}"; filename="${fn}"${LF}Content-Type: text/csv${LF}${LF}`));
    parts.push(fs.readFileSync(fp));
    parts.push(enc(LF));
  }
  parts.push(enc(`--${boundary}--${LF}`));
  return { body: Buffer.concat(parts), boundary };
}

async function postForm(urlPath, fields, files, token) {
  const { body, boundary } = buildForm(fields, files);
  return httpReq("POST", urlPath, body, token, `multipart/form-data; boundary=${boundary}`);
}

// ─── Reporter ─────────────────────────────────────────────────────────────────
const results = [];
function T(name, got, exp, detail = "") {
  const ok  = got === exp;
  results.push({ name, tag: ok ? "PASS" : "FAIL", got, exp, detail });
  const icon  = ok ? "✓" : "✗";
  const tag   = ok ? "PASS" : "FAIL";
  const extra = detail ? `  │ ${detail}` : "";
  console.log(`  ${icon} [${tag}] ${name}  got=${got} exp=${exp}${extra}`);
}

function elapsed(ms) {
  return ms < 1000 ? `${ms}ms` : `${(ms/1000).toFixed(1)}s`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  E2E UPLOAD TEST — Real Production Files");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log(`  TIKET CLOSE : ${(fs.statSync(TIKET_FILE).size/1024).toFixed(0)} KB`);
  console.log(`  SQM         : ${(fs.statSync(SQM_FILE).size/1024/1024).toFixed(1)} MB`);
  console.log("");

  // Login
  const loginR = await httpReq("POST", "/api/auth/login",
    Buffer.from(JSON.stringify({ email: "admin@telkom.co.id", password: "admin12345" })),
    null, "application/json");
  const token = loginR.b.data?.token;
  if (!token) { console.error("LOGIN GAGAL"); process.exit(1); }
  console.log("  Auth  : OK\n");

  let batchTiket, batchSqm, batchGabungan;

  // ═══════════════════════════════════════════════════════════════
  console.log("══ TEST 1: Validate TIKET CLOSE ═══════════════════════");
  // ═══════════════════════════════════════════════════════════════
  let t0 = Date.now();
  let res = await postForm("/api/upload/validate",
    { type: "tiket_close" }, { file: TIKET_FILE }, token);
  let dur = elapsed(Date.now() - t0);
  T("Validate tiket_close (6314 rows, 745 STO valid)", res.s, 200,
    `valid=${res.b.data?.valid_rows} total=${res.b.data?.total_rows} durasi=${dur}`);

  if (res.s === 200) {
    const validPct = (res.b.data.valid_rows / res.b.data.total_rows * 100).toFixed(1);
    console.log(`       → ${validPct}% baris cocok dengan 19 STO Witel Pekalongan`);
    console.log(`       → ${res.b.message}`);
  } else {
    console.log(`       → ERROR: ${JSON.stringify(res.b)}`);
  }

  // ═══════════════════════════════════════════════════════════════
  console.log("\n══ TEST 2: Validate SQM ════════════════════════════════");
  // ═══════════════════════════════════════════════════════════════
  t0 = Date.now();
  res = await postForm("/api/upload/validate",
    { type: "sqm" }, { file: SQM_FILE }, token);
  dur = elapsed(Date.now() - t0);
  T("Validate SQM (67911 rows, 1156 STO valid)", res.s, 200,
    `valid=${res.b.data?.valid_rows} total=${res.b.data?.total_rows} durasi=${dur}`);

  if (res.s === 200) {
    const validPct = (res.b.data.valid_rows / res.b.data.total_rows * 100).toFixed(1);
    console.log(`       → ${validPct}% baris cocok dengan 19 STO Witel Pekalongan`);
    console.log(`       → ${res.b.message}`);
  } else {
    console.log(`       → ERROR: ${JSON.stringify(res.b).substring(0, 200)}`);
  }

  // ═══════════════════════════════════════════════════════════════
  console.log("\n══ TEST 3: Commit TIKET CLOSE saja ════════════════════");
  // ═══════════════════════════════════════════════════════════════
  t0 = Date.now();
  res = await postForm("/api/upload/commit",
    { periodeAwal: "2026-07-01", periodeAkhir: "2026-07-15", sourceFilename: "KPI Dashboard - TIKET CLOSE.csv" },
    { tiketCloseFile: TIKET_FILE }, token);
  dur = elapsed(Date.now() - t0);
  batchTiket = res.b.batchId;
  T("Commit tiket_close real file", res.s, 200,
    `batchId=${batchTiket} ttr_rows=${res.b.data?.ttrRowCount} durasi=${dur}`);

  if (res.s !== 200) {
    console.log(`       → ERROR: ${res.b.error || res.b.message || JSON.stringify(res.b).substring(0,200)}`);
  } else {
    console.log(`       → KPI Summary rows: ${res.b.data?.summary?.length}`);
  }

  // ═══════════════════════════════════════════════════════════════
  console.log("\n══ TEST 4: Commit SQM saja ═════════════════════════════");
  // ═══════════════════════════════════════════════════════════════
  t0 = Date.now();
  res = await postForm("/api/upload/commit",
    { periodeAwal: "2026-07-01", periodeAkhir: "2026-07-15", sourceFilename: "KPI Dashboard - SQM.csv" },
    { sqmFile: SQM_FILE }, token);
  dur = elapsed(Date.now() - t0);
  batchSqm = res.b.batchId;
  T("Commit SQM real file", res.s, 200,
    `batchId=${batchSqm} sqm_rows=${res.b.data?.sqmRowCount} durasi=${dur}`);

  if (res.s !== 200) {
    console.log(`       → ERROR: ${res.b.error || res.b.message || JSON.stringify(res.b).substring(0,200)}`);
  } else {
    console.log(`       → KPI Summary rows: ${res.b.data?.summary?.length}`);
  }

  // ═══════════════════════════════════════════════════════════════
  console.log("\n══ TEST 5: Commit GABUNGAN (TIKET + SQM) ══════════════");
  // ═══════════════════════════════════════════════════════════════
  t0 = Date.now();
  res = await postForm("/api/upload/commit",
    { periodeAwal: "2026-07-01", periodeAkhir: "2026-07-15", sourceFilename: "KPI Dashboard - GABUNGAN.csv" },
    { tiketCloseFile: TIKET_FILE, sqmFile: SQM_FILE }, token);
  dur = elapsed(Date.now() - t0);
  batchGabungan = res.b.batchId;
  T("Commit GABUNGAN real file", res.s, 200,
    `batchId=${batchGabungan} ttr=${res.b.data?.ttrRowCount} sqm=${res.b.data?.sqmRowCount} durasi=${dur}`);

  if (res.s !== 200) {
    console.log(`       → ERROR: ${res.b.error || res.b.message || JSON.stringify(res.b).substring(0,200)}`);
  } else {
    const sum = res.b.data?.summary || [];
    console.log(`       → KPI Summary: ${sum.length} rows (${[...new Set(sum.map(r=>r.area))].join(', ')})`);
    // Tampilkan KPI per area
    const byArea = {};
    for (const kpi of sum) {
      if (!byArea[kpi.area]) byArea[kpi.area] = [];
      byArea[kpi.area].push(`${kpi.kpi_name}: ${kpi.achieved_pct}% (${kpi.is_achieved ? '✓' : '✗'} target ${kpi.target_pct}%)`);
    }
    for (const [area, kpis] of Object.entries(byArea)) {
      console.log(`       [${area}]`);
      kpis.forEach(k => console.log(`         - ${k}`));
    }
  }

  // ═══════════════════════════════════════════════════════════════
  console.log("\n══ TEST 6: Verifikasi DB — Batch Gabungan ══════════════");
  // ═══════════════════════════════════════════════════════════════

  if (batchGabungan) {
    // 6.1 Status batch
    let r = await httpReq("GET", `/api/upload/${batchGabungan}`, null, token);
    const bdata = r.b.data;
    T("Batch gabungan status=READY", (r.s===200 && bdata?.status==="READY") ? 200 : -1, 200,
      `status=${bdata?.status} ttr=${bdata?.row_count_ttr} sqm=${bdata?.row_count_sqm} hari=${bdata?.jumlah_hari_periode}`);

    // 6.2 KPI summary tersedia
    r = await httpReq("GET", `/api/kpi/summary?batchId=${batchGabungan}`, null, token);
    const sumData = r.b.data || [];
    T("KPI summary gabungan tersedia", (r.s===200 && sumData.length>0) ? 200 : -1, 200,
      `rows=${sumData.length}`);

    // 6.3 Overview stats
    r = await httpReq("GET", `/api/kpi/overview?batchId=${batchGabungan}`, null, token);
    const ov = r.b.data;
    T("KPI overview gabungan", r.s, 200,
      `achieved=${ov?.achieved_count}/${ov?.total_count} (${ov?.achievement_rate}%)`);

    // 6.4 KPI summary per area
    for (const area of ["PEKALONGAN", "TEGAL", "PEMALANG", "BREBES"]) {
      r = await httpReq("GET", `/api/kpi/summary?batchId=${batchGabungan}&area=${area}`, null, token);
      const aData = r.b.data || [];
      T(`KPI summary area=${area}`, (r.s===200 && aData.length>0) ? 200 : -1, 200,
        `kpi_rows=${aData.length}`);
    }

    // 6.5 STO breakdown per area
    for (const area of ["PEKALONGAN", "TEGAL", "PEMALANG", "BREBES"]) {
      r = await httpReq("GET", `/api/kpi/summary-by-sto?batchId=${batchGabungan}&area=${area}`, null, token);
      const stoData = r.b.data || [];
      T(`STO breakdown area=${area}`, r.s, 200, `sto_count=${stoData.length}`);
    }

    // 6.6 Trend setelah commit
    r = await httpReq("GET", "/api/kpi/trend?kpiName=Service+Availability&area=PEKALONGAN&limit=5", null, token);
    const trend = r.b.data || [];
    T("Trend SA/PEKALONGAN ada data", (r.s===200 && trend.length>0) ? 200 : -1, 200,
      `rows=${trend.length}`);

    // 6.7 Problems drill-down (TTR 12 Gold, PEKALONGAN)
    r = await httpReq("GET", `/api/kpi/problems?batchId=${batchGabungan}&kpiName=TTR+12+Gold&area=PEKALONGAN`, null, token);
    T("Problems drill-down TTR12/PKL", r.s, 200,
      `problem_tickets=${r.b.data?.length}`);

    // 6.8 Problems SQM Close
    r = await httpReq("GET", `/api/kpi/problems?batchId=${batchGabungan}&kpiName=SQM+Close&area=TEGAL`, null, token);
    T("Problems drill-down SQM/TEGAL", r.s, 200,
      `problem_tickets=${r.b.data?.length}`);
  }

  // ═══════════════════════════════════════════════════════════════
  console.log("\n══ TEST 7: Compare Batch (Tiket vs Gabungan) ══════════");
  // ═══════════════════════════════════════════════════════════════
  if (batchTiket && batchGabungan) {
    const r = await httpReq("GET", `/api/kpi/compare?batchOld=${batchTiket}&batchNew=${batchGabungan}`, null, token);
    const cmp = r.b.data || [];
    T("Compare batch tiket vs gabungan", r.s, 200, `delta_rows=${cmp.length}`);
    if (cmp.length > 0) {
      // Tampilkan beberapa delta
      const samples = cmp.slice(0, 4);
      samples.forEach(c => {
        console.log(`       ${c.area} | ${c.kpi_name}: ${c.pct_lama ?? "N/A"}% → ${c.pct_baru ?? "N/A"}% (Δ${c.delta_pct >= 0 ? "+" : ""}${parseFloat(c.delta_pct ?? 0).toFixed(2)}%)`);
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // FINAL SUMMARY
  // ═══════════════════════════════════════════════════════════════
  const passed = results.filter(r => r.tag === "PASS").length;
  const failed = results.filter(r => r.tag === "FAIL").length;

  console.log("\n══════════════════════════════════════════════════════════");
  console.log(`  TOTAL=${results.length}   PASS=${passed}   FAIL=${failed}`);
  console.log("══════════════════════════════════════════════════════════");

  if (failed > 0) {
    console.log("\n── FAILED TESTS ──────────────────────────────────────────");
    results.filter(r => r.tag === "FAIL").forEach(r => {
      console.log(`  ✗ ${r.name}`);
      console.log(`    got=${r.got} exp=${r.exp}`);
      if (r.detail) console.log(`    ${r.detail}`);
    });
  }

  process.exit(0);
})();
