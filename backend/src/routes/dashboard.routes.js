const express = require("express");
const router = express.Router();
const { getMyDashboard } = require("../controllers/dashboard.controller");
const { protect } = require("../middleware/auth.middleware");

router.get("/me", protect, getMyDashboard);

module.exports = router;