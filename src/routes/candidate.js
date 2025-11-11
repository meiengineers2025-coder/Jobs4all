// src/routes/candidate.js

const express = require("express");
const router = express.Router();

const Application = require("../models/Application");
const Job = require("../models/Job");

const { requireAuth, isCandidate } = require("../utils/access");

// CANDIDATE DASHBOARD (Shows applied jobs + match score)
router.get("/dashboard", requireAuth, isCandidate, (req, res) => {
  const candidate_id = req.session.user.id;

  Application.findByCandidate(candidate_id, (err, applications) => {
    res.render("candidate/dashboard", {
      user: req.session.user,
      applications,
    });
  });
});

// CANDIDATE PROFILE PAGE
router.get("/profile", requireAuth, isCandidate, (req, res) => {
  res.render("candidate/profile", {
    user: req.session.user,
    message: null,
  });
});

// SAVE PROFILE UPDATE (later we can store resume permanently)
router.post("/profile", requireAuth, isCandidate, (req, res) => {
  // currently frontend-only for premium UI profile page
  res.render("candidate/profile", {
    user: req.session.user,
    message: "Profile updated 👍",
  });
});

module.exports = router;