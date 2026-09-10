import { useState } from "react";
import { MOOD_META } from "./moodTheme";
import { usePlayer } from "./PlayerContext";

const MOODS = Object.keys(MOOD_META);

export default function MoodJourney() {
  const saved = JSON.parse(localStorage.getItem("moodify_mood") || "null");
  const [currentMood, setCurrentMood] = useState(saved?.emotion || localStorage.getItem("moodify_theme_emotion") || "sadness");
  const [targetMood, setTargetMood] = useState("joy");
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const { playTrack } = usePlayer();
  const createJourney = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("moodifyToken");
      const response = await fetch("http://localhost:8000/mood/journey", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ current_mood: currentMood, target_mood: targetMood }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail);
      setSongs(data.songs || []);
    } catch (error) { alert(error.message || "Could not create a mood journey."); } finally { setLoading(false); }
  };
  return <><section className="journey-page"><p className="eyebrow">MOOD JOURNEY</p><h1>Move your soundtrack forward</h1><p>Build a gentle playlist from how you feel now to how you want to feel.</p><div className="journey-controls glass"><label>Current mood<select value={currentMood} onChange={(e) => setCurrentMood(e.target.value)}>{MOODS.map((m) => <option key={m} value={m}>{MOOD_META[m].emoji} {MOOD_META[m].label}</option>)}</select></label><span className="journey-arrow">→</span><label>Desired mood<select value={targetMood} onChange={(e) => setTargetMood(e.target.value)}>{MOODS.map((m) => <option key={m} value={m}>{MOOD_META[m].emoji} {MOOD_META[m].label}</option>)}</select></label><button className="primary-btn" onClick={createJourney} disabled={loading}>{loading ? "Creating…" : "Create playlist"}</button></div>{songs.length > 0 && <div className="journey-songs">{songs.map((song, index) => <button key={`${song.track_name}-${index}`} className="journey-song glass" onClick={() => playTrack(song, songs)}><span>{index < 2 ? "Start" : "Towards goal"}</span><strong>{song.track_name}</strong><small>{song.artists}</small></button>)}</div>}</section></>;
}
