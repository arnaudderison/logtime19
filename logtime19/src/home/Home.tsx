import { useAuth } from '../auth/AuthProvider';
import { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/test.css';
import '../styles/home.css';
import Calendar from './Calendar';

type Log = {
  date: string;
  hours: number;
  host: string;
};

function Home() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<Log[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  function formatHours(hours: number): string {
    const totalMinutes = Math.round(hours * 60);
    const hh = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
    const mm = String(totalMinutes % 60).padStart(2, '0');
    return `${hh}h${mm}`;
  }

  function getWeekDay(date: string): string {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long' };
    const day = new Date(date).toLocaleDateString('fr-FR', options);
    return day.charAt(0).toUpperCase() + day.slice(1);
  }

  function calculateTotalHours(): string {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const logsForCurrentMonth = logs.filter((log) => {
      const logDate = new Date(log.date);
      return (
        logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear
      );
    });

    const totalHours = logsForCurrentMonth.reduce((sum, log) => sum + log.hours, 0);
    return formatHours(totalHours);
  }

  const fetchLogs = () => {
    if (user) {
      setLoading(true);
      setError(null);
      axios
        .get<Log[]>(`${import.meta.env.VITE_API_42_URI}/logs`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
        })
        .then((response) => {
          setLogs(response.data);
          console.log(response.data);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.response?.data?.message || 'Erreur inconnue');
          setLoading(false);
        });
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [user]);

  return (
    <div className="home-container">
      <header className="header">
        <h1>Bienvenue, {user?.login || 'Utilisateur'}</h1>
        <p>Voici vos logtimes.</p>
      </header>

      <main>
        {!loading && error && <p className="error">{error}</p>}
        {loading && <p className="loading">Chargement des logtimes...</p>}
        {!loading && logs.length > 0 && (
          <>
            <section className="calendar-section">
              <h2>Calendrier</h2>
              <Calendar logs={logs} />
            </section>

            <section className="logs-section">
              <div className="total-hours">
                <p>Total des heures du mois : <strong>{calculateTotalHours()}</strong></p>
              </div>

              <div className="button-container">
                <button className="reload-button" onClick={fetchLogs}>
                  Mettre à jour les logs
                </button>
              </div>

              <h2>Liste des logs</h2>
              <ul className="log-list">
                {logs.map((log, i) => (
                  <li key={i}>
                    <span>{log.host}</span>
                    <span className="log-date">
                      {getWeekDay(log.date)}, {log.date}
                    </span>
                    <span className="log-hours">{formatHours(log.hours)}</span>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default Home;
