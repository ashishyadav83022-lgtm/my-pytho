require("dotenv").config();
const app = require("./src/app");
const { testConnection } = require("./src/config/db");
const {
  initUsersTable,
  initCourseTables,
  initLearningTables,
  initEnrollmentTable,
} = require("./src/config/initDb");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  const connected = await testConnection();
  if (connected) {
    await initUsersTable();
    await initCourseTables();
    await initLearningTables();
    await initEnrollmentTable();
  }

  app.listen(PORT, () => {
    console.log(`Capacity Connect API running on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
  });
};

startServer();

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err.message);
  process.exit(1);
});