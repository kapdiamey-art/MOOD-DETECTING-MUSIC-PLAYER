import React, { useState, useRef } from "react";
import { usePlayer } from "../context/PlayerContext";

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

  // Tonearm angle calculation (User Requested Motion):
  // When OFF (isPlaying === false): Tonearm rests ON the CD (30deg).
  // When STARTS / ON (isPlaying === true): Tonearm COMES OUT from the CD to the side (-6deg).
  const tonearmAngle = isPlaying ? -6 : 30;

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
      style={{ width: `${platterSize + (showTonearm ? 80 : 0)}px` }}
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

      {/* ── Compact Realistic SVG Tonearm ── */}
      {showTonearm && (
        <div className="turntable-tonearm-svg-wrap" style={{ height: `${platterSize * 0.72}px` }}>
          <div
            className="tonearm-rotator"
            style={{
              transform: `rotate(${tonearmAngle}deg)`,
              transformOrigin: "32px 32px",
              transition: "transform 0.9s cubic-bezier(0.34, 1.2, 0.64, 1)"
            }}
          >
            <svg
              width="100"
              height="210"
              viewBox="0 0 100 210"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="tonearm-svg"
            >
              <defs>
                <linearGradient id="chromeGimbal2" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="40%" stopColor="#cbd5e1" />
                  <stop offset="80%" stopColor="#475569" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>
                <linearGradient id="chromeArm2" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#cbd5e1" />
                  <stop offset="35%" stopColor="#ffffff" />
                  <stop offset="70%" stopColor="#94a3b8" />
                  <stop offset="100%" stopColor="#334155" />
                </linearGradient>
                <linearGradient id="brassAccent2" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
                <filter id="armShadow2" x="-20" y="-20" width="150" height="280" filterUnits="userSpaceOnUse">
                  <feDropShadow dx="4" dy="8" stdDeviation="7" floodColor="#000000" floodOpacity="0.85" />
                </filter>
              </defs>

              <g filter="url(#armShadow2)">
                {/* Pivot Base */}
                <circle cx="32" cy="32" r="24" fill="#090d16" stroke="#475569" strokeWidth="2" />
                <circle cx="32" cy="32" r="16" fill="url(#chromeGimbal2)" stroke="#334155" strokeWidth="1.5" />
                <circle cx="32" cy="32" r="8"  fill="url(#brassAccent2)" />
                <circle cx="32" cy="32" r="3"  fill="#ffffff" />

                {/* Counterweight Block */}
                <rect x="20" y="4" width="24" height="14" rx="3" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.2" />
                <rect x="23" y="7"  width="18" height="3"  fill="url(#chromeArm2)" opacity="0.55" />

                {/* Arm Tube — shorter, proportionate curve */}
                <path
                  d="M 32 32 Q 26 100 36 155 L 42 178"
                  stroke="url(#chromeArm2)"
                  strokeWidth="5"
                  strokeLinecap="round"
                />

                {/* Cartridge Joint */}
                <rect x="37" y="173" width="10" height="5" rx="1.5" fill="url(#brassAccent2)" />

                {/* Headshell */}
                <path
                  d="M 39 178 L 52 176 L 59 198 L 45 201 Z"
                  fill="#0f172a"
                  stroke="#cbd5e1"
                  strokeWidth="1.5"
                />

                {/* Stylus / Needle glow */}
                <circle cx="53" cy="200" r="3.5" fill="#f59e0b" />
                <circle cx="53" cy="200" r="6"   fill="none" stroke="#f59e0b" strokeWidth="1" opacity="0.45" />
              </g>
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
