// ===== server.js =====
// Jobs Portal — Full Version (SQLite + EJS + OAuth + Admin Panel)

const express = require("express");
const session = require("express-session");
const SQLiteStore = require("connect-sqlite3")(session);
const expressLayouts = require("express-ejs-layouts");
const path = require("path");
const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const LinkedInStrategy = require("passport-linkedin-oauth2").Strategy;

dotenv.config();
const app = express();

// ===== Setup Directories =====
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_FILE = path.join(DATA_DIR, "database.sqlite");

// ===== SQLite Setup =====
const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) console.error("❌ DB error:", err.message);
  else console.log("✅ SQLite connected successfully");
});

db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT,
    provider TEXT,
    role TEXT DEFAULT 'user'
  )
`);

// ===== Express Config =====
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressLayouts);
app.set("layout", "layouts/main");

// ===== Session =====
app.use(
  session({
    store: new SQLiteStore({ db: "sessions.sqlite", dir: DATA_DIR }),
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: false,
  })
);

// ===== Passport =====
app.use(passport.initialize());
app.use(passport.session());

// Serialize / Deserialize
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  db.get("SELECT * FROM users WHERE id = ?", [id], (err, row) => done(err, row));
});

// ===== GOOGLE AUTH =====
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BASE_URL}/auth/google/callback`,
    },
    (accessToken, refreshToken, profile, done) => {
      const email = profile.emails[0].value;
      const name = profile.displayName;
      db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
        if (user) return done(null, user);
        db.run(
          "INSERT INTO users (name, email, provider, role) VALUES (?, ?, ?, ?)",
          [name, email, "google", "user"],
          function (err2) {
            if (err2) return done(err2);
            db.get("SELECT * FROM users WHERE id = ?", [this.lastID], (e, newUser) => done(e, newUser));
          }
        );
      });
    }
  )
);

// ===== FACEBOOK AUTH =====
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      callbackURL: `${process.env.BASE_URL}/auth/facebook/callback`,
      profileFields: ["id", "emails", "displayName"],
    },
    (accessToken, refreshToken, profile, done) => {
      const email = profile.emails ? profile.emails[0].value : `${profile.id}@facebook.com`;
      const name = profile.displayName || "Facebook User";
      db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
        if (user) return done(null, user);
        db.run(
          "INSERT INTO users (name, email, provider, role) VALUES (?, ?, ?, ?)",
          [name, email, "facebook", "user"],
          function (err2) {
            if (err2) return done(err2);
            db.get("SELECT * FROM users WHERE id = ?", [this.lastID], (e, newUser) => done(e, newUser));
          }
        );
      });
    }
  )
);

// ===== LINKEDIN AUTH =====
passport.use(
  new LinkedInStrategy(
    {
      clientID: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      callbackURL: `${process.env.BASE_URL}/auth/linkedin/callback`,
      scope: ["r_emailaddress", "r_liteprofile"],
    },
    (accessToken, refreshToken, profile, done) => {
      const email = profile.emails ? profile.emails[0].value : `${profile.id}@linkedin.com`;
      const name = profile.displayName || "LinkedIn User";
      db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
        if (user) return done(null, user);
        db.run(
          "INSERT INTO users (name, email, provider, role) VALUES (?, ?, ?, ?)",
          [name, email, "linkedin", "user"],
          function (err2) {
            if (err2) return done(err2);
            db.get("SELECT * FROM users WHERE id = ?", [this.lastID], (e, newUser) => done(e, newUser));
          }
        );
      });
    }
  )
);

// ===== Globals for Layout =====
app.use((req, res, next) => {
  res.locals.user = req.session?.user || req.user || null;
  next();
});

// ===== USER ROUTES =====
app.get("/", (req, res) => res.render("index", { title: "Home" }));

// Register
app.get("/register", (req, res) => res.render("register", { title: "Register", message: null }));
app.post("/register", (req, res) => {
  const { name, email, password } = req.body;
  db.run(
    "INSERT INTO users (name, email, password, provider, role) VALUES (?, ?, ?, ?, ?)",
    [name, email, password, "local", "user"],
    (err) => {
      if (err) return res.render("register", { title: "Register", message: "User already exists." });
      res.redirect("/login");
    }
  );
});

// Login
app.get("/login", (req, res) => res.render("login", { title: "Login", message: null }));
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  db.get("SELECT * FROM users WHERE email = ? AND password = ?", [email, password], (err, user) => {
    if (err || !user) return res.render("login", { title: "Login", message: "Invalid credentials." });
    req.session.user = user;
    req.session.userId = user.id;
    res.redirect("/dashboard");
  });
});

// OAuth Routes
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
app.get("/auth/google/callback", passport.authenticate("google", { failureRedirect: "/login" }), (req, res) => {
  req.session.user = req.user;
  res.redirect("/dashboard");
});

app.get("/auth/facebook", passport.authenticate("facebook", { scope: ["email"] }));
app.get("/auth/facebook/callback", passport.authenticate("facebook", { failureRedirect: "/login" }), (req, res) => {
  req.session.user = req.user;
  res.redirect("/dashboard");
});

app.get("/auth/linkedin", passport.authenticate("linkedin"));
app.get("/auth/linkedin/callback", passport.authenticate("linkedin", { failureRedirect: "/login" }), (req, res) => {
  req.session.user = req.user;
  res.redirect("/dashboard");
});

// Dashboard
app.get("/dashboard", (req, res) => {
  if (!req.session.user && !req.user) return res.redirect("/login");
  const user = req.session.user || req.user;
  res.render("dashboard", { title: "Dashboard", user });
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

// ===== ADMIN ROUTES =====

// Admin Login Page
app.get("/admin/login", (req, res) => {
  res.render("admin-login", { title: "Admin Login", message: null });
});

// Admin Login
app.post("/admin/login", (req, res) => {
  const { email, password } = req.body;
  db.get(
    "SELECT * FROM users WHERE email = ? AND password = ? AND role = 'admin'",
    [email, password],
    (err, admin) => {
      if (err || !admin)
        return res.render("admin-login", { title: "Admin Login", message: "Invalid credentials." });

      req.session.adminId = admin.id;
      req.session.admin = admin;
      res.redirect("/admin/dashboard");
    }
  );
});

// Admin Dashboard
app.get("/admin/dashboard", (req, res) => {
  if (!req.session.adminId) return res.redirect("/admin/login");

  db.all("SELECT id, name, email, provider, role FROM users", [], (err, users) => {
    if (err) return res.status(500).send("Database error");
    res.render("admin-dashboard", {
      title: "Admin Dashboard",
      admin: req.session.admin,
      users,
    });
  });
});

// Admin Logout
app.get("/admin/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/admin/login"));
});

// ===== Start Server =====
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));