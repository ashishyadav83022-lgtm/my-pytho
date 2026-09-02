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

module.exports = { initUsersTable };