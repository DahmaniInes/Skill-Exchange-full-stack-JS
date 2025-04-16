const Event = require('../Models/Event');
const Reservation = require('../Models/Reservation');

exports.getEvents = async (req, res) => {
  try {
    const events = await Event.find();
    res.status(200).json(events);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Événement non trouvé' });
    res.status(200).json(event);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.createEvent = async (req, res) => {
  try {
    const { title, description, date } = req.body;
    const event = await Event.create({
      title,
      description,
      date,
      createdBy: req.userId
    });
    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.userId },
      req.body,
      { new: true }
    );
    if (!event) return res.status(404).json({ message: 'Événement non trouvé ou non autorisé' });
    res.status(200).json(event);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findOneAndDelete({ _id: req.params.id, createdBy: req.userId });
    if (!event) return res.status(404).json({ message: 'Événement non trouvé ou non autorisé' });
    res.status(200).json({ message: 'Événement supprimé' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.getEventsCreatedByUser = async (req, res) => {
  try {
    const events = await Event.find({ createdBy: req.userId });
    res.status(200).json(events);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.getReservationsForMyEvents = async (req, res) => {
  try {
    const events = await Event.find({ createdBy: req.userId });
    const eventIds = events.map(event => event._id);

    const reservations = await Reservation.find({ event: { $in: eventIds } })
      .populate('event')
      .populate('user', 'email name');

    res.status(200).json(reservations);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
