const certificateService = require("../services/certificate.service");

const generateCertificate = async (req, res, next) => {
  try {
    const certificate = await certificateService.generateCertificate(req.params.courseId, req.user.id);
    res.status(201).json({ success: true, message: "Certificate generated", data: certificate });
  } catch (error) {
    next(error);
  }
};

const getMyCertificates = async (req, res, next) => {
  try {
    const certificates = await certificateService.getMyCertificates(req.user.id);
    res.status(200).json({ success: true, data: certificates });
  } catch (error) {
    next(error);
  }
};

const getCertificateDetails = async (req, res, next) => {
  try {
    const certificate = await certificateService.getCertificateById(req.params.id, req.user);
    res.status(200).json({ success: true, data: certificate });
  } catch (error) {
    next(error);
  }
};

const verifyCertificate = async (req, res, next) => {
  try {
    const result = await certificateService.verifyCertificate(req.params.certificateId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateCertificate,
  getMyCertificates,
  getCertificateDetails,
  verifyCertificate,
};