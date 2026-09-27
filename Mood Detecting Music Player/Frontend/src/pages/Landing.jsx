import { Link } from "react-router-dom";

export default function Landing() {
  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="landing">

      {/* =========================================================
          NAVIGATION BAR
      ========================================================= */}
      <nav className="navbar">
        <div className="logo">
          <div className="logo-icon">♫</div>
          <span>Moodify</span>
        </div>

        <div className="nav-links">
          <a href="#how" onClick={(e) => { e.preventDefault(); scrollToSection("how"); }}>How it works</a>
          <a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection("features"); }}>Features</a>
          <a href="#about" onClick={(e) => { e.preventDefault(); scrollToSection("about"); }}>About</a>
        </div>

        <div className="nav-actions">
          <Link to="/login" className="secondary-btn" style={{ padding: "10px 20px", borderRadius: "12px" }}>
            Login
          </Link>
          <Link to="/register" className="primary-btn" style={{ padding: "10px 22px", borderRadius: "12px" }}>
            Get Started
          </Link>
        </div>
      </nav>

      {/* =========================================================
          HERO SECTION
      ========================================================= */}
      <section className="hero">
        <div>
          <div className="hero-badge">
            ✦ AI-Powered Music Personalization
          </div>

          <h1>
            Music that
            <br />
            <span className="gradient-text">
              understands
            </span>
            you.
          </h1>

          <p>
            Moodify uses advanced PyTorch Deep Learning and Natural Language Processing to detect your exact emotional state and curate a soundtrack tailored for your moment.
          </p>

          <div className="hero-buttons">
            <Link to="/mood" className="primary-btn" style={{ padding: "14px 28px", fontSize: "1rem" }}>
              🧠 Detect My Mood
            </Link>

            <Link to="/discover" className="secondary-btn" style={{ padding: "14px 28px", fontSize: "1rem" }}>
              Explore Music →
            </Link>
          </div>
        </div>

        <div className="mood-orb" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
          <div className="mood-face" style={{ fontSize: "90px", animation: "float 4s ease-in-out infinite" }}>
            😌
          </div>
          <div style={{ marginTop: "20px", background: "rgba(255,255,255,0.06)", backdropFilter: "blur(12px)", padding: "12px 24px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.12)", textAlign: "center" }}>
            <div style={{ fontSize: "0.85rem", color: "var(--primary)", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>Current Vibe</div>
            <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "#fff", marginTop: "2px" }}>Calm & Peaceful</div>
          </div>
        </div>
      </section>

      {/* =========================================================
          HOW IT WORKS SECTION (#how)
      ========================================================= */}
      <section id="how" className="landing-section" style={{ width: "min(1180px, 92%)", margin: "100px auto", paddingTop: "40px" }}>
        <div style={{ textAlign: "center", marginBottom: "60px" }}>
          <div className="hero-badge" style={{ display: "inline-block" }}>⚡ Simple 3-Step Process</div>
          <h2 style={{ fontSize: "clamp(32px, 4vw, 48px)", fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-1.5px", marginTop: "10px" }}>
            How <span className="gradient-text">Moodify</span> Works
          </h2>
          <p style={{ color: "var(--muted)", maxWidth: "600px", margin: "15px auto 0", fontSize: "1.05rem" }}>
            Express your thoughts naturally through voice or text, and let our AI handle the rest.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "30px" }}>
          {/* Step 1 */}
          <div className="glass" style={{ padding: "35px 28px", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.1)", position: "relative" }}>
            <div style={{ width: "50px", height: "50px", borderRadius: "16px", background: "linear-gradient(135deg, #8b5cf6, #ec4899)", display: "grid", placeItems: "center", fontSize: "24px", fontWeight: "800", color: "#fff", marginBottom: "20px" }}>
              1
            </div>
            <h3 style={{ fontSize: "1.35rem", marginBottom: "12px", color: "#fff" }}>Express Your Mind</h3>
            <p style={{ color: "var(--muted)", lineHeight: "1.7", fontSize: "0.95rem" }}>
              Type or speak how your day went. Write about your feelings, thoughts, or what you're experiencing in plain conversational text.
            </p>
          </div>

          {/* Step 2 */}
          <div className="glass" style={{ padding: "35px 28px", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.1)", position: "relative" }}>
            <div style={{ width: "50px", height: "50px", borderRadius: "16px", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "grid", placeItems: "center", fontSize: "24px", fontWeight: "800", color: "#fff", marginBottom: "20px" }}>
              2
            </div>
            <h3 style={{ fontSize: "1.35rem", marginBottom: "12px", color: "#fff" }}>AI Sentiment Extraction</h3>
            <p style={{ color: "var(--muted)", lineHeight: "1.7", fontSize: "0.95rem" }}>
              Our custom PyTorch BiLSTM model with Multi-Head Self-Attention extracts subtle emotional signals, confidence scores, and weather context in &lt;10ms.
            </p>
          </div>

          {/* Step 3 */}
          <div className="glass" style={{ padding: "35px 28px", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.1)", position: "relative" }}>
            <div style={{ width: "50px", height: "50px", borderRadius: "16px", background: "linear-gradient(135deg, #10b981, #3b82f6)", display: "grid", placeItems: "center", fontSize: "24px", fontWeight: "800", color: "#fff", marginBottom: "20px" }}>
              3
            </div>
            <h3 style={{ fontSize: "1.35rem", marginBottom: "12px", color: "#fff" }}>Personalized Soundtrack</h3>
            <p style={{ color: "var(--muted)", lineHeight: "1.7", fontSize: "0.95rem" }}>
              Instantly receive a custom playlist tailored to your mood. Play preview audio, save favorites, or switch into full Zen vinyl mode.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================
          FEATURES SECTION (#features)
      ========================================================= */}
      <section id="features" className="landing-section" style={{ width: "min(1180px, 92%)", margin: "100px auto", paddingTop: "40px" }}>
        <div style={{ textAlign: "center", marginBottom: "60px" }}>
          <div className="hero-badge" style={{ display: "inline-block" }}>✨ Intelligent Capabilities</div>
          <h2 style={{ fontSize: "clamp(32px, 4vw, 48px)", fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-1.5px", marginTop: "10px" }}>
            Designed for <span className="gradient-text">Emotional Well-being</span>
          </h2>
          <p style={{ color: "var(--muted)", maxWidth: "620px", margin: "15px auto 0", fontSize: "1.05rem" }}>
            Discover features built to help you understand your feelings, relax, and stay connected with music.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
          {/* Feature 1 */}
          <div className="glass" style={{ padding: "30px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.08)", transition: "transform 0.3s ease" }}>
            <div style={{ fontSize: "36px", marginBottom: "16px" }}>🧠</div>
            <h3 style={{ fontSize: "1.25rem", color: "#fff", marginBottom: "10px" }}>AI Emotion Detection</h3>
            <p style={{ color: "var(--muted)", fontSize: "0.93rem", lineHeight: "1.6" }}>
              Detects 7 distinct emotion classes (Joy, Sadness, Anger, Fear, Love, Surprise, Neutral) with confidence probability percentages.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="glass" style={{ padding: "30px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.08)", transition: "transform 0.3s ease" }}>
            <div style={{ fontSize: "36px", marginBottom: "16px" }}>⛅</div>
            <h3 style={{ fontSize: "1.25rem", color: "#fff", marginBottom: "10px" }}>Weather-Based Sentiment Fusion</h3>
            <p style={{ color: "var(--muted)", fontSize: "0.93rem", lineHeight: "1.6" }}>
              Combines live local weather conditions (rain, sunny, snowy) with your current mood to refine playlist recommendations.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="glass" style={{ padding: "30px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.08)", transition: "transform 0.3s ease" }}>
            <div style={{ fontSize: "36px", marginBottom: "16px" }}>🧘</div>
            <h3 style={{ fontSize: "1.25rem", color: "#fff", marginBottom: "10px" }}>Zen Mode & Vinyl Player</h3>
            <p style={{ color: "var(--muted)", fontSize: "0.93rem", lineHeight: "1.6" }}>
              Immerse yourself in full-screen relaxation mode featuring interactive vinyl arm physics and live audio visualizers.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="glass" style={{ padding: "30px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.08)", transition: "transform 0.3s ease" }}>
            <div style={{ fontSize: "36px", marginBottom: "16px" }}>📔</div>
            <h3 style={{ fontSize: "1.25rem", color: "#fff", marginBottom: "10px" }}>Mood Journal & Year in Pixels</h3>
            <p style={{ color: "var(--muted)", fontSize: "0.93rem", lineHeight: "1.6" }}>
              Log daily mood entries and visualize your emotional shifts across months with an interactive Year-in-Pixels matrix.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="glass" style={{ padding: "30px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.08)", transition: "transform 0.3s ease" }}>
            <div style={{ fontSize: "36px", marginBottom: "16px" }}>🤖</div>
            <h3 style={{ fontSize: "1.25rem", color: "#fff", marginBottom: "10px" }}>AI Therapy Companion</h3>
            <p style={{ color: "var(--muted)", fontSize: "0.93rem", lineHeight: "1.6" }}>
              Talk with an interactive AI companion trained to offer comforting conversation and custom playlist suggestions.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="glass" style={{ padding: "30px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.08)", transition: "transform 0.3s ease" }}>
            <div style={{ fontSize: "36px", marginBottom: "16px" }}>🎧</div>
            <h3 style={{ fontSize: "1.25rem", color: "#fff", marginBottom: "10px" }}>Discover & My Music</h3>
            <p style={{ color: "var(--muted)", fontSize: "0.93rem", lineHeight: "1.6" }}>
              Search thousands of Spotify tracks, manage your favorite liked songs, and create custom mood playlists.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================
          ABOUT SECTION (#about)
      ========================================================= */}
      <section id="about" className="landing-section" style={{ width: "min(1180px, 92%)", margin: "100px auto", paddingTop: "40px" }}>
        <div className="glass" style={{ padding: "50px 40px", borderRadius: "32px", border: "1px solid rgba(255,255,255,0.12)", background: "linear-gradient(135deg, rgba(139,92,246,0.12), rgba(236,72,153,0.12))" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "40px", alignItems: "center" }}>
            <div>
              <div className="hero-badge">✦ Our Mission</div>
              <h2 style={{ fontSize: "clamp(28px, 3.5vw, 42px)", fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-1px", marginTop: "10px" }}>
                Connecting Emotion &amp; Sound
              </h2>
              <p style={{ color: "var(--muted)", lineHeight: "1.8", marginTop: "18px", fontSize: "1rem" }}>
                Moodify was built to bridge the gap between mental wellness and digital music streaming. By leveraging deep learning models, real-time weather analytics, and intuitive UI design, Moodify turns everyday listening into a therapeutic, personalized experience.
              </p>
              <div style={{ display: "flex", gap: "20px", marginTop: "25px" }}>
                <div>
                  <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "#c4b5fd" }}>93.2%</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Model Accuracy</div>
                </div>
                <div>
                  <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "#f472b6" }}>30,000+</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Songs Indexed</div>
                </div>
                <div>
                  <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "#34d399" }}>&lt; 10ms</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>AI Inference</div>
                </div>
              </div>
            </div>

            <div style={{ textAlign: "center", background: "rgba(0,0,0,0.2)", padding: "35px 25px", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ fontSize: "48px", marginBottom: "15px" }}>🎵</div>
              <h3 style={{ fontSize: "1.5rem", color: "#fff", marginBottom: "10px" }}>Experience Moodify Today</h3>
              <p style={{ color: "var(--muted)", fontSize: "0.95rem", marginBottom: "25px" }}>
                Join thousands of listeners enjoying AI-curated mood music.
              </p>
              <Link to="/register" className="primary-btn" style={{ padding: "14px 32px", fontSize: "1rem", display: "inline-block", width: "100%", borderRadius: "14px" }}>
                Get Started for Free →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          FOOTER
      ========================================================= */}
      <footer style={{ width: "min(1180px, 92%)", margin: "60px auto 30px", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "30px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}>
        <div className="logo" style={{ fontSize: "18px" }}>
          <div className="logo-icon" style={{ width: "30px", height: "30px", fontSize: "14px" }}>♫</div>
          <span>Moodify</span>
        </div>
        <div style={{ color: "var(--muted)", fontSize: "0.88rem" }}>
          © {new Date().getFullYear()} Moodify — AI Music Player. All rights reserved.
        </div>
      </footer>

    </div>
  );
}