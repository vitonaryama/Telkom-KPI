# Telkom KPI Dashboard

Aplikasi dashboard KPI untuk memantau performa jaringan Telkom Witel suatu wilayah~~ secara terpusat.

## Deskripsi

Proyek ini menghadirkan tampilan dashboard KPI yang menggabungkan data Service Availability, Assurance Guarantee, TTR (waktu penyelesaian trouble), dan SQM. Pengguna dapat melakukan autentikasi, melihat ringkasan KPI, menjelajahi data per area dan STO, serta mengunggah batch data CSV melalui backend yang terproteksi.

## Latar Belakang / Permasalahan

Memantau performa jaringan selama periode tertentu di beberapa service area memerlukan integrasi data dari berbagai file CSV dan sistem. Dashboard ini menyederhanakan proses tersebut dengan menyediakan:
- tampilan KPI terpadu,
- alur upload data CSV terstruktur,
- serta akses berbasis peran untuk menjaga keamanan data.

## Tujuan dan Manfaat

Tujuan proyek ini adalah:
- menyediakan satu titik pemantauan KPI jaringan bagi tim operasional,
- memudahkan analisis performa setiap area dan STO,
- mempercepat proses upload dan validasi data KPI,
- serta mengamankan akses upload dengan JWT dan otorisasi peran.

Manfaat proyek ini antara lain:
- visualisasi KPI yang cepat dan mudah dipahami,
- pemisahan hak akses admin dan pengguna reguler,
- dukungan batch data dan history upload,
- fallback data mock saat backend tidak tersedia.

## Fitur Utama

- Autentikasi pengguna: login, registrasi, lupa password, reset password.
- Role-based access control untuk halaman upload.
- Dashboard KPI dengan kartu ringkasan dan tabel drill-down.
- Filter area dan pencarian STO/KPI.
- Lazy loading data STO untuk detail area.
- Batch selection untuk melihat data berdasarkan periode upload.
- Monitoring tren KPI menggunakan grafik.
- Validasi file CSV sebelum commit upload.
- Riwayat upload batch dan penghapusan batch (admin).
- Frontend fallback ke data mock jika API tidak tersedia.

## Tech Stack

- Frontend:
  - React 19
  - Vite
  - Tailwind CSS
  - Recharts
  - lucide-react
- Backend:
  - Node.js
  - Express
  - MySQL (mysql2)
  - JWT authentication
  - multer untuk upload file
  - joi untuk validasi input
  - bcryptjs untuk hashing password
  - dotenv untuk konfigurasi environment
  - cors untuk cross-origin
  - csv-parser untuk membaca CSV

## Struktur Folder

- `src/`
  - `components/`: halaman dan komponen UI React
  - `services/api.js`: klien API frontend
  - `data/mockData.js`: data fallback untuk dashboard
- `backend/`
  - `server.js`: entrypoint Express
  - `routes/`: definisi endpoint API
    - `authRoutes.js`
    - `kpiRoutes.js`
    - `uploadRoutes.js`
  - `services/`: logika pemrosesan backend
    - `kpiService.js`
    - `uploadService.js`
  - `config/database.js`: koneksi MySQL
  - `middleware/auth.js`: middleware JWT dan role
  - `.env.example`: template konfigurasi environment
  - `create_sto_table.js`: skrip pembantu pembuatan tabel tertentu

## Instalasi dan Menjalankan Project

1. Install dependensi frontend:

   ```powershell
   cd Telkom-KPI
   npm install
   ```

2. Install dependensi backend:

   ```powershell
   cd Telkom-KPI\backend
   npm install
   ```

3. Salin file konfigurasi environment backend:

   ```powershell
   cd Telkom-KPI\backend
   copy .env.example .env
   ```

4. Isi `backend/.env` dengan konfigurasi MySQL, JWT, dan SMTP.

5. Siapkan database MySQL sesuai nilai `DB_NAME` pada `.env`.

6. Jalankan backend:

   ```powershell
   cd Telkom-KPI\backend
   npm run dev
   ```

7. Jalankan frontend:

   ```powershell
   cd Telkom-KPI
   npm run dev
   ```

Frontend akan berjalan di `http://localhost:5173` dan proxy API akan mengarahkan request `/api` ke backend di `http://localhost:5000`.

## Cara Penggunaan

1. Buka aplikasi di browser `http://localhost:5173`.
2. Daftar akun baru atau login menggunakan akun yang sudah ada.
3. Untuk pengguna non-admin, akses utama adalah halaman dashboard KPI.
4. Untuk pengguna dengan hak admin, menu `Upload Excel` tersedia di sidebar.
5. Pada dashboard, pilih batch data, filter berdasarkan area, dan cari STO atau KPI.
6. Untuk drill-down, klik baris area untuk memuat data per STO.
7. Pada halaman upload, unggah file CSV, pilih tipe file, validasi, lalu commit ke backend.
8. Gunakan fungsi lupa password dan reset password jika token reset dikirim.

## Konfigurasi Environment

Backend menggunakan file `.env` dengan variabel berikut:

- `DB_HOST`: hostname database MySQL
- `DB_PORT`: port database (default 3306)
- `DB_USER`: username database
- `DB_PASSWORD`: password database
- `DB_NAME`: nama database aplikasi
- `NODE_ENV`: environment aplikasi (`development` / `production`)
- `PORT`: port backend Express (default 5000)
- `CORS_ORIGIN`: asal yang diizinkan untuk CORS
- `JWT_SECRET`: rahasia JWT untuk pembuatan token
- `JWT_EXPIRES`: masa berlaku token JWT (misalnya `24h`)
- `MAX_FILE_SIZE`: batas ukuran upload file dalam byte
- `UPLOAD_DIR`: folder penyimpanan file sementara
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`: konfigurasi email untuk fitur reset password

## API / Endpoint Utama

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

### KPI

- `GET /api/kpi/summary?batchId=<id>&area=<optional>`
- `GET /api/kpi/overview?batchId=<id>`
- `GET /api/kpi/trend?kpiName=<name>&area=<area>&granularity=<opt>&year=<opt>&month=<opt>&limit=<opt>`
- `GET /api/kpi/trend-all?kpiName=<name>&granularity=<opt>&year=<opt>&month=<opt>&limit=<opt>`
- `GET /api/kpi/periods`
- `GET /api/kpi/compare?batchOld=<id>&batchNew=<id>`
- `GET /api/kpi/problems?batchId=<id>&kpiName=<name>&area=<area>&sto=<optional>`
- `GET /api/kpi/summary-by-sto?batchId=<id>&area=<area>`

### Upload & Batch

- `POST /api/upload/validate`
- `POST /api/upload/commit`
- `GET /api/upload?limit=<n>&offset=<n>`
- `GET /api/upload/:id`
- `DELETE /api/upload/:id`

Catatan: `/api/kpi` dan `/api/upload` diproteksi JWT. Upload dan batch management memerlukan otorisasi role admin.

