import { useEffect, useState } from "react";

export default function ThemeToggle() {
  // =====================================================
  // GET SAVED THEME
  // =====================================================

  const [dark, setDark] = useState(() => {
    return localStorage.getItem("theme") !== "light";
  });

  // =====================================================
  // APPLY THEME
  // =====================================================

  useEffect(() => {
    const html = document.documentElement;

    if (dark) {
      // DARK MODE
      html.classList.add("dark");
      html.classList.remove("light");

      localStorage.setItem("theme", "dark");
    } else {
      // LIGHT MODE
      html.classList.remove("dark");
      html.classList.add("light");

      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  // =====================================================
  // TOGGLE
  // =====================================================

  const toggleTheme = () => {
    setDark((prev) => !prev);
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={
        dark
          ? "Switch to light mode"
          : "Switch to dark mode"
      }
      style={{
        position: "fixed",

        // Below the A avatar
        top: "92px",
        right: "20px",

        zIndex: 99999,

        padding: "8px 14px",
        borderRadius: "10px",

        cursor: "pointer",

        border: dark
          ? "1px solid rgba(255,255,255,0.2)"
          : "1px solid rgba(0,0,0,0.15)",

        background: dark
          ? "#111"
          : "#fff",

        color: dark
          ? "#fff"
          : "#111",

        fontSize: "13px",
        fontWeight: "600",

        boxShadow:
          "0 4px 12px rgba(0,0,0,0.2)",

        transition:
          "all 0.25s ease",

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