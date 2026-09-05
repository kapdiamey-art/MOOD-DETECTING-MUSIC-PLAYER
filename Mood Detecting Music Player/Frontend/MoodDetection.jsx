import { useState } from "react";
import AppLayout from "./AppLayout";
import { useNavigate } from "react-router-dom";

const MOOD_MAPPING = {
  joy:      { emoji: "🤩", name: "Joyful",    description: "You're radiating happiness and positive energy!",    gradient: "linear-gradient(135deg,#f59e0b,#ef4444)", color: "#f59e0b" },
  sadness:  { emoji: "😢", name: "Sad",        description: "It's okay to feel down. Let the music comfort you.", gradient: "linear-gradient(135deg,#3b82f6,#6366f1)", color: "#3b82f6" },
  anger:    { emoji: "😡", name: "Angry",      description: "Let off some steam with these tracks.",             gradient: "linear-gradient(135deg,#ef4444,#f97316)", color: "#ef4444" },
  fear:     { emoji: "😨", name: "Fearful",    description: "Take a deep breath. You are safe here.",            gradient: "linear-gradient(135deg,#8b5cf6,#6366f1)", color: "#8b5cf6" },
  love:     { emoji: "🥰", name: "Loving",     description: "Love is in the air!",                               gradient: "linear-gradient(135deg,#ec4899,#f43f5e)", color: "#ec4899" },
  surprise: { emoji: "😲", name: "Surprised",  description: "Expect the unexpected!",                            gradient: "linear-gradient(135deg,#22c55e,#06b6d4)", color: "#22c55e" },
};

export default function MoodDetection() {
  const [text,            setText           ] = useState("");
  const [genre,           setGenre          ] = useState("");
  const [artist,          setArtist         ] = useState("");
  const [mood,            setMood           ] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading,         setLoading        ] = useState(false);

  const navigate = useNavigate();

  const detectMood = async () => {
    if (!text.trim()) {
      alert("Please tell us how you are feeling first.");
      return;
    }

    setLoading(true);
    setMood(null);
    setRecommendations([]);

    try {
      const response = await fetch("http://localhost:8000/mood/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          genre:  genre.trim()  || undefined,
          artist: artist.trim() || undefined,
        }),
      });

      if (!response.ok) throw new Error("Failed to detect mood");

      const data     = await response.json();
      const moodData = MOOD_MAPPING[data.emotion] || MOOD_MAPPING.joy;

      setMood({
        emoji:       moodData.emoji,
        name:        moodData.name,
        description: moodData.description,
        confidence:  Math.round(data.confidence * 100),
        gradient:    moodData.gradient,
        color:       moodData.color,
      });

      setRecommendations(data.recommendations || []);
    } catch (error) {
      console.error(error);
      alert("Error analyzing mood. Make sure the backend is running!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mood-page">

      <style>{`
        /* ── Ambient background orbs ── */
        .md-orb {
          position: fixed;
          border-radius: 50%;
          filter: blur(120px);
          pointer-events: none;
          z-index: 0;
          animation: orbPulse 8s ease-in-out infinite alternate;
        }
        .md-orb-1 { width:500px; height:500px; background:rgba(139,92,246,0.18); top:-150px; right:-100px; }
        .md-orb-2 { width:400px; height:400px; background:rgba(236,72,153,0.12); bottom:-100px; left:-100px; animation-delay: 3s; }
        @keyframes orbPulse {
          from { transform: scale(1);   opacity: 0.8; }
          to   { transform: scale(1.2); opacity: 1;   }
        }

        /* ── Page layout ── */
        .md-page {
          position: relative;
          min-height: 100vh;
          padding: 40px 20px 60px;
          z-index: 1;
        }

        /* ── Hero heading ── */
        .md-hero {
          text-align: center;
          margin-bottom: 40px;
        }
        .md-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(139,92,246,0.15);
          border: 1px solid rgba(139,92,246,0.3);
          color: #a78bfa;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 2px;
          padding: 6px 16px;
          border-radius: 99px;
          margin-bottom: 20px;
          text-transform: uppercase;
        }
        .md-hero h1 {
          font-size: clamp(2.2rem, 5vw, 3.8rem);
          font-weight: 800;
          color: #fff;
          line-height: 1.1;
          letter-spacing: -2px;
          margin-bottom: 14px;
        }
        .md-hero h1 span {
          background: linear-gradient(135deg,#8b5cf6,#ec4899);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .md-hero p {
          color: rgba(255,255,255,0.45);
          font-size: 1.05rem;
          max-width: 500px;
          margin: 0 auto;
          line-height: 1.7;
        }

        /* ── Card ── */
        .md-card {
          max-width: 720px;
          margin: 0 auto;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 28px;
          padding: 36px;
          position: relative;
          overflow: hidden;
          backdrop-filter: blur(20px);
        }
        .md-card-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at top left, rgba(139,92,246,0.08), transparent 60%);
          pointer-events: none;
        }

        /* ── Textarea ── */
        .md-textarea-wrap {
          position: relative;
          margin-bottom: 16px;
        }
        .md-textarea {
          width: 100%;
          min-height: 140px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          color: #fff;
          font-size: 1rem;
          padding: 18px;
          resize: vertical;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          font-family: inherit;
          line-height: 1.7;
        }
        .md-textarea:focus {
          border-color: rgba(139,92,246,0.5);
          box-shadow: 0 0 0 3px rgba(139,92,246,0.12);
        }
        .md-textarea::placeholder { color: rgba(255,255,255,0.25); }
        .md-textarea-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 4px 0;
          font-size: 0.8rem;
          color: rgba(255,255,255,0.35);
        }

        /* ── Preference Inputs ── */
        .md-prefs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 24px;
        }
        @media (max-width: 520px) { .md-prefs { grid-template-columns: 1fr; } }
        .md-pref-input {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          color: #fff;
          font-size: 0.9rem;
          padding: 12px 16px;
          outline: none;
          width: 100%;
          transition: border-color 0.2s;
          font-family: inherit;
        }
        .md-pref-input:focus {
          border-color: rgba(139,92,246,0.4);
        }
        .md-pref-input::placeholder { color: rgba(255,255,255,0.25); }

        /* ── Analyze button ── */
        .md-analyze-btn {
          width: 100%;
          padding: 16px;
          background: linear-gradient(135deg, #8b5cf6, #ec4899);
          color: #fff;
          border: none;
          border-radius: 14px;
          font-size: 1.05rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
          position: relative;
          overflow: hidden;
        }
        .md-analyze-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 16px 40px rgba(139,92,246,0.4);
        }
        .md-analyze-btn:disabled { opacity: 0.7; cursor: not-allowed; }
        .md-analyze-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg,rgba(255,255,255,0.15),transparent);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .md-analyze-btn:hover::before { opacity: 1; }
        .md-spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Result card ── */
        .md-result {
          margin-top: 28px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 24px;
          animation: fadeUp 0.4s ease;
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(12px); }
          to   { opacity:1; transform:translateY(0);    }
        }
        .md-result-top {
          display: flex;
          align-items: center;
          gap: 18px;
          margin-bottom: 20px;
        }
        .md-result-emoji {
          font-size: 3.5rem;
          filter: drop-shadow(0 0 16px var(--result-color, #8b5cf6));
          flex-shrink: 0;
        }
        .md-result-label {
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--result-color, #a78bfa);
          margin-bottom: 4px;
        }
        .md-result-name {
          font-size: 1.6rem;
          font-weight: 800;
          color: #fff;
          margin-bottom: 4px;
        }
        .md-result-desc {
          color: rgba(255,255,255,0.45);
          font-size: 0.9rem;
          line-height: 1.6;
        }
        .md-conf-label {
          display: flex;
          justify-content: space-between;
          font-size: 0.82rem;
          color: rgba(255,255,255,0.4);
          margin-bottom: 8px;
        }
        .md-conf-track {
          height: 8px;
          background: rgba(255,255,255,0.07);
          border-radius: 99px;
          overflow: hidden;
          margin-bottom: 22px;
        }
        .md-conf-fill {
          height: 100%;
          border-radius: 99px;
          transition: width 0.8s ease;
        }
        .md-playlist-btn {
          width: 100%;
          padding: 14px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: #fff;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: background 0.2s, border-color 0.2s;
        }
        .md-playlist-btn:hover {
          background: rgba(139,92,246,0.12);
          border-color: rgba(139,92,246,0.3);
        }

        /* ── Feature strip ── */
        .md-features {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          max-width: 720px;
          margin: 36px auto 0;
        }
        @media (max-width: 600px) { .md-features { grid-template-columns: 1fr; } }
        .md-feature {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }
        .md-feature-icon {
          font-size: 1.6rem;
          flex-shrink: 0;
        }
        .md-feature h3 {
          font-size: 0.95rem;
          font-weight: 700;
          color: #fff;
          margin-bottom: 4px;
        }
        .md-feature p {
          font-size: 0.82rem;
          color: rgba(255,255,255,0.35);
          line-height: 1.5;
        }
      `}</style>

      {/* Ambient orbs */}
      <div className="md-orb md-orb-1" />
      <div className="md-orb md-orb-2" />

      {/* ── NAVBAR ── */}
      <header className="mood-navbar">
        <div className="mood-logo" onClick={() => navigate("/")}>
          <div className="mood-logo-icon">♫</div>
          <span>Moodify</span>
        </div>
        <nav className="mood-nav-links">
          <button onClick={() => navigate("/mood")}>🧠 Mood</button>
          <button onClick={() => navigate("/recommendations")}>🎧 Recommendations</button>
          <button onClick={() => navigate("/discover")}>🔎 Discover</button>
          <button onClick={() => navigate("/my-music")}>❤️ My Music</button>
          <button onClick={() => navigate("/analytics")}>📊 Analytics</button>
          <button onClick={() => navigate("/profile")}>👤 Profile</button>
        </nav>
        <div className="mood-user">
          <div className="mood-avatar">A</div>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="md-page">

        {/* Hero */}
        <div className="md-hero">
          <div className="md-badge">✦ AI Mood Detection</div>
          <h1>How are you <span>feeling?</span></h1>
          <p>
            Tell Moodify what's on your mind and let AI
            create a soundtrack that matches your emotions.
          </p>
        </div>

        {/* Detection Card */}
        <section className="md-card">
          <div className="md-card-glow" />

          {/* Textarea */}
          <div className="md-textarea-wrap">
            <textarea
              className="md-textarea"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={500}
              placeholder="Example: I've had a long day and I just want to relax with some peaceful music..."
            />
            <div className="md-textarea-footer">
              <span>✨ AI will analyze your emotions</span>
              <span>{text.length}/500</span>
            </div>
          </div>

          {/* Preferences */}
          <div className="md-prefs">
            <input
              className="md-pref-input"
              type="text"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder="🎸 Preferred genre (e.g. pop)"
            />
            <input
              className="md-pref-input"
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="🎤 Preferred artist (e.g. Taylor Swift)"
            />
          </div>

          {/* Analyze Button */}
          <button
            className="md-analyze-btn"
            onClick={detectMood}
            disabled={loading}
          >
            {loading ? (
              <><div className="md-spinner" /> Analyzing your mood...</>
            ) : (
              <>✨ Analyze My Mood</>
            )}
          </button>

          {/* ── RESULT ── */}
          {mood && (
            <div
              className="md-result"
              style={{ "--result-color": mood.color }}
            >
              <div className="md-result-top">
                <div className="md-result-emoji">{mood.emoji}</div>
                <div>
                  <div className="md-result-label">Mood Detected</div>
                  <div className="md-result-name">You seem {mood.name}</div>
                  <div className="md-result-desc">{mood.description}</div>
                </div>
              </div>

              <div className="md-conf-label">
                <span>AI Confidence</span>
                <strong style={{ color: "#fff" }}>{mood.confidence}%</strong>
              </div>
              <div className="md-conf-track">
                <div
                  className="md-conf-fill"
                  style={{ width: `${mood.confidence}%`, background: mood.gradient }}
                />
              </div>

              <button
                className="md-playlist-btn"
                onClick={() => {
                  localStorage.setItem("moodify_mood",            JSON.stringify(mood));
                  localStorage.setItem("moodify_recommendations", JSON.stringify(recommendations));
                  navigate("/recommendations");
                }}
              >
                Create My Mood Playlist →
              </button>
            </div>
          )}
        </section>

        {/* Feature strip */}
        <div className="md-features">
          <div className="md-feature">
            <div className="md-feature-icon">🧠</div>
            <div>
              <h3>AI Powered</h3>
              <p>Understand emotions using our custom-trained LSTM model.</p>
            </div>
          </div>
          <div className="md-feature">
            <div className="md-feature-icon">🎵</div>
            <div>
              <h3>Personalized Music</h3>
              <p>Songs selected specifically for your current emotional state.</p>
            </div>
          </div>
          <div className="md-feature">
            <div className="md-feature-icon">📊</div>
            <div>
              <h3>Mood Insights</h3>
              <p>Track your emotional journey through your listening history.</p>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}