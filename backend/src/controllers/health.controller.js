const { testConnection } = require("../config/db");

const getHealthStatus = async (req, res, next) => {
  try {
    const dbConnected = await testConnection();

    res.status(200).json({
      success: true,
      message: "Capacity Connect API is running",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      database: dbConnected ? "connected" : "disconnected",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getHealthStatus };