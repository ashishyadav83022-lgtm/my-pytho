const express = require("express");
const router = express.Router();
const {
  generateCertificate,
  getMyCertificates,
  getCertificateDetails,
  verifyCertificate,
} = require("../controllers/certificate.controller");
const { protect } = require("../middleware/auth.middleware");

router.get("/verify/:certificateId", verifyCertificate);

router.post("/courses/:courseId", protect, generateCertificate);
router.get("/me", protect, getMyCertificates);
router.get("/:id", protect, getCertificateDetails);

module.exports = router;