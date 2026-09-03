const { query } = require("../config/db");

const ensureEventOwnership = async (eventId, user) => {
  const result = await query("SELECT created_by FROM events WHERE id = $1", [eventId]);
  if (result.rows.length === 0) {
    const error = new Error("Event not found");
    error.statusCode = 404;
    throw error;
  }
  const event = result.rows[0];
  if (user.role !== "admin" && event.created_by !== user.id) {
    const error = new Error("Forbidden: you do not own this event");
    error.statusCode = 403;
    throw error;
  }
};

const getRegisteredCount = async (eventId) => {
  const result = await query(
    "SELECT COUNT(*)::int AS count FROM event_registrations WHERE event_id = $1 AND status = 'registered'",
    [eventId]
  );
  return result.rows[0].count;
};

// ---------- Event CRUD ----------

const createEvent = async (data, user) => {
  const { title, description, eventType, eventDate, durationMinutes, location, maxParticipants, courseId } = data;

  if (courseId) {
    const courseResult = await query("SELECT trainer_id FROM courses WHERE id = $1", [courseId]);
    if (courseResult.rows.length === 0) {
      const error = new Error("Course not found");
      error.statusCode = 404;
      throw error;
    }
    if (user.role !== "admin" && courseResult.rows[0].trainer_id !== user.id) {
      const error = new Error("Forbidden: you do not own the course this event is linked to");
      error.statusCode = 403;
      throw error;
    }
  }

  const result = await query(
    `INSERT INTO events (course_id, title, description, event_type, event_date, duration_minutes, location, max_participants, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [
      courseId || null,
      title,
      description || null,
      eventType || "workshop",
      eventDate,
      durationMinutes || 60,
      location || null,
      maxParticipants || null,
      user.id,
    ]
  );
  return result.rows[0];
};

const getAllEvents = async ({ timeframe, courseId, eventType, page = 1, limit = 10 }) => {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (timeframe === "upcoming") {
    conditions.push(`e.event_date >= NOW()`);
    conditions.push(`e.status != 'cancelled'`);
  } else if (timeframe === "past") {
    conditions.push(`e.event_date < NOW()`);
  }

  if (courseId) {
    conditions.push(`e.course_id = $${idx++}`);
    params.push(courseId);
  }

  if (eventType) {
    conditions.push(`e.event_type = $${idx++}`);
    params.push(eventType);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countResult = await query(`SELECT COUNT(*)::int AS total FROM events e ${whereClause}`, params);
  const total = countResult.rows[0].total;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
  const offset = (pageNum - 1) * limitNum;

  const dataParams = [...params, limitNum, offset];
  const eventsResult = await query(
    `SELECT e.id, e.title, e.description, e.event_type, e.event_date, e.duration_minutes,
            e.location, e.max_participants, e.status, e.created_at,
            c.title AS course_title, u.name AS created_by_name,
            (SELECT COUNT(*)::int FROM event_registrations r WHERE r.event_id = e.id AND r.status = 'registered') AS registered_count
     FROM events e
     LEFT JOIN courses c ON e.course_id = c.id
     LEFT JOIN users u ON e.created_by = u.id
     ${whereClause}
     ORDER BY e.event_date ASC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    dataParams
  );

  return {
    events: eventsResult.rows,
    pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) || 1 },
  };
};

const getEventById = async (eventId) => {
  const result = await query(
    `SELECT e.*, c.title AS course_title, u.name AS created_by_name,
            (SELECT COUNT(*)::int FROM event_registrations r WHERE r.event_id = e.id AND r.status = 'registered') AS registered_count
     FROM events e
     LEFT JOIN courses c ON e.course_id = c.id
     LEFT JOIN users u ON e.created_by = u.id
     WHERE e.id = $1`,
    [eventId]
  );
  if (result.rows.length === 0) {
    const error = new Error("Event not found");
    error.statusCode = 404;
    throw error;
  }
  return result.rows[0];
};

const updateEvent = async (eventId, data, user) => {
  await ensureEventOwnership(eventId, user);
  const { title, description, eventType, eventDate, durationMinutes, location, maxParticipants, status } = data;

  const result = await query(
    `UPDATE events SET title = COALESCE($1, title), description = COALESCE($2, description),
     event_type = COALESCE($3, event_type), event_date = COALESCE($4, event_date),
     duration_minutes = COALESCE($5, duration_minutes), location = COALESCE($6, location),
     max_participants = COALESCE($7, max_participants), status = COALESCE($8, status),
     updated_at = NOW()
     WHERE id = $9 RETURNING *`,
    [title, description, eventType, eventDate, durationMinutes, location, maxParticipants, status, eventId]
  );
  return result.rows[0];
};

const deleteEvent = async (eventId, user) => {
  await ensureEventOwnership(eventId, user);
  await query("DELETE FROM events WHERE id = $1", [eventId]);
};

// ---------- Registration ----------

const registerForEvent = async (eventId, userId) => {
  const eventResult = await query("SELECT max_participants, status FROM events WHERE id = $1", [eventId]);
  if (eventResult.rows.length === 0) {
    const error = new Error("Event not found");
    error.statusCode = 404;
    throw error;
  }
  const event = eventResult.rows[0];

  if (event.status === "cancelled") {
    const error = new Error("This event has been cancelled");
    error.statusCode = 400;
    throw error;
  }

  const existing = await query(
    "SELECT id, status FROM event_registrations WHERE event_id = $1 AND user_id = $2",
    [eventId, userId]
  );

  if (existing.rows.length > 0 && existing.rows[0].status === "registered") {
    const error = new Error("Already registered for this event");
    error.statusCode = 409;
    throw error;
  }

  if (event.max_participants !== null) {
    const currentCount = await getRegisteredCount(eventId);
    if (currentCount >= event.max_participants) {
      const error = new Error("This event has reached maximum capacity");
      error.statusCode = 409;
      throw error;
    }
  }

  if (existing.rows.length > 0) {
    const reactivated = await query(
      `UPDATE event_registrations SET status = 'registered', registered_at = NOW() WHERE id = $1 RETURNING *`,
      [existing.rows[0].id]
    );
    return reactivated.rows[0];
  }

  const result = await query(
    `INSERT INTO event_registrations (event_id, user_id, status) VALUES ($1, $2, 'registered') RETURNING *`,
    [eventId, userId]
  );
  return result.rows[0];
};

const cancelRegistration = async (eventId, userId) => {
  const result = await query(
    `UPDATE event_registrations SET status = 'cancelled'
     WHERE event_id = $1 AND user_id = $2 AND status = 'registered'
     RETURNING *`,
    [eventId, userId]
  );
  if (result.rows.length === 0) {
    const error = new Error("Registration not found or already cancelled");
    error.statusCode = 404;
    throw error;
  }
  return result.rows[0];
};

const getMyEvents = async (userId) => {
  const result = await query(
    `SELECT e.id, e.title, e.event_type, e.event_date, e.location, e.status,
            r.status AS registration_status, r.registered_at
     FROM event_registrations r
     JOIN events e ON r.event_id = e.id
     WHERE r.user_id = $1 AND r.status = 'registered'
     ORDER BY e.event_date ASC`,
    [userId]
  );
  return result.rows;
};

const getEventRegistrations = async (eventId, user) => {
  await ensureEventOwnership(eventId, user);
  const result = await query(
    `SELECT r.id, r.status, r.registered_at, u.id AS user_id, u.name, u.email
     FROM event_registrations r
     JOIN users u ON r.user_id = u.id
     WHERE r.event_id = $1 AND r.status = 'registered'
     ORDER BY r.registered_at ASC`,
    [eventId]
  );
  return result.rows;
};

module.exports = {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  registerForEvent,
  cancelRegistration,
  getMyEvents,
  getEventRegistrations,
};