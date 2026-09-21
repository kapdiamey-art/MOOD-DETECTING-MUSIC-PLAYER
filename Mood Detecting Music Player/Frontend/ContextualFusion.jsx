import { useState, useEffect } from "react";

export default function ContextualFusion({ onPlaylistFused }) {
  const [city, setCity] = useState("Mumbai");
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fusing, setFusing] = useState(false);
  const [fusionResult, setFusionResult] = useState(null);

  useEffect(() => {
    fetchWeather(city);
  }, []);

  const fetchWeather = async (targetCity) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/context/weather?city=${encodeURIComponent(targetCity)}`);
      if (res.ok) {
        const data = await res.json();
        setWeather(data);
      }
    } catch (err) {
      console.error("Error fetching weather:", err);
    } finally {
      setLoading(false);
    }
  };

  const triggerFusion = async () => {
    setFusing(true);
    try {
      const savedEmotion = localStorage.getItem("moodify_theme_emotion") || "joy";
      const res = await fetch("http://localhost:8000/context/fuse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `Listening during ${weather?.condition || "Clear"} weather in ${city}`,
          emotion: savedEmotion,
          city: city,
          language: "all"
        })
      });

      if (res.ok) {
        const data = await res.json();
        setFusionResult(data);
        if (onPlaylistFused) {
          onPlaylistFused(data);
        }
      }
    } catch (err) {
      console.error("Error triggering contextual fusion:", err);
    } finally {
      setFusing(false);
    }
  };

  const currentEmotion = localStorage.getItem("moodify_theme_emotion") || "joy";

  return (
    <div className="ctx-fusion-card glass">
      <style>{`
        .ctx-fusion-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 24px;
          margin-top: 24px;
          backdrop-filter: blur(20px);
        }

        .ctx-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .ctx-title h3 {
          font-size: 1.15rem;
          font-weight: 800;
          color: var(--text, #ffffff);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ctx-title p {
          font-size: 0.82rem;
          color: var(--text-secondary, #a1a1aa);
          margin-top: 2px;
        }

        .ctx-city-input-wrap {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .ctx-city-input {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px;
          padding: 6px 12px;
          color: #ffffff;
          font-size: 0.85rem;
          outline: none;
          width: 120px;
        }

        .ctx-city-btn {
          background: rgba(139,92,246,0.2);
          border: 1px solid rgba(139,92,246,0.4);
          color: #a78bfa;
          padding: 6px 12px;
          border-radius: 10px;
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
        }

        .ctx-api-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(34, 197, 94, 0.12);
          border: 1px solid rgba(34, 197, 94, 0.3);
          color: #4ade80;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 99px;
          margin-top: 10px;
        }

        .ctx-env-strip {
          display: flex;
          gap: 12px;
          margin-top: 14px;
          flex-wrap: wrap;
        }

        .ctx-pill {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          padding: 8px 14px;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
          color: #e4e4e7;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .ctx-fuse-btn {
          margin-top: 20px;
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #06b6d4, #3b82f6);
          color: #ffffff;
          border: none;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .ctx-fuse-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(6, 182, 212, 0.35);
        }

        .ctx-result-banner {
          margin-top: 16px;
          padding: 16px;
          background: rgba(6, 182, 212, 0.08);
          border: 1px solid rgba(6, 182, 212, 0.25);
          border-radius: 14px;
        }

        .ctx-result-banner h4 {
          font-size: 1.05rem;
          color: #38bdf8;
          font-weight: 800;
        }

        .ctx-result-banner p {
          font-size: 0.85rem;
          color: #e0f2fe;
          margin-top: 4px;
        }

        /* ── LIGHT MODE OVERRIDES ── */
        html.light .ctx-fusion-card {
          background: #ffffff;
          border: 1px solid rgba(0, 0, 0, 0.1);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
        }
        html.light .ctx-title h3 { color: #18181b; }
        html.light .ctx-title p { color: #52525b; }
        html.light .ctx-city-input {
          background: #f4f4f5;
          border-color: #d4d4d8;
          color: #18181b;
        }
        html.light .ctx-city-btn {
          background: #f3e8ff;
          border-color: #ddd6fe;
          color: #7c3aed;
        }
        html.light .ctx-pill {
          background: #f4f4f5;
          border-color: #e4e4e7;
          color: #18181b;
        }
        html.light .ctx-api-badge {
          background: #dcfce7;
          border-color: #86efac;
          color: #15803d;
        }
        html.light .ctx-result-banner {
          background: #f0f9ff;
          border-color: #bae6fd;
        }
        html.light .ctx-result-banner h4 { color: #0284c7; }
        html.light .ctx-result-banner p { color: #0369a1; }
      `}</style>

      <div className="ctx-header">
        <div className="ctx-title">
          <h3>🌧️ Environmental Sentiment Fusion</h3>
          <p>Live Weather + Time of Day + Spotify Audio Features</p>
        </div>

        <div className="ctx-city-input-wrap">
          <input
            className="ctx-city-input"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City"
          />
          <button className="ctx-city-btn" onClick={() => fetchWeather(city)}>
            Update
          </button>
        </div>
      </div>

      {weather && (
        <>
          <div className="ctx-api-badge">
            🟢 OpenWeatherMap API Active • Weather: {weather.condition} ({weather.temp_c}°C) • Time: {weather.time_of_day} • City: {weather.city} • Mood: {currentEmotion}
          </div>

          <div className="ctx-env-strip">
            <div className="ctx-pill">
              <span>{weather.icon}</span>
              <span>{weather.condition} ({weather.temp_c}°C)</span>
            </div>
            <div className="ctx-pill">
              <span>{weather.time_icon}</span>
              <span>{weather.time_of_day}</span>
            </div>
            <div className="ctx-pill">
              <span>📍</span>
              <span>{weather.city}</span>
            </div>
            <div className="ctx-pill">
              <span>🎭 Mood:</span>
              <span style={{ textTransform: "capitalize", fontWeight: 700 }}>{currentEmotion}</span>
            </div>
          </div>
        </>
      )}

      <button className="ctx-fuse-btn" onClick={triggerFusion} disabled={fusing}>
        {fusing ? "⚡ Fusing Weather & Sentiment..." : "✨ Fuse Weather & Mood Playlist"}
      </button>

      {fusionResult && (
        <div className="ctx-result-banner">
          <h4>{fusionResult.title}</h4>
          <p>{fusionResult.description}</p>
        </div>
      )}
    </div>
  );
}
