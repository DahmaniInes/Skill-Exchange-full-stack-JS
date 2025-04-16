import { useEffect, useState } from "react";
import { getMyReservations } from "../../services/reservationService";

function UserReservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getMyReservations();
        setReservations(response.data); // ✅ adaptation : utiliser response.data
      } catch (err) {
        console.error(err);
        setError("Impossible de récupérer les réservations.");
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, []);

  if (loading) return <p>Chargement des réservations...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Mes Réservations</h2>
      {reservations.length === 0 ? (
        <p>Aucune réservation trouvée.</p>
      ) : (
        <ul className="space-y-4">
          {reservations.map((res) => (
            <li
              key={res._id}
              className="border p-4 rounded shadow hover:shadow-md transition"
            >
              <p className="text-lg">
                <strong>Événement :</strong> {res.event?.title || "Non trouvé"}
              </p>
              <p className="text-gray-600">
                <strong>Date de réservation :</strong>{" "}
                {new Date(res.createdAt).toLocaleString("fr-FR")}
              </p>
              {res.status && (
                <p className="text-sm mt-2">
                  <strong>Statut :</strong>{" "}
                  <span
                    className={`font-semibold ${
                      res.status === "confirmed"
                        ? "text-green-600"
                        : res.status === "pending"
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {res.status}
                  </span>
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default UserReservations;
