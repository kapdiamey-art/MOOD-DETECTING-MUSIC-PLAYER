import { useEffect, useMemo, useState } from "react";
import { MOOD_META } from "./moodTheme";

const API = "http://localhost:8000";

export default function MoodJournal() {
  const [entries, setEntries] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showAllOpen, setShowAllOpen] = useState(false);
  const [error, setError] = useState("");

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
      const day = new Date(entry.timestamp).toISOString().slice(0, 10);
      (grouped[day] ||= []).push(entry);
    });
    return grouped;
  }, [entries]);

  const selectedEntries = selectedDay ? days[selectedDay] || [] : entries;
  const visibleEntries = selectedEntries.slice(0, 3);
  const hasMoreEntries = selectedEntries.length > 3;

  return <>
    <section className="journal-page">
      <div className="journal-heading"><div><p className="eyebrow">MOOD JOURNAL</p><h1>Your emotional calendar</h1><p>Every mood check-in is saved here automatically.</p></div></div>
      {error && <p className="journal-empty">{error}</p>}
      <div className="journal-grid">
        <div className="journal-card glass">
          <h2>Mood Calendar</h2>
          <div className="mood-calendar">
            {Array.from({ length: 28 }, (_, index) => {
              const date = new Date(); date.setDate(date.getDate() - (27 - index));
              const key = date.toISOString().slice(0, 10);
              const latest = days[key]?.[0];
              const meta = MOOD_META[latest?.detected_mood];
              return <button key={key} className={`calendar-day ${selectedDay === key ? "selected" : ""}`} onClick={() => setSelectedDay(key)} title={latest?.detected_mood || "No entry"}>
                <span>{date.getDate()}</span><b>{meta?.emoji || "·"}</b>
              </button>;
            })}
          </div>
          <p className="calendar-key">Select a day to read its saved check-ins.</p>
        </div>

        <div className="journal-card glass journal-list-card">
          <div className="journal-list-header">
            <h2>{selectedDay ? new Date(`${selectedDay}T00:00:00`).toLocaleDateString() : "Recent entries"}</h2>
            {hasMoreEntries && (
              <button className="show-all-button" onClick={() => setShowAllOpen(true)}>Show all</button>
            )}
          </div>

          {selectedEntries.length ? (
            <div className="journal-entry-list">
              {visibleEntries.map((entry) => {
                const meta = MOOD_META[entry.detected_mood] || { emoji: "🎵", label: entry.detected_mood };
                return <article className="journal-entry" key={entry.id || `${entry.timestamp}-${entry.input_text}`}>
                  <span className="journal-emoji">{meta.emoji}</span>
                  <div className="journal-entry-copy">
                    <strong>{meta.label}</strong>
                    <time>{new Date(entry.timestamp).toLocaleString()}</time>
                    <p>{entry.input_text}</p>
                    {entry.recommended_song && <small>Recommended: {entry.recommended_song.title} — {entry.recommended_song.artist}</small>}
                  </div>
                </article>;
              })}
            </div>
          ) : (
            <p className="journal-empty">No mood entries for this day yet.</p>
          )}
        </div>
      </div>

      {showAllOpen && (
        <div className="journal-modal-backdrop" onClick={() => setShowAllOpen(false)}>
          <div className="journal-modal" onClick={(e) => e.stopPropagation()}>
            <div className="journal-modal-header">
              <div>
                <p className="eyebrow">MOOD JOURNAL</p>
                <h3>{selectedDay ? new Date(`${selectedDay}T00:00:00`).toLocaleDateString() : "All entries"}</h3>
              </div>
              <button className="journal-modal-close" onClick={() => setShowAllOpen(false)} aria-label="Close entries">×</button>
            </div>
            <div className="journal-modal-list">
              {selectedEntries.map((entry) => {
                const meta = MOOD_META[entry.detected_mood] || { emoji: "🎵", label: entry.detected_mood };
                return <article className="journal-entry" key={entry.id || `${entry.timestamp}-${entry.input_text}`}>
                  <span className="journal-emoji">{meta.emoji}</span>
                  <div className="journal-entry-copy">
                    <strong>{meta.label}</strong>
                    <time>{new Date(entry.timestamp).toLocaleString()}</time>
                    <p>{entry.input_text}</p>
                    {entry.recommended_song && <small>Recommended: {entry.recommended_song.title} — {entry.recommended_song.artist}</small>}
                  </div>
                </article>;
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  </>;
}
