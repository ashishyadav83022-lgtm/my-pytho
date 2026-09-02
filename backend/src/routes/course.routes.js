const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const {
  getCategories,
  createCategory,
  browseCourses,
  getCourseDetails,
  createCourse,
  updateCourse,
  deleteCourse,
} = require("../controllers/course.controller");
const { protect, optionalAuth } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");

const courseValidation = [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("level").optional().isIn(["beginner", "intermediate", "advanced"]).withMessage("Invalid level"),
  body("durationHours").optional().isInt({ min: 0 }).withMessage("Duration must be a positive number"),
  body("categoryId").optional().isInt().withMessage("categoryId must be an integer"),
  body("status").optional().isIn(["draft", "published", "archived"]).withMessage("Invalid status"),
];

const categoryValidation = [
  body("name").trim().notEmpty().withMessage("Category name is required"),
];

router.get("/categories", getCategories);
router.post("/categories", protect, authorize("admin"), categoryValidation, createCategory);

router.get("/", optionalAuth, browseCourses);
router.get("/:id", getCourseDetails);

router.post("/", protect, authorize("trainer", "admin"), courseValidation, createCourse);
router.put("/:id", protect, authorize("trainer", "admin"), courseValidation, updateCourse);
router.delete("/:id", protect, authorize("trainer", "admin"), deleteCourse);

module.exports = router;