import React, { useState, useEffect } from 'react';
import styles from './ReportTable.module.css';

const ReportTable = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingReportId, setEditingReportId] = useState(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [statusOptions] = useState([
    'pending',
    'reviewed',
    'blocked_3days',
    'blocked_permanent',
    'resolved',
  ]);

  // Fetch reports from the API
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
        setReports(data.data);
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Update report status in the backend
  const updateReportStatus = async (reportId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/MessengerRoute/reports/${reportId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour du statut');
      }

      const data = await response.json();
      if (data.success) {
        // Update the local state to reflect the change
        setReports((prevReports) =>
          prevReports.map((report) =>
            report._id === reportId ? { ...report, status: newStatus } : report
          )
        );
        setEditingReportId(null); // Close the dropdown
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchReports();
  }, []);

  // Render status badge
  const renderStatusBadge = (status) => {
    if (status.includes('blocked')) {
      return <span className={`${styles.badge} ${styles.blockedBadge}`}>{status}</span>;
    } else if (status === 'pending') {
      return <span className={`${styles.badge} ${styles.pendingBadge}`}>{status}</span>;
    } else if (status === 'reviewed') {
      return <span className={`${styles.badge} ${styles.reviewedBadge}`}>{status}</span>;
    } else if (status === 'resolved') {
      return <span className={`${styles.badge} ${styles.resolvedBadge}`}>{status}</span>;
    }
    return status;
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  // Handle edit icon click
  const handleEditClick = (reportId) => {
    setEditingReportId(reportId);
  };

  // Handle status selection
  const handleStatusChange = (reportId, newStatus) => {
    updateReportStatus(reportId, newStatus);
  };

  // Toggle dashboard view
  const toggleDashboard = () => {
    setShowDashboard(!showDashboard);
  };

  if (loading) {
    return <div className={styles.container}>Chargement des signalements...</div>;
  }

  if (error) {
    return <div className={styles.container}>Erreur : {error}</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Tableau de Bord des Signalements</h1>
        <button 
          className={styles.dashboardButton} 
          onClick={toggleDashboard}
        >
          Dashboard
        </button>
      </div>

      {showDashboard ? (
        <div className={styles.dashboardContainer}>
          <iframe 
            title="pi" 
            width="100%" 
            height="600" 
            src="https://app.powerbi.com/view?r=eyJrIjoiM2Q5NzIwZmUtZWQ4OS00OTdiLWI1YTktOTg1N2JhNDQ4ZjQ0IiwidCI6ImRiZDY2NjRkLTRlYjktNDZlYi05OWQ4LTVjNDNiYTE1M2M2MSIsImMiOjl9" 
            frameBorder="0" 
            allowFullScreen="true"
          />
        </div>
      ) : (
        <table className={styles.table}>
          <thead className={styles.tableHeader}>
            <tr>
              <th>Utilisateur signalé</th>
              <th>Signalé par</th>
              <th>Motif</th>
              <th>Date</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report._id} className={styles.tableRow}>
                <td className={styles.tableCell}>
                  {report.reportedUser
                    ? `${report.reportedUser.firstName} ${report.reportedUser.lastName}`
                    : 'Inconnu'}
                </td>
                <td className={styles.tableCell}>
                  {report.reporter
                    ? `${report.reporter.firstName} ${report.reporter.lastName}`
                    : 'Inconnu'}
                </td>
                <td className={styles.tableCell}>{report.reason}</td>
                <td className={styles.tableCell}>{formatDate(report.createdAt)}</td>
                <td className={`${styles.tableCell} ${styles.statusCell}`}>
                  <div className={styles.statusContainer}>
                    {renderStatusBadge(report.status)}
                    <svg
                      onClick={() => handleEditClick(report._id)}
                      className={styles.editIcon}
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="#06BBCC"
                      xmlns="http://www.w3.org/2000/svg"
                      style={{ cursor: 'pointer', marginLeft: '8px' }}
                    >
                      <path d="M12.293 1.293a1 1 0 011.414 0l1 1a1 1 0 010 1.414L6.414 12H3v-3.414l8.293-8.293zM4 11h1.586l7-7L11 2.414l-7 7V11z" />
                    </svg>
                    {editingReportId === report._id && (
                      <select
                        className={styles.statusSelect}
                        value={report.status}
                        onChange={(e) => handleStatusChange(report._id, e.target.value)}
                        autoFocus
                        onBlur={() => setEditingReportId(null)}
                      >
                        {statusOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ReportTable;