import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    return localStorage.getItem("theme") !== "light";
  });

  useEffect(() => {
    const html = document.documentElement;

    if (dark) {
      html.classList.add("dark");
      html.classList.remove("light");
      localStorage.setItem("theme", "dark");
    } else {
      html.classList.remove("dark");
      html.classList.add("light");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  return (
    <button
      onClick={() => setDark((prev) => !prev)}
      style={{
        position: "fixed",

        /* 👇 Move button below the A avatar */
        top: "92px",
        right: "20px",

        zIndex: 99999,

        padding: "8px 14px",
        borderRadius: "10px",

        cursor: "pointer",

        border: dark
          ? "1px solid rgba(255,255,255,0.2)"
          : "1px solid rgba(0,0,0,0.15)",

        background: dark ? "#111" : "#fff",
        color: dark ? "#fff" : "#111",

        fontSize: "13px",
        fontWeight: "600",

        boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
      }}
    >
      {dark ? "☀️ Light" : "🌙 Dark"}
    </button>
  );
}