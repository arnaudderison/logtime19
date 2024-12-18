import { useAuth } from "../auth/AuthProvider";
import { useState, useEffect } from "react";
import axios from "axios";
import "../styles/calendar.css";
import "../styles/home.css";
import Calendar from "./Calendar";

type Log = {
  begin_at: string;
  end_at: string;
  host: string;
};

function Home() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<Log[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLogs = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get<Log[]>(
        `${import.meta.env.VITE_API_42_URI}/logs`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );
      setLogs(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  const mergeIntervals = (intervals: { start: Date; end: Date }[]) => {
    if (intervals.length === 0) return [];

    intervals.sort((a, b) => a.start.getTime() - b.start.getTime());

    const merged: { start: Date; end: Date }[] = [intervals[0]];

    for (let i = 1; i < intervals.length; i++) {
      const last = merged[merged.length - 1];
      const current = intervals[i];

      if (current.start <= last.end) {
        last.end = new Date(Math.max(last.end.getTime(), current.end.getTime()));
      } else {
        merged.push(current);
      }
    }

    return merged;
  };

  const calculateTotalHours = () => {
    const now = new Date();
    const currentMonth = now.getUTCMonth();
    const currentYear = now.getUTCFullYear();

    const logsForCurrentMonth = logs.filter((log) => {
      const logDate = new Date(log.begin_at);
      return (
        logDate.getUTCMonth() === currentMonth &&
        logDate.getUTCFullYear() === currentYear
      );
    });

    const dayMap: { [key: string]: { start: Date; end: Date }[] } = {};

    logsForCurrentMonth.forEach((log) => {
      const start = new Date(log.begin_at); // UTC
      const end = new Date(log.end_at); // UTC

      let current = new Date(start);

      while (current <= end) {
        const dayKey = current.toISOString().split("T")[0];
        const dayStart = new Date(dayKey + "T00:00:00Z"); // Start of the day in UTC
        const dayEnd = new Date(dayKey + "T23:59:59.999Z"); // End of the day in UTC

        const effectiveStart = current > dayStart ? new Date(current) : dayStart;
        const effectiveEnd = end < dayEnd ? new Date(end) : dayEnd;

        if (!dayMap[dayKey]) {
          dayMap[dayKey] = [];
        }

        dayMap[dayKey].push({ start: effectiveStart, end: effectiveEnd });

        current = new Date(dayStart);
        current.setUTCDate(current.getUTCDate() + 1);
      }
    });

    const totalHours = Object.keys(dayMap).reduce((sum, dayKey) => {
      const intervals = mergeIntervals(dayMap[dayKey]);
      const hours = intervals.reduce((daySum, interval) => {
        const diffHours =
          (interval.end.getTime() - interval.start.getTime()) / (1000 * 60 * 60);
        return daySum + diffHours;
      }, 0);
      return sum + hours;
    }, 0);

    return formatHours(totalHours);
  };

  const formatHours = (hours: number) => {
    const totalMinutes = Math.round(hours * 60);
    const hh = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
    const mm = String(totalMinutes % 60).padStart(2, "0");
    return mm === "00" ? `${hh}h` : `${hh}h${mm}`;
  };

  // Format dates for Belgium timezone
  const formatDateForBelgium = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fr-FR", {
      timeZone: "Europe/Brussels",
      dateStyle: "short",
      timeStyle: "short",
    }).format(date);
  };

  useEffect(() => {
    fetchLogs();
  }, [user]);

  return (
    <div className="home-container">
      <header className="header">
        <h1>Bienvenue, {user?.login || "Utilisateur"}</h1>
        <p>Voici vos logtimes.</p>
      </header>

      <main>
        {loading && <p className="loading">Chargement des logtimes...</p>}
        {error && <p className="error">{error}</p>}

        {!loading && logs.length > 0 && (
          <>
            <section className="calendar-section">
              <h2>Calendrier</h2>
              <Calendar logs={logs} />
            </section>

            <section className="logs-section">
              <div className="total-hours">
                <p>
                  Total des heures du mois : <strong>{calculateTotalHours()}</strong>
                </p>
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
                    <span>Poste : {log.host}</span>
                    <span className="log-date">
                      Début : {formatDateForBelgium(log.begin_at)}
                    </span>
                    <span className="log-date">
                      Fin : {formatDateForBelgium(log.end_at)}
                    </span>
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
