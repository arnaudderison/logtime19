import { useAuth } from "../auth/AuthProvider";
import { useState, useEffect } from "react";
import axios from "axios";
import "../styles/calendar.css";
import "../styles/home.css";
import Calendar from "./Calendar";

type Log = {
  begin_at: string;
  end_at: string | null;
  host: string;
};

function Home() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<Log[]>([]);
  const [totalMonthHours, setTotalMonthHours] = useState<string | null>(null);
  const [totalWeeklyHours, setTotalWeeklyHours] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const splitIntervalsByDay = (start: Date, end: Date) => {
    const intervals: { start: Date; end: Date }[] = [];
    let currentStart = new Date(start);

    while (currentStart < end) {
      const dayEnd = new Date(currentStart);
      dayEnd.setUTCHours(23, 59, 59, 999);

      intervals.push({
        start: new Date(currentStart),
        end: dayEnd < end ? dayEnd : new Date(end),
      });

      currentStart = new Date(dayEnd.getTime() + 1);
    }

    return intervals;
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

  const calculateTotalHours = (logs: Log[], startDate: Date, endDate: Date): number => {
    const intervals: { start: Date; end: Date }[] = logs.flatMap((log) => {
      const logStart = new Date(log.begin_at);
      const logEnd = log.end_at ? new Date(log.end_at) : new Date();
      const effectiveStart = logStart > startDate ? logStart : startDate;
      const effectiveEnd = logEnd < endDate ? logEnd : endDate;

      return effectiveStart < effectiveEnd
        ? splitIntervalsByDay(effectiveStart, effectiveEnd)
        : [];
    });

    const mergedIntervals = mergeIntervals(intervals);

    return mergedIntervals.reduce((sum, interval) => {
      return sum + (interval.end.getTime() - interval.start.getTime()) / (1000 * 60 * 60);
    }, 0);
  };

  const formatHours = (hours: number): string => {
    const totalMinutes = Math.round(hours * 60);
    const hh = Math.floor(totalMinutes / 60).toString();
    const mm = (totalMinutes % 60).toString().padStart(2, "0");
    return `${hh}h${mm}`;
  };

  const calculateTotals = (logs: Log[]) => {
    const now = new Date();

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setUTCHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setUTCHours(23, 59, 59, 999);

    const monthHours = calculateTotalHours(logs, startOfMonth, endOfMonth);
    const weekHours = calculateTotalHours(logs, startOfWeek, endOfWeek);

    setTotalMonthHours(formatHours(monthHours));
    setTotalWeeklyHours(formatHours(weekHours));
  };

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
      calculateTotals(response.data);
    } catch (err: any) {
      setError("Erreur lors de la récupération des données.");
      console.error("Erreur :", err);
    } finally {
      setLoading(false);
    }
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
        {loading && <p className="loading">Chargement des données...</p>}
        {error && <p className="error">{error}</p>}

        {!loading && (
          <>
            <section className="calendar-section">
              <h2>Calendrier</h2>
              <Calendar logs={logs} />
            </section>

            <section className="logs-section">
              <div className="total-hours">
                <p>
                  <strong>Total des heures du mois :</strong> {totalMonthHours || "0h"}
                </p>
                <p>
                  <strong>Total des heures de la semaine :</strong> {totalWeeklyHours || "0h"}
                </p>
              </div>

              <div className="button-container">
                <button className="reload-button" onClick={fetchLogs}>
                  Mettre à jour les données
                </button>
              </div>

              <h2>Liste des logs</h2>
              <ul className="log-list">
                {logs.map((log, i) => (
                  <li key={i}>
                    <span>Poste : {log.host}</span>
                    <span className="log-date">
                      Début : {new Date(log.begin_at).toLocaleString("fr-FR")}
                    </span>
                    <span className="log-date">
                      Fin : {log.end_at ? new Date(log.end_at).toLocaleString("fr-FR") : "En cours"}
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
