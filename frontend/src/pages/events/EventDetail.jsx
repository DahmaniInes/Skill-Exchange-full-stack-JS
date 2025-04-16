import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getEventById } from "../../services/eventsService";
import { createReservation } from "../../services/reservationService";

function EventDetail() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getEventById(id);
        setEvent(response.data);
      } catch (err) {
        setError("Impossible de charger les détails de l'événement.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  const handleReservation = async () => {
    try {
      await createReservation(id); // ✅ on passe directement l'ID
      alert("Réservation effectuée !");
      navigate("/my-reservations");
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Erreur lors de la réservation.");
    }
  };

  if (loading) return <p>Chargement...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!event) return null;

  return (
    <div className="max-w-2xl mx-auto p-6 border rounded shadow">
      <h1 className="text-3xl font-bold mb-4">{event.title}</h1>
      <p className="mb-2 text-gray-700">{event.description}</p>
      <p className="text-sm text-gray-500 mb-4">
        Date : {new Date(event.date).toLocaleDateString("fr-FR")}
      </p>
      <button
        onClick={handleReservation}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        aria-label="Réserver cet événement"
      >
        Réserver
      </button>
    </div>
  );
}

export default EventDetail;
