import { useState, useEffect } from "react";
import AppLayout from "./AppLayout";
import { useNavigate } from "react-router-dom";

const MOOD_EMOJIS = {
  joy:      "🤩",
  sadness:  "😢",
  anger:    "😡",
  fear:     "😨",
  love:     "🥰",
  surprise: "😲",
};

export default function Recommendations() {

  const navigate = useNavigate();

  const [mood, setMood] = useState(null);
  const [songs, setSongs] = useState([]);

  useEffect(() => {
    // Read data saved by MoodDetection page
    const savedMood  = localStorage.getItem("moodify_mood");
    const savedSongs = localStorage.getItem("moodify_recommendations");

    if (savedMood)  setMood(JSON.parse(savedMood));
    if (savedSongs) setSongs(JSON.parse(savedSongs));
  }, []);

  return (
    <AppLayout>

      <h1 className="page-title">
        Made for your mood ✨
      </h1>

      <p className="page-description">
        Your AI-powered soundtrack for this moment.
      </p>

      {/* ── Mood Summary Hero ── */}
      <div className="dashboard-hero">

        <h2>
          {mood
            ? `${MOOD_EMOJIS[mood.name.toLowerCase()] ?? "🎵"} You seem ${mood.name}`
            : "🎵 Your Mood Playlist"
          }
        </h2>

        <p>
          {mood
            ? `${mood.description} (AI Confidence: ${mood.confidence}%)`
            : "We've selected music to match your current emotional state."
          }
        </p>

        {!mood && (
          <button
            className="primary-btn"
            style={{ marginTop: "16px" }}
            onClick={() => navigate("/mood")}
          >
            ← Detect My Mood First
          </button>
        )}

      </div>

      {/* ── Song List ── */}
      {songs.length > 0 ? (
        <>
          <div className="section-header">
            <h2>Recommended for you</h2>
            <span className="artist">{songs.length} songs</span>
          </div>

          <div className="song-grid">
            {songs.map((song, idx) => (
              <div className="song-card" key={idx}>

                <div className="song-cover">
                  <div style={{
                    height: "100%",
                    display: "grid",
                    placeItems: "center",
                    fontSize: "55px"
                  }}>
                    🎵
                  </div>
                  <button className="play-small">▶</button>
                </div>

                <div className="song-info">
                  <div className="song-title">{song.track_name}</div>
                  <div className="artist">{song.artists}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--primary)", marginTop: "4px", fontWeight: "600" }}>
                    {Math.round(song.final_score * 100)}% Match
                  </div>
                </div>

              </div>
            ))}
          </div>

          <div className="dashboard-hero" style={{ marginTop: "35px" }}>
            <h3>🧠 Why these songs?</h3>
            <p>
              {mood
                ? `Your mood appears ${mood.name.toLowerCase()}, so Moodify selected music that matches your emotional state using AI.`
                : "These songs were selected to match your detected mood using our recommendation engine."
              }
            </p>
          </div>
        </>
      ) : (
        <div className="dashboard-hero" style={{ marginTop: "30px", textAlign: "center" }}>
          <h3>No recommendations yet</h3>
          <p>Go to the Mood page, describe how you feel, and click "Analyze My Mood" first!</p>
          <button
            className="primary-btn"
            style={{ marginTop: "16px" }}
            onClick={() => navigate("/mood")}
          >
            ← Go to Mood Detection
          </button>
        </div>
      )}

    </AppLayout>
  );
}