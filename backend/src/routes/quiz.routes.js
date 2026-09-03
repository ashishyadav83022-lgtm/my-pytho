const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const {
  createQuiz,
  getCourseQuizzes,
  getQuizDetails,
  updateQuiz,
  deleteQuiz,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  submitQuiz,
  getMyAttempts,
  getAttemptResult,
} = require("../controllers/quiz.controller");
const { protect } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");

const quizValidation = [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("passingScore").optional().isInt({ min: 0, max: 100 }).withMessage("passingScore must be 0-100"),
  body("timeLimitMinutes").optional().isInt({ min: 0 }).withMessage("timeLimitMinutes must be a positive integer"),
];

const questionValidation = [
  body("questionText").trim().notEmpty().withMessage("questionText is required"),
  body("options").isArray({ min: 2 }).withMessage("options must be an array with at least 2 items"),
  body("correctOptionIndex").isInt({ min: 0 }).withMessage("correctOptionIndex is required"),
];

const submitValidation = [
  body("answers").isArray().withMessage("answers must be an array"),
  body("answers.*.questionId").isInt().withMessage("Each answer needs a valid questionId"),
  body("answers.*.selectedIndex").isInt({ min: 0 }).withMessage("Each answer needs a valid selectedIndex"),
];

router.post("/courses/:courseId", protect, authorize("trainer", "admin"), quizValidation, createQuiz);
router.get("/courses/:courseId", getCourseQuizzes);

router.get("/attempts/:attemptId", protect, getAttemptResult);

router.get("/:id", protect, getQuizDetails);
router.put("/:id", protect, authorize("trainer", "admin"), quizValidation, updateQuiz);
router.delete("/:id", protect, authorize("trainer", "admin"), deleteQuiz);

router.post("/:quizId/questions", protect, authorize("trainer", "admin"), questionValidation, addQuestion);
router.put("/questions/:id", protect, authorize("trainer", "admin"), questionValidation, updateQuestion);
router.delete("/questions/:id", protect, authorize("trainer", "admin"), deleteQuestion);

router.post("/:id/submit", protect, submitValidation, submitQuiz);
router.get("/:id/attempts", protect, getMyAttempts);

module.exports = router;