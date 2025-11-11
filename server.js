require("dotenv").config();
const express = require("express");
const path = require("path");
const session = require("express-session");
const SQLiteStore = require("connect-sqlite3")(session);

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------
// MIDDLEWARE
// ---------------------

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Public static files (CSS, JS, Images)
app.use(express.static(path.join(__dirname, "public")));

// Session management stored in SQLite (persistent)
app.use(
    session({
        store: new SQLiteStore({ db: "sessions.sqlite", dir: "./sql" }),
        secret: process.env.SESSION_SECRET || "jobportal-secret-key",
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 24 * 60 * 60 * 1000, // 1 day
        }
    })
);

// Expose logged-in user + messages to views
app.use((req, res, next) => {
    res.locals.user = req.session.user;
    res.locals.message = req.session.message;
    delete req.session.message;
    next();
});

// ---------------------
// VIEW ENGINE
// ---------------------

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));


// ---------------------
// ROUTES
// ---------------------

const authRoutes = require("./src/routes/auth");
const candidateRoutes = require("./src/routes/candidate");
const employerRoutes = require("./src/routes/employer");
const jobsRoutes = require("./src/routes/jobs");
const applicationsRoutes = require("./src/routes/applications");
const aiRoutes = require("./src/routes/ai");

app.use("/", authRoutes);
app.use("/candidate", candidateRoutes);
app.use("/employer", employerRoutes);
app.use("/jobs", jobsRoutes);
app.use("/applications", applicationsRoutes);
app.use("/ai", aiRoutes);


// ---------------------
// START SERVER
// ---------------------

app.listen(PORT, () => {
    console.log(`🚀 Job Portal running at http://localhost:${PORT}`);
});