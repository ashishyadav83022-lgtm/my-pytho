const { query } = require("./db");

const initUsersTable = async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'trainee' CHECK (role IN ('trainee', 'trainer', 'admin')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("Users table ready");
  } catch (error) {
    console.error("Failed to initialize users table:", error.message);
    throw error;
  }
};

const initCourseTables = async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS courses (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        trainer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        level VARCHAR(20) NOT NULL DEFAULT 'beginner' CHECK (level IN ('beginner','intermediate','advanced')),
        duration_hours INTEGER DEFAULT 0,
        thumbnail_url VARCHAR(500),
        status VARCHAR(20) NOT NULL DEFAULT 'published' CHECK (status IN ('draft','published','archived')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log("Course tables ready");
  } catch (error) {
    console.error("Failed to initialize course tables:", error.message);
    throw error;
  }
};

const initLearningTables = async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS modules (
        id SERIAL PRIMARY KEY,
        course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        order_index INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS lessons (
        id SERIAL PRIMARY KEY,
        module_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        content TEXT,
        video_url VARCHAR(500),
        resource_url VARCHAR(500),
        order_index INTEGER NOT NULL DEFAULT 0,
        duration_minutes INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS lesson_progress (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
        completed_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, lesson_id)
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS notes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, lesson_id)
      );
    `);

    console.log("Learning tables ready");
  } catch (error) {
    console.error("Failed to initialize learning tables:", error.message);
    throw error;
  }
};

const initEnrollmentTable = async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS enrollments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','dropped')),
        enrolled_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP,
        UNIQUE(user_id, course_id)
      );
    `);
    console.log("Enrollment table ready");
  } catch (error) {
    console.error("Failed to initialize enrollment table:", error.message);
    throw error;
  }
};

const initQuizTables = async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS quizzes (
        id SERIAL PRIMARY KEY,
        course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        passing_score INTEGER NOT NULL DEFAULT 50 CHECK (passing_score BETWEEN 0 AND 100),
        time_limit_minutes INTEGER DEFAULT 0,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
        question_text TEXT NOT NULL,
        options JSONB NOT NULL,
        correct_option_index INTEGER NOT NULL,
        order_index INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS quiz_attempts (
        id SERIAL PRIMARY KEY,
        quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        score INTEGER NOT NULL,
        total_questions INTEGER NOT NULL,
        correct_answers INTEGER NOT NULL,
        passed BOOLEAN NOT NULL,
        answers JSONB NOT NULL,
        attempted_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log("Quiz tables ready");
  } catch (error) {
    console.error("Failed to initialize quiz tables:", error.message);
    throw error;
  }
};

const initEventTables = async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        event_type VARCHAR(30) NOT NULL DEFAULT 'workshop' CHECK (event_type IN ('workshop','webinar','exam','meeting','other')),
        event_date TIMESTAMP NOT NULL,
        duration_minutes INTEGER DEFAULT 60,
        location VARCHAR(500),
        max_participants INTEGER,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming','ongoing','completed','cancelled')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS event_registrations (
        id SERIAL PRIMARY KEY,
        event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL DEFAULT 'registered' CHECK (status IN ('registered','cancelled')),
        registered_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(event_id, user_id)
      );
    `);

    console.log("Event tables ready");
  } catch (error) {
    console.error("Failed to initialize event tables:", error.message);
    throw error;
  }
};

const initAnnouncementTable = async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS announcements (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        content TEXT NOT NULL,
        target_role VARCHAR(20) NOT NULL DEFAULT 'all' CHECK (target_role IN ('all','trainee','trainer','admin')),
        course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
        priority VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high')),
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("Announcement table ready");
  } catch (error) {
    console.error("Failed to initialize announcement table:", error.message);
    throw error;
  }
};

const initCertificateTable = async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS certificates (
        id SERIAL PRIMARY KEY,
        certificate_id VARCHAR(30) UNIQUE NOT NULL,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        issued_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, course_id)
      );
    `);
    console.log("Certificate table ready");
  } catch (error) {
    console.error("Failed to initialize certificate table:", error.message);
    throw error;
  }
};

module.exports = {
  initUsersTable,
  initCourseTables,
  initLearningTables,
  initEnrollmentTable,
  initQuizTables,
  initEventTables,
  initAnnouncementTable,
  initCertificateTable,
};