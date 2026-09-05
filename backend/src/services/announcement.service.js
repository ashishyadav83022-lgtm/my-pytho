const { query } = require("../config/db");

const ensureAnnouncementOwnership = async (announcementId, user) => {
  const result = await query("SELECT created_by FROM announcements WHERE id = $1", [announcementId]);
  if (result.rows.length === 0) {
    const error = new Error("Announcement not found");
    error.statusCode = 404;
    throw error;
  }
  const announcement = result.rows[0];
  if (user.role !== "admin" && announcement.created_by !== user.id) {
    const error = new Error("Forbidden: you do not own this announcement");
    error.statusCode = 403;
    throw error;
  }
};

const createAnnouncement = async (data, user) => {
  const { title, content, targetRole, courseId, priority } = data;

  if (user.role === "trainer") {
    if (!courseId) {
      const error = new Error("Trainers must link an announcement to one of their courses");
      error.statusCode = 400;
      throw error;
    }

    const courseResult = await query("SELECT trainer_id FROM courses WHERE id = $1", [courseId]);
    if (courseResult.rows.length === 0) {
      const error = new Error("Course not found");
      error.statusCode = 404;
      throw error;
    }
    if (courseResult.rows[0].trainer_id !== user.id) {
      const error = new Error("Forbidden: you do not own this course");
      error.statusCode = 403;
      throw error;
    }

    if (targetRole && targetRole !== "all" && targetRole !== "trainee") {
      const error = new Error("Trainers can only target 'all' or 'trainee'");
      error.statusCode = 403;
      throw error;
    }
  }

  const result = await query(
    `INSERT INTO announcements (title, content, target_role, course_id, priority, created_by)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [title, content, targetRole || "all", courseId || null, priority || "normal", user.id]
  );
  return result.rows[0];
};

const getAnnouncementsForUser = async (user, { courseId, page = 1, limit = 10 }) => {
  const conditions = [`(a.target_role = 'all' OR a.target_role = $1)`];
  const params = [user.role];
  let idx = 2;

  if (courseId) {
    conditions.push(`a.course_id = $${idx++}`);
    params.push(courseId);
  } else if (user.role === "trainee") {
    // Trainees see platform-wide announcements plus ones for courses they're enrolled in
    conditions.push(`(a.course_id IS NULL OR a.course_id IN (
      SELECT course_id FROM enrollments WHERE user_id = $${idx} AND status IN ('active','completed')
    ))`);
    params.push(user.id);
    idx++;
  } else if (user.role === "trainer") {
    // Trainers see platform-wide announcements plus ones for their own courses
    conditions.push(`(a.course_id IS NULL OR a.course_id IN (
      SELECT id FROM courses WHERE trainer_id = $${idx}
    ))`);
    params.push(user.id);
    idx++;
  }
  // admin sees everything regardless of course_id

  const whereClause = `WHERE ${conditions.join(" AND ")}`;

  const countResult = await query(`SELECT COUNT(*)::int AS total FROM announcements a ${whereClause}`, params);
  const total = countResult.rows[0].total;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
  const offset = (pageNum - 1) * limitNum;

  const dataParams = [...params, limitNum, offset];
  const result = await query(
    `SELECT a.id, a.title, a.content, a.target_role, a.priority, a.created_at,
            a.course_id, c.title AS course_title, u.name AS created_by_name
     FROM announcements a
     LEFT JOIN courses c ON a.course_id = c.id
     LEFT JOIN users u ON a.created_by = u.id
     ${whereClause}
     ORDER BY a.priority = 'high' DESC, a.created_at DESC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    dataParams
  );

  return {
    announcements: result.rows,
    pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) || 1 },
  };
};

const getAnnouncementById = async (announcementId) => {
  const result = await query(
    `SELECT a.*, c.title AS course_title, u.name AS created_by_name
     FROM announcements a
     LEFT JOIN courses c ON a.course_id = c.id
     LEFT JOIN users u ON a.created_by = u.id
     WHERE a.id = $1`,
    [announcementId]
  );
  if (result.rows.length === 0) {
    const error = new Error("Announcement not found");
    error.statusCode = 404;
    throw error;
  }
  return result.rows[0];
};

const updateAnnouncement = async (announcementId, data, user) => {
  await ensureAnnouncementOwnership(announcementId, user);
  const { title, content, targetRole, priority } = data;

  if (user.role === "trainer" && targetRole && targetRole !== "all" && targetRole !== "trainee") {
    const error = new Error("Trainers can only target 'all' or 'trainee'");
    error.statusCode = 403;
    throw error;
  }

  const result = await query(
    `UPDATE announcements SET title = COALESCE($1, title), content = COALESCE($2, content),
     target_role = COALESCE($3, target_role), priority = COALESCE($4, priority), updated_at = NOW()
     WHERE id = $5 RETURNING *`,
    [title, content, targetRole, priority, announcementId]
  );
  return result.rows[0];
};

const deleteAnnouncement = async (announcementId, user) => {
  await ensureAnnouncementOwnership(announcementId, user);
  await query("DELETE FROM announcements WHERE id = $1", [announcementId]);
};

module.exports = {
  createAnnouncement,
  getAnnouncementsForUser,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
};