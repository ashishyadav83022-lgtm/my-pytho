const { validationResult } = require("express-validator");
const eventService = require("../services/event.service");

const checkValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, message: "Validation failed", errors: errors.array() });
    return false;
  }
  return true;
};

const createEvent = async (req, res, next) => {
  try {
    if (!checkValidation(req, res)) return;
    const event = await eventService.createEvent(req.body, req.user);
    res.status(201).json({ success: true, message: "Event created", data: event });
  } catch (error) {
    next(error);
  }
};

const getAllEvents = async (req, res, next) => {
  try {
    const { timeframe, courseId, eventType, page, limit } = req.query;
    const result = await eventService.getAllEvents({ timeframe, courseId, eventType, page, limit });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const getMyEvents = async (req, res, next) => {
  try {
    const events = await eventService.getMyEvents(req.user.id);
    res.status(200).json({ success: true, data: events });
  } catch (error) {
    next(error);
  }
};

const getEventDetails = async (req, res, next) => {
  try {
    const event = await eventService.getEventById(req.params.id);
    res.status(200).json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
};

const updateEvent = async (req, res, next) => {
  try {
    if (!checkValidation(req, res)) return;
    const event = await eventService.updateEvent(req.params.id, req.body, req.user);
    res.status(200).json({ success: true, message: "Event updated", data: event });
  } catch (error) {
    next(error);
  }
};

const deleteEvent = async (req, res, next) => {
  try {
    await eventService.deleteEvent(req.params.id, req.user);
    res.status(200).json({ success: true, message: "Event deleted" });
  } catch (error) {
    next(error);
  }
};

const register = async (req, res, next) => {
  try {
    const registration = await eventService.registerForEvent(req.params.id, req.user.id);
    res.status(201).json({ success: true, message: "Registered for event", data: registration });
  } catch (error) {
    next(error);
  }
};

const cancelRegistration = async (req, res, next) => {
  try {
    const result = await eventService.cancelRegistration(req.params.id, req.user.id);
    res.status(200).json({ success: true, message: "Registration cancelled", data: result });
  } catch (error) {
    next(error);
  }
};

const getEventRegistrations = async (req, res, next) => {
  try {
    const registrations = await eventService.getEventRegistrations(req.params.id, req.user);
    res.status(200).json({ success: true, data: registrations });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createEvent,
  getAllEvents,
  getMyEvents,
  getEventDetails,
  updateEvent,
  deleteEvent,
  register,
  cancelRegistration,
  getEventRegistrations,
};