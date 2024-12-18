import React, { useState, useEffect } from "react";

type Log = {
  begin_at: string;
  end_at: string | null;
};

type CalendarProps = {
  logs: Log[];
};

function useIsUserConnected(logs: Log[]) {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const hasActiveConnection = logs.some(log => log.end_at === null);
    setIsConnected(hasActiveConnection);
  }, [logs]);

  return isConnected;
}

function Calendar({ logs }: CalendarProps) {
  const today = new Date();
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const isConnected = useIsUserConnected(logs);

  const currentMonthDays = Array.from({ length: endOfMonth.getDate() }, (_, i) => {
    const date = new Date(today.getFullYear(), today.getMonth(), i + 1);
    date.setUTCHours(0, 0, 0, 0);
    return date;
  });

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

  // Fusion des intervalles qui se chevauchent
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

  const calculateHoursPerDay = (logs: Log[]) => {
    const dayMap: { [key: string]: { start: Date; end: Date }[] } = {};

    logs.forEach((log) => {
      const start = new Date(log.begin_at);
      const end = log.end_at ? new Date(log.end_at) : new Date();

      const intervals = splitIntervalsByDay(start, end);
      intervals.forEach((interval) => {
        const dayKey = interval.start.toISOString().split("T")[0];
        if (!dayMap[dayKey]) {
          dayMap[dayKey] = [];
        }
        dayMap[dayKey].push(interval);
      });
    });

    const hoursPerDay: { [key: string]: number } = {};
    Object.keys(dayMap).forEach((dayKey) => {
      const mergedIntervals = mergeIntervals(dayMap[dayKey]);
      const totalHours = mergedIntervals.reduce((sum, interval) => {
        const diffHours =
          (interval.end.getTime() - interval.start.getTime()) / (1000 * 60 * 60);
        return sum + diffHours;
      }, 0);
      hoursPerDay[dayKey] = totalHours;
    });

    return hoursPerDay;
  };

  const hoursPerDay = calculateHoursPerDay(logs);

  const getColor = (hours: number) => {
    if (hours >= 6) return "high";
    if (hours >= 3) return "medium";
    if (hours > 0) return "low";
    return "none";
  };

  const formatHours = (hours: number) => {
    const totalMinutes = Math.round(hours * 60);
    if (totalMinutes < 60) return `${totalMinutes}m`;

    const hh = Math.floor(totalMinutes / 60).toString();
    const mm = (totalMinutes % 60).toString().padStart(2, "0");
    return `${hh}h${mm}`;
  };

  const [hoverInfo, setHoverInfo] = useState({
    visible: false,
    text: "",
    x: 0,
    y: 0,
  });

  const handleMouseEnter = (e: React.MouseEvent, hours: number) => {
    setHoverInfo({
      visible: true,
      text: formatHours(hours),
      x: e.pageX + 15,
      y: e.pageY + 15,
    });
  };

  const handleMouseLeave = () => setHoverInfo({ visible: false, text: "", x: 0, y: 0 });

  return (
    <div>
      <h1>Calendar</h1>

      {isConnected && (
        <div style={{
          backgroundColor: "green",
          color: "white",
          padding: "10px",
          textAlign: "center",
          borderRadius: "5px",
          marginBottom: "10px",
        }}>
          Vous êtes actuellement connecté !
        </div>
      )}

      {hoverInfo.visible && (
        <div
          style={{
            position: "absolute",
            top: hoverInfo.y,
            left: hoverInfo.x,
            backgroundColor: "black",
            color: "white",
            padding: "5px",
            borderRadius: "4px",
            fontSize: "12px",
          }}
        >
          {hoverInfo.text}
        </div>
      )}

      <div className="calendar" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "10px" }}>
        {currentMonthDays.map((date) => {
          const dayKey = date.toISOString().split("T")[0];
          const hours = hoursPerDay[dayKey] || 0;

          return (
            <div
              key={dayKey}
              className={`day ${getColor(hours)}`}
              onMouseEnter={(e) => handleMouseEnter(e, hours)}
              onMouseLeave={handleMouseLeave}
              style={{
                height: "50px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <span>{date.getDate()}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Calendar;