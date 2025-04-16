import axiosInstance from './axiosInstance';

const createReservation = async (eventId) => {
  try {
    const response = await axiosInstance.post('/reservations', { eventId });
    return response.data;
  } catch (error) {
    throw new Error('Erreur lors de la création de la réservation');
  }
};

const getMyReservations = async () => {
  try {
    const response = await axiosInstance.get('/reservations/my');
    return response.data;
  } catch (error) {
    throw new Error('Erreur lors de la récupération des réservations');
  }
};

const cancelReservation = async (id) => {
  try {
    const response = await axiosInstance.delete(`/reservations/${id}`);
    return response.data;
  } catch (error) {
    throw new Error('Erreur lors de l\'annulation de la réservation');
  }
};

export default {
  createReservation,
  getMyReservations,
  cancelReservation,
};
