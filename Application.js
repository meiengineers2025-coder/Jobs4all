// src/models/Application.js

const db = require("../config/db");

const Application = {
  create: (job_id, candidate_id, resumePath, matchScore, callback) => {
    const query = `
      INSERT INTO applications (job_id, candidate_id, resume, match_score)
      VALUES (?, ?, ?, ?)
    `;
    db.run(query, [job_id, candidate_id, resumePath, matchScore], function (err) {
      callback(err, this?.lastID);
    });
  },

  findByJob: (job_id, callback) => {
    const query = `
      SELECT applications.*, users.name AS candidate_name, users.email AS candidate_email
      FROM applications
      LEFT JOIN users ON applications.candidate_id = users.id
      WHERE job_id = ?
      ORDER BY applied_at DESC
    `;
    db.all(query, [job_id], (err, rows) => callback(err, rows));
  },

  findByCandidate: (candidate_id, callback) => {
    db.all(
      `SELECT applications.*, jobs.title AS job_title
       FROM applications
       LEFT JOIN jobs ON applications.job_id = jobs.id
       WHERE candidate_id = ?
       ORDER BY applied_at DESC`,
      [candidate_id],
      (err, rows) => callback(err, rows)
    );
  }
};

module.exports = Application;