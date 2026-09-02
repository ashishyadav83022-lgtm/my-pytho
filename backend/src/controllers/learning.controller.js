const { validationResult } = require("express-validator");
const learningService = require("../services/learning.service");
const enrollmentService = require("../services/enrollment.service");

const checkValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, message: "Validation failed", errors: errors.array() });
    return false;
  }
  return true;
};

const getModules = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    const modules = await learningService.getModulesWithLessons(req.params.courseId, userId);
    res.status(200).json({ success: true, data: modules });
  } catch (error) {
    next(error);
  }
};

const createModule = async (req, res, next) => {
  try {
    if (!checkValidation(req, res)) return;
    const module = await learningService.createModule(req.params.courseId, req.body, req.user);
    res.status(201).json({ success: true, message: "Module created", data: module });
  } catch (error) {
    next(error);
  }
};

const updateModule = async (req, res, next) => {
  try {
    if (!checkValidation(req, res)) return;
    const module = await learningService.updateModule(req.params.id, req.body, req.user);
    res.status(200).json({ success: true, message: "Module updated", data: module });
  } catch (error) {
    next(error);
  }
};

const deleteModule = async (req, res, next) => {
  try {
    await learningService.deleteModule(req.params.id, req.user);
    res.status(200).json({ success: true, message: "Module deleted" });
  } catch (error) {
    next(error);
  }
};

const createLesson = async (req, res, next) => {
  try {
    if (!checkValidation(req, res)) return;
    const lesson = await learningService.createLesson(req.params.moduleId, req.body, req.user);
    res.status(201).json({ success: true, message: "Lesson created", data: lesson });
  } catch (error) {
    next(error);
  }
};

const getLesson = async (req, res, next) => {
  try {
    const lesson = await learningService.getLessonById(req.params.id);

    const isOwnerOrAdmin =
      req.user.role === "admin" ||
      (req.user.role === "trainer" && lesson.trainer_id === req.user.id);

    if (!isOwnerOrAdmin) {
      const enrolled = await enrollmentService.isUserEnrolled(lesson.course_id, req.user.id);
      if (!enrolled) {
        const error = new Error("You must be enrolled in this course to view this lesson");
        error.statusCode = 403;
        throw error;
      }
    }

    res.status(200).json({ success: true, data: lesson });
  } catch (error) {
    next(error);
  }
};

const updateLesson = async (req, res, next) => {
  try {
    if (!checkValidation(req, res)) return;
    const lesson = await learningService.updateLesson(req.params.id, req.body, req.user);
    res.status(200).json({ success: true, message: "Lesson updated", data: lesson });
  } catch (error) {
    next(error);
  }
};

const deleteLesson = async (req, res, next) => {
  try {
    await learningService.deleteLesson(req.params.id, req.user);
    res.status(200).json({ success: true, message: "Lesson deleted" });
  } catch (error) {
    next(error);
  }
};

const completeLesson = async (req, res, next) => {
  try {
    const result = await learningService.markLessonComplete(req.params.id, req.user.id);
    res.status(200).json({ success: true, message: "Lesson marked complete", data: result });
  } catch (error) {
    next(error);
  }
};

const uncompleteLesson = async (req, res, next) => {
  try {
    const result = await learningService.unmarkLessonComplete(req.params.id, req.user.id);
    res.status(200).json({ success: true, message: "Lesson marked incomplete", data: result });
  } catch (error) {
    next(error);
  }
};

const getCourseProgress = async (req, res, next) => {
  try {
    const progress = await learningService.getCourseProgress(req.params.courseId, req.user.id);
    res.status(200).json({ success: true, data: progress });
  } catch (error) {
    next(error);
  }
};

const getNote = async (req, res, next) => {
  try {
    const note = await learningService.getNote(req.params.lessonId, req.user.id);
    res.status(200).json({ success: true, data: note });
  } catch (error) {
    next(error);
  }
};

const saveNote = async (req, res, next) => {
  try {
    if (!checkValidation(req, res)) return;
    const note = await learningService.upsertNote(req.params.lessonId, req.user.id, req.body.content);
    res.status(200).json({ success: true, message: "Note saved", data: note });
  } catch (error) {
    next(error);
  }
};

const deleteNote = async (req, res, next) => {
  try {
    await learningService.deleteNote(req.params.lessonId, req.user.id);
    res.status(200).json({ success: true, message: "Note deleted" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};