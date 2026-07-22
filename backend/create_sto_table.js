const db = require("./config/database");

async function main() {
  try {
    console.log("Creating kpi_summary_sto_snapshot table...");
    await db.query(`
      CREATE TABLE IF NOT EXISTS kpi_summary_sto_snapshot (
        id INT AUTO_INCREMENT PRIMARY KEY,
        upload_batch_id INT NOT NULL,
        area VARCHAR(50) NOT NULL,
        sto VARCHAR(50) NOT NULL,
        kpi_name VARCHAR(50) NOT NULL,
        numerator FLOAT DEFAULT 0,
        denominator FLOAT DEFAULT 0,
        achieved_pct FLOAT DEFAULT 0,
        target_pct FLOAT DEFAULT 0,
        is_achieved TINYINT(1) DEFAULT 0,
        INDEX idx_batch_sto (upload_batch_id, sto),
        FOREIGN KEY (upload_batch_id) REFERENCES upload_batch(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("Table created successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error creating table:", error);
    process.exit(1);
  }
}

main();
