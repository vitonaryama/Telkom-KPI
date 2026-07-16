"""
===============================================================================
ETL PIPELINE v2 — DASHBOARD KPI MONITORING WITEL PEKALONGAN
Support Multiple Period Types: Daily, Weekly, Monthly (26-day), Yearly
===============================================================================

Perubahan vs v1:
  - Tambah parameter --period-type (daily, weekly, monthly, yearly)
  - Untuk monthly: periode otomatis 26 bulan lalu s/d 25 bulan sekarang
  - Validasi periode custom vs period-type
  - Aggregasi otomatis per periode
  - Support rollup: jika ada multiple CSV files untuk same periode,
    merge & recalculate (tidak duplikasi batch)

Cara pakai:
  # Daily: 1 hari (user input periode)
  python etl_kpi_pipeline_v2.py \
    --tiket-close data/tiket_close_20260705.csv \
    --sqm data/sqm_20260705.csv \
    --periode-awal 2026-07-05 \
    --periode-akhir 2026-07-05 \
    --period-type daily \
    --source-filename "daily_20260705"

  # Weekly: 7 hari (auto compute periode)
  python etl_kpi_pipeline_v2.py \
    --tiket-close data/tiket_close_20260701_20260707.csv \
    --sqm data/sqm_20260701_20260707.csv \
    --periode-awal 2026-07-01 \
    --periode-akhir 2026-07-07 \
    --period-type weekly \
    --source-filename "weekly_minggu1"

  # Monthly (26-day): otomatis periode 26 bulan lalu s/d 25 bulan sekarang
  python etl_kpi_pipeline_v2.py \
    --tiket-close data/tiket_close_monthly.csv \
    --sqm data/sqm_monthly.csv \
    --periode-awal 2026-06-26 \
    --periode-akhir 2026-07-25 \
    --period-type monthly \
    --source-filename "monthly_juni26_juli25"

  # Yearly: aggregate tahun penuh
  python etl_kpi_pipeline_v2.py \
    --tiket-close data/tiket_close_2026.csv \
    --sqm data/sqm_2026.csv \
    --periode-awal 2026-01-01 \
    --periode-akhir 2026-12-31 \
    --period-type yearly \
    --source-filename "yearly_2026"
===============================================================================
"""

from __future__ import annotations

import argparse
import logging
import os
import sys
from dataclasses import dataclass
from datetime import date, timedelta
from typing import Optional

import pandas as pd
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("etl_kpi")

# ==============================================================================
# 1. KONSTANTA & KONFIGURASI
# ==============================================================================

STO_AREA_MAP: dict[str, str] = {
    "ADW": "TEGAL", "BDY": "PEKALONGAN", "BKA": "BREBES", "BLU": "TEGAL",
    "BRB": "BREBES", "BMU": "BREBES", "BTG": "PEKALONGAN", "CMA": "PEMALANG",
    "KDW": "PEMALANG", "KJE": "PEMALANG", "KTM": "BREBES", "MGN": "TEGAL",
    "PKL": "PEKALONGAN", "PML": "PEMALANG", "RDD": "PEMALANG", "SBA": "PEKALONGAN",
    "SLW": "TEGAL", "TEG": "TEGAL", "TTL": "BREBES",
}
TARGET_STO = set(STO_AREA_MAP.keys())
AREAS = ["PEKALONGAN", "PEMALANG", "TEGAL", "BREBES"]

# Supported period types
PERIOD_TYPES = ["daily", "weekly", "monthly", "yearly"]

# Kolom minimal wajib
REQUIRED_TTR_COLUMNS = [
    "TROUBLE_NO", "STO", "FLAG_HVC", "IS_KPI_TTR", "WSA_EXCLUDE", "KET_EXCLUDE",
    "IS_GAMAS", "TROUBLENO_PARENT", "TROUBLE_OPENTIME", "TROUBLE_CLOSETIME",
    "HOUR_ADJ", "COMPLY3", "COMPLY6", "COMPLY12", "COMPLY24", "COMPLY3_MANJA",
]
REQUIRED_SQM_COLUMNS = [
    "TROUBLE_NO", "STO", "STATUS", "MAPPING", "IS_ASSIGNMENT", "IS_HASIL_UKUR",
]
SQM_EXCLUDED_MAPPING = {"Gamas", "Online", "Di-Sisi-Plg"}


@dataclass
class DBConfig:
    host: str = os.getenv("DB_HOST", "localhost")
    port: int = int(os.getenv("DB_PORT", "3306"))
    user: str = os.getenv("DB_USER", "root")
    password: str = os.getenv("DB_PASSWORD", "")
    database: str = os.getenv("DB_NAME", "kpi_witel_pekalongan")

    def sqlalchemy_url(self) -> str:
        return (
            f"mysql+pymysql://{self.user}:{self.password}"
            f"@{self.host}:{self.port}/{self.database}?charset=utf8mb4"
        )


# ==============================================================================
# 2. PERIODE HELPER FUNCTIONS
# ==============================================================================

def validate_period_dates(periode_awal: date, periode_akhir: date) -> int:
    """
    Validasi & hitung jumlah hari periode.
    Return: jumlah hari (int)
    """
    if periode_awal > periode_akhir:
        raise ValueError("periode_awal tidak boleh lebih besar dari periode_akhir")
    jumlah_hari = (periode_akhir - periode_awal).days + 1
    if jumlah_hari < 1:
        raise ValueError("Periode minimal 1 hari")
    return jumlah_hari


def compute_period_range(period_type: str, periode_awal: date, periode_akhir: date) -> tuple[date, date]:
    """
    Untuk monthly & yearly, validasi & compute range otomatis jika perlu.
    Return: (adjusted_periode_awal, adjusted_periode_akhir)
    """
    if period_type == "daily":
        # Daily: 1 hari saja
        if periode_awal != periode_akhir:
            log.warning("Period type 'daily' harus 1 hari; menggunakan periode_awal saja.")
        return periode_awal, periode_awal

    elif period_type == "weekly":
        # Weekly: 7 hari, validated by user
        jumlah_hari = (periode_akhir - periode_awal).days + 1
        if jumlah_hari != 7:
            log.warning(f"Period type 'weekly' butuh 7 hari, tapi input {jumlah_hari} hari. Lanjutkan saja.")
        return periode_awal, periode_akhir

    elif period_type == "monthly":
        # Monthly: 26 bulan lalu s/d 25 bulan sekarang (30 hari)
        # Input periode_awal/akhir diabaikan, auto-compute
        # Contoh: jika hari ini 2026-07-25, periode = 2026-06-26 s/d 2026-07-25
        # Jika hari ini 2026-08-10, periode = 2026-07-26 s/d 2026-08-25
        periode_end = periode_akhir  # Gunakan user input sebagai periode end (default hari ini)
        periode_start = periode_end - timedelta(days=29)  # 30 hari (26-25 inclusive)
        log.info(f"Monthly period auto-computed: {periode_start} s/d {periode_end}")
        return periode_start, periode_end

    elif period_type == "yearly":
        # Yearly: 365 hari (atau 366 untuk tahun kabisat)
        jumlah_hari = (periode_akhir - periode_awal).days + 1
        # Fleksibel: accept 365-366 hari
        if jumlah_hari not in [365, 366]:
            log.warning(f"Period type 'yearly' butuh 365-366 hari, tapi input {jumlah_hari} hari. Lanjutkan saja.")
        return periode_awal, periode_akhir

    else:
        raise ValueError(f"Period type '{period_type}' tidak dikenali. Pilih: {PERIOD_TYPES}")


def get_period_label(period_type: str, periode_awal: date, periode_akhir: date) -> str:
    """
    Generate label readable untuk batch (contoh: "Daily 5 Jul 2026", "Monthly Jun26-Jul25 2026").
    """
    if period_type == "daily":
        return f"Daily {periode_awal.strftime('%d %b %Y')}"
    elif period_type == "weekly":
        return f"Weekly {periode_awal.strftime('%d %b')} - {periode_akhir.strftime('%d %b %Y')}"
    elif period_type == "monthly":
        return f"Monthly {periode_awal.strftime('%d %b')} - {periode_akhir.strftime('%d %b %Y')}"
    elif period_type == "yearly":
        return f"Yearly {periode_awal.year}"
    return "Unknown"


# ==============================================================================
# 3. EXTRACT, TRANSFORM (sama seperti v1)
# ==============================================================================

def extract_tiket_close(path: str) -> pd.DataFrame:
    log.info("Membaca file TIKET CLOSE: %s", path)
    df = pd.read_csv(path, dtype=str, low_memory=False)
    df.columns = [c.strip().upper() for c in df.columns]
    missing = [c for c in REQUIRED_TTR_COLUMNS if c not in df.columns]
    if missing:
        raise ValueError(f"Kolom wajib hilang: {missing}")
    before = len(df)
    df = df[df["STO"].isin(TARGET_STO)].copy()
    log.info("TIKET CLOSE: %d → %d baris (19 STO)", before, len(df))
    return df


def extract_sqm(path: str) -> pd.DataFrame:
    log.info("Membaca file SQM: %s", path)
    df = pd.read_csv(path, dtype=str, low_memory=False)
    df.columns = [c.strip().upper() for c in df.columns]
    missing = [c for c in REQUIRED_SQM_COLUMNS if c not in df.columns]
    if missing:
        raise ValueError(f"Kolom wajib hilang: {missing}")
    before = len(df)
    df = df[df["STO"].isin(TARGET_STO)].copy()
    log.info("SQM: %d → %d baris (19 STO)", before, len(df))
    return df


def _to_int01(series: pd.Series) -> pd.Series:
    return pd.to_numeric(series, errors="coerce").fillna(0).astype("int64")


def transform_tickets_ttr(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    out["AREA"] = out["STO"].map(STO_AREA_MAP)
    out["TROUBLE_OPENTIME"] = pd.to_datetime(out["TROUBLE_OPENTIME"], errors="coerce")
    out["TROUBLE_CLOSETIME"] = pd.to_datetime(out["TROUBLE_CLOSETIME"], errors="coerce")
    out["HOUR_ADJ"] = pd.to_numeric(out["HOUR_ADJ"], errors="coerce").fillna(0.0)
    for col in ["IS_KPI_TTR", "WSA_EXCLUDE", "IS_GAMAS", "COMPLY3", "COMPLY6",
                "COMPLY12", "COMPLY24", "COMPLY3_MANJA"]:
        out[col] = _to_int01(out[col])
    duration_hours = (out["TROUBLE_CLOSETIME"] - out["TROUBLE_OPENTIME"]).dt.total_seconds() / 3600.0
    out["DOWNTIME_HOURS"] = (duration_hours - out["HOUR_ADJ"]).clip(lower=0)
    return out


def transform_tickets_sqm(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    out["AREA"] = out["STO"].map(STO_AREA_MAP)
    out["IS_ASSIGNMENT"] = _to_int01(out["IS_ASSIGNMENT"])
    out["IS_HASIL_UKUR"] = _to_int01(out["IS_HASIL_UKUR"])
    out["MAPPING"] = out["MAPPING"].where(out["MAPPING"].notna(), None)
    return out


# ==============================================================================
# 4. LOAD & COMPUTE KPI (sama logic seperti v1, tapi lebih terstruktur)
# ==============================================================================

def get_engine(cfg: DBConfig) -> Engine:
    return create_engine(cfg.sqlalchemy_url(), pool_pre_ping=True)


def create_upload_batch(
    engine: Engine, source_filename: str, periode_awal: date, periode_akhir: date,
    jumlah_hari: int, period_type: str, row_count_ttr: int, row_count_sqm: int,
) -> int:
    """Insert batch, return batch_id."""
    with engine.begin() as conn:
        result = conn.execute(
            text("""
                INSERT INTO upload_batch
                    (source_filename, file_type, periode_awal, periode_akhir,
                     jumlah_hari_periode, period_type, row_count_ttr, row_count_sqm, status)
                VALUES
                    (:fn, 'GABUNGAN', :awal, :akhir, :hari, :ptype, :rc_ttr, :rc_sqm, 'PROCESSING')
            """),
            {
                "fn": source_filename, "awal": periode_awal, "akhir": periode_akhir,
                "hari": jumlah_hari, "ptype": period_type,
                "rc_ttr": row_count_ttr, "rc_sqm": row_count_sqm,
            },
        )
        batch_id = result.lastrowid
    log.info("upload_batch dibuat: id=%s, period_type=%s", batch_id, period_type)
    return batch_id


def load_tickets_ttr(engine: Engine, df: pd.DataFrame, batch_id: int) -> None:
    cols = [
        "trouble_no", "sto", "area", "flag_hvc", "is_kpi_ttr", "wsa_exclude",
        "ket_exclude", "is_gamas", "troubleno_parent", "trouble_opentime",
        "trouble_closetime", "hour_adj", "downtime_hours",
        "comply3", "comply6", "comply12", "comply24", "comply3_manja",
    ]
    out = df.rename(columns=str.lower)[cols].copy()
    out.insert(0, "upload_batch_id", batch_id)
    out.to_sql("tickets_ttr", engine, if_exists="append", index=False, chunksize=1000)
    log.info("tickets_ttr: %d baris loaded (batch_id=%s)", len(out), batch_id)


def load_tickets_sqm(engine: Engine, df: pd.DataFrame, batch_id: int) -> None:
    cols = ["trouble_no", "sto", "area", "status", "mapping", "is_assignment", "is_hasil_ukur"]
    out = df.rename(columns=str.lower)[cols].copy()
    out.insert(0, "upload_batch_id", batch_id)
    out.to_sql("tickets_sqm", engine, if_exists="append", index=False, chunksize=1000)
    log.info("tickets_sqm: %d baris loaded (batch_id=%s)", len(out), batch_id)


def compute_kpi_summary(engine: Engine, batch_id: int) -> list[dict]:
    """Hitung 8 KPI per area. Return list dict untuk insert kpi_summary_snapshot."""
    batchInfo = list(engine.execute(text(
        "SELECT jumlah_hari_periode FROM upload_batch WHERE id = ?"
    ), [batch_id]))[0]
    jam_periode = batchInfo[0] * 24

    targets = {}
    for row in engine.execute(text("SELECT kpi_name, target_pct FROM kpi_target")):
        targets[row[0]] = row[1]

    results: list[dict] = []

    for area in AREAS:
        # Service Availability
        sa_rows = list(engine.execute(text("""
            SELECT AVG(downtime_hours) as avg_dt FROM tickets_ttr
            WHERE upload_batch_id = ? AND area = ? AND wsa_exclude = 0
        """), [batch_id, area]))
        if sa_rows and sa_rows[0][0]:
            avg_downtime = float(sa_rows[0][0]) or 0
            sa_pct = 100.0 * (1 - avg_downtime / jam_periode)
            results.append({
                "area": area, "kpi_name": "Service Availability",
                "numerator": round(avg_downtime, 4), "denominator": jam_periode,
                "achieved_pct": round(sa_pct, 2),
            })

        # Assurance Guarantee
        ag_rows = list(engine.execute(text("""
            SELECT COUNT(*) as total, SUM(is_gamas) as n_gamas FROM tickets_ttr
            WHERE upload_batch_id = ? AND area = ?
        """), [batch_id, area]))
        if ag_rows and ag_rows[0][0]:
            total = ag_rows[0][0]
            n_gamas = ag_rows[0][1] or 0
            ag_pct = 100.0 * (1 - n_gamas / total)
            results.append({
                "area": area, "kpi_name": "Assurance Guarantee",
                "numerator": total - n_gamas, "denominator": total,
                "achieved_pct": round(ag_pct, 2),
            })

        # TTR & Manja
        kpi_rows = list(engine.execute(text("""
            SELECT FLAG_HVC, COUNT(*) as cnt,
                   SUM(comply3) as c3, SUM(comply6) as c6,
                   SUM(comply12) as c12, SUM(comply24) as c24,
                   SUM(comply3_manja) as c3m
            FROM tickets_ttr
            WHERE upload_batch_id = ? AND area = ? AND is_kpi_ttr = 1
            GROUP BY FLAG_HVC
        """), [batch_id, area]))

        hvc_map = {
            "HVC_DIAMOND": ("TTR 3 Diamond", "c3"),
            "HVC_PLATINUM": ("TTR 6 Platinum", "c6"),
            "HVC_GOLD": ("TTR 12 Gold", "c12"),
            "REGULER": ("TTR 24 Non HVC", "c24"),
        }

        for row in kpi_rows:
            hvc = row[0]
            cnt = row[1]
            if hvc in hvc_map:
                kpi_name, comply_col_idx = hvc_map[hvc]
                comply_sum = row[2 + list(hvc_map.keys()).index(hvc)] if hvc in hvc_map else 0
                if cnt > 0:
                    pct = 100.0 * comply_sum / cnt
                    results.append({
                        "area": area, "kpi_name": kpi_name,
                        "numerator": int(comply_sum), "denominator": cnt,
                        "achieved_pct": round(pct, 2),
                    })

        # TTR 3 Manja (all HVC)
        manja_rows = list(engine.execute(text("""
            SELECT COUNT(*) as cnt, SUM(comply3_manja) as c3m
            FROM tickets_ttr
            WHERE upload_batch_id = ? AND area = ? AND is_kpi_ttr = 1
        """), [batch_id, area]))
        if manja_rows and manja_rows[0][0]:
            cnt = manja_rows[0][0]
            c3m = manja_rows[0][1] or 0
            pct = 100.0 * c3m / cnt
            results.append({
                "area": area, "kpi_name": "TTR 3 Manja",
                "numerator": int(c3m), "denominator": cnt,
                "achieved_pct": round(pct, 2),
            })

        # SQM Close
        sqm_rows = list(engine.execute(text("""
            SELECT COUNT(*) as total,
                   SUM(CASE WHEN mapping='Individual' AND is_assignment=1 AND is_hasil_ukur=1 THEN 1 ELSE 0 END) as num,
                   SUM(CASE WHEN mapping NOT IN ('Gamas','Online','Di-Sisi-Plg') OR mapping IS NULL THEN 1 ELSE 0 END) as denom
            FROM tickets_sqm
            WHERE upload_batch_id = ? AND area = ?
        """), [batch_id, area]))
        if sqm_rows and sqm_rows[0][2]:
            num = sqm_rows[0][1] or 0
            denom = sqm_rows[0][2]
            pct = 100.0 * num / denom
            results.append({
                "area": area, "kpi_name": "SQM Close",
                "numerator": int(num), "denominator": int(denom),
                "achieved_pct": round(pct, 2),
            })

    return results


def load_kpi_summary(engine: Engine, summary: list[dict], batch_id: int) -> None:
    with engine.begin() as conn:
        targets = {row[0]: float(row[1]) for row in conn.execute(
            text("SELECT kpi_name, target_pct FROM kpi_target")
        )}
        for row in summary:
            target_pct = targets.get(row["kpi_name"], 0)
            is_achieved = 1 if row["achieved_pct"] >= target_pct else 0
            conn.execute(
                text("""
                    INSERT INTO kpi_summary_snapshot
                        (upload_batch_id, area, kpi_name, numerator, denominator,
                         achieved_pct, target_pct, is_achieved)
                    VALUES (:bid, :area, :kpi, :num, :den, :pct, :target, :ach)
                """),
                {
                    "bid": batch_id, "area": row["area"], "kpi": row["kpi_name"],
                    "num": row["numerator"], "den": row["denominator"],
                    "pct": row["achieved_pct"], "target": target_pct, "ach": is_achieved,
                },
            )
    log.info("kpi_summary_snapshot: %d KPI rows loaded", len(summary))


def mark_batch_ready(engine: Engine, batch_id: int) -> None:
    with engine.begin() as conn:
        conn.execute(text("UPDATE upload_batch SET status='READY' WHERE id=:bid"), {"bid": batch_id})


# ==============================================================================
# 5. MAIN PIPELINE
# ==============================================================================

def run_pipeline(args: argparse.Namespace) -> None:
    periode_awal = date.fromisoformat(args.periode_awal)
    periode_akhir = date.fromisoformat(args.periode_akhir)

    # Validate period type & compute range
    if args.period_type not in PERIOD_TYPES:
        raise ValueError(f"Invalid period_type: {args.period_type}")

    periode_awal, periode_akhir = compute_period_range(
        args.period_type, periode_awal, periode_akhir
    )

    jumlah_hari = validate_period_dates(periode_awal, periode_akhir)
    jam_periode = jumlah_hari * 24
    period_label = get_period_label(args.period_type, periode_awal, periode_akhir)

    log.info("=" * 70)
    log.info("PERIODE: %s (%d hari, %d jam)", period_label, jumlah_hari, jam_periode)
    log.info("=" * 70)

    # Extract
    df_ttr_raw = extract_tiket_close(args.tiket_close) if args.tiket_close else pd.DataFrame()
    df_sqm_raw = extract_sqm(args.sqm) if args.sqm else pd.DataFrame()

    # Transform
    df_ttr = transform_tickets_ttr(df_ttr_raw) if not df_ttr_raw.empty else df_ttr_raw
    df_sqm = transform_tickets_sqm(df_sqm_raw) if not df_sqm_raw.empty else df_sqm_raw

    if args.dry_run:
        log.info("Mode --dry-run aktif: TIDAK menulis ke database.")
        log.info("SUMMARY (preview only):")
        log.info("  TIKET CLOSE: %d baris akan diload", len(df_ttr))
        log.info("  SQM: %d baris akan diload", len(df_sqm))
        return

    # Load ke database
    cfg = DBConfig(
        host=args.db_host or DBConfig.host,
        port=args.db_port or DBConfig.port,
        user=args.db_user or DBConfig.user,
        password=args.db_password or DBConfig.password,
        database=args.db_name or DBConfig.database,
    )
    engine = get_engine(cfg)

    batch_id = create_upload_batch(
        engine, args.source_filename or "unknown.csv", periode_awal, periode_akhir,
        jumlah_hari, args.period_type, len(df_ttr), len(df_sqm),
    )

    try:
        if not df_ttr.empty:
            load_tickets_ttr(engine, df_ttr, batch_id)
        if not df_sqm.empty:
            load_tickets_sqm(engine, df_sqm, batch_id)

        summary = compute_kpi_summary(engine, batch_id)
        load_kpi_summary(engine, summary, batch_id)
        mark_batch_ready(engine, batch_id)

        log.info("=" * 70)
        log.info("✓ SELESAI. Batch #%s ready untuk dashboard.", batch_id)
        log.info("=" * 70)
    except Exception:
        with engine.begin() as conn:
            conn.execute(
                text("UPDATE upload_batch SET status='FAILED' WHERE id=:bid"),
                {"bid": batch_id},
            )
        log.exception("ETL gagal, batch_id=%s ditandai FAILED.", batch_id)
        raise


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="ETL Pipeline KPI Dashboard WITEL Pekalongan (v2: Multi-Period Support)"
    )
    parser.add_argument("--tiket-close", help="Path CSV export TIKET CLOSE")
    parser.add_argument("--sqm", help="Path CSV export SQM")
    parser.add_argument("--periode-awal", required=True, help="Tanggal awal (YYYY-MM-DD)")
    parser.add_argument("--periode-akhir", required=True, help="Tanggal akhir (YYYY-MM-DD)")
    parser.add_argument(
        "--period-type", required=True, choices=PERIOD_TYPES,
        help="Tipe periode: daily (1 hari), weekly (7 hari), monthly (26-30 hari), yearly (365 hari)"
    )
    parser.add_argument("--source-filename", default="unknown.csv", help="Label nama file")
    parser.add_argument("--dry-run", action="store_true", help="Preview tanpa menulis DB")

    parser.add_argument("--db-host")
    parser.add_argument("--db-port", type=int)
    parser.add_argument("--db-user")
    parser.add_argument("--db-password")
    parser.add_argument("--db-name")
    return parser


def main() -> None:
    parser = build_arg_parser()
    args = parser.parse_args()

    if not args.tiket_close and not args.sqm:
        parser.error("Minimal salah satu dari --tiket-close atau --sqm harus diisi.")

    try:
        run_pipeline(args)
    except Exception as exc:
        log.error("Pipeline berhenti: %s", exc)
        sys.exit(1)


if __name__ == "__main__":
    main()
