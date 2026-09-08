import {
  Link,
  useLocation,
  useNavigate
} from "react-router-dom";
import { usePlayer } from "./PlayerContext";

export default function AppLayout({ children }) {

  const location = useLocation();
  const navigate = useNavigate();

  // ================= USER =================

  const savedUser =
    JSON.parse(
      localStorage.getItem("moodifyUser")
    );

  const userName =
    savedUser?.name || "User";

  const userEmail =
    savedUser?.email || "";

  const userInitial =
    userName.charAt(0).toUpperCase();

  // ================= MUSIC PLAYER STATE =================
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
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

    ["👤", "Profile", "/profile"]

  ];


  // ================= LOGOUT =================

  const handleLogout = () => {

    localStorage.removeItem(
      "moodifyLoggedIn"
    );

    navigate("/login");

  };


  return (

    <div className="app-layout">


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

        <div
          className="top-user"

          onClick={() =>
            navigate("/profile")
          }

          title={userName}
        >

          <div className="top-user-avatar">
            {userInitial}
          </div>

          <div className="top-user-info">

            <strong>
              {userName}
            </strong>

            <small>
              {userEmail}
            </small>

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

        <div className="now-playing" style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: "220px" }}>

          <div
            className="player-cover"
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "8px",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255,255,255,0.05)",
              fontSize: "24px",
              flexShrink: 0
            }}
          >
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

          <div style={{ overflow: "hidden", maxWidth: "160px" }}>

            <div
              className="song-name"
              style={{
                fontSize: "0.92rem",
                fontWeight: "600",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
              title={currentTrack?.track_name}
            >
              {currentTrack?.track_name || "No track playing"}
            </div>

            <div
              className="artist"
              style={{
                fontSize: "0.78rem",
                color: "var(--muted)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
              title={currentTrack?.artists}
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
              title="Open track on Spotify"
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "4px 8px",
                borderRadius: "999px",
                background: "rgba(30, 215, 96, 0.15)",
                color: "#1ed760",
                fontSize: "0.72rem",
                fontWeight: "700",
                textDecoration: "none",
                border: "1px solid rgba(30, 215, 96, 0.3)",
                flexShrink: 0
              }}
            >
              Spotify ↗
            </a>
          )}

        </div>


        <div className="player-controls">

          <button onClick={playPrev} title="Previous song">
            ⏮
          </button>

          <button
            className="player-play"
            onClick={togglePlay}
            title={isPlaying ? "Pause" : "Play"}
            style={{
              background: isPlaying ? "#22c55e" : undefined,
              color: "#fff"
            }}
          >
            {isPlaying ? "❚❚" : "▶"}
          </button>

          <button onClick={playNext} title="Next song">
            ⏭
          </button>

        </div>


        <div className="player-progress">

          <span style={{ fontSize: "0.75rem", minWidth: "32px", textAlign: "right" }}>
            {formatTime(currentTime)}
          </span>

          <div
            className="progress"
            style={{ cursor: "pointer", position: "relative" }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const ratio = Math.max(0, Math.min(1, clickX / rect.width));
              seek(ratio * duration);
            }}
            title="Click to seek"
          >

            <div
              className="progress-fill"
              style={{
                width: `${progressPercent}%`,
                transition: "width 0.1s linear"
              }}
            />

          </div>

          <span style={{ fontSize: "0.75rem", minWidth: "32px" }}>
            {formatTime(duration)}
          </span>

        </div>

      </div>

    </div>

  );
}