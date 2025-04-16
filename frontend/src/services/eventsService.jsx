import axiosInstance from './axiosInstance';

const getEvents = async () => {
  try {
    const response = await axiosInstance.get('/events');
    return response.data;
  } catch (error) {
    throw new Error('Erreur lors de la récupération des événements');
  }
};

const getEventById = async (id) => {
  try {
    const response = await axiosInstance.get(`/events/${id}`);
    return response.data;
  } catch (error) {
    throw new Error('Erreur lors de la récupération de l\'événement');
  }
};

const createEvent = async (eventData) => {
  try {
    const response = await axiosInstance.post('/events', eventData);
    return response.data;
  } catch (error) {
    throw new Error('Erreur lors de la création de l\'événement');
  }
};

const updateEvent = async (id, eventData) => {
  try {
    const response = await axiosInstance.put(`/events/${id}`, eventData);
    return response.data;
  } catch (error) {
    throw new Error('Erreur lors de la mise à jour de l\'événement');
  }
};

const deleteEvent = async (id) => {
  try {
    const response = await axiosInstance.delete(`/events/${id}`);
    return response.data;
  } catch (error) {
    throw new Error('Erreur lors de la suppression de l\'événement');
  }
};

const getEventsCreatedByUser = async () => {
  try {
    const response = await axiosInstance.get('/events/my-events');
    return response.data;
  } catch (error) {
    throw new Error('Erreur lors de la récupération des événements créés par l\'utilisateur');
  }
};

const getReservationsForMyEvents = async () => {
  try {
    const response = await axiosInstance.get('/events/my-events/reservations');
    return response.data;
  } catch (error) {
    throw new Error('Erreur lors de la récupération des réservations sur mes événements');
  }
};

export default {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventsCreatedByUser,
  getReservationsForMyEvents,
};
