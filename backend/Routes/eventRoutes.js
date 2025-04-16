const express = require('express');
const router = express.Router();
const {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getEventsCreatedByUser,
  getReservationsForMyEvents
} = require('../Controllers/eventController');

const verifySession = require('../middleware/verifySession');

router.get('/', getEvents); // public
router.get('/my-events', verifySession, getEventsCreatedByUser); // créateur
router.get('/my-events/reservations', verifySession, getReservationsForMyEvents); // réservations sur mes events

router.get('/:id', getEventById);
router.post('/', verifySession, createEvent);
router.put('/:id', verifySession, updateEvent);
router.delete('/:id', verifySession, deleteEvent);

module.exports = router;
