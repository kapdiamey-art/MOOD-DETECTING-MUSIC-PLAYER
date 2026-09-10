import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    return localStorage.getItem("theme") !== "light";
  });

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    if (dark) {
      html.classList.add("dark");
      html.classList.remove("light");
      body?.classList.add("dark");
      body?.classList.remove("light");
      localStorage.setItem("theme", "dark");
    } else {
      html.classList.add("light");
      html.classList.remove("dark");
      body?.classList.add("light");
      body?.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }

    const mood = localStorage.getItem("moodify_theme_emotion") || "joy";
    const moodMeta = {
      joy: { colors: ["#f59e0b", "#f97316"] },
      sadness: { colors: ["#2563eb", "#4f46e5"] },
      anger: { colors: ["#ef4444", "#f97316"] },
      love: { colors: ["#ec4899", "#8b5cf6"] },
      fear: { colors: ["#4c1d95", "#7c3aed"] },
      surprise: { colors: ["#06b6d4", "#a855f7"] },
    };
    const selectedMood = moodMeta[mood] || moodMeta.joy;
    html.style.setProperty("--mood-primary", selectedMood.colors[0]);
    html.style.setProperty("--mood-secondary", selectedMood.colors[1]);
    html.style.setProperty("--theme-gradient", `linear-gradient(135deg, ${selectedMood.colors[0]}, ${selectedMood.colors[1]})`);
  }, [dark]);

  const toggleTheme = () => {
    setDark((prev) => !prev);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        position: "fixed",
        top: "92px",
        right: "20px",
        zIndex: 99999,
        padding: "8px 14px",
        borderRadius: "10px",
        cursor: "pointer",
        border: dark ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(0,0,0,0.15)",
        background: dark ? "#111" : "#fff",
        color: dark ? "#fff" : "#111",
        fontSize: "13px",
        fontWeight: "600",
        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        transition: "all 0.25s ease",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        whiteSpace: "nowrap",
      }}
    >
      {dark ? "☀️ Light" : "🌙 Dark"}
    </button>
  );
}