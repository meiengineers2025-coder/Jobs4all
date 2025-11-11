// src/routes/employer.js

const express = require("express");
const router = express.Router();

const Job = require("../models/Job");
const Application = require("../models/Application");

const { requireAuth, isEmployer } = require("../utils/access");

// EMPLOYER DASHBOARD (list all jobs posted)
router.get("/dashboard", requireAuth, isEmployer, (req, res) => {
  const employer_id = req.session.user.id;

  Job.findByEmployer(employer_id, (err, jobs) => {
    res.render("employer/dashboard", {
      user: req.session.user,
      jobs,
    });
  });
});

// POST JOB PAGE (form)
router.get("/post-job", requireAuth, isEmployer, (req, res) => {
  res.render("employer/post-job", {
    user: req.session.user,
    message: null,
  });
});

// SAVE NEW JOB POST
router.post("/post-job", requireAuth, isEmployer, (req, res) => {
  const { title, description, location, salary, skills } = req.body;

  if (!title || !skills) {
    return res.render("employer/post-job", {
      user: req.session.user,
      message: "Title and Skills are required",
    });
  }

  Job.create(
    req.session.user.id,
    title,
    description,
    location,
    salary,
    skills,
    () => {
      res.redirect("/employer/dashboard");
    }
  );
});

// VIEW APPLICANTS FOR A JOB
router.get("/applicants/:jobId", requireAuth, isEmployer, (req, res) => {
  Application.findByJob(req.params.jobId, (err, applicants) => {
    res.render("employer/applicants", {
      user: req.session.user,
      applicants,
    });
  });
});

// EMPLOYER PLAN PAGE (payments - razorpay/paypal)
router.get("/plans", requireAuth, isEmployer, (req, res) => {
  res.render("employer/plans", {
    user: req.session.user,
  });
});

module.exports = router;