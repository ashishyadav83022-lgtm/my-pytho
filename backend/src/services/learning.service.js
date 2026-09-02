const { query } = require("../config/db");
const enrollmentService = require("./enrollment.service");

const getCourseIdFromModule = async (moduleId) => {
  const result = await query("SELECT course_id FROM modules WHERE id = $1", [moduleId]);
  if (result.rows.length === 0) {
    const error = new Error("Module not found");
    error.statusCode = 404;
    throw error;
  }
  return result.rows[0].course_id;
};

const getModuleIdFromLesson = async (lessonId) => {
  const result = await query("SELECT module_id FROM lessons WHERE id = $1", [lessonId]);
  if (result.rows.length === 0) {
    const error = new Error("Lesson not found");
    error.statusCode = 404;
    throw error;
  }
  return result.rows[0].module_id;
};

const ensureCourseOwnership = async (courseId, user) => {
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

// ---------- Modules ----------

const getModulesWithLessons = async (courseId, userId) => {
  const modulesResult = await query(
    "SELECT id, title, description, order_index FROM modules WHERE course_id = $1 ORDER BY order_index ASC, id ASC",
    [courseId]
  );
  const modules = modulesResult.rows;

  for (const mod of modules) {
    const lessonsResult = userId
      ? await query(
          `SELECT l.id, l.title, l.video_url, l.resource_url, l.order_index, l.duration_minutes,
                  (lp.id IS NOT NULL) AS completed
           FROM lessons l
           LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = $2
           WHERE l.module_id = $1
           ORDER BY l.order_index ASC, l.id ASC`,
          [mod.id, userId]
        )
      : await query(
          `SELECT id, title, video_url, resource_url, order_index, duration_minutes, false AS completed
           FROM lessons WHERE module_id = $1 ORDER BY order_index ASC, id ASC`,
          [mod.id]
        );
    mod.lessons = lessonsResult.rows;
  }

  return modules;
};

const createModule = async (courseId, data, user) => {
  await ensureCourseOwnership(courseId, user);
  const { title, description, orderIndex } = data;
  const result = await query(
    `INSERT INTO modules (course_id, title, description, order_index)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [courseId, title, description || null, orderIndex || 0]
  );
  return result.rows[0];
};

const updateModule = async (moduleId, data, user) => {
  const courseId = await getCourseIdFromModule(moduleId);
  await ensureCourseOwnership(courseId, user);
  const { title, description, orderIndex } = data;
  const result = await query(
    `UPDATE modules SET title = COALESCE($1, title), description = COALESCE($2, description),
     order_index = COALESCE($3, order_index), updated_at = NOW()
     WHERE id = $4 RETURNING *`,
    [title, description, orderIndex, moduleId]
  );
  return result.rows[0];
};

const deleteModule = async (moduleId, user) => {
  const courseId = await getCourseIdFromModule(moduleId);
  await ensureCourseOwnership(courseId, user);
  await query("DELETE FROM modules WHERE id = $1", [moduleId]);
};

// ---------- Lessons ----------

const createLesson = async (moduleId, data, user) => {
  const courseId = await getCourseIdFromModule(moduleId);
  await ensureCourseOwnership(courseId, user);
  const { title, content, videoUrl, resourceUrl, orderIndex, durationMinutes } = data;
  const result = await query(
    `INSERT INTO lessons (module_id, title, content, video_url, resource_url, order_index, duration_minutes)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [moduleId, title, content || null, videoUrl || null, resourceUrl || null, orderIndex || 0, durationMinutes || 0]
  );
  return result.rows[0];
};

const getLessonById = async (lessonId) => {
  const result = await query(
    `SELECT l.*, m.course_id, c.trainer_id
     FROM lessons l
     JOIN modules m ON l.module_id = m.id
     JOIN courses c ON m.course_id = c.id
     WHERE l.id = $1`,
    [lessonId]
  );
  if (result.rows.length === 0) {
    const error = new Error("Lesson not found");
    error.statusCode = 404;
    throw error;
  }
  return result.rows[0];
};

const updateLesson = async (lessonId, data, user) => {
  const moduleId = await getModuleIdFromLesson(lessonId);
  const courseId = await getCourseIdFromModule(moduleId);
  await ensureCourseOwnership(courseId, user);
  const { title, content, videoUrl, resourceUrl, orderIndex, durationMinutes } = data;
  const result = await query(
    `UPDATE lessons SET title = COALESCE($1, title), content = COALESCE($2, content),
     video_url = COALESCE($3, video_url), resource_url = COALESCE($4, resource_url),
     order_index = COALESCE($5, order_index), duration_minutes = COALESCE($6, duration_minutes),
     updated_at = NOW()
     WHERE id = $7 RETURNING *`,
    [title, content, videoUrl, resourceUrl, orderIndex, durationMinutes, lessonId]
  );
  return result.rows[0];
};

const deleteLesson = async (lessonId, user) => {
  const moduleId = await getModuleIdFromLesson(lessonId);
  const courseId = await getCourseIdFromModule(moduleId);
  await ensureCourseOwnership(courseId, user);
  await query("DELETE FROM lessons WHERE id = $1", [lessonId]);
};

// ---------- Progress ----------

const markLessonComplete = async (lessonId, userId) => {
  const lesson = await getLessonById(lessonId);

  await query(
    `INSERT INTO lesson_progress (user_id, lesson_id) VALUES ($1, $2)
     ON CONFLICT (user_id, lesson_id) DO NOTHING`,
    [userId, lessonId]
  );

  const progress = await getCourseProgress(lesson.course_id, userId);

  if (progress.progressPercentage === 100) {
    try {
      await enrollmentService.markCompleted(lesson.course_id, userId);
    } catch (err) {
      // No active enrollment record for this user/course (e.g. trainer previewing) — safe to ignore
    }
  }

  return { lessonId: Number(lessonId), completed: true };
};

const unmarkLessonComplete = async (lessonId, userId) => {
  await query("DELETE FROM lesson_progress WHERE user_id = $1 AND lesson_id = $2", [userId, lessonId]);
  return { lessonId: Number(lessonId), completed: false };
};

const getCourseProgress = async (courseId, userId) => {
  const totalResult = await query(
    `SELECT COUNT(*)::int AS total FROM lessons l
     JOIN modules m ON l.module_id = m.id WHERE m.course_id = $1`,
    [courseId]
  );
  const total = totalResult.rows[0].total;

  const completedResult = await query(
    `SELECT COUNT(*)::int AS completed FROM lesson_progress lp
     JOIN lessons l ON lp.lesson_id = l.id
     JOIN modules m ON l.module_id = m.id
     WHERE m.course_id = $1 AND lp.user_id = $2`,
    [courseId, userId]
  );
  const completed = completedResult.rows[0].completed;

  const progressPercentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  return { courseId: Number(courseId), totalLessons: total, completedLessons: completed, progressPercentage };
};

// ---------- Notes ----------

const getNote = async (lessonId, userId) => {
  const result = await query(
    "SELECT id, content, updated_at FROM notes WHERE lesson_id = $1 AND user_id = $2",
    [lessonId, userId]
  );
  return result.rows[0] || null;
};

const upsertNote = async (lessonId, userId, content) => {
  const result = await query(
    `INSERT INTO notes (user_id, lesson_id, content) VALUES ($1, $2, $3)
     ON CONFLICT (user_id, lesson_id) DO UPDATE SET content = EXCLUDED.content, updated_at = NOW()
     RETURNING id, content, updated_at`,
    [userId, lessonId, content]
  );
  return result.rows[0];
};

const deleteNote = async (lessonId, userId) => {
  await query("DELETE FROM notes WHERE lesson_id = $1 AND user_id = $2", [lessonId, userId]);
};

module.exports = {
  getModulesWithLessons,
  createModule,
  updateModule,
  deleteModule,
  createLesson,
  getLessonById,
  updateLesson,
  deleteLesson,
  markLessonComplete,
  unmarkLessonComplete,
  getCourseProgress,
  getNote,
  upsertNote,
  deleteNote,
};