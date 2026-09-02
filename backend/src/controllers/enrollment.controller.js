const enrollmentService = require('../services/enrollment.service');

const enroll = async (req, res, next) => {
  try {
    const result = await enrollmentService.enrollUser(req.user.id, req.params.courseId);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getMyEnrollments = async (req, res, next) => {
  try {
    const enrollments = await enrollmentService.getMyEnrollments(req.user.id, req.query.status);
    res.status(200).json({ success: true, data: enrollments });
  } catch (error) {
    next(error);
  }
};

const getStatus = async (req, res, next) => {
  try {
    const status = await enrollmentService.getEnrollmentStatus(req.params.courseId, req.user.id);
    res.status(200).json({ success: true, data: status });
  } catch (error) {
    next(error);
  }
};

const unenroll = async (req, res, next) => {
  try {
    const result = await enrollmentService.unenroll(req.params.courseId, req.user.id);
    res.status(200).json({ success: true, message: "Unenrolled successfully", data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = { enroll, getMyEnrollments, getStatus, unenroll };