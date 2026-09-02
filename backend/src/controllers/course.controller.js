const { validationResult } = require("express-validator");
const courseService = require("../services/course.service");

const getCategories = async (req, res, next) => {
  try {
    const categories = await courseService.getCategories();
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: "Validation failed", errors: errors.array() });
    }
    const category = await courseService.createCategory(req.body);
    res.status(201).json({ success: true, message: "Category created", data: category });
  } catch (error) {
    next(error);
  }
};

const browseCourses = async (req, res, next) => {
  try {
    const { search, category, level, trainerId, status, page, limit } = req.query;

    let effectiveStatus = "published";
    if (status && req.user && (req.user.role === "admin" || req.user.role === "trainer")) {
      effectiveStatus = status;
    }

    const result = await courseService.getAllCourses({
      search,
      category,
      level,
      trainerId,
      status: effectiveStatus,
      page,
      limit,
    });

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const getCourseDetails = async (req, res, next) => {
  try {
    const course = await courseService.getCourseById(req.params.id);
    res.status(200).json({ success: true, data: course });
  } catch (error) {
    next(error);
  }
};

const createCourse = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: "Validation failed", errors: errors.array() });
    }
    const course = await courseService.createCourse(req.body, req.user.id);
    res.status(201).json({ success: true, message: "Course created", data: course });
  } catch (error) {
    next(error);
  }
};

const updateCourse = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: "Validation failed", errors: errors.array() });
    }
    const course = await courseService.updateCourse(req.params.id, req.body, req.user);
    res.status(200).json({ success: true, message: "Course updated", data: course });
  } catch (error) {
    next(error);
  }
};

const deleteCourse = async (req, res, next) => {
  try {
    await courseService.deleteCourse(req.params.id, req.user);
    res.status(200).json({ success: true, message: "Course deleted" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  createCategory,
  browseCourses,
  getCourseDetails,
  createCourse,
  updateCourse,
  deleteCourse,
};