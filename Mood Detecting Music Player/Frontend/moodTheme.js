export const MOOD_META = {
  joy: { emoji: "😊", label: "Joy", colors: ["#f59e0b", "#f97316"] },
  sadness: { emoji: "😢", label: "Sadness", colors: ["#2563eb", "#4f46e5"] },
  anger: { emoji: "😡", label: "Anger", colors: ["#ef4444", "#f97316"] },
  love: { emoji: "🥰", label: "Love", colors: ["#ec4899", "#8b5cf6"] },
  fear: { emoji: "😨", label: "Fear", colors: ["#4c1d95", "#7c3aed"] },
  surprise: { emoji: "😲", label: "Surprise", colors: ["#06b6d4", "#a855f7"] },
};

export function applyMoodTheme(emotion) {
  const mood = MOOD_META[emotion];
  if (!mood) return;

  const root = document.documentElement;
  const body = document.body;

  root.style.setProperty("--mood-primary", mood.colors[0]);
  root.style.setProperty("--mood-secondary", mood.colors[1]);
  root.style.setProperty("--theme-gradient", `linear-gradient(135deg, ${mood.colors[0]}, ${mood.colors[1]})`);
  root.dataset.mood = emotion;

  if (body) {
    body.dataset.mood = emotion;
  }

  localStorage.setItem("moodify_theme_emotion", emotion);
}
