// src/utils/access.js

// Checks if user is logged in
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
}

// Checks if user is a candidate
function isCandidate(req, res, next) {
  if (req.session.user?.role !== "candidate") {
    return res.status(403).send("Access denied");
  }
  next();
}

// Checks if user is an employer
function isEmployer(req, res, next) {
  if (req.session.user?.role !== "employer") {
    return res.status(403).send("Access denied");
  }
  next();
}

module.exports = {
  requireAuth,
  isCandidate,
  isEmployer,

};
