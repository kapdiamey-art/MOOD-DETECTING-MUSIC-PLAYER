import { useState, useEffect } from "react";
import {
  Link,
  useLocation,
  useNavigate
} from "react-router-dom";
import { usePlayer } from "./PlayerContext";
import AmbientAurora from "./AmbientAurora";
import AudioVisualizer from "./AudioVisualizer";
import ZenModeModal from "./ZenModeModal";

export default function AppLayout({ children }) {

  const location = useLocation();
  const navigate = useNavigate();
  const [isZenOpen, setIsZenOpen] = useState(false);

  // ================= USER =================
  const [userInfo, setUserInfo] = useState(() => {
    const email = localStorage.getItem("moodifyEmail") || "";
    let name = localStorage.getItem("moodifyUserName");
    if (!name) {
      try {
        const saved = JSON.parse(localStorage.getItem("moodifyUser"));
        name = saved?.name;
      } catch {}
    }
    return {
      name: name || (email ? email.split("@")[0] : "User"),
      email: email
    };
  });

  useEffect(() => {
    const token = localStorage.getItem("moodifyToken");
    if (!token) return;
    fetch("http://localhost:8000/auth/me", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((r) => r.json())
      .then((data) => {
        if (data && (data.email || data.name)) {
          const localName = localStorage.getItem("moodifyUserName");
          const isEmailPrefix = data.name && data.email && data.name.toLowerCase() === data.email.split("@")[0].toLowerCase();
          const resolvedName = (localName && isEmailPrefix) ? localName : (data.name || localName || "User");

          const freshUser = {
            name: resolvedName,
            email: data.email || localStorage.getItem("moodifyEmail") || ""
          };
          setUserInfo(freshUser);
          if (freshUser.name) localStorage.setItem("moodifyUserName", freshUser.name);
          if (freshUser.email) localStorage.setItem("moodifyEmail", freshUser.email);
          localStorage.setItem("moodifyUser", JSON.stringify(freshUser));
        }
      })
      .catch((err) => console.log("Profile sync error:", err));
  }, []);

  const userName = userInfo.name;
  const userEmail = userInfo.email;
  const userInitial = (userName.charAt(0) || "U").toUpperCase();

  // ================= MUSIC PLAYER STATE =================
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    setVolume,
    togglePlay,
    playNext,
    playPrev,
    seek
  } = usePlayer();

  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds === null) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const progressPercent =
    duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;


  // ================= NAVIGATION =================

  const links = [

    ["🧠", "Mood", "/mood"],

    ["🎧", "Recommendations", "/recommendations"],

    ["🔎", "Discover", "/discover"],

    ["❤️", "My Music", "/my-music"],

    ["📊", "Analytics", "/analytics"],

    ["📔", "Journal", "/journal"],

    ["✨", "Journey", "/journey"],

    ["👤", "Profile", "/profile"]

  ];


  // ================= LOGOUT =================
  const handleLogout = () => {
    localStorage.removeItem("moodifyLoggedIn");
    localStorage.removeItem("moodifyToken");
    localStorage.removeItem("moodifyUser");
    localStorage.removeItem("moodifyUserName");
    localStorage.removeItem("moodifyEmail");
    localStorage.removeItem("moodifyLoginMethod");
    localStorage.removeItem("moodify_mood");
    localStorage.removeItem("moodify_recommendations");
    localStorage.removeItem("moodify_current_track");
    navigate("/login");
  };


  return (

    <div className="app-layout">

      {/* Dynamic Fluid Mood Aurora Background */}
      <AmbientAurora />


      {/* =================================================
          DESKTOP TOP NAVIGATION
          ================================================= */}

      <nav className="top-navigation">

        {/* LOGO */}

        <Link
          to="/mood"
          className="top-logo"
        >

          <div className="top-logo-icon">
            ♫
          </div>

          <span>
            Moodify
          </span>

        </Link>


        {/* DESKTOP NAVIGATION */}

        <div className="top-navigation-links">

          {links.map(
            ([icon, title, path]) => (

              <Link
                key={path}
                to={path}

                className={
                  `top-navigation-link ${
                    location.pathname === path
                      ? "active"
                      : ""
                  }`
                }
              >

                <span className="nav-icon">
                  {icon}
                </span>

                <span className="nav-title">
                  {title}
                </span>

              </Link>

            )
          )}

        </div>


        {/* USER */}

        {/* USER - ONLY FIRST LETTER CIRCULAR AVATAR */}
        <div
          className="top-user"
          onClick={() => navigate("/profile")}
          title={userName}
          style={{ cursor: "pointer" }}
        >
          <div className="top-user-avatar">
            {userInitial}
          </div>
        </div>

      </nav>


      {/* =================================================
          NEW RESPONSIVE NAVIGATION
          iPHONE / PIXEL / iPAD / SURFACE
          ================================================= */}

      <div className="responsive-navigation">

        {links.map(
          ([icon, title, path]) => (

            <Link
              key={path}
              to={path}

              className={
                location.pathname === path
                  ? "responsive-nav-item active"
                  : "responsive-nav-item"
              }
            >

              <span className="responsive-nav-icon">
                {icon}
              </span>

              <span className="responsive-nav-text">
                {title === "Recommendations"
                  ? "Recommend"
                  : title}
              </span>

            </Link>

          )
        )}

      </div>


      {/* =================================================
          MAIN CONTENT
          ================================================= */}

      <main className="main-content">

        {/* TOPBAR */}

        <div className="topbar">

          <div className="search-bar">

            <span className="search-icon">
              🔍
            </span>

            <input
              type="text"
              className="search-input"
              placeholder="Search songs, artists, or playlists..."
            />

          </div>

        </div>


        {/* CURRENT PAGE */}

        {children}

      </main>


      {/* =================================================
          MUSIC PLAYER
          ================================================= */}

      <div className="music-player glass">

        {/* 1. LEFT: NOW PLAYING */}
        <div className="now-playing">
          <div className="player-cover">
            {currentTrack?.album_image ? (
              <img
                src={currentTrack.album_image}
                alt="cover"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            ) : (
              "🎵"
            )}
          </div>

          <div className="player-track-info">
            <div
              className="player-track-title"
              title={currentTrack?.track_name || "No track playing"}
            >
              {currentTrack?.track_name || "No track playing"}
            </div>

            <div
              className="player-track-artist"
              title={currentTrack?.artists || "Select a song to play"}
            >
              {currentTrack?.artists || "Select a song from Recommendations"}
            </div>
          </div>

          {currentTrack && (
            <a
              href={
                currentTrack.spotify_url ||
                `https://open.spotify.com/search/${encodeURIComponent(
                  `${currentTrack.track_name} ${currentTrack.artists}`
                )}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="player-spotify-link"
              title="Open track on Spotify"
            >
              Spotify ↗
            </a>
          )}
        </div>

        {/* 2. CENTER: CONTROLS & SCRUBBER */}
        <div className="player-center">
          <div className="player-controls">
            <button
              className="player-control-btn"
              onClick={playPrev}
              title="Previous song"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
              </svg>
            </button>

            <button
              className={`player-play ${isPlaying ? "playing" : ""}`}
              onClick={togglePlay}
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: "2px" }}>
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>

            <button
              className="player-control-btn"
              onClick={playNext}
              title="Next song"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
              </svg>
            </button>
          </div>

          <div className="player-progress-row">
            <span className="player-time">
              {formatTime(currentTime)}
            </span>

            <div
              className="player-progress-bar"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const ratio = Math.max(0, Math.min(1, clickX / rect.width));
                seek(ratio * (duration || 30));
              }}
              title="Click to seek"
            >
              <div
                className="player-progress-fill"
                style={{ width: `${progressPercent}%` }}
              >
                <span className="player-progress-thumb" />
              </div>
            </div>

            <span className="player-time">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* 3. RIGHT: VOLUME */}
        <div className="player-right-actions">
          <button
            className="player-vol-icon"
            onClick={() => setVolume(volume > 0 ? 0 : 0.8)}
            title={volume === 0 ? "Unmute" : "Mute"}
          >
            {volume === 0 ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            )}
          </button>

          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="player-vol-slider"
            title={`Volume: ${Math.round(volume * 100)}%`}
          />

          {/* Mini Real-time Audio Visualizer */}
          <div className="player-vis-container" title="Live Audio Visualizer">
            <AudioVisualizer height={26} mode="bars" className="player-mini-vis" />
          </div>

          {/* Fullscreen Zen Mode Button */}
          <button
            type="button"
            className="player-zen-btn"
            onClick={() => setIsZenOpen(true)}
            title="Open Fullscreen Zen Mode (Press Z)"
          >
            <span className="zen-sparkle">✨</span>
            <span className="zen-label">Zen</span>
          </button>
        </div>

      </div>

      {/* Fullscreen Zen Sanctuary Modal */}
      <ZenModeModal isOpen={isZenOpen} onClose={() => setIsZenOpen(false)} />

    </div>

  );
}
