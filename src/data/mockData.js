/* =========================================================================
   MOCK DATA
   Ganti isi file ini dengan hasil fetch dari backend Go (Gin + GORM) kamu.
   ========================================================================= */

export const TARGETS = { availability: 99, assurance: 90, ttr3: 90, sqm: 75 };

export const WITEL_DATA = [
  {
    witel: "Pekalongan",
    metrics: { availability: 99.8, assurance: 92.5, ttr3: 94.2, sqm: 76.1 },
    trend: { availability: "up", assurance: "up", ttr3: "down", sqm: "up" },
    stos: [
      { nama: "STO PKL", metrics: { availability: 99.9, assurance: 92.5, ttr3: 94.2, sqm: 76.1 }, trend: { availability: "up", assurance: "up", ttr3: "down", sqm: "up" } },
      { nama: "STO BTG", metrics: { availability: 99.8, assurance: 89.2, ttr3: 91.5, sqm: 74.2 }, trend: { availability: "up", assurance: "down", ttr3: "up", sqm: "down" } },
      { nama: "STO SBA", metrics: { availability: 99.5, assurance: 90.8, ttr3: 87.4, sqm: 78.9 }, trend: { availability: "up", assurance: "up", ttr3: "down", sqm: "up" } },
      { nama: "STO BDY", metrics: { availability: 99.7, assurance: 94.1, ttr3: 92.3, sqm: 80.1 }, trend: { availability: "up", assurance: "up", ttr3: "up", sqm: "up" } },
    ],
  },
  {
    witel: "Tegal",
    metrics: { availability: 99.4, assurance: 88.7, ttr3: 90.6, sqm: 73.8 },
    trend: { availability: "up", assurance: "down", ttr3: "up", sqm: "down" },
    stos: [
      { nama: "STO ADW", metrics: { availability: 99.6, assurance: 87.5, ttr3: 89.2, sqm: 72.1 }, trend: { availability: "up", assurance: "down", ttr3: "down", sqm: "down" } },
      { nama: "STO BLU", metrics: { availability: 99.1, assurance: 91.3, ttr3: 93.7, sqm: 75.6 }, trend: { availability: "down", assurance: "up", ttr3: "up", sqm: "up" } },
      { nama: "STO MGN", metrics: { availability: 99.5, assurance: 85.9, ttr3: 88.4, sqm: 70.9 }, trend: { availability: "up", assurance: "down", ttr3: "down", sqm: "down" } },
      { nama: "STO SLW", metrics: { availability: 99.3, assurance: 90.1, ttr3: 91.8, sqm: 76.3 }, trend: { availability: "up", assurance: "up", ttr3: "up", sqm: "up" } },
      { nama: "STO TEG", metrics: { availability: 99.7, assurance: 88.7, ttr3: 89.9, sqm: 74.0 }, trend: { availability: "up", assurance: "down", ttr3: "down", sqm: "up" } },
    ],
  },
  {
    witel: "Brebes",
    metrics: { availability: 99.2, assurance: 91.0, ttr3: 88.8, sqm: 77.6 },
    trend: { availability: "up", assurance: "up", ttr3: "down", sqm: "up" },
    stos: [
      { nama: "STO BKA", metrics: { availability: 99.4, assurance: 92.2, ttr3: 90.1, sqm: 79.0 }, trend: { availability: "up", assurance: "up", ttr3: "up", sqm: "up" } },
      { nama: "STO BRB", metrics: { availability: 99.0, assurance: 89.4, ttr3: 86.5, sqm: 75.2 }, trend: { availability: "down", assurance: "down", ttr3: "down", sqm: "down" } },
      { nama: "STO BMU", metrics: { availability: 99.3, assurance: 90.7, ttr3: 87.9, sqm: 78.1 }, trend: { availability: "up", assurance: "up", ttr3: "down", sqm: "up" } },
      { nama: "STO KTM", metrics: { availability: 99.1, assurance: 93.1, ttr3: 91.2, sqm: 76.8 }, trend: { availability: "up", assurance: "up", ttr3: "up", sqm: "up" } },
      { nama: "STO TTL", metrics: { availability: 99.2, assurance: 89.6, ttr3: 88.3, sqm: 78.9 }, trend: { availability: "down", assurance: "down", ttr3: "down", sqm: "up" } },
    ],
  },
  {
    witel: "Pemalang",
    metrics: { availability: 99.3, assurance: 89.5, ttr3: 91.2, sqm: 75.4 },
    trend: { availability: "up", assurance: "down", ttr3: "up", sqm: "up" },
    stos: [
      { nama: "STO CMA", metrics: { availability: 99.5, assurance: 90.9, ttr3: 92.6, sqm: 76.7 }, trend: { availability: "up", assurance: "up", ttr3: "up", sqm: "up" } },
      { nama: "STO KDW", metrics: { availability: 99.0, assurance: 87.3, ttr3: 88.1, sqm: 73.5 }, trend: { availability: "down", assurance: "down", ttr3: "down", sqm: "down" } },
      { nama: "STO KJE", metrics: { availability: 99.4, assurance: 91.8, ttr3: 93.4, sqm: 77.9 }, trend: { availability: "up", assurance: "up", ttr3: "up", sqm: "up" } },
      { nama: "STO PML", metrics: { availability: 99.2, assurance: 88.6, ttr3: 89.7, sqm: 74.6 }, trend: { availability: "up", assurance: "down", ttr3: "down", sqm: "up" } },
      { nama: "STO RDD", metrics: { availability: 99.1, assurance: 89.0, ttr3: 90.9, sqm: 74.2 }, trend: { availability: "down", assurance: "up", ttr3: "up", sqm: "down" } },
    ],
  },
];

export const TREND_DATA = [
  { date: "01 Oct", Pekalongan: 91.2, Tegal: 93.5, Brebes: 88.1, Pemalang: 79.4, Target: 90 },
  { date: "07 Oct", Pekalongan: 92.6, Tegal: 94.0, Brebes: 87.4, Pemalang: 82.0, Target: 90 },
  { date: "13 Oct", Pekalongan: 93.1, Tegal: 95.2, Brebes: 89.0, Pemalang: 85.6, Target: 90 },
  { date: "18 Oct", Pekalongan: 93.9, Tegal: 96.0, Brebes: 88.6, Pemalang: 88.2, Target: 90 },
  { date: "23 Oct", Pekalongan: 94.2, Tegal: 96.4, Brebes: 87.9, Pemalang: 89.9, Target: 90 },
  { date: "27 Oct", Pekalongan: 94.0, Tegal: 96.9, Brebes: 89.3, Pemalang: 90.4, Target: 90 },
  { date: "31 Oct", Pekalongan: 94.4, Tegal: 97.1, Brebes: 90.1, Pemalang: 90.4, Target: 90 },
];

export const RECENT_UPLOADS = [
  { time: "24 Jul 2024, 09:45", file: "KPI_Regional_July_2024.xlsx", user: "Andi Prasetyo", status: "Success" },
  { time: "22 Jul 2024, 14:20", file: "Network_Log_B_Pekalongan.xlsx", user: "Andi Prasetyo", status: "Failed" },
  { time: "21 Jul 2024, 11:05", file: "Maintenance_Report_Q2.xlsx", user: "Siti Aminah", status: "Success" },
  { time: "19 Jul 2024, 16:30", file: "Regional_KPI_Draft_v2.xls", user: "Budi Santoso", status: "Success" },
];

export const LINE_COLORS = { Pekalongan: "#2563eb", Tegal: "#16a34a", Brebes: "#7c3aed", Pemalang: "#f59e0b" };
