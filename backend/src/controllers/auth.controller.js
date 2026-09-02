const { validationResult } = require("express-validator");
const authService = require("../services/auth.service");

const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: "Validation failed", errors: errors.array() });
    }

    const { name, email, password, role } = req.body;
    const { user, token } = await authService.registerUser({ name, email, password, role });

    res.status(201).json({ success: true, message: "Registration successful", data: { user, token } });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: "Validation failed", errors: errors.array() });
    }

    const { email, password } = req.body;
    const { user, token } = await authService.loginUser({ email, password });

    res.status(200).json({ success: true, message: "Login successful", data: { user, token } });
  } catch (error) {
    next(error);
  }
};

const logout = (req, res) => {
  // JWT is stateless — the server holds no session to destroy.
  // The frontend is responsible for deleting the stored token.
  res.status(200).json({ success: true, message: "Logged out successfully" });
};

const getMe = async (req, res, next) => {
  try {
    const user = await authService.getUserById(req.user.id);
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, logout, getMe };