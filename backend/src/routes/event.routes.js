const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const {
  createEvent,
  getAllEvents,
  getMyEvents,
  getEventDetails,
  updateEvent,
  deleteEvent,
  register,
  cancelRegistration,
  getEventRegistrations,
} = require("../controllers/event.controller");
const { protect } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");

const eventValidation = [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("eventDate").isISO8601().withMessage("eventDate must be a valid date (e.g. 2026-09-15T10:00:00)"),
  body("eventType").optional().isIn(["workshop", "webinar", "exam", "meeting", "other"]).withMessage("Invalid eventType"),
  body("durationMinutes").optional().isInt({ min: 0 }).withMessage("durationMinutes must be a positive integer"),
  body("maxParticipants").optional().isInt({ min: 1 }).withMessage("maxParticipants must be a positive integer"),
  body("courseId").optional().isInt().withMessage("courseId must be an integer"),
];

router.get("/me", protect, getMyEvents);
router.get("/", getAllEvents);

router.post("/", protect, authorize("trainer", "admin"), eventValidation, createEvent);
router.get("/:id", getEventDetails);
router.put("/:id", protect, authorize("trainer", "admin"), eventValidation, updateEvent);
router.delete("/:id", protect, authorize("trainer", "admin"), deleteEvent);

router.post("/:id/register", protect, register);
router.delete("/:id/register", protect, cancelRegistration);
router.get("/:id/registrations", protect, authorize("trainer", "admin"), getEventRegistrations);

module.exports = router;