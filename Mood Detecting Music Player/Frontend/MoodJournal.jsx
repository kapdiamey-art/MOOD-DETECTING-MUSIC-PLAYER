import { useEffect, useMemo, useState } from "react";
import { MOOD_META } from "./moodTheme";
import YearInPixels from "./YearInPixels";

const API = "http://localhost:8000";
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function MoodJournal() {
  const [entries, setEntries] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showAllOpen, setShowAllOpen] = useState(false);
  const [error, setError] = useState("");

  // Month & Year state (defaults to current date)
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());

  useEffect(() => {
    const token = localStorage.getItem("moodifyToken");
    fetch(`${API}/mood/journal`, { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => setEntries(data.entries || []))
      .catch(() => setError("Your journal could not be loaded right now."));
  }, []);

  const days = useMemo(() => {
    const grouped = {};
    entries.forEach((entry) => {
      if (entry.timestamp) {
        const day = new Date(entry.timestamp).toISOString().slice(0, 10);
        (grouped[day] ||= []).push(entry);
      }
    });
    return grouped;
  }, [entries]);

  // Handle Month Navigation
  const prevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  // Generate Calendar Days for Selected Month & Year
  const firstDayOfWeek = new Date(selectedYear, selectedMonth, 1).getDay();
  const daysInMonthCount = new Date(selectedYear, selectedMonth + 1, 0).getDate();

  const selectedEntries = selectedDay ? days[selectedDay] || [] : entries;
  const visibleEntries = selectedEntries.slice(0, 3);
  const hasMoreEntries = selectedEntries.length > 3;

  return (
    <>
      <style>{`
        .month-year-picker {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .month-year-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .month-select, .year-select {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.14);
          color: var(--text, #ffffff);
          padding: 6px 12px;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 700;
          outline: none;
          cursor: pointer;
        }

        .month-nav-btn {
          background: rgba(139,92,246,0.2);
          border: 1px solid rgba(139,92,246,0.4);
          color: #a78bfa;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: grid;
          place-items: center;
          font-weight: 800;
          cursor: pointer;
          transition: background 0.2s;
        }
        .month-nav-btn:hover { background: rgba(139,92,246,0.4); }

        .calendar-day-labels {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 6px;
          text-align: center;
          margin-bottom: 8px;
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-secondary, #a1a1aa);
        }

        .calendar-month-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 6px;
        }

        .month-select option, .year-select option {
          background-color: #1a1a28 !important;
          color: #ffffff !important;
        }

        html.light .month-select, html.light .year-select {
          background: #ffffff !important;
          border-color: #d1d5db !important;
          color: #111827 !important;
        }
        html.light .month-select option, html.light .year-select option {
          background-color: #ffffff !important;
          color: #111827 !important;
        }
        html.light .month-nav-btn {
          background: #f3e8ff !important;
          border-color: #ddd6fe !important;
          color: #7c3aed !important;
        }
      `}</style>

      <section className="journal-page">
        <div className="journal-heading">
          <div>
            <p className="eyebrow">MOOD JOURNAL</p>
            <h1>Your emotional calendar</h1>
            <p>Every mood check-in is saved here automatically.</p>
          </div>
        </div>

        {error && <p className="journal-empty">{error}</p>}

        <div className="journal-grid">
          <div className="journal-card glass">
            <h2>Mood Calendar</h2>

            {/* 🗓️ MONTH & YEAR SELECTOR */}
            <div className="month-year-picker">
              <div className="month-year-controls">
                <button className="month-nav-btn" onClick={prevMonth} title="Previous Month">
                  ‹
                </button>
                <select
                  className="month-select"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                >
                  {MONTH_NAMES.map((mName, idx) => (
                    <option key={mName} value={idx}>{mName}</option>
                  ))}
                </select>

                <select
                  className="year-select"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                >
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <button className="month-nav-btn" onClick={nextMonth} title="Next Month">
                  ›
                </button>
              </div>

              {selectedDay && (
                <button
                  style={{
                    fontSize: "0.75rem",
                    padding: "4px 10px",
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: "8px",
                    color: "var(--text-secondary)",
                    cursor: "pointer"
                  }}
                  onClick={() => setSelectedDay(null)}
                >
                  Clear Filter
                </button>
              )}
            </div>

            {/* DAY OF WEEK LABELS */}
            <div className="calendar-day-labels">
              {DAY_NAMES.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>

            {/* MONTH CALENDAR GRID */}
            <div className="calendar-month-grid">
              {/* Empty offset padding for 1st day of month */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`pad-${i}`} style={{ height: "48px" }} />
              ))}

              {/* Days of the month */}
              {Array.from({ length: daysInMonthCount }).map((_, i) => {
                const dayNum = i + 1;
                const mStr = String(selectedMonth + 1).padStart(2, "0");
                const dStr = String(dayNum).padStart(2, "0");
                const key = `${selectedYear}-${mStr}-${dStr}`;

                const latest = days[key]?.[0];
                const meta = MOOD_META[latest?.detected_mood];

                return (
                  <button
                    key={key}
                    className={`calendar-day ${selectedDay === key ? "selected" : ""}`}
                    onClick={() => setSelectedDay(key)}
                    title={latest ? `${MONTH_NAMES[selectedMonth]} ${dayNum}: ${latest.detected_mood}` : `No entry for ${MONTH_NAMES[selectedMonth]} ${dayNum}`}
                  >
                    <span>{dayNum}</span>
                    <b>{meta?.emoji || "·"}</b>
                  </button>
                );
              })}
            </div>

            <p className="calendar-key" style={{ marginTop: "14px" }}>
              Showing {MONTH_NAMES[selectedMonth]} {selectedYear}. Select a day to view check-ins.
            </p>
          </div>

          <div className="journal-card glass journal-list-card">
            <div className="journal-list-header">
              <h2>
                {selectedDay
                  ? new Date(`${selectedDay}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                  : `Entries for ${MONTH_NAMES[selectedMonth]} ${selectedYear}`}
              </h2>
              {hasMoreEntries && (
                <button className="show-all-button" onClick={() => setShowAllOpen(true)}>Show all</button>
              )}
            </div>

            {selectedEntries.length ? (
              <div className="journal-entry-list">
                {visibleEntries.map((entry) => {
                  const meta = MOOD_META[entry.detected_mood] || { emoji: "🎵", label: entry.detected_mood };
                  return (
                    <article className="journal-entry" key={entry.id || `${entry.timestamp}-${entry.input_text}`}>
                      <span className="journal-emoji">{meta.emoji}</span>
                      <div className="journal-entry-copy">
                        <strong>{meta.label}</strong>
                        <time>{new Date(entry.timestamp).toLocaleString()}</time>
                        <p>{entry.input_text}</p>
                        {entry.recommended_song && (
                          <small>Recommended: {entry.recommended_song.title} — {entry.recommended_song.artist}</small>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="journal-empty">No mood entries for this selection yet.</p>
            )}
          </div>
        </div>

        {/* 🖼️ YEAR IN PIXELS HEATMAP */}
        <YearInPixels />

        {showAllOpen && (
          <div className="journal-modal-backdrop" onClick={() => setShowAllOpen(false)}>
            <div className="journal-modal" onClick={(e) => e.stopPropagation()}>
              <div className="journal-modal-header">
                <div>
                  <p className="eyebrow">MOOD JOURNAL</p>
                  <h3>
                    {selectedDay
                      ? new Date(`${selectedDay}T00:00:00`).toLocaleDateString()
                      : "All entries"}
                  </h3>
                </div>
                <button className="journal-modal-close" onClick={() => setShowAllOpen(false)} aria-label="Close entries">×</button>
              </div>
              <div className="journal-modal-list">
                {selectedEntries.map((entry) => {
                  const meta = MOOD_META[entry.detected_mood] || { emoji: "🎵", label: entry.detected_mood };
                  return (
                    <article className="journal-entry" key={entry.id || `${entry.timestamp}-${entry.input_text}`}>
                      <span className="journal-emoji">{meta.emoji}</span>
                      <div className="journal-entry-copy">
                        <strong>{meta.label}</strong>
                        <time>{new Date(entry.timestamp).toLocaleString()}</time>
                        <p>{entry.input_text}</p>
                        {entry.recommended_song && (
                          <small>Recommended: {entry.recommended_song.title} — {entry.recommended_song.artist}</small>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
}

