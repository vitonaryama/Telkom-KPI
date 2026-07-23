/**
 * Database Configuration & Connection Pool
 * Menggunakan mysql2/promise untuk async/await support
 */

  const mysql = require("mysql2/promise");
  require("dotenv").config();

  const pool = mysql.createPool({
  host: process.env.MYSQLHOST,
  port: process.env.MYSQLPORT,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/**
 * Helper: execute query dengan auto-connection management.
 * Menggunakan pool.query() (non-prepared) agar kompatibel dengan
 * LIMIT/OFFSET sebagai parameter di semua versi MySQL 5.7+/8.0+.
 * Nilai parameter di-escape oleh mysql2, tetap aman dari SQL injection.
 */
async function query(sql, values = []) {
  const [result] = await pool.query(sql, values);
  return result;
}

/**
 * Helper: execute multiple queries dalam satu transaction
 */
async function transaction(callback) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Test koneksi database
 */
async function testConnection() {
  try {
    const result = await query("SELECT 1");
    console.log("✓ Database connection successful");
    return true;
  } catch (error) {
    console.error("✗ Database connection failed:", error.message);
    return false;
  }
}

module.exports = {
  pool,
  query,
  transaction,
  testConnection,
};
