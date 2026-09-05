const { query } = require("../config/db");
const certificateService = require("./certificate.service");
const announcementService = require("./announcement.service");

const getTraineeDashboard = async (user) => {
  const userId = user.id;

  const enrolledResult = await query(
    `SELECT e.id AS enrollment_id, e.enrolled_at, c.id AS course_id, c.title, c.thumbnail_url, c.level,
            COALESCE(total.total_lessons, 0) AS total_lessons,
            COALESCE(done.completed_lessons, 0) AS completed_lessons
     FROM enrollments e
     JOIN courses c ON e.course_id = c.id
     LEFT JOIN (
       SELECT m.course_id, COUNT(l.id)::int AS total_lessons
       FROM modules m JOIN lessons l ON l.module_id = m.id
       GROUP BY m.course_id
     ) total ON total.course_id = c.id
     LEFT JOIN (
       SELECT m.course_id, COUNT(lp.id)::int AS completed_lessons
       FROM modules m JOIN lessons l ON l.module_id = m.id
       JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = $1
       GROUP BY m.course_id
     ) done ON done.course_id = c.id
     WHERE e.user_id = $1 AND e.status = 'active'
     ORDER BY e.enrolled_at DESC`,
    [userId]
  );

  const enrolledCourses = enrolledResult.rows.map((row) => ({
    ...row,
    progress_percentage:
      row.total_lessons === 0 ? 0 : Math.round((row.completed_lessons / row.total_lessons) * 100),
  }));

  const completedResult = await query(
    `SELECT e.id AS enrollment_id, e.completed_at, c.id AS course_id, c.title, c.thumbnail_url
     FROM enrollments e JOIN courses c ON e.course_id = c.id
     WHERE e.user_id = $1 AND e.status = 'completed'
     ORDER BY e.completed_at DESC`,
    [userId]
  );

  const certificates = await certificateService.getMyCertificates(userId);

  const upcomingTestsResult = await query(
    `SELECT q.id, q.title, q.passing_score, c.id AS course_id, c.title AS course_title
     FROM quizzes q
     JOIN courses c ON q.course_id = c.id
     JOIN enrollments e ON e.course_id = c.id AND e.user_id = $1 AND e.status = 'active'
     WHERE NOT EXISTS (
       SELECT 1 FROM quiz_attempts qa WHERE qa.quiz_id = q.id AND qa.user_id = $1
     )
     ORDER BY q.created_at DESC
     LIMIT 10`,
    [userId]
  );

  const upcomingEventsResult = await query(
    `SELECT ev.id, ev.title, ev.event_type, ev.event_date, ev.location
     FROM event_registrations r JOIN events ev ON r.event_id = ev.id
     WHERE r.user_id = $1 AND r.status = 'registered' AND ev.event_date >= NOW()
     ORDER BY ev.event_date ASC
     LIMIT 10`,
    [userId]
  );

  const { announcements } = await announcementService.getAnnouncementsForUser(user, { limit: 5 });

  return {
    enrolledCourses,
    completedCourses: completedResult.rows,
    certificates,
    upcomingTests: upcomingTestsResult.rows,
    upcomingEvents: upcomingEventsResult.rows,
    announcements,
    summary: {
      totalEnrolled: enrolledCourses.length,
      totalCompleted: completedResult.rows.length,
      totalCertificates: certificates.length,
    },
  };
};

const getTrainerDashboard = async (user) => {
  const trainerId = user.id;

  const coursesResult = await query(
    `SELECT c.id, c.title, c.status, c.level, c.created_at,
            (SELECT COUNT(*)::int FROM enrollments e WHERE e.course_id = c.id AND e.status IN ('active','completed')) AS enrolled_count,
            (SELECT COUNT(*)::int FROM modules m WHERE m.course_id = c.id) AS module_count
     FROM courses c
     WHERE c.trainer_id = $1
     ORDER BY c.created_at DESC`,
    [trainerId]
  );

  const learnersResult = await query(
    `SELECT COUNT(DISTINCT e.user_id)::int AS total_learners
     FROM enrollments e JOIN courses c ON e.course_id = c.id
     WHERE c.trainer_id = $1 AND e.status IN ('active','completed')`,
    [trainerId]
  );

  const analyticsResult = await query(
    `SELECT c.id AS course_id, c.title,
            COUNT(DISTINCT e.id) FILTER (WHERE e.status IN ('active','completed'))::int AS total_enrolled,
            COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'completed')::int AS completed_count,
            ROUND(AVG(qa.score)) AS avg_quiz_score
     FROM courses c
     LEFT JOIN enrollments e ON e.course_id = c.id
     LEFT JOIN quizzes q ON q.course_id = c.id
     LEFT JOIN quiz_attempts qa ON qa.quiz_id = q.id
     WHERE c.trainer_id = $1
     GROUP BY c.id, c.title
     ORDER BY c.title`,
    [trainerId]
  );

  const courseAnalytics = analyticsResult.rows.map((row) => ({
    ...row,
    completion_rate: row.total_enrolled === 0 ? 0 : Math.round((row.completed_count / row.total_enrolled) * 100),
    avg_quiz_score: row.avg_quiz_score === null ? null : Number(row.avg_quiz_score),
  }));

  const upcomingEventsResult = await query(
    `SELECT id, title, event_type, event_date, location,
            (SELECT COUNT(*)::int FROM event_registrations r WHERE r.event_id = events.id AND r.status = 'registered') AS registered_count
     FROM events
     WHERE created_by = $1 AND event_date >= NOW()
     ORDER BY event_date ASC
     LIMIT 10`,
    [trainerId]
  );

  return {
    courses: coursesResult.rows,
    totalLearners: learnersResult.rows[0].total_learners,
    courseAnalytics,
    upcomingEvents: upcomingEventsResult.rows,
    summary: {
      totalCourses: coursesResult.rows.length,
      totalLearners: learnersResult.rows[0].total_learners,
    },
  };
};

const getAdminDashboard = async () => {
  const [
    usersByRole,
    coursesByStatus,
    enrollmentsByStatus,
    topCourses,
    recentSignups,
    certificateCount,
    eventCount,
  ] = await Promise.all([
    query("SELECT role, COUNT(*)::int AS count FROM users GROUP BY role"),
    query("SELECT status, COUNT(*)::int AS count FROM courses GROUP BY status"),
    query("SELECT status, COUNT(*)::int AS count FROM enrollments GROUP BY status"),
    query(
      `SELECT c.id, c.title, COUNT(e.id)::int AS enrollment_count
       FROM courses c LEFT JOIN enrollments e ON e.course_id = c.id AND e.status IN ('active','completed')
       GROUP BY c.id, c.title
       ORDER BY enrollment_count DESC
       LIMIT 5`
    ),
    query("SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 5"),
    query("SELECT COUNT(*)::int AS count FROM certificates"),
    query("SELECT COUNT(*)::int AS count FROM events"),
  ]);

  const totalUsers = usersByRole.rows.reduce((sum, r) => sum + r.count, 0);
  const totalCourses = coursesByStatus.rows.reduce((sum, r) => sum + r.count, 0);
  const totalEnrollments = enrollmentsByStatus.rows.reduce((sum, r) => sum + r.count, 0);

  return {
    usersByRole: usersByRole.rows,
    coursesByStatus: coursesByStatus.rows,
    enrollmentsByStatus: enrollmentsByStatus.rows,
    topCourses: topCourses.rows,
    recentSignups: recentSignups.rows,
    platformStatistics: {
      totalUsers,
      totalCourses,
      totalEnrollments,
      totalCertificatesIssued: certificateCount.rows[0].count,
      totalEvents: eventCount.rows[0].count,
    },
  };
};

module.exports = {
  getTraineeDashboard,
  getTrainerDashboard,
  getAdminDashboard,
};