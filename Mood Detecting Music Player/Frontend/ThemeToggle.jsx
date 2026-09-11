import { useEffect, useState } from "react";
import { applyTheme } from "./moodTheme";

export default function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    return localStorage.getItem("theme") !== "light";
  });

  useEffect(() => {
    applyTheme(dark);

    const handleThemeChange = (e) => {
      if (e.detail && typeof e.detail.dark === "boolean") {
        setDark(e.detail.dark);
      } else {
        setDark(localStorage.getItem("theme") !== "light");
      }
    };
    window.addEventListener("themechange", handleThemeChange);
    return () => window.removeEventListener("themechange", handleThemeChange);
  }, []);

  const toggleTheme = () => {
    const nextDark = !dark;
    setDark(nextDark);
    applyTheme(nextDark);
  };

  return (
    <button
      type="button"
      className="floating-theme-toggle"
      onClick={toggleTheme}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        position: "fixed",
        top: "94px",
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