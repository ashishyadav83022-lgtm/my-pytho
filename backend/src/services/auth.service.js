const bcrypt = require("bcrypt");
const { query } = require("../config/db");
const generateToken = require("../utils/generateToken");

const SALT_ROUNDS = 10;
const PUBLIC_REGISTER_ROLES = ["trainee", "trainer"];

const registerUser = async ({ name, email, password, role }) => {
  const existing = await query("SELECT id FROM users WHERE email = $1", [email]);
  if (existing.rows.length > 0) {
    const error = new Error("Email already registered");
    error.statusCode = 409;
    throw error;
  }

  const safeRole = PUBLIC_REGISTER_ROLES.includes(role) ? role : "trainee";

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const result = await query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role, created_at`,
    [name, email, hashedPassword, safeRole]
  );

  const user = result.rows[0];
  const token = generateToken({ id: user.id, role: user.role, email: user.email });

  return { user, token };
};

const loginUser = async ({ email, password }) => {
  const result = await query("SELECT * FROM users WHERE email = $1", [email]);
  const user = result.rows[0];

  if (!user) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken({ id: user.id, role: user.role, email: user.email });

  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    token,
  };
};

const getUserById = async (id) => {
  const result = await query(
    "SELECT id, name, email, role, created_at FROM users WHERE id = $1",
    [id]
  );
  return result.rows[0];
};

module.exports = { registerUser, loginUser, getUserById };