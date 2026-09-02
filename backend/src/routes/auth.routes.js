const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const { register, login, logout, getMe } = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");

router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("role").optional().isIn(["trainee", "trainer"]).withMessage("Role must be trainee or trainer"),
  ],
  register
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  login
);

router.post("/logout", protect, logout);
router.get("/me", protect, getMe);

// Temporary test route to confirm role middleware works — safe to remove or repurpose later
router.get("/admin-only", protect, authorize("admin"), (req, res) => {
  res.status(200).json({ success: true, message: `Welcome, admin ${req.user.email}` });
});

module.exports = router;