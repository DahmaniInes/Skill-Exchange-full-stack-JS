// src/services/RoadmapService.jsx
import axios from "axios";

// Create an Axios instance with base configuration
const api = axios.create({
  baseURL: "http://localhost:5000", // Adjust to your backend URL
  timeout: 10000,
});

// Add request interceptor to include JWT token
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

// RoadmapService object with methods
const RoadmapService = {
  // Create a personalized roadmap (POST /api/roadmaps/generate)
  createRoadmap: async (skillId, goals, timeframe = 3, preferences = {}) => {
    try {
      // Validate inputs before sending
      if (!skillId || !goals || !Array.isArray(goals) || goals.length === 0) {
        throw new Error("Skill ID and goals are required");
      }

      const payload = {
        skill: { id: skillId }, // Backend expects skill as an object with 'id'
        goals,
        timeframe,
        preferences,
      };

      const response = await api.post("/api/roadmaps/generate", payload);
      return response.data; // { success: true, roadmap: savedRoadmap, source?: "cache", message?: string }
    } catch (error) {
      throw new Error(error.response?.data?.message || "Error creating roadmap");
    }
  },

  // Get roadmap by skill ID (GET /api/roadmaps/by-skill/:skillId)
  getRoadmapBySkillId: async (skillId) => {
    try {
      const response = await api.get(`/api/roadmaps/by-skill/${skillId}`);
      return response.data; // { success: true, roadmap }
    } catch (error) {
      throw new Error(error.response?.data?.message || "Error fetching roadmap by skill ID");
    }
  },

  // Get all roadmaps for a user (GET /api/roadmaps/user/:userId)
  getUserRoadmaps: async (userId) => {
    try {
      const response = await api.get(`/api/roadmaps/user/${userId}`);
      return response.data; // { success: true, roadmaps }
    } catch (error) {
      throw new Error(error.response?.data?.message || "Error fetching user roadmaps");
    }
  },

  // Get roadmap by ID (GET /api/roadmaps/:id)
  getRoadmapById: async (id) => {
    try {
      const response = await api.get(`/api/roadmaps/${id}`);
      return response.data; // { success: true, roadmap }
    } catch (error) {
      throw new Error(error.response?.data?.message || "Error fetching roadmap by ID");
    }
  },

  // Update roadmap with AI feedback (PUT /api/roadmaps/:id/update-with-feedback)
  updateRoadmapWithAIFeedback: async (id, feedback, progress) => {
    try {
      const payload = { feedback, progress };
      const response = await api.put(`/api/roadmaps/${id}/update-with-feedback`, payload);
      return response.data; // { success: true, roadmap, message?: string }
    } catch (error) {
      throw new Error(error.response?.data?.message || "Error updating roadmap with feedback");
    }
  },

  // Update a specific roadmap step (PUT /api/roadmaps/:id/update-step/:stepIndex)
  updateRoadmapStep: async (id, stepIndex, completed, overallProgress) => {
    try {
      const payload = { completed, overallProgress };
      const response = await api.put(`/api/roadmaps/${id}/update-step/${stepIndex}`, payload);
      return response.data; // { success: true, roadmap }
    } catch (error) {
      throw new Error(error.response?.data?.message || "Error updating roadmap step");
    }
  },

  // Delete a roadmap (DELETE /api/roadmaps/:id)
  deleteRoadmap: async (id) => {
    try {
      const response = await api.delete(`/api/roadmaps/${id}`);
      return response.data; // { success: true, message: "Roadmap deleted successfully" }
    } catch (error) {
      throw new Error(error.response?.data?.message || "Error deleting roadmap");
    }
  },
};

export default RoadmapService;