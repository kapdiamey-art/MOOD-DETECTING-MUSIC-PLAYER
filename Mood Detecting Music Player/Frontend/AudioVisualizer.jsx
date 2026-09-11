import React, { useEffect, useRef, useState } from "react";
import { usePlayer } from "./PlayerContext";

export default function AudioVisualizer({
  mode: initialMode = "bars",
  height = 50,
  width: customWidth = null,
  interactive = false,
  className = "",
  glowColor = null,
  baseRadius = null
}) {
  const { isPlaying } = usePlayer();
  const [activeMode, setActiveMode] = useState(initialMode);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const phaseRef = useRef(0);
  const prevLevelsRef = useRef(new Array(64).fill(0));

  useEffect(() => {
    setActiveMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = customWidth || rect.width || 320;
    const canvasHeight = height;

    canvas.width = width * dpr;
    canvas.height = canvasHeight * dpr;
    ctx.scale(dpr, dpr);

    const render = () => {
      ctx.clearRect(0, 0, width, canvasHeight);

      const style = getComputedStyle(document.documentElement);
      const primaryColor = glowColor || style.getPropertyValue("--mood-primary").trim() || "#8b5cf6";
      const secondaryColor = glowColor ? "#fb923c" : (style.getPropertyValue("--mood-secondary").trim() || "#ec4899");

      if (isPlaying) {
        phaseRef.current += 0.06;
      } else {
        phaseRef.current += 0.012;
      }
      const t = phaseRef.current;

      const binCount = activeMode === "portal" ? 56 : (canvasHeight <= 28 ? 16 : 32);
      const levels = [];

      for (let i = 0; i < binCount; i++) {
        let val;
        if (isPlaying) {
          const wave1 = Math.sin(t * 1.5 + i * 0.22);
          const wave2 = Math.cos(t * 2.7 - i * 0.16);
          const bass = Math.sin(t * 2.0) * 0.35 + 0.5;
          const noise = (Math.sin(i * 63 + t * 3) + 1) * 0.1;
          const raw = Math.abs(wave1 * 0.45 + wave2 * 0.35) + bass * 0.4 + noise;
          val = Math.min(1, Math.max(0.18, raw * 0.7));
        } else {
          val = 0.15 + Math.sin(t + i * 0.25) * 0.08;
        }

        const prev = prevLevelsRef.current[i] || 0;
        const smoothed = prev + (val - prev) * 0.28;
        prevLevelsRef.current[i] = smoothed;
        levels.push(smoothed);
      }

      // ========================================================
      // 1. EQUALIZER BARS (Sleek, rounded, floating reflection)
      // ========================================================
      if (activeMode === "bars") {
        const gap = 3;
        const barWidth = Math.max(3.5, (width - (binCount - 1) * gap) / binCount);

        for (let i = 0; i < binCount; i++) {
          const barHeight = Math.max(4, levels[i] * (canvasHeight - 2));
          const x = i * (barWidth + gap);
          const y = canvasHeight - barHeight;

          const grad = ctx.createLinearGradient(0, canvasHeight, 0, y);
          grad.addColorStop(0, primaryColor);
          grad.addColorStop(1, secondaryColor);

          ctx.fillStyle = grad;
          ctx.shadowColor = primaryColor;
          ctx.shadowBlur = isPlaying ? 6 : 2;

          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(x, y, barWidth, barHeight, [3, 3, 0, 0]);
          } else {
            ctx.rect(x, y, barWidth, barHeight);
          }
          ctx.fill();
        }
      }

      // ========================================================
      // 2. LIQUID WAVE (Elegant thin glowing ribbon)
      // ========================================================
      else if (activeMode === "wave") {
        const step = width / (binCount - 1);
        ctx.shadowColor = primaryColor;
        ctx.shadowBlur = isPlaying ? 10 : 3;

        ctx.beginPath();
        ctx.moveTo(0, canvasHeight);

        for (let i = 0; i < binCount; i++) {
          const x = i * step;
          const y = canvasHeight - levels[i] * (canvasHeight * 0.7) - 4;
          if (i === 0) {
            ctx.lineTo(x, y);
          } else {
            const prevX = (i - 1) * step;
            const prevY = canvasHeight - levels[i - 1] * (canvasHeight * 0.7) - 4;
            const cx = (prevX + x) / 2;
            ctx.quadraticCurveTo(prevX, prevY, cx, (prevY + y) / 2);
          }
        }
        ctx.lineTo(width, canvasHeight);
        ctx.closePath();

        const waveGrad = ctx.createLinearGradient(0, 0, 0, canvasHeight);
        waveGrad.addColorStop(0, primaryColor);
        waveGrad.addColorStop(1, "transparent");
        ctx.fillStyle = waveGrad;
        ctx.globalAlpha = 0.22;
        ctx.fill();

        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // ========================================================
      // 3. CIRCULAR SONIC PORTAL (Clean, Elegant & Clutter-Free)
      // ========================================================
      else if (activeMode === "portal") {
        const cx = width / 2;
        const cy = canvasHeight / 2;
        const rBase = baseRadius || Math.min(cx, cy) * 0.64;
        const cleanCount = 36; // 36 rays: clean, spacious, uncluttered

        ctx.shadowColor = primaryColor;
        ctx.shadowBlur = isPlaying ? 12 : 4;

        // 1. Soft Warm Glowing Halo Ring
        const pulseOffset = isPlaying ? Math.sin(t * 1.8) * 2.5 : 0;
        ctx.beginPath();
        ctx.arc(cx, cy, rBase + 5 + pulseOffset, 0, Math.PI * 2);
        ctx.strokeStyle = colorWithAlpha(primaryColor, isPlaying ? 0.3 : 0.12);
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 2. Clean, Tapered Radial Rays
        for (let i = 0; i < cleanCount; i++) {
          const angle = (i / cleanCount) * Math.PI * 2 + t * 0.12;
          const maxRay = Math.max(30, (Math.min(cx, cy) - rBase) * 0.72);
          const lvl = levels[i % levels.length] || 0.2;
          const rayLen = Math.max(4, lvl * maxRay);

          const x1 = cx + Math.cos(angle) * (rBase + 3);
          const y1 = cy + Math.sin(angle) * (rBase + 3);
          const x2 = cx + Math.cos(angle) * (rBase + 3 + rayLen);
          const y2 = cy + Math.sin(angle) * (rBase + 3 + rayLen);

          // Ray stroke
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = colorWithAlpha(primaryColor, isPlaying ? 0.75 : 0.35);
          ctx.lineWidth = 2.2;
          ctx.lineCap = "round";
          ctx.stroke();

          // Delicate glowing tip particle
          if (isPlaying && lvl > 0.35) {
            ctx.beginPath();
            ctx.arc(x2, y2, 2.2, 0, Math.PI * 2);
            ctx.fillStyle = "#ffffff";
            ctx.shadowColor = primaryColor;
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
      }

      ctx.shadowBlur = 0;
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, activeMode, height, customWidth, glowColor, baseRadius]);

  const colorWithAlpha = (color, alpha) => {
    if (color.startsWith("#")) {
      const r = parseInt(color.slice(1, 3), 16) || 139;
      const g = parseInt(color.slice(3, 5), 16) || 92;
      const b = parseInt(color.slice(5, 7), 16) || 246;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return color;
  };

  return (
    <div
      className={`audio-visualizer-wrap ${className}`}
      style={{
        width: customWidth ? `${customWidth}px` : "100%",
        height: `${height}px`
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: customWidth ? `${customWidth}px` : "100%",
          height: `${height}px`,
          display: "block"
        }}
      />

      {interactive && (
        <div className="visualizer-mode-toggle" title="Switch visualizer style">
          <button
            type="button"
            className={`vis-btn ${activeMode === "bars" ? "active" : ""}`}
            onClick={() => setActiveMode("bars")}
          >
            📊 Bars
          </button>
          <button
            type="button"
            className={`vis-btn ${activeMode === "wave" ? "active" : ""}`}
            onClick={() => setActiveMode("wave")}
          >
            〰️ Wave
          </button>
          <button
            type="button"
            className={`vis-btn ${activeMode === "portal" ? "active" : ""}`}
            onClick={() => setActiveMode("portal")}
          >
            🌀 Portal
          </button>
        </div>
      )}
    </div>
  );
}
