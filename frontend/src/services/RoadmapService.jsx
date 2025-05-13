import axios from "axios";

// Create an Axios instance with base configuration
const api = axios.create({
  baseURL: "http://localhost:5000",
  timeout: 10000,
});

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

const RoadmapService = {
  createRoadmap: async (skillId, goals, timeframe = 3, preferences = {}) => {
    try {
      if (!skillId || !goals || !Array.isArray(goals) || goals.length === 0) {
        throw new Error("Skill ID and goals are required");
      }

      const payload = {
        skill: { id: skillId },
        goals,
        timeframe,
        preferences,
      };

      const response = await api.post("/api/roadmaps/generate", payload);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Error creating roadmap");
    }
  },

  getRoadmapBySkillId: async (skillId) => {
    try {
      const response = await api.get(`/api/roadmaps/by-skill/${skillId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Error fetching roadmap by skill ID");
    }
  },

  getUserRoadmaps: async (userId) => {
    try {
      const response = await api.get(`/api/roadmaps/user/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Error fetching user roadmaps");
    }
  },

  getRoadmapById: async (id) => {
    if (!id || id === 'undefined') {
      throw new Error('ID de roadmap invalide');
    }
    try {
      const response = await api.get(`/api/roadmaps/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Error fetching roadmap by ID");
    }
  },

  updateRoadmapWithAIFeedback: async (id, feedback, progress) => {
    try {
      const payload = { feedback, progress };
      const response = await api.put(`/api/roadmaps/${id}/update-with-feedback`, payload);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Error updating roadmap with feedback");
    }
  },

  updateRoadmapStep: async (id, stepIndex, completed, overallProgress) => {
    try {
      const payload = { completed, overallProgress };
      const response = await api.put(`/api/roadmaps/${id}/update-step/${stepIndex}`, payload);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Error updating roadmap step");
    }
  },

  deleteRoadmap: async (id) => {
    try {
      const response = await api.delete(`/api/roadmaps/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Error deleting roadmap");
    }
  },

  downloadRoadmap: async (roadmapId, format) => {
    try {
      const response = await api.get(`/api/roadmaps/${roadmapId}/download?format=${format}`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || `Error downloading roadmap as ${format}`);
    }
  },

  updateStep: async (roadmapId, stepId, updates) => {
    try {
      const response = await api.put(`/api/roadmaps/${roadmapId}/steps/${stepId}`, updates);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Error updating step");
    }
  },

  reorderSteps: async (roadmapId, newOrder) => {
    try {
      const response = await api.post(`/api/roadmaps/${roadmapId}/reorder-steps`, { newOrder });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Error reordering steps");
    }
  },
};

export default RoadmapService;