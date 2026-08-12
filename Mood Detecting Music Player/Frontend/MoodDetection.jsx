import { useState } from "react";
import AppLayout from "./AppLayout";
import { useNavigate } from "react-router-dom";

export default function MoodDetection() {
  const [text, setText] = useState("");
  const [mood, setMood] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const detectMood = () => {
    if (!text.trim()) {
      alert("Please tell us how you are feeling first.");
      return;
    }

    setLoading(true);

    // Temporary frontend result
    // Later this will connect to your Python/Flask ML model.

    setTimeout(() => {
      setMood({
        emoji: "😌",
        name: "Calm",
        confidence: 87,
        description:
          "Your words suggest a peaceful and relaxed emotional state."
      });

      setLoading(false);
    }, 1000);
  };

  return (
    <div className="mood-page">

      {/* ================= NAVBAR ================= */}

      <header className="mood-navbar">

        <div
          className="mood-logo"
          onClick={() => navigate("/")}
        >
          <div className="mood-logo-icon">♫</div>
          <span>Moodify</span>
        </div>

        <nav className="mood-nav-links">

          <button onClick={() => navigate("/mood")}>
            🧠 Mood
          </button>

          <button onClick={() => navigate("/recommendations")}>
            🎧 Recommendations
          </button>

          <button onClick={() => navigate("/discover")}>
            🔎 Discover
          </button>

          <button onClick={() => navigate("/my-music")}>
            ❤️ My Music
          </button>

          <button onClick={() => navigate("/analytics")}>
            📊 Analytics
          </button>

          <button onClick={() => navigate("/profile")}>
            👤 Profile
          </button>

        </nav>

        <div className="mood-user">
          <div className="mood-avatar">A</div>
        </div>

      </header>

      {/* ================= MAIN CONTENT ================= */}

      <main className="mood-main">

        <div className="mood-heading">

          <div className="mood-small-badge">
            ✦ AI MOOD DETECTION
          </div>

          <h1>
            How are you
            <span> feeling?</span>
          </h1>

          <p>
            Tell Moodify what's on your mind and let AI
            create a soundtrack that matches your emotions.
          </p>

        </div>

        {/* ================= DETECTION CARD ================= */}

        <section className="mood-detection-card">

          <div className="mood-card-glow"></div>

          <div className="brain-circle">
            🧠
          </div>

          <h2>
            Tell Moodify what's on your mind
          </h2>

          <p className="mood-card-description">
            Describe your current feelings, your day,
            or anything that's on your mind.
          </p>

          <div className="textarea-wrapper">

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Example: I've had a long day and I just want to relax with some peaceful music..."
            />

            <div className="textarea-bottom">

              <span>
                ✨ AI will analyze your emotions
              </span>

              <span>
                {text.length}/500
              </span>

            </div>

          </div>

          <button
            className="analyze-button"
            onClick={detectMood}
            disabled={loading}
          >

            {loading ? (
              <>
                <span className="spinner"></span>
                Analyzing...
              </>
            ) : (
              <>
                ✨ Analyze My Mood
              </>
            )}

          </button>

          {/* ================= RESULT ================= */}

          {mood && (

            <div className="mood-result-card">

              <div className="result-top">

                <div className="result-emoji">
                  {mood.emoji}
                </div>

                <div className="result-title">

                  <span>MOOD DETECTED</span>

                  <h3>
                    You seem {mood.name.toLowerCase()}
                  </h3>

                  <p>
                    {mood.description}
                  </p>

                </div>

              </div>

              <div className="confidence-section">

                <div className="confidence-heading">

                  <span>
                    AI Confidence
                  </span>

                  <strong>
                    {mood.confidence}%
                  </strong>

                </div>

                <div className="confidence-bar">

                  <div
                    className="confidence-fill"
                    style={{
                      width: `${mood.confidence}%`
                    }}
                  ></div>

                </div>

              </div>

              <button
                className="playlist-button"
                onClick={() =>
                  navigate("/recommendations")
                }
              >
                Create My Mood Playlist
                <span>→</span>
              </button>

            </div>

          )}

        </section>

        {/* ================= BOTTOM FEATURES ================= */}

        <section className="mood-features">

          <div className="mood-feature">

            <div className="feature-icon">
              🧠
            </div>

            <div>
              <h3>AI Powered</h3>

              <p>
                Understand emotions using intelligent
                mood analysis.
              </p>
            </div>

          </div>

          <div className="mood-feature">

            <div className="feature-icon">
              🎵
            </div>

            <div>
              <h3>Personalized Music</h3>

              <p>
                Get songs selected specifically for
                your current mood.
              </p>
            </div>

          </div>

          <div className="mood-feature">

            <div className="feature-icon">
              📊
            </div>

            <div>
              <h3>Mood Insights</h3>

              <p>
                Track your emotional journey through
                your listening history.
              </p>
            </div>

          </div>

        </section>

      </main>

    </div>
  );
}