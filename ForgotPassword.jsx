import { Link } from "react-router-dom";

export default function ForgotPassword() {

  const sendReset = (e) => {
    e.preventDefault();

    alert("Password reset link sent successfully!");
  };

  return (
    <div className="auth-page">

      <div className="auth-visual">

        <div>

          <div className="logo">
            <div className="logo-icon">♫</div>
            Moodify
          </div>

          <h1>
            Come back to
            <br />
            your
            <span className="gradient-text">
              music.
            </span>
          </h1>

          <p>
            We'll help you get back into your
            personalized music experience.
          </p>

        </div>

      </div>

      <div className="auth-box">

        <div style={{
          fontSize:"55px",
          marginBottom:"15px"
        }}>
          🔐
        </div>

        <h2>Forgot your password?</h2>

        <p className="auth-subtitle">
          Enter your email and we'll send you
          a reset link.
        </p>

        <form onSubmit={sendReset}>

          <div className="form-group">

            <label>Email address</label>

            <input
              className="form-input"
              type="email"
              placeholder="you@example.com"
              required
            />

          </div>

          <button className="primary-btn">
            Send Reset Link
          </button>

        </form>

        <div className="auth-bottom">
          <Link to="/login">
            ← Back to Login
          </Link>
        </div>

      </div>

    </div>
  );
}