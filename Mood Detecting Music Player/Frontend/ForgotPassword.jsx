import React, { useState } from "react";
import {
  Link,
  useLocation,
} from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";

import { auth } from "./firebase";

export default function ForgotPassword() {
  // ============================================================
  // CHECK WHERE USER CAME FROM
  // ============================================================

  const location = useLocation();

  const cameFromProfile =
    location.state?.from === "profile";

  // ============================================================
  // STATES
  // ============================================================

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // ============================================================
  // SEND PASSWORD RESET EMAIL
  // ============================================================

  const sendReset = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    const cleanEmail =
      email.trim().toLowerCase();

    if (!cleanEmail) {
      setError(
        "Please enter your email address."
      );
      return;
    }

    try {
      setLoading(true);

      console.log(
        "Sending password reset email to:",
        cleanEmail
      );

      await sendPasswordResetEmail(
        auth,
        cleanEmail
      );

      setMessage(
        "Password reset link sent! Please check your email and spam folder."
      );

    } catch (error) {
      console.error(
        "Password reset error:",
        error
      );

      if (
        error.code ===
        "auth/user-not-found"
      ) {
        setError(
          "No Moodify account is registered with this email."
        );

      } else if (
        error.code ===
        "auth/invalid-email"
      ) {
        setError(
          "Please enter a valid email address."
        );

      } else if (
        error.code ===
        "auth/too-many-requests"
      ) {
        setError(
          "Too many requests. Please wait a while and try again."
        );

      } else {
        setError(
          error.message ||
            "Unable to send password reset email. Please try again."
        );
      }

    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="auth-page">

      {/* ======================================================
          LEFT SIDE
      ====================================================== */}

      <div className="auth-visual">

        <div>

          <div className="logo">

            <div className="logo-icon">
              ♫
            </div>

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

      {/* ======================================================
          RIGHT SIDE
      ====================================================== */}

      <div className="auth-box">

        <div
          style={{
            fontSize: "55px",
            marginBottom: "15px",
          }}
        >
          🔐
        </div>

        <h2>
          Forgot your password?
        </h2>

        <p className="auth-subtitle">
          Enter your registered email and
          we'll send you a password reset
          link.
        </p>

        {/* ==================================================
            FORM
        ================================================== */}

        <form onSubmit={sendReset}>

          <div className="form-group">

            <label>
              Email address
            </label>

            <input
              className="form-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(
                  e.target.value
                );

                setError("");
                setMessage("");
              }}
              required
            />

          </div>

          {/* ==================================================
              ERROR
          ================================================== */}

          {error && (
            <div className="auth-error">
              ⚠️ {error}
            </div>
          )}

          {/* ==================================================
              SUCCESS
          ================================================== */}

          {message && (
            <div className="auth-success">
              ✅ {message}
            </div>
          )}

          {/* ==================================================
              SEND BUTTON
          ================================================== */}

          <button
            type="submit"
            className="primary-btn"
            disabled={loading}
          >
            {loading
              ? "Sending..."
              : "Send Reset Link"}
          </button>

        </form>

        {/* ==================================================
            BACK BUTTON
        ================================================== */}

        <div className="auth-bottom">

          {cameFromProfile ? (
            <Link to="/profile">
              ← Back to Profile
            </Link>
          ) : (
            <Link to="/login">
              ← Back to Login
            </Link>
          )}

        </div>

      </div>

    </div>
  );
}