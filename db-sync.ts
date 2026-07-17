import mysql from "mysql2/promise";
import 'dotenv/config';

async function sync() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is missing");
    process.exit(1);
  }

  console.log("Connecting to TiDB Cloud...");
  const connection = await mysql.createConnection({
    uri: url,
    ssl: {
      rejectUnauthorized: true,
    },
  });

  console.log("Creating tables...");
  
  await connection.query(`
    CREATE TABLE IF NOT EXISTS users (
      line_url VARCHAR(500) PRIMARY KEY,
      name VARCHAR(255),
      auth_code VARCHAR(255),
      status VARCHAR(50) DEFAULT 'free',
      expired_at DATETIME,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS assessments (
      id INT PRIMARY KEY AUTO_INCREMENT,
      nickname VARCHAR(255) NOT NULL,
      birthday VARCHAR(255) NOT NULL,
      gender ENUM('male', 'female') NOT NULL,
      height DECIMAL(5,1),
      weight DECIMAL(5,1),
      symptoms JSON NOT NULL,
      customSymptoms TEXT,
      reportData JSON NOT NULL,
      leader_line_url VARCHAR(500),
      is_favorite BOOLEAN DEFAULT FALSE,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS medication_images (
      id INT PRIMARY KEY AUTO_INCREMENT,
      assessmentId INT NOT NULL,
      s3Key VARCHAR(500) NOT NULL,
      s3Url VARCHAR(1000) NOT NULL,
      originalName VARCHAR(255),
      mimeType VARCHAR(100),
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS recovery_logs (
      id INT PRIMARY KEY AUTO_INCREMENT,
      lineId VARCHAR(100) NOT NULL,
      dosage INT NOT NULL,
      reactions JSON NOT NULL,
      notes TEXT,
      reportDate VARCHAR(20) NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log("Database synced successfully!");
  await connection.end();
}

sync().catch(err => {
  console.error("Sync failed:", err);
  process.exit(1);
});
