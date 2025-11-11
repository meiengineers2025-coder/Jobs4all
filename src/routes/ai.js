// src/routes/ai.js

const express = require("express");
const router = express.Router();
const { calculateMatchScore } = require("../services/aiMatch");

/**
 * API endpoint to manually test AI score
 * Usage (POST):
 *    {
 *      "skills": "javascript, node, mysql",
 *      "resume": "I have worked on javascript and mysql"
 *    }
 */
router.post("/match", (req, res) => {
  const { skills, resume } = req.body;

  const score = calculateMatchScore(skills, resume);

  res.json({
    success: true,
    score: score,
  });
});


module.exports = router;
