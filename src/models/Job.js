// src/models/Job.js

const db = require("../config/db");

const Job = {
  create: (employer_id, title, description, location, salary, skills, callback) => {
    const query = `
      INSERT INTO jobs (employer_id, title, description, location, salary, skills)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    db.run(
      query,
      [employer_id, title, description, location, salary, skills],
      function (err) {
        callback(err, this?.lastID);
      }
    );
  },

  list: (callback) => {
    db.all(`SELECT jobs.*, users.name AS employer_name FROM jobs 
            LEFT JOIN users ON jobs.employer_id = users.id
            ORDER BY jobs.created_at DESC`,
      [],
      (err, rows) => {
        callback(err, rows);
      }
    );
  },

  findById: (id, callback) => {
    db.get(`SELECT * FROM jobs WHERE id = ?`, [id], (err, row) => {
      callback(err, row);
    });
  },

  findByEmployer: (employer_id, callback) => {
    db.all(`SELECT * FROM jobs WHERE employer_id = ? ORDER BY created_at DESC`,
      [employer_id],
      (err, rows) => {
        callback(err, rows);
      }
    );
  }
};

module.exports = Job;