import React, { useEffect, useState, useMemo } from "react";
import { usePlayer } from "./PlayerContext";

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
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });

  // Sync with active emotion from localStorage and document attributes
  useEffect(() => {
    const checkEmotion = () => {
      const stored = localStorage.getItem("moodify_theme_emotion") ||
                     document.documentElement.dataset.mood;
      if (stored && MOOD_PALETTES[stored]) {
        setCurrentEmotion(stored);
      } else {
        try {
          const savedMood = JSON.parse(localStorage.getItem("moodify_mood"));
          if (savedMood?.emotion && MOOD_PALETTES[savedMood.emotion]) {
            setCurrentEmotion(savedMood.emotion);
          }
        } catch {}
      }
    };

    checkEmotion();
    const interval = setInterval(checkEmotion, 1500);

    // Subtle parallax response to mouse movements
    const handleMouseMove = (e) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      setMousePos({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    return () => {
      clearInterval(interval);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const palette = useMemo(() => {
    return MOOD_PALETTES[currentEmotion] || MOOD_PALETTES.default;
  }, [currentEmotion]);

  // Calculate smooth parallax displacement for each orb
  const orb1Offset = {
    x: (mousePos.x - 0.5) * 40,
    y: (mousePos.y - 0.5) * 30
  };
  const orb2Offset = {
    x: (mousePos.x - 0.5) * -35,
    y: (mousePos.y - 0.5) * -25
  };

  return (
    <div
      className={`ambient-aurora-container ${isPlaying ? "aurora-playing" : ""}`}
      aria-hidden="true"
    >
      {/* Primary Ambient Orb */}
      <div
        className="aurora-orb aurora-orb-1"
        style={{
          background: `radial-gradient(circle, ${palette.primary} 0%, transparent 70%)`,
          transform: `translate(${orb1Offset.x}px, ${orb1Offset.y}px)`
        }}
      />

      {/* Secondary Counter-Orb */}
      <div
        className="aurora-orb aurora-orb-2"
        style={{
          background: `radial-gradient(circle, ${palette.secondary} 0%, transparent 70%)`,
          transform: `translate(${orb2Offset.x}px, ${orb2Offset.y}px)`
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
