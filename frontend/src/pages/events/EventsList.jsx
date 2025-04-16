import { useEffect, useState } from "react";
import { getEvents } from "../../services/eventsService"; // Assure-toi que ce fichier existe bien
import { useNavigate } from "react-router-dom";

function EventsList() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getEvents();
        setEvents(response.data); // ✅ correct
      } catch (err) {
        setError("Impossible de récupérer les événements.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (loading) return <p>Chargement des événements...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Événements disponibles</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <div
            key={event._id}
            className="border p-4 shadow rounded hover:shadow-lg transition duration-200"
          >
            <h2 className="text-xl font-semibold mb-2">{event.title}</h2>
            <p className="text-gray-700 mb-2">{event.description}</p>
            <p className="text-sm text-gray-500">
              Date : {new Date(event.date).toLocaleDateString("fr-FR")}
            </p>
            <button
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => navigate(`/events/${event._id}`)} // ✅ lien corrigé ici
              aria-label={`Voir les détails de l'événement ${event.title}`}
            >
              Voir l'événement
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default EventsList;
