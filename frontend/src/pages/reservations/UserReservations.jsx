import { useEffect, useState } from "react";
import { getMyReservations } from "../../services/reservationService";

function UserReservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getMyReservations()
      .then((data) => {
        setReservations(data);
        setLoading(false);
      })
      .catch((err) => {
        setError("Impossible de récupérer les réservations.");
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Chargement des réservations...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Mes Réservations</h2>
      {reservations.length === 0 ? (
        <p>Aucune réservation trouvée.</p>
      ) : (
        <ul className="space-y-4">
          {reservations.map((res) => (
            <li key={res._id} className="border p-4 rounded shadow">
              <strong>Événement :</strong> {res.event?.title || "Non trouvé"} <br />
              <strong>Date de réservation :</strong> {new Date(res.createdAt).toLocaleString()}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default UserReservations;
