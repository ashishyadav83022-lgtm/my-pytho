const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const {
  getModules,
  createModule,
  updateModule,
  deleteModule,
  createLesson,
  getLesson,
  updateLesson,
  deleteLesson,
  completeLesson,
  uncompleteLesson,
  getCourseProgress,
  getNote,
  saveNote,
  deleteNote,
} = require("../controllers/learning.controller");
const { protect, optionalAuth } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");

const moduleValidation = [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("orderIndex").optional().isInt({ min: 0 }).withMessage("orderIndex must be a positive integer"),
];

const lessonValidation = [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("videoUrl").optional().isURL().withMessage("videoUrl must be a valid URL"),
  body("resourceUrl").optional().isURL().withMessage("resourceUrl must be a valid URL"),
  body("durationMinutes").optional().isInt({ min: 0 }).withMessage("durationMinutes must be a positive integer"),
];

const noteValidation = [body("content").trim().notEmpty().withMessage("Note content is required")];

// Modules (nested under a course)
router.get("/courses/:courseId/modules", optionalAuth, getModules);
router.post("/courses/:courseId/modules", protect, authorize("trainer", "admin"), moduleValidation, createModule);
router.put("/modules/:id", protect, authorize("trainer", "admin"), moduleValidation, updateModule);
router.delete("/modules/:id", protect, authorize("trainer", "admin"), deleteModule);

// Lessons (nested under a module)
router.post("/modules/:moduleId/lessons", protect, authorize("trainer", "admin"), lessonValidation, createLesson);
router.get("/lessons/:id", protect, getLesson);
router.put("/lessons/:id", protect, authorize("trainer", "admin"), lessonValidation, updateLesson);
router.delete("/lessons/:id", protect, authorize("trainer", "admin"), deleteLesson);

// Lesson completion
router.post("/lessons/:id/complete", protect, completeLesson);
router.delete("/lessons/:id/complete", protect, uncompleteLesson);

// Course progress
router.get("/courses/:courseId/progress", protect, getCourseProgress);

// Notes
router.get("/lessons/:lessonId/notes", protect, getNote);
router.put("/lessons/:lessonId/notes", protect, noteValidation, saveNote);
router.delete("/lessons/:lessonId/notes", protect, deleteNote);

module.exports = router;