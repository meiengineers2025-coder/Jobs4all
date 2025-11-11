// src/services/aiMatch.js

/**
 * AI Resume Matching (very lightweight)
 * Matches skills from job listing vs resume text
 */

function calculateMatchScore(jobSkills, resumeText) {
  if (!jobSkills || !resumeText) return 0;

  const skills = jobSkills.toLowerCase().split(",");
  const resume = resumeText.toLowerCase();

  let matches = 0;

  skills.forEach((skill) => {
    if (resume.includes(skill.trim())) {
      matches++;
    }
  });

  const score = Math.round((matches / skills.length) * 100);
  return isNaN(score) ? 0 : score;
}


module.exports = { calculateMatchScore };
