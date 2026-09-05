const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const {
  createAnnouncement,
  getAnnouncements,
  getAnnouncementDetails,
  updateAnnouncement,
  deleteAnnouncement,
} = require("../controllers/announcement.controller");
const { protect } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");

const announcementValidation = [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("content").trim().notEmpty().withMessage("Content is required"),
  body("targetRole").optional().isIn(["all", "trainee", "trainer", "admin"]).withMessage("Invalid targetRole"),
  body("priority").optional().isIn(["low", "normal", "high"]).withMessage("Invalid priority"),
  body("courseId").optional().isInt().withMessage("courseId must be an integer"),
];

router.post("/", protect, authorize("trainer", "admin"), announcementValidation, createAnnouncement);
router.get("/", protect, getAnnouncements);
router.get("/:id", protect, getAnnouncementDetails);
router.put("/:id", protect, authorize("trainer", "admin"), announcementValidation, updateAnnouncement);
router.delete("/:id", protect, authorize("trainer", "admin"), deleteAnnouncement);

module.exports = router;