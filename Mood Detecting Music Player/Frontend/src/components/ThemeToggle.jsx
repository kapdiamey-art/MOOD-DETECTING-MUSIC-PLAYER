import { useEffect, useState } from "react";
import { applyTheme } from "../utils/moodTheme";

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
      className={`floating-theme-toggle ${dark ? "dark-mode" : "light-mode"}`}
      onClick={toggleTheme}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {dark ? "☀️ Light" : "🌙 Dark"}
    </button>
  );
}