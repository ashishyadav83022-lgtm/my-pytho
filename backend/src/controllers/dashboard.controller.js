const dashboardService = require("../services/dashboard.service");

const getMyDashboard = async (req, res, next) => {
  try {
    let data;

    if (req.user.role === "trainee") {
      data = await dashboardService.getTraineeDashboard(req.user);
    } else if (req.user.role === "trainer") {
      data = await dashboardService.getTrainerDashboard(req.user);
    } else if (req.user.role === "admin") {
      data = await dashboardService.getAdminDashboard();
    } else {
      const error = new Error("Unknown role");
      error.statusCode = 400;
      throw error;
    }

    res.status(200).json({ success: true, role: req.user.role, data });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMyDashboard };