// sql/init-db-sqlite.js

const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "database.sqlite");
const db = new sqlite3.Database(dbPath);

// ===============================
// DB TABLE CREATION
// ===============================
db.serialize(() => {

  console.log("🔧 Initializing SQLite database...");

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT CHECK(role IN ('candidate', 'employer')) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employer_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      location TEXT,
      salary TEXT,
      skills TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employer_id) REFERENCES users(id)
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER,
      candidate_id INTEGER,
      resume TEXT,
      match_score INTEGER,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (job_id) REFERENCES jobs(id),
      FOREIGN KEY (candidate_id) REFERENCES users(id)
    );
  `);

});

// ===============================

db.close(() => console.log("✅ SQLite initialized successfully"));
