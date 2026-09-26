import { useState, useEffect } from "react";

const MOOD_PIXEL_COLORS = {
  joy:      { bg: "#f59e0b", label: "Joyful",    emoji: "🤩" },
  sadness:  { bg: "#3b82f6", label: "Sad",       emoji: "😢" },
  anger:    { bg: "#ef4444", label: "Angry",     emoji: "😡" },
  fear:     { bg: "#8b5cf6", label: "Fearful",   emoji: "😨" },
  love:     { bg: "#ec4899", label: "Loving",    emoji: "🥰" },
  surprise: { bg: "#22c55e", label: "Surprised", emoji: "😲" },
  neutral:  { bg: "#9ca3af", label: "Neutral",   emoji: "😐" },
};

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export default function YearInPixels() {
  const [pixelData, setPixelData] = useState({});
  const [activeTooltip, setActiveTooltip] = useState(null);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    async function loadRealJournalEntries() {
      const grid = {};
      const token = localStorage.getItem("moodifyToken");

      // 1. Fetch real journal entries from Backend MongoDB
      if (token) {
        try {
          const res = await fetch("http://localhost:8000/mood/journal", {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            (data.entries || []).forEach((entry) => {
              if (entry.timestamp) {
                const d = new Date(entry.timestamp);
                if (d.getFullYear() === currentYear) {
                  const key = `${d.getMonth()}-${d.getDate()}`;
                  grid[key] = {
                    emotion: entry.detected_mood || "neutral",
                    text: entry.input_text || "Logged entry",
                    date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                  };
                }
              }
            });
          }
        } catch (err) {
          console.warn("[YearInPixels] Could not load backend journal entries:", err);
        }
      }

      // 2. Fallback to localStorage real entries if available
      const localEntries = JSON.parse(localStorage.getItem("moodify_journal_entries") || "[]");
      localEntries.forEach((entry) => {
        if (entry.timestamp) {
          const d = new Date(entry.timestamp);
          if (d.getFullYear() === currentYear) {
            const key = `${d.getMonth()}-${d.getDate()}`;
            if (!grid[key]) {
              grid[key] = {
                emotion: entry.detected_mood || entry.emotion || "neutral",
                text: entry.input_text || "Logged entry",
                date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
              };
            }
          }
        }
      });

      // 3. Include today's active detected mood if logged
      const currentMood = JSON.parse(localStorage.getItem("moodify_mood") || "null");
      if (currentMood) {
        const d = new Date();
        if (d.getFullYear() === currentYear) {
          const key = `${d.getMonth()}-${d.getDate()}`;
          if (!grid[key]) {
            grid[key] = {
              emotion: currentMood.emotion || "neutral",
              text: currentMood.description || "Today's check-in",
              date: `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`,
            };
          }
        }
      }

      setPixelData(grid);
    }

    loadRealJournalEntries();
  }, [currentYear]);

  // Count real mood frequencies
  const counts = Object.values(pixelData).reduce((acc, curr) => {
    acc[curr.emotion] = (acc[curr.emotion] || 0) + 1;
    return acc;
  }, {});

  const totalLogged = Object.keys(pixelData).length;

  return (
    <div className="year-in-pixels-card glass">
      <style>{`
        .year-in-pixels-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 28px;
          margin-top: 32px;
          backdrop-filter: blur(20px);
          position: relative;
        }

        .yip-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .yip-title h2 {
          font-size: 1.4rem;
          font-weight: 800;
          color: var(--text, #ffffff);
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .yip-title p {
          font-size: 0.85rem;
          color: var(--text-secondary, #a1a1aa);
          margin-top: 4px;
        }

        .yip-stats-strip {
          display: flex;
          gap: 12px;
        }

        .yip-stat-badge {
          background: rgba(139, 92, 246, 0.15);
          border: 1px solid rgba(139, 92, 246, 0.3);
          padding: 6px 14px;
          border-radius: 99px;
          font-size: 0.8rem;
          font-weight: 700;
          color: #a78bfa;
        }

        /* ── Legend ── */
        .yip-legend {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .yip-legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.82rem;
          color: var(--text-secondary, #a1a1aa);
          font-weight: 600;
        }

        .yip-legend-dot {
          width: 12px;
          height: 12px;
          border-radius: 3px;
        }

        /* ── Heatmap Grid ── */
        .yip-grid-wrap {
          overflow-x: auto;
          padding-bottom: 10px;
        }

        .yip-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 12px;
          min-width: 680px;
        }

        .yip-month-col {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .yip-month-name {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-secondary, #a1a1aa);
          text-align: center;
          margin-bottom: 6px;
        }

        .yip-pixels-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 4px;
        }

        .yip-pixel {
          width: 14px;
          height: 14px;
          border-radius: 3.5px;
          background: rgba(255, 255, 255, 0.05);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          cursor: pointer;
          position: relative;
        }

        .yip-pixel:hover {
          transform: scale(1.4);
          z-index: 10;
          box-shadow: 0 0 12px rgba(0, 0, 0, 0.5);
        }

        /* ── Tooltip ── */
        .yip-tooltip {
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          margin-bottom: 8px;
          background: #18181b;
          border: 1px solid rgba(139, 92, 246, 0.4);
          border-radius: 10px;
          padding: 8px 12px;
          font-size: 0.75rem;
          white-space: nowrap;
          color: #ffffff;
          box-shadow: 0 8px 24px rgba(0,0,0,0.5);
          pointer-events: none;
          z-index: 100;
        }

        /* ── Distribution Bar ── */
        .yip-bar-wrap {
          margin-top: 20px;
          height: 8px;
          background: rgba(255,255,255,0.06);
          border-radius: 99px;
          display: flex;
          overflow: hidden;
        }

        .yip-bar-seg {
          height: 100%;
          transition: width 0.5s ease;
        }

        /* ── LIGHT MODE OVERRIDES ── */
        html.light .year-in-pixels-card {
          background: #ffffff;
          border: 1px solid rgba(0, 0, 0, 0.1);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
        }

        html.light .yip-title h2 { color: #18181b; }
        html.light .yip-title p { color: #52525b; }
        html.light .yip-month-name { color: #52525b; }
        html.light .yip-legend-item { color: #3f3f46; }
        html.light .yip-legend { border-bottom-color: rgba(0, 0, 0, 0.08); }
        html.light .yip-stat-badge {
          background: #f3e8ff;
          border-color: #ddd6fe;
          color: #7c3aed;
        }
        html.light .yip-pixel { background: rgba(0, 0, 0, 0.06); }
        html.light .yip-bar-wrap { background: rgba(0, 0, 0, 0.08); }
        html.light .yip-tooltip {
          background: #ffffff;
          border-color: #d4d4d8;
          color: #18181b;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
        }
      `}</style>

      {/* Header */}
      <div className="yip-header">
        <div className="yip-title">
          <h2>🖼️ Year in Pixels — {currentYear}</h2>
          <p>Your real emotional landscape logged day by day.</p>
        </div>
        <div className="yip-stats-strip">
          <div className="yip-stat-badge">✨ {totalLogged} Days Logged</div>
        </div>
      </div>

      {/* Mood Color Legend */}
      <div className="yip-legend">
        {Object.entries(MOOD_PIXEL_COLORS).map(([key, info]) => (
          <div key={key} className="yip-legend-item">
            <div className="yip-legend-dot" style={{ background: info.bg }} />
            <span>{info.emoji} {info.label} ({counts[key] || 0})</span>
          </div>
        ))}
      </div>

      {/* Heatmap Grid */}
      <div className="yip-grid-wrap">
        <div className="yip-grid">
          {MONTH_NAMES.map((monthName, mIdx) => {
            const daysInMonth = new Date(currentYear, mIdx + 1, 0).getDate();
            return (
              <div key={monthName} className="yip-month-col">
                <span className="yip-month-name">{monthName}</span>
                <div className="yip-pixels-row">
                  {Array.from({ length: daysInMonth }).map((_, dIdx) => {
                    const dayNum = dIdx + 1;
                    const key = `${mIdx}-${dayNum}`;
                    const item = pixelData[key];
                    const info = item ? MOOD_PIXEL_COLORS[item.emotion] : null;

                    return (
                      <div
                        key={dayNum}
                        className="yip-pixel"
                        style={{
                          background: info ? info.bg : undefined,
                          boxShadow: info ? `0 0 6px ${info.bg}66` : undefined,
                        }}
                        onMouseEnter={() =>
                          item &&
                          setActiveTooltip({
                            key,
                            text: `${MONTH_NAMES[mIdx]} ${dayNum}: ${info?.emoji || "🎵"} ${info?.label || item.emotion} — "${item.text}"`,
                          })
                        }
                        onMouseLeave={() => setActiveTooltip(null)}
                      >
                        {activeTooltip && activeTooltip.key === key && (
                          <div className="yip-tooltip">{activeTooltip.text}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mood Distribution Bar */}
      {totalLogged > 0 && (
        <div className="yip-bar-wrap" title="Yearly Mood Distribution">
          {Object.entries(MOOD_PIXEL_COLORS).map(([key, info]) => {
            const pct = ((counts[key] || 0) / totalLogged) * 100;
            return pct > 0 ? (
              <div
                key={key}
                className="yip-bar-seg"
                style={{ width: `${pct}%`, background: info.bg }}
                title={`${info.label}: ${pct.toFixed(1)}%`}
              />
            ) : null;
          })}
        </div>
      )}
    </div>
  );
}
