import { useEffect, useState } from "react";
import { getEvents } from "../../services/eventsService";
import { useNavigate } from "react-router-dom";

function EventList() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    setError(null);
    getEvents()
      .then((data) => {
        setEvents(data);
        setLoading(false);
      })
      .catch((err) => {
        setError("Impossible de récupérer les événements.");
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Chargement des événements...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event) => (
        <div key={event._id} className="border p-4 shadow rounded hover:shadow-lg transition">
          <h2 className="text-xl font-bold mb-2">{event.title}</h2>
          <p>{event.description}</p>
          <button
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => navigate(`/event/${event._id}`)}
            aria-label={`Voir les détails de l'événement ${event.title}`}
          >
            Voir l'événement
          </button>
        </div>
      ))}
    </div>
  );
}

export default EventList;
