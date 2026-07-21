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
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      full_name VARCHAR(255),
      phone VARCHAR(50),
      email VARCHAR(255),
      custom_leader_id VARCHAR(255),
      line_id VARCHAR(255)
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
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      leader_id VARCHAR(255)
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

  await connection.query(`
    CREATE TABLE IF NOT EXISTS client_progress_reports (
      id INT PRIMARY KEY AUTO_INCREMENT,
      leader_id VARCHAR(255) NOT NULL,
      client_id VARCHAR(255) NOT NULL,
      dosage INT NOT NULL,
      meals INT NOT NULL,
      consecutive_days INT NOT NULL,
      reactions JSON NOT NULL,
      notes TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log("Checking columns and migrating existing tables...");

  // 檢查並為 users 資料表補上新增的欄位
  const [userCols] = await connection.query("SHOW COLUMNS FROM users");
  const userColNames = (userCols as any[]).map(c => c.Field);
  
  if (!userColNames.includes("full_name")) {
    console.log("Migrating users table: adding full_name");
    await connection.query("ALTER TABLE users ADD COLUMN full_name VARCHAR(255)");
  }
  if (!userColNames.includes("phone")) {
    console.log("Migrating users table: adding phone");
    await connection.query("ALTER TABLE users ADD COLUMN phone VARCHAR(50)");
  }
  if (!userColNames.includes("email")) {
    console.log("Migrating users table: adding email");
    await connection.query("ALTER TABLE users ADD COLUMN email VARCHAR(255)");
  }
  if (!userColNames.includes("custom_leader_id")) {
    console.log("Migrating users table: adding custom_leader_id");
    await connection.query("ALTER TABLE users ADD COLUMN custom_leader_id VARCHAR(255)");
    try {
      await connection.query("ALTER TABLE users ADD UNIQUE KEY uk_custom_leader_id (custom_leader_id)");
    } catch (e) {
      console.warn("Could not create unique key on custom_leader_id, it might already exist or table has duplicate values:", e);
    }
  }
  if (!userColNames.includes("line_id")) {
    console.log("Migrating users table: adding line_id");
    await connection.query("ALTER TABLE users ADD COLUMN line_id VARCHAR(255)");
  }

  // 檢查並為 assessments 資料表補上 leader_id 與 line_id 欄位
  const [assessmentCols] = await connection.query("SHOW COLUMNS FROM assessments");
  const assessmentColNames = (assessmentCols as any[]).map(c => c.Field);

  if (!assessmentColNames.includes("leader_id")) {
    console.log("Migrating assessments table: adding leader_id");
    await connection.query("ALTER TABLE assessments ADD COLUMN leader_id VARCHAR(255)");
  }
  if (!assessmentColNames.includes("line_id")) {
    console.log("Migrating assessments table: adding line_id");
    await connection.query("ALTER TABLE assessments ADD COLUMN line_id VARCHAR(255)");
  }

  console.log("Database synced successfully!");
  await connection.end();
}

sync().catch(err => {
  console.error("Sync failed:", err);
  process.exit(1);
});
