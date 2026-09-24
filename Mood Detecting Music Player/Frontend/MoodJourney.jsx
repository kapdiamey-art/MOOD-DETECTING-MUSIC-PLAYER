import { useState } from "react";
import { MOOD_META } from "./moodTheme";
import { usePlayer } from "./PlayerContext";

const MOODS = Object.keys(MOOD_META);

export default function MoodJourney() {
  const saved = JSON.parse(localStorage.getItem("moodify_mood") || "null");
  const [currentMood, setCurrentMood] = useState(
    saved?.emotion || localStorage.getItem("moodify_theme_emotion") || "sadness"
  );
  const [targetMood, setTargetMood] = useState("joy");
  const [songs, setSongs]     = useState([]);
  const [loading, setLoading] = useState(false);
  const { playTrack, searchQuery } = usePlayer();

  // Filter journey songs by global search query
  const filterBySearch = (list) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (s) =>
        (s.track_name || "").toLowerCase().includes(q) ||
        (s.artists || "").toLowerCase().includes(q)
    );
  };

  const createJourney = async () => {
    setLoading(true);
    try {
      const token    = localStorage.getItem("moodifyToken");
      const response = await fetch("http://localhost:8000/mood/journey", {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ current_mood: currentMood, target_mood: targetMood }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail);
      setSongs(data.songs || []);
    } catch (error) {
      alert(error.message || "Could not create a mood journey.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .journey-page { padding: 40px 24px 80px; max-width: 1100px; margin: 0 auto; }
        .journey-page .eyebrow { font-size: 0.75rem; font-weight: 700; letter-spacing: 2px;
          text-transform: uppercase; color: var(--text-secondary); margin-bottom: 8px; }
        .journey-page h1 { font-size: clamp(1.8rem,4vw,2.8rem); font-weight: 800;
          color: var(--text); margin-bottom: 8px; }
        .journey-page > p { color: var(--text-secondary); margin-bottom: 28px; }

        .journey-controls { display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
          padding: 24px; border-radius: 20px; margin-bottom: 36px; }
        .journey-controls label { display: flex; flex-direction: column; gap: 6px;
          font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase;
          letter-spacing: 1px; }
        .journey-controls select { background: var(--input-bg); border: 1px solid var(--input-border);
          color: var(--text); padding: 10px 14px; border-radius: 10px; font-size: 0.95rem;
          outline: none; cursor: pointer; }
        .journey-arrow { font-size: 1.4rem; color: var(--text-secondary); }

        /* ── Song grid matching Recommendations ── */
        .journey-songs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 18px;
        }
        .journey-song-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 18px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
          text-align: left;
          display: flex;
          flex-direction: column;
        }
        .journey-song-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.35);
          border-color: rgba(139,92,246,0.4);
        }
        .journey-song-card.active {
          border-color: rgba(139,92,246,0.7);
          box-shadow: 0 0 0 2px rgba(139,92,246,0.3), 0 12px 32px rgba(0,0,0,0.35);
        }
        .journey-song-cover {
          width: 100%;
          aspect-ratio: 1;
          position: relative;
          overflow: hidden;
          flex-shrink: 0;
        }
        .journey-song-cover img {
          width: 100%; height: 100%; object-fit: cover;
          display: block;
        }
        .journey-song-cover-fallback {
          width: 100%; height: 100%;
          display: grid; place-items: center; font-size: 2.5rem;
          background: linear-gradient(135deg,rgba(139,92,246,0.25),rgba(236,72,153,0.25));
        }
        .journey-song-label {
          position: absolute; top: 8px; left: 8px;
          background: rgba(0,0,0,0.6); color: #fff;
          font-size: 0.65rem; font-weight: 700; letter-spacing: 1px;
          text-transform: uppercase; padding: 3px 8px; border-radius: 99px;
          backdrop-filter: blur(4px);
        }
        .journey-song-info {
          padding: 12px 14px;
          flex: 1;
          display: flex; flex-direction: column; gap: 4px;
        }
        .journey-song-title {
          font-size: 0.9rem; font-weight: 700; color: var(--text);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .journey-song-artist {
          font-size: 0.78rem; color: var(--text-secondary);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .journey-play-icon {
          position: absolute; bottom: 10px; right: 10px;
          width: 34px; height: 34px; border-radius: 50%;
          background: rgba(139,92,246,0.85);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.85rem; opacity: 0;
          transition: opacity 0.2s; pointer-events: none;
        }
        .journey-song-card:hover .journey-play-icon { opacity: 1; }
        .journey-song-card.active .journey-play-icon { opacity: 1; background: #8b5cf6; }
      `}</style>

      <section className="journey-page">
        <p className="eyebrow">MOOD JOURNEY</p>
        <h1>Move your soundtrack forward</h1>
        <p>Build a gentle playlist from how you feel now to how you want to feel.</p>

        <div className="journey-controls glass">
          <label>
            Current mood
            <select value={currentMood} onChange={(e) => setCurrentMood(e.target.value)}>
              {MOODS.map((m) => (
                <option key={m} value={m}>{MOOD_META[m].emoji} {MOOD_META[m].label}</option>
              ))}
            </select>
          </label>

          <span className="journey-arrow">→</span>

          <label>
            Desired mood
            <select value={targetMood} onChange={(e) => setTargetMood(e.target.value)}>
              {MOODS.map((m) => (
                <option key={m} value={m}>{MOOD_META[m].emoji} {MOOD_META[m].label}</option>
              ))}
            </select>
          </label>

          <button className="primary-btn" onClick={createJourney} disabled={loading}>
            {loading ? "Creating…" : "Create playlist"}
          </button>
        </div>

        {songs.length > 0 && (
          <div className="journey-songs-grid">
            {filterBySearch(songs).length === 0 && searchQuery ? (
              <div style={{ gridColumn: "1/-1", textAlign: "center", color: "var(--text-secondary)", padding: "40px 0" }}>
                No songs match &ldquo;<strong>{searchQuery}</strong>&rdquo;
              </div>
            ) : null}
            {filterBySearch(songs).map((song, index) => {
              const label      = index < 4 ? "Start" : "Towards goal";
              const albumImage = song.album_image || null;

              return (
                <div
                  key={`${song.track_name}-${index}`}
                  className="journey-song-card"
                  onClick={() => playTrack(song, songs)}
                  title={`${song.track_name} — ${song.artists}`}
                >
                  <div className="journey-song-cover">
                    {albumImage ? (
                      <img src={albumImage} alt={song.track_name} />
                    ) : (
                      <div className="journey-song-cover-fallback">🎵</div>
                    )}
                    <span className="journey-song-label">{label}</span>
                    <span className="journey-play-icon">▶</span>
                  </div>

                  <div className="journey-song-info">
                    <div className="journey-song-title">{song.track_name}</div>
                    <div className="journey-song-artist">{song.artists}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
