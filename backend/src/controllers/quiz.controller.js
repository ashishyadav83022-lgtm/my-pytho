const { validationResult } = require("express-validator");
const quizService = require("../services/quiz.service");

const checkValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, message: "Validation failed", errors: errors.array() });
    return false;
  }
  return true;
};

const createQuiz = async (req, res, next) => {
  try {
    if (!checkValidation(req, res)) return;
    const quiz = await quizService.createQuiz(req.params.courseId, req.body, req.user);
    res.status(201).json({ success: true, message: "Quiz created", data: quiz });
  } catch (error) {
    next(error);
  }
};

const getCourseQuizzes = async (req, res, next) => {
  try {
    const quizzes = await quizService.getCourseQuizzes(req.params.courseId);
    res.status(200).json({ success: true, data: quizzes });
  } catch (error) {
    next(error);
  }
};

const getQuizDetails = async (req, res, next) => {
  try {
    const quiz = await quizService.getQuizDetails(req.params.id, req.user);
    res.status(200).json({ success: true, data: quiz });
  } catch (error) {
    next(error);
  }
};

const updateQuiz = async (req, res, next) => {
  try {
    if (!checkValidation(req, res)) return;
    const quiz = await quizService.updateQuiz(req.params.id, req.body, req.user);
    res.status(200).json({ success: true, message: "Quiz updated", data: quiz });
  } catch (error) {
    next(error);
  }
};

const deleteQuiz = async (req, res, next) => {
  try {
    await quizService.deleteQuiz(req.params.id, req.user);
    res.status(200).json({ success: true, message: "Quiz deleted" });
  } catch (error) {
    next(error);
  }
};

const addQuestion = async (req, res, next) => {
  try {
    if (!checkValidation(req, res)) return;
    const question = await quizService.addQuestion(req.params.quizId, req.body, req.user);
    res.status(201).json({ success: true, message: "Question added", data: question });
  } catch (error) {
    next(error);
  }
};

const updateQuestion = async (req, res, next) => {
  try {
    if (!checkValidation(req, res)) return;
    const question = await quizService.updateQuestion(req.params.id, req.body, req.user);
    res.status(200).json({ success: true, message: "Question updated", data: question });
  } catch (error) {
    next(error);
  }
};

const deleteQuestion = async (req, res, next) => {
  try {
    await quizService.deleteQuestion(req.params.id, req.user);
    res.status(200).json({ success: true, message: "Question deleted" });
  } catch (error) {
    next(error);
  }
};

const submitQuiz = async (req, res, next) => {
  try {
    if (!checkValidation(req, res)) return;
    const attempt = await quizService.submitQuiz(req.params.id, req.user.id, req.body.answers, req.user);
    res.status(201).json({ success: true, message: "Quiz submitted", data: attempt });
  } catch (error) {
    next(error);
  }
};

const getMyAttempts = async (req, res, next) => {
  try {
    const attempts = await quizService.getMyAttempts(req.params.id, req.user.id);
    res.status(200).json({ success: true, data: attempts });
  } catch (error) {
    next(error);
  }
};

const getAttemptResult = async (req, res, next) => {
  try {
    const attempt = await quizService.getAttemptResult(req.params.attemptId, req.user);
    res.status(200).json({ success: true, data: attempt });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};