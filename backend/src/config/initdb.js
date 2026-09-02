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

module.exports = { initUsersTable, initCourseTables };