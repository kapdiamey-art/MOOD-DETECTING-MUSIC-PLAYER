import { useState, useEffect } from "react";
import AppLayout from "./AppLayout";

export default function Analytics() {

  const [stats,        setStats       ] = useState({ total_sessions: 0, top_mood: "-", songs_played: 0, listening_hours: 0 });
  const [insight,      setInsight     ] = useState("Loading your mood insight...");

  // *******************************************c*******************************************
  // REAL DATA STATES — fetched from backend analytics endpoints
  const [distribution, setDistribution] = useState([]);
  const [activity,     setActivity    ] = useState([]);
  // *******************************************c*******************************************

  useEffect(() => {
    const token = localStorage.getItem("moodifyToken");
    if (!token) return;
    const h = { "Authorization": `Bearer ${token}` };

    fetch("http://localhost:8000/analytics/stats", { headers: h })
      .then(r => r.json()).then(setStats).catch(console.log);

    fetch("http://localhost:8000/analytics/insight", { headers: h })
      .then(r => r.json()).then(d => setInsight(d.insight)).catch(console.log);

    // *******************************************c*******************************************
    // FETCH REAL MOOD DISTRIBUTION — replaces hardcoded mood percentages
    fetch("http://localhost:8000/analytics/mood-distribution", { headers: h })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setDistribution(data); })
      .catch(console.log);

    // FETCH REAL MOOD ACTIVITY — replaces hardcoded chart bars
    fetch("http://localhost:8000/analytics/mood-activity", { headers: h })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setActivity(data); })
      .catch(console.log);
    // *******************************************c*******************************************

  }, []);

  return (
    <AppLayout>

      <h1 className="page-title">
        Your Mood Journey 📊
      </h1>

      <p className="page-description">
        Understand your emotions through your music.
      </p>

      <div className="stats-grid">

        <div className="stat-card glass">
          <div className="stat-label">
            Mood Sessions
          </div>
          <div className="stat-value">
            {stats.total_sessions}
          </div>
        </div>

        <div className="stat-card glass">
          <div className="stat-label">
            Most Detected
          </div>
          <div className="stat-value">
            {stats.top_mood}
          </div>
        </div>

        <div className="stat-card glass">
          <div className="stat-label">
            Songs Played
          </div>
          <div className="stat-value">
            {stats.songs_played}
          </div>
        </div>

        <div className="stat-card glass">
          <div className="stat-label">
            Listening Time
          </div>
          <div className="stat-value">
            {stats.listening_hours}h
          </div>
        </div>

      </div>

      <div className="analytics-grid">

        <div className="analytics-card glass">

          <h2>Mood activity</h2>

          {/* *******************************************c******************************************* */}
          {/* REAL ACTIVITY CHART — data from /analytics/mood-activity, with day labels */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div className="chart">
              {activity.length > 0
                ? activity.map((day, index) => {
                    const maxSessions = Math.max(...activity.map(d => d.sessions), 1);
                    const heightPct   = Math.round((day.sessions / maxSessions) * 100);
                    return (
                      <div
                        key={index}
                        className="chart-bar"
                        style={{
                          height:   heightPct > 0 ? `${heightPct}%` : "4px",
                          opacity:  heightPct > 0 ? 1 : 0.15,
                          minHeight: "4px"
                        }}
                        title={`${day.day}: ${day.sessions} session(s)`}
                      />
                    );
                  })
                : [55,75,40,90,65,80,58,85].map((h, i) => (
                    <div key={i} className="chart-bar" style={{ height: `${h}%`, opacity: 0.3 }} />
                  ))
            }
            </div>

            {/* Day labels row below bars */}
            {activity.length > 0 && (
              <div style={{
                display: "flex",
                justifyContent: "space-around",
                fontSize: "0.72rem",
                color: "var(--text-secondary)",
                paddingTop: "4px"
              }}>
                {activity.map((day, i) => (
                  <span key={i} style={{ textAlign: "center", flex: 1 }}>{day.day}</span>
                ))}
              </div>
            )}
          </div>
          {/* *******************************************c******************************************* */}

        </div>

        <div className="analytics-card glass">

          <h2>Mood distribution</h2>

          {/* *******************************************c******************************************* */}
          {/* REAL MOOD DISTRIBUTION — data from /analytics/mood-distribution */}
          <div className="mood-list">
            {distribution.length > 0
              ? distribution.map(({ mood, percentage }) => (
                  <div className="mood-row" key={mood}>
                    <span>{mood}</span>
                    <div className="mood-progress">
                      <span style={{ width: `${percentage}%` }} />
                    </div>
                    <span>{percentage}%</span>
                  </div>
                ))
              : <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                  No mood data yet. Detect your mood first!
                </p>
            }
          </div>
          {/* *******************************************c******************************************* */}

        </div>

      </div>

      {/* *******************************************c******************************************* */}
      {/* AI INSIGHT — real text from /analytics/insight endpoint */}
      <div className="dashboard-hero" style={{ marginTop: "20px" }}>
        <h2>🧠 Your AI Insight</h2>
        <p>{insight}</p>
      </div>
      {/* *******************************************c******************************************* */}

    </AppLayout>
  );
}