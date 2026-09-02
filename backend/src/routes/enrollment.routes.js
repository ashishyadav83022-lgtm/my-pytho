const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollment.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.post('/courses/:courseId', enrollmentController.enroll);
router.get('/my-courses', enrollmentController.getMyEnrollments);
router.get('/status/:courseId', enrollmentController.getStatus);
router.delete('/courses/:courseId', enrollmentController.unenroll);

module.exports = router;