import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="landing">

      <nav className="navbar">

        <div className="logo">
          <div className="logo-icon">♫</div>
          <span>Moodify</span>
        </div>

        <div className="nav-links">
          <a href="#how">How it works</a>
          <a href="#features">Features</a>
          <a href="#about">About</a>
        </div>

        <div className="nav-actions">
          <Link to="/login" className="secondary-btn">
            Login
          </Link>

          <Link to="/register" className="primary-btn">
            Get Started
          </Link>
        </div>

      </nav>

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
            Moodify uses AI to understand your emotional state
            and create a soundtrack that feels right for your
            moment.
          </p>

          <div className="hero-buttons">

            <Link to="/mood" className="primary-btn">
              🧠 Detect My Mood
            </Link>

            <Link to="/discover" className="secondary-btn">
              Explore Music →
            </Link>

          </div>

        </div>

        <div className="mood-orb">

          <div className="mood-face">
            😌
          </div>

        </div>

      </section>

    </div>
  );
}