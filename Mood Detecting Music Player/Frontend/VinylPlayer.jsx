import React, { useState, useRef } from "react";
import { usePlayer } from "./PlayerContext";

export default function VinylPlayer({
  size = 220,
  variant = "sleeve", // "sleeve" (modern album jacket + vinyl slide-out) or "turntable" (chassis + precision SVG tonearm)
  showTonearm = false,
  interactive = true,
  className = ""
}) {
  const { currentTrack, isPlaying, togglePlay, currentTime, duration, seek } = usePlayer();
  const [isScratching, setIsScratching] = useState(false);
  const [scratchAngle, setScratchAngle] = useState(0);
  const vinylRef = useRef(null);
  const startAngleRef = useRef(0);

  // Tonearm angle calculation for turntable variant:
  // Rest angle: 0deg. Play start: 22deg. Play end: 36deg.
  const progressRatio = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;
  const tonearmAngle = isPlaying ? 22 + progressRatio * 14 : 0;

  // Synthesize realistic vinyl scratch sound
  const playScratchSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const bufferSize = ctx.sampleRate * 0.07;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 2200;
      filter.Q.value = 3.5;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.07);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
    } catch {}
  };

  const handleMouseDown = (e) => {
    if (!interactive || !vinylRef.current) return;
    setIsScratching(true);
    const rect = vinylRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    startAngleRef.current = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    playScratchSound();
  };

  const handleMouseMove = (e) => {
    if (!isScratching || !vinylRef.current) return;
    const rect = vinylRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    const diff = (currentAngle - startAngleRef.current) * (180 / Math.PI);
    setScratchAngle((prev) => prev + diff * 0.6);
    startAngleRef.current = currentAngle;

    if (duration > 0 && Math.abs(diff) > 2) {
      const scrubDelta = (diff / 360) * 4;
      seek(Math.max(0, Math.min(duration, currentTime + scrubDelta)));
    }
  };

  const handleMouseUp = () => {
    if (isScratching) setIsScratching(false);
  };

  const albumCover = currentTrack?.album_image;
  const trackTitle = currentTrack?.track_name || currentTrack?.title || "No track selected";
  const artistName = currentTrack?.artists || currentTrack?.artist || "Moodify Player";

  // ==========================================================
  // VARIANT 1: MODERN 3D VINYL SLEEVE SLIDE-OUT (CARD FRIENDLY)
  // ==========================================================
  if (variant === "sleeve") {
    const sleeveSize = size;
    const recordSize = size * 0.92;

    return (
      <div
        className={`vinyl-sleeve-deck ${className}`}
        style={{ width: `${sleeveSize * 1.45}px`, height: `${sleeveSize}px` }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Glowing aura under sleeve */}
        <div className={`sleeve-ambient-glow ${isPlaying ? "glow-active" : ""}`} />

        {/* ── Spinning Vinyl Disc (Slides out from inside jacket) ── */}
        <div
          ref={vinylRef}
          className={`vinyl-record-disc ${isPlaying && !isScratching ? "spinning" : ""} ${isPlaying ? "playing-out" : ""}`}
          style={{
            width: `${recordSize}px`,
            height: `${recordSize}px`,
            transform: isScratching ? `rotate(${scratchAngle}deg)` : undefined,
            cursor: interactive ? (isScratching ? "grabbing" : "grab") : "default"
          }}
          onMouseDown={handleMouseDown}
          onClick={() => {
            if (!isScratching && interactive) togglePlay();
          }}
          title={interactive ? (isPlaying ? "Click to Pause / Drag to Scratch" : "Click to Play") : trackTitle}
        >
          {/* Microgrooves & Conic Reflection */}
          <div className="vinyl-sheen-layer" />
          <div className="vinyl-ridge ridge-1" />
          <div className="vinyl-ridge ridge-2" />
          <div className="vinyl-ridge ridge-3" />

          {/* Center Record Label */}
          <div className="vinyl-disc-label">
            {albumCover ? (
              <img src={albumCover} alt={trackTitle} className="vinyl-label-thumb" />
            ) : (
              <div className="vinyl-label-empty">🎵</div>
            )}
            <div className="vinyl-spindle-dot" />
          </div>
        </div>

        {/* ── Cardboard Album Jacket (Front) ── */}
        <div
          className="album-jacket-cover"
          style={{ width: `${sleeveSize}px`, height: `${sleeveSize}px` }}
          onClick={() => {
            if (interactive) togglePlay();
          }}
          title={interactive ? (isPlaying ? "Pause" : "Play") : trackTitle}
        >
          {albumCover ? (
            <img src={albumCover} alt={trackTitle} className="jacket-artwork" />
          ) : (
            <div className="jacket-placeholder">
              <span className="jacket-icon">✨</span>
              <span className="jacket-hint">Moodify</span>
            </div>
          )}

          {/* Jacket Gloss Reflection & Vinyl Mouth Shadow */}
          <div className="jacket-gloss-sheen" />
          <div className="jacket-mouth-shadow" />

          {/* Play/Pause Hover Badge */}
          {interactive && (
            <div className={`jacket-play-overlay ${isPlaying ? "playing" : ""}`}>
              <span>{isPlaying ? "❚❚" : "▶"}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================================
  // VARIANT 2: PREMIUM HIGH-END TURNTABLE (FOR ZEN SANCTUARY)
  // ==========================================================
  const platterSize = size;
  const recordSize = platterSize * 0.94;

  return (
    <div
      className={`turntable-deck-wrap ${className}`}
      style={{ width: `${platterSize + (showTonearm ? 70 : 0)}px` }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* ── Turntable Platter Base ── */}
      <div
        className="turntable-platter-base"
        style={{ width: `${platterSize}px`, height: `${platterSize}px` }}
      >
        {/* Soft Radial Ambient Aura */}
        <div className={`turntable-ambient-aura ${isPlaying ? "aura-active" : ""}`} />

        {/* ── Vinyl Record ── */}
        <div
          ref={vinylRef}
          className={`vinyl-record-disc ${isPlaying && !isScratching ? "spinning" : ""}`}
          style={{
            width: `${recordSize}px`,
            height: `${recordSize}px`,
            transform: isScratching ? `rotate(${scratchAngle}deg)` : undefined,
            cursor: interactive ? (isScratching ? "grabbing" : "grab") : "default"
          }}
          onMouseDown={handleMouseDown}
          onClick={() => {
            if (!isScratching && interactive) togglePlay();
          }}
          title={interactive ? (isPlaying ? "Click to Pause / Drag to Scratch" : "Click to Play") : trackTitle}
        >
          {/* Microgrooves & Conic Reflection */}
          <div className="vinyl-sheen-layer" />
          <div className="vinyl-ridge ridge-1" />
          <div className="vinyl-ridge ridge-2" />
          <div className="vinyl-ridge ridge-3" />

          {/* Center Record Label */}
          <div className="vinyl-disc-label">
            {albumCover ? (
              <img src={albumCover} alt={trackTitle} className="vinyl-label-thumb" />
            ) : (
              <div className="vinyl-label-empty">🎵</div>
            )}
            <div className="vinyl-spindle-dot" />
          </div>
        </div>

        {/* Play/Pause Hover Badge */}
        {interactive && (
          <button
            type="button"
            className="turntable-play-badge"
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? "❚❚" : "▶"}
          </button>
        )}
      </div>

      {/* ── Realistic Precision SVG Tonearm ── */}
      {showTonearm && (
        <div className="turntable-tonearm-svg-wrap" style={{ height: `${platterSize * 0.92}px` }}>
          <div
            className="tonearm-rotator"
            style={{
              transform: `rotate(${tonearmAngle}deg)`,
              transformOrigin: "24px 24px",
              transition: isPlaying
                ? "transform 0.7s cubic-bezier(0.2, 0.9, 0.3, 1)"
                : "transform 0.9s cubic-bezier(0.4, 0, 0.2, 1)"
            }}
          >
            <svg
              width="68"
              height="220"
              viewBox="0 0 68 220"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="tonearm-svg"
            >
              <defs>
                <linearGradient id="chromeGimbal" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#f1f5f9" />
                  <stop offset="50%" stopColor="#64748b" />
                  <stop offset="100%" stopColor="#1e293b" />
                </linearGradient>
                <linearGradient id="chromeArm" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#e2e8f0" />
                  <stop offset="40%" stopColor="#ffffff" />
                  <stop offset="70%" stopColor="#94a3b8" />
                  <stop offset="100%" stopColor="#475569" />
                </linearGradient>
                <filter id="armShadow" x="-10" y="-10" width="90" height="240" filterUnits="userSpaceOnUse">
                  <feDropShadow dx="3" dy="6" stdDeviation="5" floodColor="#000000" floodOpacity="0.65" />
                </filter>
              </defs>

              <g filter="url(#armShadow)">
                {/* Pivot Gimbal Ring */}
                <circle cx="24" cy="24" r="18" fill="#0f172a" stroke="#334155" strokeWidth="2" />
                <circle cx="24" cy="24" r="12" fill="url(#chromeGimbal)" />
                <circle cx="24" cy="24" r="5" fill="#f8fafc" />

                {/* Counterweight */}
                <rect x="18" y="2" width="12" height="10" rx="2" fill="#1e293b" stroke="#64748b" strokeWidth="1" />

                {/* Curved Metallic Tonearm Pipe */}
                <path
                  d="M 24 24 Q 22 100 28 150 L 32 178"
                  stroke="url(#chromeArm)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Cartridge Headshell */}
                <path
                  d="M 29 178 L 36 177 L 41 202 L 32 204 Z"
                  fill="#0f172a"
                  stroke="#94a3b8"
                  strokeWidth="1.2"
                />

                {/* Stylus Needle Glow Point */}
                <circle cx="36" cy="204" r="2.2" fill="#f59e0b" />
              </g>
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
