import React, { useState, useEffect } from 'react';
import styles from './ReportTable.module.css';

const ReportTable = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fonction pour récupérer les signalements depuis l'API sans token
  const fetchReports = async () => {
    try {
      const response = await fetch('http://localhost:5000/MessengerRoute/reports', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des signalements');
      }

      const data = await response.json();
      if (data.success) {
        setReports(data.data); // Les données sont dans data.data selon la réponse de l'API
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Charger les données au montage du composant
  useEffect(() => {
    fetchReports();
  }, []);

  // Rendu du badge pour le statut
  const renderStatusBadge = (status) => {
    if (status.includes('blocked')) {
      return <span className={`${styles.badge} ${styles.blockedBadge}`}>{status}</span>;
    } else if (status === 'pending') {
      return <span className={`${styles.badge} ${styles.pendingBadge}`}>{status}</span>;
    }
    return status;
  };

  // Formatage de la date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR'); // Format JJ/MM/AAAA
  };

  if (loading) {
    return <div className={styles.container}>Chargement des signalements...</div>;
  }

  if (error) {
    return <div className={styles.container}>Erreur : {error}</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Tableau de Bord des Signalements</h1>
      <table className={styles.table}>
        <thead className={styles.tableHeader}>
          <tr>
            <th>ID</th>
            <th>Signalé par</th>
            <th>Utilisateur signalé</th>
            <th>Conversation</th>
            <th>Motif</th>
            <th>Statut</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr key={report._id} className={styles.tableRow}>
              <td className={`${styles.tableCell} ${styles.idCell}`}>
                {report._id.substring(0, 6)}...{report._id.substring(report._id.length - 4)}
              </td>
              <td className={styles.tableCell}>
                {report.reporter ? `${report.reporter.firstName} ${report.reporter.lastName}` : 'Inconnu'}
              </td>
              <td className={styles.tableCell}>
                {report.reportedUser ? `${report.reportedUser.firstName} ${report.reportedUser.lastName}` : 'Inconnu'}
              </td>
              <td className={styles.tableCell}>
                {report.conversation?.groupName || `Conv_${report.conversation?._id.substring(0, 6)}`}
              </td>
              <td className={styles.tableCell}>{report.reason}</td>
              <td className={`${styles.tableCell} ${styles.statusCell}`}>
                {renderStatusBadge(report.status)}
              </td>
              <td className={styles.tableCell}>{formatDate(report.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReportTable;