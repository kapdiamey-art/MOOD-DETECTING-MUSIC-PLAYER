import { useState, useEffect } from "react";
import AppLayout from "./AppLayout";
import { useNavigate } from "react-router-dom";
import { usePlayer } from "./PlayerContext";

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
  const { currentTrack, isPlaying, playTrack, togglePlay, errorMsg } = usePlayer();

  const [mood, setMood] = useState(null);
  const [songs, setSongs] = useState([]);

  // *******************************************c*******************************************
  // LIKED SONGS STATE — tracks which songs the user has liked in this session
  const [likedSongs, setLikedSongs] = useState({});
  // *******************************************c*******************************************

  useEffect(() => {
    // Read data saved by MoodDetection page
    const savedMood  = localStorage.getItem("moodify_mood");
    const savedSongs = localStorage.getItem("moodify_recommendations");

    if (savedMood)  setMood(JSON.parse(savedMood));
    if (savedSongs) setSongs(JSON.parse(savedSongs));
  }, []);

  // *******************************************c*******************************************
  // LIKE SONG FUNCTION — sends song data to backend MongoDB via POST /recommendations/like
  const likeSong = async (song, idx) => {
    const token = localStorage.getItem("moodifyToken");
    if (!token) { alert("Please login first."); return; }

    // Toggle off if already liked
    if (likedSongs[idx]) {
      setLikedSongs(prev => ({ ...prev, [idx]: false }));
      return;
    }

    try {
      const res = await fetch("http://localhost:8000/recommendations/like", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          song_title: song.title,
          artist:     song.artist,
          mood_tag:   song.mood_tag || (mood ? mood.name : "Unknown")
        })
      });

      if (res.ok || res.status === 400) {
        // 400 = already liked — still mark as liked in UI
        setLikedSongs(prev => ({ ...prev, [idx]: true }));
      }
    } catch (err) {
      console.error("Like failed:", err);
    }
  };
  // *******************************************c*******************************************

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
          <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2>Recommended for you</h2>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <span className="artist">{songs.length} songs</span>
              <button
                className="primary-btn"
                style={{ padding: "8px 16px", fontSize: "0.85rem" }}
                onClick={() => playTrack(songs[0], songs)}
              >
                ▶ Play All
              </button>
            </div>
          </div>

          {/* Error / skip notice */}
          {errorMsg && (
            <div style={{
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: "10px",
              padding: "10px 16px",
              marginBottom: "14px",
              fontSize: "0.82rem",
              color: "#f87171",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              ⚠️ {errorMsg}
            </div>
          )}

          <div className="song-grid">
            {songs.map((song, idx) => {
              const isCurrent = currentTrack?.track_name === song.track_name && currentTrack?.artists === song.artists;
              const isCurrentPlaying = isCurrent && isPlaying;
              const hasPreview = !!song.preview_url;
              const spotifyLink = song.spotify_url || `https://open.spotify.com/search/${encodeURIComponent(`${song.track_name} ${song.artists}`)}`;

              return (
                <div
                  className={`song-card ${isCurrent ? "song-card-active" : ""}`}
                  key={idx}
                  onClick={() => {
                    if (isCurrent) {
                      togglePlay();
                    } else {
                      playTrack(song, songs);
                    }
                  }}
                  style={{
                    cursor: "pointer",
                    position: "relative",
                    transition: "all 0.2s ease"
                  }}
                >
                  <div className="song-cover" style={{ position: "relative", overflow: "hidden" }}>
                    {song.album_image ? (
                      <img
                        src={song.album_image}
                        alt={song.track_name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          borderRadius: "12px",
                          display: "block"
                        }}
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "grid";
                        }}
                      />
                    ) : null}
                    <div
                      style={{
                        height: "100%",
                        display: song.album_image ? "none" : "grid",
                        placeItems: "center",
                        fontSize: "50px",
                        background: "rgba(255,255,255,0.04)",
                        borderRadius: "12px"
                      }}
                    >
                      🎵
                    </div>

                    <button
                      className="play-small"
                      title={hasPreview ? (isCurrentPlaying ? "Pause" : "Play preview") : "No preview – opens Spotify"}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isCurrent) {
                          togglePlay();
                        } else {
                          playTrack(song, songs);
                        }
                      }}
                      style={{
                        background: isCurrentPlaying ? "#22c55e" : hasPreview ? undefined : "rgba(30,215,96,0.2)",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
                      }}
                    >
                      {isCurrentPlaying ? "❚❚" : hasPreview ? "▶" : "↗"}
                    </button>
                  </div>

                <div className="song-info">
                  <div className="song-title">{song.track_name}</div>
                  <div className="artist">{song.artists}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--primary)", marginTop: "4px", fontWeight: "600" }}>
                    {Math.round(song.final_score * 100)}% Match
                  </div>
                  {/* *******************************************c******************************************* */}
                  {/* LIKE BUTTON — saves song to MongoDB backend */}
                  <button
                    onClick={() => likeSong(song, idx)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "1.3rem",
                      marginTop: "6px",
                      transition: "transform 0.2s",
                      transform: likedSongs[idx] ? "scale(1.3)" : "scale(1)"
                    }}
                    title={likedSongs[idx] ? "Liked!" : "Like this song"}
                  >
                    {likedSongs[idx] ? "❤️" : "🤍"}
                  </button>
                  {/* *******************************************c******************************************* */}
                </div>
              );
            })}
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