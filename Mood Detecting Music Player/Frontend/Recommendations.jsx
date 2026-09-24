import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePlayer } from "./PlayerContext";
import VinylPlayer from "./VinylPlayer";
import AudioVisualizer from "./AudioVisualizer";

const MOOD_EMOJIS = {
  joy: "🤩",
  sadness: "😢",
  anger: "😡",
  fear: "😨",
  love: "🥰",
  surprise: "😲",
};

export default function Recommendations() {

  const navigate = useNavigate();
  const { currentTrack, isPlaying, playTrack, togglePlay, errorMsg, searchQuery } = usePlayer();

  // Helper: filter songs by global search query
  const filterBySearch = (list) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (s) =>
        (s.track_name || s.song_title || s.title || s.name || "").toLowerCase().includes(q) ||
        (s.artists || s.artist || "").toLowerCase().includes(q) ||
        (s.genre || "").toLowerCase().includes(q) ||
        (s.album || "").toLowerCase().includes(q)
    );
  };

  const [mood, setMood] = useState(null);
  const [songs, setSongs] = useState([]);       // currently displayed 15
  const [songPool, setSongPool] = useState([]); // full 50-song pool
  const [weatherCtx, setWeatherCtx] = useState(null);
  const [shuffling, setShuffling] = useState(false);

  // LIKED SONGS STATE — tracks which songs the user has liked in this session
  const [likedSongs, setLikedSongs] = useState({});

  useEffect(() => {
    // Read data saved by MoodDetection page
    const savedMood    = localStorage.getItem("moodify_mood");
    const savedPool    = localStorage.getItem("moodify_song_pool");        // full 50
    const savedSongs   = localStorage.getItem("moodify_recommendations");  // current 15
    const savedWeather = localStorage.getItem("moodify_weather_context");
    const weatherEnabled = localStorage.getItem("moodify_weather_enabled") === "true";

    if (savedMood)  setMood(JSON.parse(savedMood));
    if (savedPool)  setSongPool(JSON.parse(savedPool));
    if (savedSongs) setSongs(JSON.parse(savedSongs));
    if (weatherEnabled && savedWeather) {
      setWeatherCtx(JSON.parse(savedWeather));
    }
  }, []);

  // Pick a fresh random 15 from the full 50-song pool
  const shuffleSongs = () => {
    const pool = songPool.length > 0 ? songPool : songs;
    if (pool.length === 0) return;
    setShuffling(true);
    setTimeout(() => {
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      const next15 = shuffled.slice(0, Math.min(15, shuffled.length));
      setSongs(next15);
      setLikedSongs({});
      localStorage.setItem("moodify_recommendations", JSON.stringify(next15));
      setShuffling(false);
    }, 300);
  };

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
          song_title:  song.track_name  || song.title,
          artist:      song.artists     || song.artist,
          mood_tag:    song.mood_tag    || (mood ? mood.name : "Unknown"),
          // Playback fields — saved to MongoDB so MyMusic can play songs directly
          preview_url: song.preview_url || null,
          album_image: song.album_image || null,
          spotify_url: song.spotify_url || null,
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

  return (
      <>

      <h1 className="page-title">
        Made for your mood
      </h1>

      <p className="page-description">
        Your AI-powered soundtrack for this moment.
      </p>

      {/* ── Compact, Polished Mood Spotlight Hero ── */}
      <div className="enhanced-hero">
        <div className="hero-content-split">
          {/* Left Side: Mood Text & CTA Group (45–48% width) */}
          <div className="hero-text-col">
            <div className="hero-mood-badge">
              <span className="badge-emoji">{mood ? `${MOOD_EMOJIS[mood.name.toLowerCase()] ?? "🎵"}` : "🎵"}</span>
              <span className="badge-text">{mood ? `Detected Mood: ${mood.name}` : "Your Playlist"}</span>
              {isPlaying && <span className="hero-eq-bars"><span></span><span></span><span></span><span></span></span>}
            </div>

            <h2 className="hero-heading">
              {mood
                ? `Soundtrack for your ${mood.name} vibe`
                : "Your Personal Mood Playlist"
              }
            </h2>

            <p className="hero-desc">
              {mood
                ? mood.description
                : "We've selected music to match your current emotional state."
              }
            </p>

            {weatherCtx && (
              <div style={{ marginTop: '12px', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ fontSize: '1.2rem' }}>{weatherCtx.icon}</span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Filtered for <strong style={{ color: 'var(--text)' }}>{weatherCtx.condition}</strong> in <strong style={{ color: 'var(--text)' }}>{weatherCtx.city}</strong> ({weatherCtx.temp_c}°C)
                </span>
              </div>
            )}

            {mood?.confidence && (
              <div className="hero-ai-confidence">
                <span className="confidence-spark">✦</span>
                <span>AI Confidence: {mood.confidence}%</span>
              </div>
            )}

            <div className="hero-cta-row">
              {songs.length > 0 && (
                <button
                  type="button"
                  className="primary-btn hero-play-all-btn"
                  onClick={() => playTrack(songs[0], songs)}
                >
                  ▶ Play All Tracks
                </button>
              )}

              {!mood && (
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => navigate("/mood")}
                >
                  ← Detect My Mood First
                </button>
              )}
            </div>
          </div>

          {/* Right Side: Naturally Integrated Featured Track & Artwork (50–52% width) */}
          <div className="hero-featured-player">
            <div className="featured-sleeve-stage">
              <VinylPlayer size={138} variant="sleeve" interactive={true} />
            </div>
            <div className="featured-track-meta">
              <div className="featured-track-badge-row">
                <span className="featured-track-badge">
                  {isPlaying ? "NOW PLAYING" : "FEATURED TRACK"}
                </span>
              </div>
              <div className="featured-track-title" title={currentTrack?.track_name || songs[0]?.track_name || "Select a song"}>
                {currentTrack?.track_name || songs[0]?.track_name || "Select a song"}
              </div>
              <div className="featured-track-artist" title={currentTrack?.artists || songs[0]?.artists || "Moodify Playlist"}>
                {currentTrack?.artists || songs[0]?.artists || "Moodify Playlist"}
              </div>
              <div className="featured-vis-wrap">
                <AudioVisualizer height={24} mode="bars" glowColor="#f59e0b" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Song List ── */}
      {songs.length > 0 ? (
        <>
          <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2>Recommended for you</h2>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <span className="artist">{songs.length} of {songPool.length || songs.length} songs</span>
              <button
                className="primary-btn"
                style={{
                  padding: "8px 16px",
                  fontSize: "0.85rem",
                  background: shuffling
                    ? "rgba(139,92,246,0.3)"
                    : "linear-gradient(135deg,rgba(139,92,246,0.25),rgba(236,72,153,0.25))",
                  border: "1px solid rgba(139,92,246,0.5)",
                  color: "var(--text)",
                  transition: "all 0.2s"
                }}
                onClick={shuffleSongs}
                disabled={shuffling}
                title={`Pick 15 new songs from a pool of ${songPool.length || songs.length}`}
              >
                {shuffling ? "🔄 Shuffling…" : "🔀 Shuffle (New 15)"}
              </button>
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
            {(() => {
              const sourceList = searchQuery ? (songPool.length > 0 ? songPool : songs) : songs;
              const filteredList = filterBySearch(sourceList);
              if (filteredList.length === 0 && searchQuery) {
                return (
                  <div style={{ gridColumn: "1/-1", textAlign: "center", color: "var(--text-secondary)", padding: "40px 0" }}>
                    No songs match &ldquo;<strong>{searchQuery}</strong>&rdquo;
                  </div>
                );
              }
              return filteredList.map((song, idx) => {
                const isCurrent = currentTrack?.track_name === song.track_name && currentTrack?.artists === song.artists;
                const isCurrentPlaying = isCurrent && isPlaying;
                const hasPreview = !!song.preview_url;

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
                          if (e.target.nextSibling) e.target.nextSibling.style.display = "grid";
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
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                      <div style={{ fontSize: "0.8rem", color: "var(--primary)", fontWeight: "600" }}>
                        {Math.round((song.final_score || 0) * 100)}% Match
                      </div>
                      {weatherCtx && song.suitable_weather && (
                        <div style={{
                          fontSize: "0.7rem",
                          color: "#a78bfa",
                          background: "rgba(139,92,246,0.1)",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          border: "1px solid rgba(139,92,246,0.2)"
                        }}>
                          ⛅ {song.suitable_weather}
                        </div>
                      )}
                    </div>
                    {/* LIKE BUTTON — saves song to MongoDB backend */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        likeSong(song, idx);
                      }}
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
                  </div>
                </div>
              );
            });
          })()}
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

    </>
  );
}