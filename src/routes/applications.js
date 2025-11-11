// src/routes/applications.js

const express = require("express");
const router = express.Router();
const upload = require("../utils/upload");
const Application = require("../models/Application");
const Job = require("../models/Job");

const { calculateMatchScore } = require("../services/aiMatch");
const { sendWhatsAppMessage } = require("../services/whatsapp");
const { requireAuth, isCandidate } = require("../utils/access");
const fs = require("fs");
const path = require("path");

// CJM: (Candidate Job Match)
// -------------------------------------------------
// APPLY FOR JOB
router.post(
  "/apply/:jobId",
  requireAuth,
  isCandidate,
  upload.single("resume"),
  (req, res) => {
    const job_id = req.params.jobId;
    const candidate_id = req.session.user.id;

    if (!req.file) return res.send("Resume upload failed");

    // 🔍 Read resume text
    const resumeText = fs.readFileSync(
      path.join(__dirname, "../../public/resumes/", req.file.filename),
      "utf8"
    );

    // 🔍 Fetch job skills
    Job.findById(job_id, (err, job) => {
      if (!job) return res.send("Job not found");

      // ✅ AI Match Score calculation
      const score = calculateMatchScore(job.skills, resumeText);

      // ✅ Save application record
      Application.create(job_id, candidate_id, req.file.filename, score, () => {
        // OPTIONAL: Send WhatsApp to employer (if mobile exist)
        if (job.employer_mobile) {
          sendWhatsAppMessage(job.employer_mobile, `📢 New Job Application received!\n\nJob: ${job.title}\nMatch Score: ${score}%`);
        }

        return res.render("candidate/job-applied-success", {
          job,
          score,
        });
      });
    });
  }
);

// -------------------------------------------------
// Employer can view all applicants
router.get("/:jobId", requireAuth, (req, res) => {
  Application.findByJob(req.params.jobId, (err, applicants) => {
    res.render("employer/applicants", { applicants });
  });
});

module.exports = router;