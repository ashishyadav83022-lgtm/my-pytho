const { query } = require("../config/db");
const enrollmentService = require("./enrollment.service");

const getQuizCourseAndOwner = async (quizId) => {
  const result = await query(
    `SELECT q.course_id, c.trainer_id
     FROM quizzes q JOIN courses c ON q.course_id = c.id
     WHERE q.id = $1`,
    [quizId]
  );
  if (result.rows.length === 0) {
    const error = new Error("Quiz not found");
    error.statusCode = 404;
    throw error;
  }
  return result.rows[0];
};

const getQuizIdFromQuestion = async (questionId) => {
  const result = await query("SELECT quiz_id FROM questions WHERE id = $1", [questionId]);
  if (result.rows.length === 0) {
    const error = new Error("Question not found");
    error.statusCode = 404;
    throw error;
  }
  return result.rows[0].quiz_id;
};

const ensureCourseOwnership = async (courseId, user) => {
  const result = await query("SELECT trainer_id FROM courses WHERE id = $1", [courseId]);
  if (result.rows.length === 0) {
    const error = new Error("Course not found");
    error.statusCode = 404;
    throw error;
  }
  if (user.role !== "admin" && result.rows[0].trainer_id !== user.id) {
    const error = new Error("Forbidden: you do not own this course");
    error.statusCode = 403;
    throw error;
  }
};

const ensureAccess = async (courseId, trainerId, user) => {
  const isOwnerOrAdmin = user.role === "admin" || (user.role === "trainer" && trainerId === user.id);
  if (isOwnerOrAdmin) return;

  const enrolled = await enrollmentService.isUserEnrolled(courseId, user.id);
  if (!enrolled) {
    const error = new Error("You must be enrolled in this course to access this quiz");
    error.statusCode = 403;
    throw error;
  }
};

const createQuiz = async (courseId, data, user) => {
  await ensureCourseOwnership(courseId, user);
  const { title, description, passingScore, timeLimitMinutes } = data;
  const result = await query(
    `INSERT INTO quizzes (course_id, title, description, passing_score, time_limit_minutes, created_by)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [courseId, title, description || null, passingScore ?? 50, timeLimitMinutes || 0, user.id]
  );
  return result.rows[0];
};

const getCourseQuizzes = async (courseId) => {
  const result = await query(
    `SELECT id, title, description, passing_score, time_limit_minutes, created_at
     FROM quizzes WHERE course_id = $1 ORDER BY created_at DESC`,
    [courseId]
  );
  return result.rows;
};

const getQuizDetails = async (quizId, user) => {
  const quizResult = await query("SELECT * FROM quizzes WHERE id = $1", [quizId]);
  if (quizResult.rows.length === 0) {
    const error = new Error("Quiz not found");
    error.statusCode = 404;
    throw error;
  }
  const quiz = quizResult.rows[0];

  const courseResult = await query("SELECT trainer_id FROM courses WHERE id = $1", [quiz.course_id]);
  const trainerId = courseResult.rows[0]?.trainer_id;

  await ensureAccess(quiz.course_id, trainerId, user);

  const questionsResult = await query(
    `SELECT id, question_text, options, order_index FROM questions
     WHERE quiz_id = $1 ORDER BY order_index ASC, id ASC`,
    [quizId]
  );

  return { ...quiz, questions: questionsResult.rows };
};

const updateQuiz = async (quizId, data, user) => {
  const { course_id: courseId } = await getQuizCourseAndOwner(quizId);
  await ensureCourseOwnership(courseId, user);

  const { title, description, passingScore, timeLimitMinutes } = data;
  const result = await query(
    `UPDATE quizzes SET title = COALESCE($1, title), description = COALESCE($2, description),
     passing_score = COALESCE($3, passing_score), time_limit_minutes = COALESCE($4, time_limit_minutes),
     updated_at = NOW() WHERE id = $5 RETURNING *`,
    [title, description, passingScore, timeLimitMinutes, quizId]
  );
  return result.rows[0];
};

const deleteQuiz = async (quizId, user) => {
  const { course_id: courseId } = await getQuizCourseAndOwner(quizId);
  await ensureCourseOwnership(courseId, user);
  await query("DELETE FROM quizzes WHERE id = $1", [quizId]);
};

const addQuestion = async (quizId, data, user) => {
  const { course_id: courseId } = await getQuizCourseAndOwner(quizId);
  await ensureCourseOwnership(courseId, user);

  const { questionText, options, correctOptionIndex, orderIndex } = data;
  const result = await query(
    `INSERT INTO questions (quiz_id, question_text, options, correct_option_index, order_index)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [quizId, questionText, JSON.stringify(options), correctOptionIndex, orderIndex || 0]
  );
  return result.rows[0];
};

const updateQuestion = async (questionId, data, user) => {
  const quizId = await getQuizIdFromQuestion(questionId);
  const { course_id: courseId } = await getQuizCourseAndOwner(quizId);
  await ensureCourseOwnership(courseId, user);

  const { questionText, options, correctOptionIndex, orderIndex } = data;
  const result = await query(
    `UPDATE questions SET question_text = COALESCE($1, question_text),
     options = COALESCE($2, options), correct_option_index = COALESCE($3, correct_option_index),
     order_index = COALESCE($4, order_index) WHERE id = $5 RETURNING *`,
    [questionText, options ? JSON.stringify(options) : null, correctOptionIndex, orderIndex, questionId]
  );
  return result.rows[0];
};

const deleteQuestion = async (questionId, user) => {
  const quizId = await getQuizIdFromQuestion(questionId);
  const { course_id: courseId } = await getQuizCourseAndOwner(quizId);
  await ensureCourseOwnership(courseId, user);
  await query("DELETE FROM questions WHERE id = $1", [questionId]);
};

const submitQuiz = async (quizId, userId, submittedAnswers, user) => {
  const quizResult = await query("SELECT * FROM quizzes WHERE id = $1", [quizId]);
  if (quizResult.rows.length === 0) {
    const error = new Error("Quiz not found");
    error.statusCode = 404;
    throw error;
  }
  const quiz = quizResult.rows[0];

  const courseResult = await query("SELECT trainer_id FROM courses WHERE id = $1", [quiz.course_id]);
  const trainerId = courseResult.rows[0]?.trainer_id;
  await ensureAccess(quiz.course_id, trainerId, user);

  const questionsResult = await query(
    "SELECT id, question_text, options, correct_option_index FROM questions WHERE quiz_id = $1 ORDER BY order_index ASC, id ASC",
    [quizId]
  );
  const questions = questionsResult.rows;

  if (questions.length === 0) {
    const error = new Error("This quiz has no questions yet");
    error.statusCode = 400;
    throw error;
  }

  let correctCount = 0;
  const graded = questions.map((q) => {
    const submitted = submittedAnswers.find((a) => Number(a.questionId) === q.id);
    const selectedIndex = submitted ? Number(submitted.selectedIndex) : null;
    const isCorrect = selectedIndex === q.correct_option_index;
    if (isCorrect) correctCount++;

    return {
      questionId: q.id,
      questionText: q.question_text,
      options: q.options,
      selectedIndex,
      correctIndex: q.correct_option_index,
      isCorrect,
    };
  });

  const total = questions.length;
  const score = Math.round((correctCount / total) * 100);
  const passed = score >= quiz.passing_score;

  const attemptResult = await query(
    `INSERT INTO quiz_attempts (quiz_id, user_id, score, total_questions, correct_answers, passed, answers)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [quizId, userId, score, total, correctCount, passed, JSON.stringify(graded)]
  );

  return attemptResult.rows[0];
};

const getMyAttempts = async (quizId, userId) => {
  const result = await query(
    `SELECT id, score, total_questions, correct_answers, passed, attempted_at
     FROM quiz_attempts WHERE quiz_id = $1 AND user_id = $2 ORDER BY attempted_at DESC`,
    [quizId, userId]
  );
  return result.rows;
};

const getAttemptResult = async (attemptId, user) => {
  const result = await query(
    `SELECT qa.*, q.course_id, c.trainer_id
     FROM quiz_attempts qa
     JOIN quizzes q ON qa.quiz_id = q.id
     JOIN courses c ON q.course_id = c.id
     WHERE qa.id = $1`,
    [attemptId]
  );

  if (result.rows.length === 0) {
    const error = new Error("Attempt not found");
    error.statusCode = 404;
    throw error;
  }

  const attempt = result.rows[0];
  const isOwner = attempt.user_id === user.id;
  const isOwnerOrAdmin = user.role === "admin" || (user.role === "trainer" && attempt.trainer_id === user.id);

  if (!isOwner && !isOwnerOrAdmin) {
    const error = new Error("Forbidden: you cannot view this attempt");
    error.statusCode = 403;
    throw error;
  }

  return attempt;
};

module.exports = {
  createQuiz,
  getCourseQuizzes,
  getQuizDetails,
  updateQuiz,
  deleteQuiz,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  submitQuiz,
  getMyAttempts,
  getAttemptResult,
};