// src/models/User.js

const db = require("../config/db");

const User = {
  create: (name, email, password, role, callback) => {
    const query = `
      INSERT INTO users (name, email, password, role)
      VALUES (?, ?, ?, ?)
    `;
    db.run(query, [name, email, password, role], function (err) {
      callback(err, this?.lastID);
    });
  },

  findByEmail: (email, callback) => {
    db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, row) => {
      callback(err, row);
    });
  },

  findById: (id, callback) => {
    db.get(`SELECT * FROM users WHERE id = ?`, [id], (err, row) => {
      callback(err, row);
    });
  }
};

module.exports = User;