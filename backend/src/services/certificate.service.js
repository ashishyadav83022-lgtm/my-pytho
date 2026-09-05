const { query } = require("../config/db");
const generateCertificateId = require("../utils/generateCertificateId");

const generateCertificate = async (courseId, userId) => {
  const existing = await query(
    "SELECT * FROM certificates WHERE user_id = $1 AND course_id = $2",
    [userId, courseId]
  );
  if (existing.rows.length > 0) {
    return existing.rows[0]; // idempotent — return the one already issued
  }

  const enrollmentResult = await query(
    "SELECT status FROM enrollments WHERE user_id = $1 AND course_id = $2",
    [userId, courseId]
  );

  if (enrollmentResult.rows.length === 0) {
    const error = new Error("You are not enrolled in this course");
    error.statusCode = 404;
    throw error;
  }

  if (enrollmentResult.rows[0].status !== "completed") {
    const error = new Error("You must complete 100% of the course before generating a certificate");
    error.statusCode = 400;
    throw error;
  }

  let certificateId;
  let inserted = null;
  let attempts = 0;

  // Extremely unlikely collision given crypto.randomBytes, but retry defensively
  while (!inserted && attempts < 5) {
    certificateId = generateCertificateId();
    try {
      const result = await query(
        `INSERT INTO certificates (certificate_id, user_id, course_id) VALUES ($1, $2, $3) RETURNING *`,
        [certificateId, userId, courseId]
      );
      inserted = result.rows[0];
    } catch (err) {
      if (err.code === "23505" && attempts < 4) {
        attempts++;
        continue;
      }
      throw err;
    }
  }

  return inserted;
};

const getMyCertificates = async (userId) => {
  const result = await query(
    `SELECT cert.id, cert.certificate_id, cert.issued_at,
            c.id AS course_id, c.title AS course_title, c.level,
            u.name AS trainer_name
     FROM certificates cert
     JOIN courses c ON cert.course_id = c.id
     LEFT JOIN users u ON c.trainer_id = u.id
     WHERE cert.user_id = $1
     ORDER BY cert.issued_at DESC`,
    [userId]
  );
  return result.rows;
};

const getCertificateById = async (certId, user) => {
  const result = await query(
    `SELECT cert.*, c.title AS course_title FROM certificates cert
     JOIN courses c ON cert.course_id = c.id
     WHERE cert.id = $1`,
    [certId]
  );
  if (result.rows.length === 0) {
    const error = new Error("Certificate not found");
    error.statusCode = 404;
    throw error;
  }
  const cert = result.rows[0];
  if (user.role !== "admin" && cert.user_id !== user.id) {
    const error = new Error("Forbidden: this is not your certificate");
    error.statusCode = 403;
    throw error;
  }
  return cert;
};

const verifyCertificate = async (certificateId) => {
  const result = await query(
    `SELECT cert.certificate_id, cert.issued_at,
            u.name AS holder_name,
            c.title AS course_title, c.level, c.duration_hours,
            t.name AS trainer_name
     FROM certificates cert
     JOIN users u ON cert.user_id = u.id
     JOIN courses c ON cert.course_id = c.id
     LEFT JOIN users t ON c.trainer_id = t.id
     WHERE cert.certificate_id = $1`,
    [certificateId]
  );

  if (result.rows.length === 0) {
    return { valid: false };
  }

  return { valid: true, ...result.rows[0] };
};

module.exports = {
  generateCertificate,
  getMyCertificates,
  getCertificateById,
  verifyCertificate,
};