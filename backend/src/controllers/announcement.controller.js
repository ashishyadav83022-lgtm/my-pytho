const { validationResult } = require("express-validator");
const announcementService = require("../services/announcement.service");

const checkValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, message: "Validation failed", errors: errors.array() });
    return false;
  }
  return true;
};

const createAnnouncement = async (req, res, next) => {
  try {
    if (!checkValidation(req, res)) return;
    const announcement = await announcementService.createAnnouncement(req.body, req.user);
    res.status(201).json({ success: true, message: "Announcement created", data: announcement });
  } catch (error) {
    next(error);
  }
};

const getAnnouncements = async (req, res, next) => {
  try {
    const { courseId, page, limit } = req.query;
    const result = await announcementService.getAnnouncementsForUser(req.user, { courseId, page, limit });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const getAnnouncementDetails = async (req, res, next) => {
  try {
    const announcement = await announcementService.getAnnouncementById(req.params.id);
    res.status(200).json({ success: true, data: announcement });
  } catch (error) {
    next(error);
  }
};

const updateAnnouncement = async (req, res, next) => {
  try {
    if (!checkValidation(req, res)) return;
    const announcement = await announcementService.updateAnnouncement(req.params.id, req.body, req.user);
    res.status(200).json({ success: true, message: "Announcement updated", data: announcement });
  } catch (error) {
    next(error);
  }
};

const deleteAnnouncement = async (req, res, next) => {
  try {
    await announcementService.deleteAnnouncement(req.params.id, req.user);
    res.status(200).json({ success: true, message: "Announcement deleted" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAnnouncement,
  getAnnouncements,
  getAnnouncementDetails,
  updateAnnouncement,
  deleteAnnouncement,
};