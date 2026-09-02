const { query } = require("../config/db");

const enrollInCourse = async (courseId, userId) => {
  const courseResult = await query("SELECT id FROM courses WHERE id = $1", [courseId]);
  if (courseResult.rows.length === 0) {
    const error = new Error("Course not found");
    error.statusCode = 404;
    throw error;
  }

  const existing = await query(
    "SELECT id, status FROM enrollments WHERE user_id = $1 AND course_id = $2",
    [userId, courseId]
  );

  if (existing.rows.length > 0) {
    const enrollment = existing.rows[0];
    if (enrollment.status === "active" || enrollment.status === "completed") {
      const error = new Error("Already enrolled in this course");
      error.statusCode = 409;
      throw error;
    }
    // previously dropped -> reactivate the same record
    const reactivated = await query(
      `UPDATE enrollments SET status = 'active', enrolled_at = NOW(), completed_at = NULL
       WHERE id = $1 RETURNING *`,
      [enrollment.id]
    );
    return reactivated.rows[0];
  }

  const result = await query(
    `INSERT INTO enrollments (user_id, course_id, status) VALUES ($1, $2, 'active') RETURNING *`,
    [userId, courseId]
  );
  return result.rows[0];
};

const getMyEnrollments = async (userId, status) => {
  const conditions = ["e.user_id = $1"];
  const params = [userId];

  if (status) {
    conditions.push(`e.status = $2`);
    params.push(status);
  }

  const result = await query(
    `SELECT e.id, e.status, e.enrolled_at, e.completed_at,
            c.id AS course_id, c.title, c.description, c.level, c.thumbnail_url,
            u.name AS trainer_name
     FROM enrollments e
     JOIN courses c ON e.course_id = c.id
     LEFT JOIN users u ON c.trainer_id = u.id
     WHERE ${conditions.join(" AND ")}
     ORDER BY e.enrolled_at DESC`,
    params
  );
  return result.rows;
};

const getEnrollmentStatus = async (courseId, userId) => {
  const result = await query(
    "SELECT status, enrolled_at, completed_at FROM enrollments WHERE user_id = $1 AND course_id = $2",
    [userId, courseId]
  );

  if (result.rows.length === 0) {
    return { enrolled: false, status: null, enrolledAt: null, completedAt: null };
  }

  const row = result.rows[0];
  return {
    enrolled: row.status !== "dropped",
    status: row.status,
    enrolledAt: row.enrolled_at,
    completedAt: row.completed_at,
  };
};

const isUserEnrolled = async (courseId, userId) => {
  const result = await query(
    "SELECT 1 FROM enrollments WHERE user_id = $1 AND course_id = $2 AND status IN ('active','completed')",
    [userId, courseId]
  );
  return result.rows.length > 0;
};

const unenroll = async (courseId, userId) => {
  const result = await query(
    `UPDATE enrollments SET status = 'dropped'
     WHERE user_id = $1 AND course_id = $2 AND status != 'dropped'
     RETURNING *`,
    [userId, courseId]
  );

  if (result.rows.length === 0) {
    const error = new Error("Enrollment not found or already dropped");
    error.statusCode = 404;
    throw error;
  }
  return result.rows[0];
};

const markCompleted = async (courseId, userId) => {
  const result = await query(
    `UPDATE enrollments SET status = 'completed', completed_at = NOW()
     WHERE user_id = $1 AND course_id = $2 AND status = 'active'
     RETURNING *`,
    [userId, courseId]
  );

  if (result.rows.length === 0) {
    const error = new Error("Active enrollment not found");
    error.statusCode = 404;
    throw error;
  }
  return result.rows[0];
};

module.exports = {
  enrollInCourse,
  getMyEnrollments,
  getEnrollmentStatus,
  isUserEnrolled,
  unenroll,
  markCompleted,
};