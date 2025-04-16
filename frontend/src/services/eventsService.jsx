// src/services/eventService.jsx
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/event",
  timeout: 10000,
});

// Ajoute le JWT automatiquement dans chaque requête
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

// --- Événements publics et CRUD utilisateur ---

export const getEvents = () => api.get("/");

export const getEventById = (id) => api.get(`/${id}`);

export const createEvent = (data) => api.post("/", data);

export const updateEvent = (id, data) => api.put(`/${id}`, data);

export const deleteEvent = (id) => api.delete(`/${id}`);

// --- Récupération des événements créés par l’utilisateur ---

export const getMyEvents = () => api.get("/my-events");

export const getReservationsForMyEvents = () => api.get("/my-events/reservations");
