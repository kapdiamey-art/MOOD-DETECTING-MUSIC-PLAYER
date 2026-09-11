import { useState, useEffect } from "react";
import { auth } from "./firebase";

export default function Analytics() {

  const [stats,        setStats       ] = useState({ total_sessions: 0, top_mood: "-", songs_played: 0, listening_hours: 0 });
  const [insight,      setInsight     ] = useState("Loading your mood insight...");
  const [loading,      setLoading     ] = useState(true);

  // *******************************************c*******************************************
  // REAL DATA STATES — fetched from backend analytics endpoints
  const [distribution, setDistribution] = useState([]);
  const [activity,     setActivity    ] = useState([]);
  // *******************************************c*******************************************

  useEffect(() => {
    async function loadData() {
      let token = localStorage.getItem("moodifyToken");

      // Auto-refresh token if Firebase auth user is active
      if (auth?.currentUser) {
        try {
          token = await auth.currentUser.getIdToken();
          localStorage.setItem("moodifyToken", token);
        } catch (e) {
          console.warn("[Analytics] Could not refresh token from auth.currentUser", e);
        }
      }

      // Fallback for email / OTP sessions
      if (!token && localStorage.getItem("moodifyEmail")) {
        token = localStorage.getItem("moodifyEmail");
      }

      if (!token) {
        setInsight("Please log in to see your analytics.");
        setLoading(false);
        return;
      }
      const h = { "Authorization": `Bearer ${token}` };

      // Safe fetch: throws if response is not OK so bad JSON error bodies don't overwrite state
      const safeFetch = (url) =>
        fetch(url, { headers: h }).then(r => {
          if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
          return r.json();
        });

      // *******************************************c*******************************************
      // Run all four requests in parallel and handle each independently
      try {
        const [statsRes, insightRes, distRes, actRes] = await Promise.allSettled([
          safeFetch("http://localhost:8000/analytics/stats"),
          safeFetch("http://localhost:8000/analytics/insight"),
          safeFetch("http://localhost:8000/analytics/mood-distribution"),
          safeFetch("http://localhost:8000/analytics/mood-activity"),
        ]);

      // Stats — safely merge only the fields we need so an error body never wipes defaults
      if (statsRes.status === "fulfilled" && statsRes.value) {
        const d = statsRes.value;
        setStats({
          total_sessions:  d.total_sessions  ?? 0,
          top_mood:        d.top_mood        ?? "-",
          songs_played:    d.songs_played    ?? 0,
          listening_hours: d.listening_hours ?? 0,
        });
      } else {
        console.warn("[Analytics] /stats failed:", statsRes.reason);
      }

      // Insight
      if (insightRes.status === "fulfilled" && insightRes.value?.insight) {
        setInsight(insightRes.value.insight);
      } else {
        console.warn("[Analytics] /insight failed:", insightRes.reason);
        setInsight("Could not load insight. Detect your mood at least once to get started!");
      }

      // Mood distribution
      if (distRes.status === "fulfilled" && Array.isArray(distRes.value)) {
        setDistribution(distRes.value);
      } else {
        console.warn("[Analytics] /mood-distribution failed:", distRes.reason);
      }

      // Mood activity
      if (actRes.status === "fulfilled" && Array.isArray(actRes.value)) {
        setActivity(actRes.value);
      } else {
        console.warn("[Analytics] /mood-activity failed:", actRes.reason);
      }
    } catch (err) {
      console.error("[Analytics] Error loading analytics:", err);
    } finally {
      setLoading(false);
    }
  }
    // *******************************************c*******************************************

    loadData();
  }, []);

  // Compute max sessions once (avoids recalculating inside every map iteration)
  const maxSessions = activity.length > 0
    ? Math.max(...activity.map(d => d.sessions))
    : 1;

  return (
      <>

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
            {loading ? "—" : stats.total_sessions}
          </div>
        </div>

        <div className="stat-card glass">
          <div className="stat-label">
            Most Detected
          </div>
          <div className="stat-value">
            {loading ? "—" : stats.top_mood}
          </div>
        </div>

        <div className="stat-card glass">
          <div className="stat-label">
            Songs Played
          </div>
          <div className="stat-value">
            {loading ? "—" : stats.songs_played}
          </div>
        </div>

        <div className="stat-card glass">
          <div className="stat-label">
            Listening Time
          </div>
          <div className="stat-value">
            {loading ? "—" : `${stats.listening_hours}h`}
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
              {loading
                // Faint skeleton bars while loading
                ? [55,75,40,90,65,80,58,85].map((h, i) => (
                    <div key={i} className="chart-bar" style={{ height: `${h}%`, opacity: 0.15 }} />
                  ))
                : activity.length > 0
                  ? activity.map((day, index) => {
                      const heightPct = maxSessions > 0 ? Math.round((day.sessions / maxSessions) * 100) : 0;
                      return (
                        <div
                          key={day.day + index}
                          className="chart-bar"
                          style={{
                            height:    heightPct > 0 ? `${heightPct}%` : "4px",
                            opacity:   heightPct > 0 ? 1 : 0.15,
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
            {activity.length > 0 && !loading && (
              <div style={{
                display: "flex",
                justifyContent: "space-around",
                fontSize: "0.72rem",
                color: "var(--text-secondary)",
                paddingTop: "4px"
              }}>
                {activity.map((day, i) => (
                  <span key={day.day + i} style={{ textAlign: "center", flex: 1 }}>{day.day}</span>
                ))}
              </div>
            )}

            {!loading && activity.length === 0 && (
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", textAlign: "center", marginTop: "8px" }}>
                No activity in the last 8 days. Start detecting your mood!
              </p>
            )}
          </div>
          {/* *******************************************c******************************************* */}

        </div>

        <div className="analytics-card glass">

          <h2>Mood distribution</h2>

          {/* *******************************************c******************************************* */}
          {/* REAL MOOD DISTRIBUTION — data from /analytics/mood-distribution */}
          <div className="mood-list">
            {loading
              ? <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Loading…</p>
              : distribution.length > 0
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

    </>
  );
}