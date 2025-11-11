// src/routes/auth.js

const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");

// LOGIN PAGE
router.get("/login", (req, res) => {
  res.render("auth/login", { message: null });
});

// REGISTER PAGE
router.get("/register", (req, res) => {
  res.render("auth/register", { message: null });
});

// HANDLE REGISTER
router.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role)
    return res.render("auth/register", { message: "All fields are required" });

  User.findByEmail(email, async (err, existingUser) => {
    if (existingUser) {
      return res.render("auth/register", { message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    User.create(name, email, hashedPassword, role, (err) => {
      if (err) {
        return res.render("auth/register", { message: "Error creating account" });
      }
      return res.redirect("/login");
    });
  });
});

// HANDLE LOGIN
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  User.findByEmail(email, async (err, user) => {
    if (!user) return res.render("auth/login", { message: "Invalid login" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.render("auth/login", { message: "Invalid login" });
    }

    req.session.user = user;

    if (user.role === "employer") return res.redirect("/employer/dashboard");
    if (user.role === "candidate") return res.redirect("/candidate/dashboard");
  });
});

// LOGOUT
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

module.exports = router;