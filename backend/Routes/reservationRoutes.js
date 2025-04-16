const express = require('express');
const router = express.Router();
const {
  createReservation,
  getMyReservations,
  cancelReservation
} = require('../Controllers/reservationController');

const verifySession = require('../middleware/verifySession');

router.post('/', verifySession, createReservation);
router.get('/my', verifySession, getMyReservations);
router.delete('/:id', verifySession, cancelReservation);

module.exports = router;
