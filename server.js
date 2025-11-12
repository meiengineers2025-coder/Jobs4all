// ===== server.js =====
// Express + SQLite + Sessions + EJS Views + Safe for Render

const express = require("express");
const session = require("express-session");
const SQLiteStore = require("connect-sqlite3")(session);
const path = require("path");
const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const dotenv = require("dotenv");

dotenv.config();
const app = express();

// ====== 1. PATHS & DIRECTORIES ======
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_FILE = path.join(DATA_DIR, "database.sqlite");
console.log("📁 Using SQLite DB at:", DB_FILE);

// ====== 2. DATABASE INIT ======
const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) console.error("❌ DB connection failed:", err.message);
  else console.log("✅ SQLite connected successfully");
});

db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT
  )
`);

// ====== 3. EXPRESS SETTINGS ======
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// ====== 4. SESSION STORE ======
app.use(
  session({
    store: new SQLiteStore({ db: "sessions.sqlite", dir: DATA_DIR }),
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: false,
  })
);

// ====== 5. ROUTES ======

// Home page
app.get("/", (req, res) => {
  res.render("index");
});

// Login page
app.get("/login", (req, res) => {
  res.render("login", { message: null });
});

// Register page
app.get("/register", (req, res) => {
  res.render("register", { message: null });
});

// Dashboard page (protected)
app.get("/dashboard", (req, res) => {
  if (!req.session.userId) return res.redirect("/login");
  res.render("dashboard", { user: req.session.user });
});

// Users list (for testing)
app.get("/users", (req, res) => {
  db.all("SELECT id, name, email FROM users", [], (err, rows) => {
    if (err) return res.status(500).send("DB error");
    res.json(rows);
  });
});

// Register new user
app.post("/register", (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.render("register", { message: "All fields required" });

  db.run(
    "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
    [name, email, password],
    (err) => {
      if (err) {
        console.error(err);
        return res.render("register", { message: "User already exists!" });
      }
      console.log(`✅ Registered: ${email}`);
      res.redirect("/login");
    }
  );
});

// Login user
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  db.get(
    "SELECT * FROM users WHERE email = ? AND password = ?",
    [email, password],
    (err, user) => {
      if (err) return res.render("login", { message: "DB error" });
      if (!user) return res.render("login", { message: "Invalid credentials" });

      req.session.userId = user.id;
      req.session.user = user;
      console.log(`✅ Logged in: ${email}`);
      res.redirect("/dashboard");
    }
  );
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

// ====== 6. SERVER START ======
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));