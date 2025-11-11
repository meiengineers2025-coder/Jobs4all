// src/routes/jobs.js

const express = require("express");
const router = express.Router();
const Job = require("../models/Job");
const { requireAuth } = require("../utils/access");

// List all jobs (candidate job board)
router.get("/", requireAuth, (req, res) => {
  Job.list((err, jobs) => {
    if (err) return res.send("Error loading jobs");

    res.render("candidate/jobs", {
      user: req.session.user,
      jobs,
    });
  });
});

// Show job details
router.get("/:id", requireAuth, (req, res) => {
  Job.findById(req.params.id, (err, job) => {
    if (!job) return res.send("Job not found");

    res.render("candidate/job-details", {
      user: req.session.user,
      job,
    });
  });
});

module.exports = router;