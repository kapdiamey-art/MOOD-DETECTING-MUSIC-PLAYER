import React, { useEffect, useState, useMemo, useRef } from "react";
import { usePlayer } from "../context/PlayerContext";

// Mood color palettes with primary, secondary, and accent glows
const MOOD_PALETTES = {
  joy: {
    primary: "rgba(245, 158, 11, 0.35)",    // Amber
    secondary: "rgba(239, 68, 68, 0.25)",   // Coral / Red
    accent: "rgba(251, 191, 36, 0.28)",     // Bright Gold
    highlight: "rgba(255, 237, 213, 0.15)"
  },
  sadness: {
    primary: "rgba(59, 130, 246, 0.32)",    // Deep Blue
    secondary: "rgba(99, 102, 241, 0.28)",  // Indigo
    accent: "rgba(14, 165, 233, 0.22)",     // Sky Blue
    highlight: "rgba(224, 231, 255, 0.12)"
  },
  anger: {
    primary: "rgba(239, 68, 68, 0.38)",     // Crimson
    secondary: "rgba(249, 115, 22, 0.30)",  // Fiery Orange
    accent: "rgba(220, 38, 38, 0.25)",      // Dark Red
    highlight: "rgba(254, 215, 170, 0.15)"
  },
  love: {
    primary: "rgba(236, 72, 153, 0.36)",    // Warm Rose
    secondary: "rgba(139, 92, 246, 0.28)",  // Soft Violet
    accent: "rgba(244, 63, 94, 0.25)",      // Magenta
    highlight: "rgba(252, 231, 243, 0.16)"
  },
  fear: {
    primary: "rgba(124, 58, 237, 0.35)",    // Neon Indigo
    secondary: "rgba(76, 29, 149, 0.32)",   // Dark Purple
    accent: "rgba(6, 182, 212, 0.20)",      // Eerie Cyan
    highlight: "rgba(237, 233, 254, 0.12)"
  },
  surprise: {
    primary: "rgba(34, 197, 94, 0.35)",     // Vibrant Emerald
    secondary: "rgba(6, 182, 212, 0.28)",   // Electric Cyan
    accent: "rgba(168, 85, 247, 0.22)",     // Purple spark
    highlight: "rgba(207, 250, 254, 0.16)"
  },
  default: {
    primary: "rgba(139, 92, 246, 0.28)",    // Violet
    secondary: "rgba(236, 72, 153, 0.22)",  // Pink
    accent: "rgba(59, 130, 246, 0.20)",     // Blue
    highlight: "rgba(255, 255, 255, 0.10)"
  }
};

export default function AmbientAurora() {
  const { isPlaying } = usePlayer();
  const [currentEmotion, setCurrentEmotion] = useState("default");
  const orb1Ref = useRef(null);
  const orb2Ref = useRef(null);

  // Sync with active emotion from localStorage and document attributes
  useEffect(() => {
    const checkEmotion = () => {
      const stored = localStorage.getItem("moodify_theme_emotion") ||
                     document.documentElement.dataset.mood;
      let target = "default";
      if (stored && MOOD_PALETTES[stored]) {
        target = stored;
      } else {
        try {
          const savedMood = JSON.parse(localStorage.getItem("moodify_mood"));
          if (savedMood?.emotion && MOOD_PALETTES[savedMood.emotion]) {
            target = savedMood.emotion;
          }
        } catch {}
      }
      setCurrentEmotion(prev => (prev !== target ? target : prev));
    };

    checkEmotion();
    const interval = setInterval(checkEmotion, 2000);

    // High-performance RAF parallax response to mouse movements (0 React re-renders!)
    let rafId = null;
    let latestX = 0;
    let latestY = 0;

    const handleMouseMove = (e) => {
      latestX = (e.clientX / window.innerWidth - 0.5);
      latestY = (e.clientY / window.innerHeight - 0.5);

      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          if (orb1Ref.current) {
            orb1Ref.current.style.transform = `translate3d(${latestX * 40}px, ${latestY * 30}px, 0)`;
          }
          if (orb2Ref.current) {
            orb2Ref.current.style.transform = `translate3d(${latestX * -35}px, ${latestY * -25}px, 0)`;
          }
          rafId = null;
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    return () => {
      clearInterval(interval);
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  const palette = useMemo(() => {
    return MOOD_PALETTES[currentEmotion] || MOOD_PALETTES.default;
  }, [currentEmotion]);

  return (
    <div
      className={`ambient-aurora-container ${isPlaying ? "aurora-playing" : ""}`}
      aria-hidden="true"
    >
      {/* Primary Ambient Orb */}
      <div
        ref={orb1Ref}
        className="aurora-orb aurora-orb-1"
        style={{
          background: `radial-gradient(circle, ${palette.primary} 0%, transparent 70%)`,
          willChange: "transform",
        }}
      />

      {/* Secondary Counter-Orb */}
      <div
        ref={orb2Ref}
        className="aurora-orb aurora-orb-2"
        style={{
          background: `radial-gradient(circle, ${palette.secondary} 0%, transparent 70%)`,
          willChange: "transform",
        }}
      />

      {/* Accent Orb for Depth */}
      <div
        className="aurora-orb aurora-orb-3"
        style={{
          background: `radial-gradient(circle, ${palette.accent} 0%, transparent 65%)`
        }}
      />

      {/* Rhythmic Core Highlight */}
      <div
        className="aurora-orb aurora-orb-center"
        style={{
          background: `radial-gradient(circle, ${palette.highlight} 0%, transparent 60%)`
        }}
      />

      {/* Ambient noise & subtle grid mesh overlay */}
      <div className="aurora-mesh-overlay" />
    </div>
  );
}
