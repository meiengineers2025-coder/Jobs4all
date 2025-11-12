// ===== server.js =====
// Express + SQLite + WhatsApp Stub + EJS Views + Safe for Render

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
  if (err) {
    console.error("❌ Failed to connect to database:", err.message);
  } else {
    console.log("✅ SQLite connected successfully");
  }
});

// Create a sample users table if not exists
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

// ====== 5. WHATSAPP STUB SERVICE ======
const whatsappService = {
  sendMessage: async (to, text) => {
    console.log(`[stub whatsapp] would send to ${to}: ${text}`);
    return { ok: true, stub: true };
  },
};

// ====== 6. ROUTES ======

// Home page (renders index.ejs)
app.get("/", (req, res) => {
  res.render("index");
});

// Login page
app.get("/login", (req, res) => {
  res.render("login");
});

// Register page
app.get("/register", (req, res) => {
  res.render("register");
});

// Dashboard (protected route example)
app.get("/dashboard", (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }
  res.render("dashboard", { user: req.session.user });
});

// Get users (API)
app.get("/users", (req, res) => {
  db.all("SELECT id, name, email FROM users", [], (err, rows) => {
    if (err) return res.status(500).send("DB error");
    res.json(rows);
  });
});

// Register new user (POST)
app.post("/register", (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).send("Missing fields");

  db.run(
    "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
    [name, email, password],
    function (err) {
      if (err) {
        console.error(err);
        return res.status(500).send("User already exists or DB error");
      }
      console.log(`✅ User registered: ${email}`);
      res.redirect("/login");
    }
  );
});

// Login (POST)
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  db.get(
    "SELECT * FROM users WHERE email = ? AND password = ?",
    [email, password],
    (err, user) => {
      if (err) return res.status(500).send("DB error");
      if (!user) return res.status(401).send("Invalid credentials");
      req.session.userId = user.id;
      req.session.user = user;
      console.log(`✅ User logged in: ${user.email}`);
      res.redirect("/dashboard");
    }
  );
});

// WhatsApp Test Route
app.get("/test-whatsapp", async (req, res) => {
  const result = await whatsappService.sendMessage("9999999999", "Hello from Render!");
  res.json(result);
});

// ====== 7. SERVER START ======
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));