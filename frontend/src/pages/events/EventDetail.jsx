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
    setLoading(true);
    setError(null);
    getEventById(id)
      .then((eventData) => {
        setEvent(eventData);
        setLoading(false);
      })
      .catch((err) => {
        setError("Impossible de charger les détails de l'événement.");
        setLoading(false);
      });
  }, [id]);

  const handleReservation = async () => {
    try {
      await createReservation(id);
      alert("Réservation effectuée !");
      navigate("/my-reservations");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la réservation.");
    }
  };

  if (loading) return <p>Chargement...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="max-w-2xl mx-auto p-4 border shadow rounded">
      <h1 className="text-2xl font-bold mb-4">{event.title}</h1>
      <p className="mb-4">{event.description}</p>
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
