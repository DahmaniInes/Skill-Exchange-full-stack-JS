import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/reservation",
  timeout: 10000,
});

// Intercepteur JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("jwtToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Réserver un événement
export const createReservation = (eventId) =>
  api.post("/", { eventId });

// Voir mes réservations
export const getMyReservations = () => api.get("/my");

// Annuler une réservation
export const cancelReservation = (id) => api.delete(`/${id}`);
