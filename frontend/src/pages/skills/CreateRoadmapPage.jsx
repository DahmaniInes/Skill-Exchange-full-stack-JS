// src/pages/skills/CreateRoadmapPage.jsx
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import RoadmapService from "../../services/RoadmapService"; // Adjust path
import { toast } from "react-toastify";

function CreateRoadmapPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const skillId = searchParams.get("skillId");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    goals: ["Master the basics"],
    timeframe: 3,
    preferences: {
      learningStyle: "Self-paced",
      availability: 10,
    },
  });

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem("jwtToken");
    if (!token) {
      toast.warning("Please log in to create a roadmap");
      navigate("/login", { state: { returnUrl: window.location.pathname + window.location.search } });
    }
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "timeframe") {
      setFormData({ ...formData, timeframe: parseInt(value) || 1 });
    } else if (name === "availability") {
      setFormData({
        ...formData,
        preferences: { ...formData.preferences, availability: parseInt(value) || 5 },
      });
    } else if (name === "goals") {
      const goalsArray = value.split(",").map((goal) => goal.trim()).filter((goal) => goal.length > 0);
      setFormData({ ...formData, goals: goalsArray.length > 0 ? goalsArray : ["Master the basics"] });
    } else if (name === "learningStyle") {
      setFormData({
        ...formData,
        preferences: { ...formData.preferences, learningStyle: value },
      });
    }
  };

  const handleCreateRoadmap = async () => {
    setLoading(true);
    try {
      if (!skillId) {
        throw new Error("Skill ID is required");
      }

      const response = await RoadmapService.createRoadmap(
        skillId,
        formData.goals,
        formData.timeframe,
        formData.preferences
      );

      if (response.success && response.roadmap?._id) {
        toast.success("Roadmap created successfully!");
        navigate(`/roadmap/${response.roadmap._id}`);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      toast.error(error.message);
      if (error.message.includes("Compétence non trouvée")) {
        navigate("/skills");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Create Your Roadmap</h1>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Goals (comma separated)</label>
          <input
            type="text"
            name="goals"
            className="w-full p-2 border rounded-md"
            placeholder="Master basics, Build a project"
            value={formData.goals.join(", ")}
            onChange={handleInputChange}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Timeframe (months)</label>
          <input
            type="number"
            name="timeframe"
            className="w-full p-2 border rounded-md"
            min="1"
            max="12"
            value={formData.timeframe}
            onChange={handleInputChange}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Learning Style</label>
          <select
            name="learningStyle"
            className="w-full p-2 border rounded-md"
            value={formData.preferences.learningStyle}
            onChange={handleInputChange}
          >
            <option value="Self-paced">Self-paced</option>
            <option value="Structured">Structured</option>
            <option value="Project-based">Project-based</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Available Hours per Week</label>
          <input
            type="number"
            name="availability"
            className="w-full p-2 border rounded-md"
            min="1"
            max="40"
            value={formData.preferences.availability}
            onChange={handleInputChange}
          />
        </div>
      </div>

      <button
        className={`w-full py-3 rounded-md transition-colors ${
          loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"
        }`}
        onClick={handleCreateRoadmap}
        disabled={loading}
      >
        {loading ? "Creating Roadmap..." : "Create Roadmap"}
      </button>
    </div>
  );
}

export default CreateRoadmapPage;