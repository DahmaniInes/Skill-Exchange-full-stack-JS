import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import RoadmapService from "../../services/RoadmapService";
import { toast } from "react-toastify";

function RoadmapPage() {
  const { roadmapId } = useParams();
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRoadmap = async () => {
      setLoading(true);
      try {
        const response = await RoadmapService.getRoadmapById(roadmapId);
        setRoadmap(response.roadmap);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (roadmapId) fetchRoadmap();
  }, [roadmapId]);

  return (
    <div>
      {loading ? (
        <p>Loading...</p>
      ) : roadmap ? (
        <p>Roadmap: {roadmap.title}</p>
      ) : (
        <p>No roadmap found</p>
      )}
    </div>
  );
}

export default RoadmapPage;