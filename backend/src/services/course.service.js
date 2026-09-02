const { query } = require("../config/db");

const getCategories = async () => {
  const result = await query("SELECT id, name, description FROM categories ORDER BY name ASC");
  return result.rows;
};

const createCategory = async ({ name, description }) => {
  const existing = await query("SELECT id FROM categories WHERE name = $1", [name]);
  if (existing.rows.length > 0) {
    const error = new Error("Category already exists");
    error.statusCode = 409;
    throw error;
  }

  const result = await query(
    "INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING id, name, description",
    [name, description || null]
  );
  return result.rows[0];
};

const getAllCourses = async ({ search, category, level, trainerId, status, page = 1, limit = 10 }) => {
  const conditions = [];
  const params = [];
  let idx = 1;

  conditions.push(`c.status = $${idx++}`);
  params.push(status || "published");

  if (search) {
    conditions.push(`(c.title ILIKE $${idx} OR c.description ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }

  if (category) {
    conditions.push(`cat.name = $${idx++}`);
    params.push(category);
  }

  if (level) {
    conditions.push(`c.level = $${idx++}`);
    params.push(level);
  }

  if (trainerId) {
    conditions.push(`c.trainer_id = $${idx++}`);
    params.push(trainerId);
  }

  const whereClause = `WHERE ${conditions.join(" AND ")}`;

  const countResult = await query(
    `SELECT COUNT(*)::int AS total
     FROM courses c
     LEFT JOIN categories cat ON c.category_id = cat.id
     ${whereClause}`,
    params
  );
  const total = countResult.rows[0].total;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
  const offset = (pageNum - 1) * limitNum;

  const dataParams = [...params, limitNum, offset];
  const coursesResult = await query(
    `SELECT c.id, c.title, c.description, c.level, c.duration_hours, c.thumbnail_url,
            c.status, c.created_at, cat.name AS category, u.id AS trainer_id, u.name AS trainer_name
     FROM courses c
     LEFT JOIN categories cat ON c.category_id = cat.id
     LEFT JOIN users u ON c.trainer_id = u.id
     ${whereClause}
     ORDER BY c.created_at DESC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    dataParams
  );

  return {
    courses: coursesResult.rows,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  };
};

const getCourseById = async (id) => {
  const result = await query(
    `SELECT c.id, c.title, c.description, c.level, c.duration_hours, c.thumbnail_url,
            c.status, c.created_at, c.updated_at, cat.id AS category_id, cat.name AS category,
            u.id AS trainer_id, u.name AS trainer_name, u.email AS trainer_email
     FROM courses c
     LEFT JOIN categories cat ON c.category_id = cat.id
     LEFT JOIN users u ON c.trainer_id = u.id
     WHERE c.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    const error = new Error("Course not found");
    error.statusCode = 404;
    throw error;
  }

  return result.rows[0];
};

const createCourse = async (data, trainerId) => {
  const { title, description, categoryId, level, durationHours, thumbnailUrl, status } = data;

  const result = await query(
    `INSERT INTO courses (title, description, category_id, trainer_id, level, duration_hours, thumbnail_url, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      title,
      description || null,
      categoryId || null,
      trainerId,
      level || "beginner",
      durationHours || 0,
      thumbnailUrl || null,
      status || "published",
    ]
  );

  return result.rows[0];
};

const ensureOwnership = async (courseId, user) => {
  const result = await query("SELECT trainer_id FROM courses WHERE id = $1", [courseId]);
  if (result.rows.length === 0) {
    const error = new Error("Course not found");
    error.statusCode = 404;
    throw error;
  }

  const course = result.rows[0];
  if (user.role !== "admin" && course.trainer_id !== user.id) {
    const error = new Error("Forbidden: you do not own this course");
    error.statusCode = 403;
    throw error;
  }
};

const updateCourse = async (courseId, data, user) => {
  await ensureOwnership(courseId, user);

  const { title, description, categoryId, level, durationHours, thumbnailUrl, status } = data;

  const result = await query(
    `UPDATE courses
     SET title = COALESCE($1, title),
         description = COALESCE($2, description),
         category_id = COALESCE($3, category_id),
         level = COALESCE($4, level),
         duration_hours = COALESCE($5, duration_hours),
         thumbnail_url = COALESCE($6, thumbnail_url),
         status = COALESCE($7, status),
         updated_at = NOW()
     WHERE id = $8
     RETURNING *`,
    [title, description, categoryId, level, durationHours, thumbnailUrl, status, courseId]
  );

  return result.rows[0];
};

const deleteCourse = async (courseId, user) => {
  await ensureOwnership(courseId, user);
  await query("DELETE FROM courses WHERE id = $1", [courseId]);
};

module.exports = {
  getCategories,
  createCategory,
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
};