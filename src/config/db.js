// src/config/db.js
const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

// Ensure /sql directory exists at project root
const sqlDir = path.join(__dirname, "../../sql");
if (!fs.existsSync(sqlDir)) fs.mkdirSync(sqlDir, { recursive: true });

const dbPath = path.join(sqlDir, "database.sqlite");

// Open / create database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ SQLite connection error:", err);
  } else {
    console.log("✅ SQLite connected:", dbPath);
  }
});

// Initialize schema (run once on startup)
db.serialize(() => {
  // Safety: enforce foreign keys
  db.run("PRAGMA foreign_keys = ON;");

  // USERS
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT CHECK (role IN ('candidate','employer','admin')) NOT NULL DEFAULT 'candidate',
      name TEXT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      phone TEXT,
      location TEXT,
      headline TEXT,
      bio TEXT,
      skills TEXT,                 -- JSON array of skills
      resume_path TEXT,            -- stored file path
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`);

  // COMPANIES
  db.run(`
    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      website TEXT,
      description TEXT,
      logo_path TEXT,
      owner_user_id INTEGER,       -- typically an employer user
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  // JOBS
  db.run(`
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      location TEXT,
      type TEXT,                   -- Full-time, Part-time, Contract, Remote
      salary_min INTEGER,
      salary_max INTEGER,
      currency TEXT DEFAULT 'USD',
      status TEXT DEFAULT 'open',  -- open, closed, paused
      company_id INTEGER,
      employer_user_id INTEGER,    -- who posted
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY (employer_user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_jobs_employer ON jobs(employer_user_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);`);

  // APPLICATIONS
  db.run(`
    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL,
      candidate_user_id INTEGER NOT NULL,
      cover_letter TEXT,
      resume_path TEXT,            -- snapshot at time of apply
      status TEXT DEFAULT 'applied',  -- applied, shortlisted, rejected, hired
      match_score REAL,            -- AI score 0..100
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(job_id, candidate_user_id),
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
      FOREIGN KEY (candidate_user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_apps_job ON applications(job_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_apps_user ON applications(candidate_user_id);`);
});

// Export db handle for use in routes/services

module.exports = db;
