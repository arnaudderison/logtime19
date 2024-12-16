import React, { useState } from "react";

type Log = {
  date: string;
  hours: number;
};

type CalendarProps = {
  logs: Log[];
};

const Calendar: React.FC<CalendarProps> = ({ logs }) => {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const currentMonthDays = Array.from({ length: endOfMonth.getDate() }, (_, i) => {
    const date = new Date(startOfMonth);
    date.setDate(startOfMonth.getDate() + i);
    return date;
  });

  const logMap = logs.reduce((acc, log) => {
    acc[log.date] = log.hours;
    return acc;
  }, {} as { [date: string]: number });

  const getColor = (hours: number) => {
    if (hours >= 6) return "high";
    if (hours >= 3) return "medium";
    if (hours > 0) return "low";
    return "none";
  };

  const formatHours = (hours: number) => {
    const totalMinutes = Math.round(hours * 60);
    const hh = Math.floor(totalMinutes / 60)
      .toString()
      .padStart(2, "0");
    const mm = (totalMinutes % 60).toString().padStart(2, "0");
    return `${hh}h${mm}`;
  };


  const [hoverInfo, setHoverInfo] = useState<{ visible: boolean; hours: string; x: number; y: number }>({
    visible: false,
    hours: "",
    x: 0,
    y: 0,
  });

  const handleMouseEnter = (e: React.MouseEvent, hours: number) => {
    const hoursText = formatHours(hours);
    setHoverInfo({
      visible: true,
      hours: hoursText,
      x: e.clientX + 15,
      y: e.clientY + 15,
    });
  };

  const handleMouseLeave = () => {
    setHoverInfo({ ...hoverInfo, visible: false });
  };

  return (
    <div className="calendar-container">
      {hoverInfo.visible && (
        <div
          className="hover-display"
          style={{
            top: hoverInfo.y,
            left: hoverInfo.x,
          }}
        >
          {hoverInfo.hours}
        </div>
      )}

      <h2 className="month-title">
        {today.toLocaleString("default", { month: "long", year: "numeric" })}
      </h2>

      <div className="calendar">
        {currentMonthDays.map((date, index) => {
          const dayKey = date.toISOString().split("T")[0];
          const hours = logMap[dayKey] || 0;
          return (
            <div
              key={index}
              className={`day ${getColor(hours)}`}
              onMouseEnter={(e) => handleMouseEnter(e, hours)}
              onMouseLeave={handleMouseLeave}
            >
              {date.getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;
