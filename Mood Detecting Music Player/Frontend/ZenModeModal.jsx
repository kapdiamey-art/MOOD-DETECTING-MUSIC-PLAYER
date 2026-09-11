import React, { useEffect, useState } from "react";
import { usePlayer } from "./PlayerContext";
import VinylPlayer from "./VinylPlayer";
import { applyTheme } from "./moodTheme";

export default function ZenModeModal({ isOpen, onClose }) {
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

  const [visualizerMode, setVisualizerMode] = useState("portal");
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("theme") !== "light";
  });

  useEffect(() => {
    const handleThemeChange = (e) => {
      if (e.detail && typeof e.detail.dark === "boolean") {
        setIsDark(e.detail.dark);
      } else {
        setIsDark(localStorage.getItem("theme") !== "light");
      }
    };
    window.addEventListener("themechange", handleThemeChange);
    return () => window.removeEventListener("themechange", handleThemeChange);
  }, []);

  const handleToggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    applyTheme(nextDark);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;

      if (e.key === "Escape") {
        onClose();
      } else if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "ArrowRight") {
        seek(Math.min(duration || 30, currentTime + 5));
      } else if (e.key === "ArrowLeft") {
        seek(Math.max(0, currentTime - 5));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, togglePlay, currentTime, duration, seek]);

  if (!isOpen) return null;

  const formatTime = (secs) => {
    if (isNaN(secs) || secs === null) return "0:00";
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${mins}:${remainingSecs < 10 ? "0" : ""}${remainingSecs}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const trackName = currentTrack?.track_name || currentTrack?.title || "Late Night Talking";
  const artistName = currentTrack?.artists || currentTrack?.artist || "Harry Styles";
  const albumImage = currentTrack?.album_image;

  return (
    <div className="zen-modal-overlay">
      {/* ── Atmospheric Warm Dark Backdrop ── */}
      {albumImage && (
        <div
          className="zen-backdrop-art"
          style={{ backgroundImage: `url(${albumImage})` }}
          aria-hidden="true"
        />
      )}

      {/* Ambient Burnt-Orange / Warm Glow */}
      <div className="zen-warm-ambient-glow" />

      {/* Subtle Cinematic Film Grain */}
      <div className="zen-film-grain" />

      {/* ── Main Centered Responsive Container ── */}
      <div className="zen-viewport-container">
        {/* Top Minimal Floating Navigation Bar */}
        <header className="zen-header">
          <div className="zen-header-left">
            <span className="zen-badge">✨ ZEN SANCTUARY</span>
          </div>

          <div className="zen-header-right">
            {/* Visualizer Mode Switcher */}
            <div className="zen-vis-toggles">
              <button
                type="button"
                className={`zen-vis-btn ${visualizerMode === "portal" ? "active" : ""}`}
                onClick={() => setVisualizerMode("portal")}
                title="Circular Portal"
              >
                🌀 Portal
              </button>
              <button
                type="button"
                className={`zen-vis-btn ${visualizerMode === "bars" ? "active" : ""}`}
                onClick={() => setVisualizerMode("bars")}
                title="Equalizer Bars"
              >
                📊 Bars
              </button>
              <button
                type="button"
                className={`zen-vis-btn ${visualizerMode === "wave" ? "active" : ""}`}
                onClick={() => setVisualizerMode("wave")}
                title="Liquid Wave"
              >
                〰️ Wave
              </button>
            </div>

            {/* Light / Dark Mode Toggle Button */}
            <button
              type="button"
              className="zen-theme-btn"
              onClick={handleToggleTheme}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              <span>{isDark ? "☀️ Light" : "🌙 Dark"}</span>
            </button>

            <button
              type="button"
              className="zen-close-btn"
              onClick={onClose}
              title="Exit Zen Mode (Esc)"
            >
              <span>Exit Zen Mode</span>
              <kbd>ESC</kbd>
            </button>
          </div>
        </header>

        {/* ── Wide Horizontal Centered Composition (Connected Experience) ── */}
        <main className="zen-main-layout">
          {/* Left Column: Prominent Large Vinyl Record with Glowing Concentric Visualizer */}
          <div className="zen-vinyl-column">
            <div className="zen-vinyl-frame">
              {/* Soft warm orange/gold ambient aura behind the vinyl */}
              <div className="zen-vinyl-warm-glow" />

              {/* Glowing Concentric Audio Visualizer */}
              <div className="zen-concentric-visualizer">
                <AudioVisualizer
                  mode={visualizerMode}
                  height={560}
                  width={560}
                  baseRadius={212}
                  glowColor="#f59e0b"
                  interactive={false}
                />
              </div>

              {/* 440px High-Fidelity Vinyl Record Platter */}
              <div className="zen-vinyl-disc-wrap">
                <VinylPlayer
                  size={440}
                  variant="turntable"
                  showTonearm={false}
                  interactive={true}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Natural Unboxed Now Playing & Control Experience */}
          <div className="zen-info-panel">
            {/* Elegant glowing NOW PLAYING pill badge */}
            <div className="zen-badge-pill">
              <span className="zen-live-pulse" />
              <span>NOW PLAYING</span>
            </div>

            {/* Song Title & Artist - Large & Prominent */}
            <h1 className="zen-song-title">{trackName}</h1>
            <p className="zen-artist-name">{artistName}</p>

            {/* Wide Floating Animated Waveform */}
            <div className="zen-waveform-module" title="Audio Waveform">
              <AudioVisualizer
                mode={visualizerMode === "portal" ? "bars" : visualizerMode}
                height={48}
                width={520}
                glowColor="#f59e0b"
                interactive={false}
              />
            </div>

            {/* Wide, Clean Scrubber with Elapsed & Total Duration */}
            <div className="zen-progress-section">
              <span className="zen-time-label">{formatTime(currentTime)}</span>
              <div
                className="zen-scrubber-track"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                  seek(ratio * (duration || 30));
                }}
              >
                <div
                  className="zen-scrubber-fill"
                  style={{ width: `${progressPercent}%` }}
                >
                  <span className="zen-scrubber-knob" />
                </div>
              </div>
              <span className="zen-time-label">{formatTime(duration)}</span>
            </div>

            {/* Spacious, Harmonious Playback Controls & Volume */}
            <div className="zen-controls-bar">
              {/* Playback Controls with Generous Spacing */}
              <div className="zen-playback-buttons">
                <button
                  type="button"
                  className="zen-btn-step"
                  onClick={playPrev}
                  title="Previous (Left Arrow)"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                  </svg>
                </button>

                <button
                  type="button"
                  className={`zen-btn-play ${isPlaying ? "playing" : ""}`}
                  onClick={togglePlay}
                  title={isPlaying ? "Pause (Space)" : "Play (Space)"}
                >
                  {isPlaying ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                  ) : (
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: "3px" }}>
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>

                <button
                  type="button"
                  className="zen-btn-step"
                  onClick={playNext}
                  title="Next (Right Arrow)"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                  </svg>
                </button>
              </div>

              {/* Subtly Floating Volume Capsule */}
              <div className="zen-volume-module">
                <button
                  type="button"
                  className="zen-vol-toggle"
                  onClick={() => setVolume(volume > 0 ? 0 : 0.8)}
                  title={volume === 0 ? "Unmute" : "Mute"}
                >
                  {volume === 0 ? "🔇" : "🔊"}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="zen-vol-range"
                  title={`Volume: ${Math.round(volume * 100)}%`}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
