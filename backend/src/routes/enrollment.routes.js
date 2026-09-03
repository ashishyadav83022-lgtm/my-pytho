const express = require("express");
const router = express.Router();
const { enroll, getMyEnrollments, getStatus, unenroll } = require("../controllers/enrollment.controller");
const { protect } = require("../middleware/auth.middleware");

router.post("/courses/:courseId", protect, enroll);
router.get("/me", protect, getMyEnrollments);
router.get("/courses/:courseId/status", protect, getStatus);
router.delete("/courses/:courseId", protect, unenroll);

module.exports = router;