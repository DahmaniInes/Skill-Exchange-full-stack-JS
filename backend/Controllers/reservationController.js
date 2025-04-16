const Reservation = require('../Models/Reservation');
const Event = require('../Models/Event');

exports.createReservation = async (req, res) => {
  try {
    const { eventId } = req.body;
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Événement introuvable' });

    const existing = await Reservation.findOne({
      user: req.userId,
      event: eventId
    });
    if (existing) return res.status(400).json({ message: 'Déjà réservé' });

    const reservation = await Reservation.create({
      user: req.userId,
      event: eventId
    });
    res.status(201).json(reservation);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.getMyReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find({ user: req.userId }).populate('event');
    res.status(200).json(reservations);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.cancelReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const reservation = await Reservation.findOneAndDelete({
      _id: id,
      user: req.userId
    });
    if (!reservation) return res.status(404).json({ message: 'Réservation non trouvée' });

    res.status(200).json({ message: 'Réservation annulée' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};
