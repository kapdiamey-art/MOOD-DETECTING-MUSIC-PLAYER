import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  signInWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";

import { auth } from "./firebase";

export default function Login() {
  const navigate = useNavigate();

  // ==========================================
  // STATES
  // ==========================================

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [showResend, setShowResend] = useState(false);

  const [resending, setResending] = useState(false);

  const [resendMessage, setResendMessage] =
    useState("");

  // ==========================================
  // LOGIN
  // ==========================================

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setResendMessage("");
    setShowResend(false);

    // ========================================
    // CHECK INPUTS
    // ========================================

    if (!email.trim() || !password) {
      setError(
        "Please enter your email and password."
      );
      return;
    }

    try {
      setLoading(true);

      // ======================================
      // FIREBASE LOGIN
      // ======================================

      const userCredential =
        await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );

      const user = userCredential.user;

      console.log(
        "Logged in Firebase user:",
        user.email
      );

      // ======================================
      // CHECK EMAIL VERIFICATION
      // ======================================

      if (!user.emailVerified) {
        setError(
          "Please verify your email before logging in."
        );

        setShowResend(true);

        return;
      }

      // ======================================
      // LOGIN SUCCESSFUL
      // ======================================

      localStorage.setItem(
        "moodifyLoggedIn",
        "true"
      );

      // Save email if needed
      localStorage.setItem(
        "moodifyEmail",
        user.email
      );

      alert("Login successful!");

      // ======================================
      // GO TO MOOD PAGE
      // ======================================

      navigate("/mood");

    } catch (error) {
      console.error(
        "Firebase Login Error:",
        error
      );

      // ======================================
      // FIREBASE ERRORS
      // ======================================

      if (
        error.code ===
        "auth/invalid-credential"
      ) {
        setError(
          "Incorrect email or password."
        );

      } else if (
        error.code ===
        "auth/user-not-found"
      ) {
        setError(
          "No account found. Please register first."
        );

      } else if (
        error.code ===
        "auth/wrong-password"
      ) {
        setError(
          "Incorrect email or password."
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
          "Too many login attempts. Please try again later."
        );

      } else if (
        error.code ===
        "auth/user-disabled"
      ) {
        setError(
          "This account has been disabled."
        );

      } else {
        setError(
          error.message ||
            "Login failed. Please try again."
        );
      }

    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // RESEND EMAIL VERIFICATION
  // ==========================================

  const handleResendVerification = async () => {
    setError("");
    setResendMessage("");

    if (!email.trim() || !password) {
      setError(
        "Enter your email and password first."
      );
      return;
    }

    try {
      setResending(true);

      // ======================================
      // SIGN IN TEMPORARILY
      // ======================================

      const userCredential =
        await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );

      const user = userCredential.user;

      // ======================================
      // CHECK IF ALREADY VERIFIED
      // ======================================

      if (user.emailVerified) {
        setResendMessage(
          "Your email is already verified. You can log in."
        );

        setShowResend(false);

        return;
      }

      // ======================================
      // SEND VERIFICATION EMAIL
      // ======================================

      await sendEmailVerification(user);

      setResendMessage(
        "Verification email sent! Please check your inbox and spam folder."
      );

    } catch (error) {
      console.error(
        "Resend verification error:",
        error
      );

      if (
        error.code ===
        "auth/invalid-credential"
      ) {
        setError(
          "Incorrect email or password."
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
            "Could not send verification email."
        );
      }

    } finally {
      setResending(false);
    }
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="auth-page">

      <div className="auth-card">

        {/* ==================================
            LOGO
        ================================== */}

        <div className="auth-logo">

          <div className="auth-logo-icon">
            ♫
          </div>

          <span>
            Moodify
          </span>

        </div>

        {/* ==================================
            HEADER
        ================================== */}

        <div className="auth-header">

          <span className="auth-badge">
            🎧 WELCOME BACK
          </span>

          <h1>
            Welcome back
          </h1>

          <p>
            Your mood. Your music. Your moment.
          </p>

        </div>

        {/* ==================================
            LOGIN FORM
        ================================== */}

        <form onSubmit={handleLogin}>

          {/* EMAIL */}

          <div className="form-group">

            <label>
              Email Address
            </label>

            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);

                setError("");
                setShowResend(false);
                setResendMessage("");
              }}
            />

          </div>

          {/* PASSWORD */}

          <div className="form-group">

            <div className="password-label">

              <label>
                Password
              </label>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/forgot-password"
                  )
                }
              >
                Forgot password?
              </button>

            </div>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(
                  e.target.value
                );

                setError("");
                setShowResend(false);
                setResendMessage("");
              }}
            />

          </div>

          {/* ==================================
              ERROR
          ================================== */}

          {error && (

            <div className="auth-error">

              ⚠️ {error}

              {/* RESEND VERIFICATION */}

              {showResend && (

                <button
                  type="button"
                  onClick={
                    handleResendVerification
                  }
                  disabled={resending}
                  style={{
                    display: "block",
                    marginTop: "12px",
                    width: "100%",
                  }}
                >
                  {resending
                    ? "Sending..."
                    : "Resend Verification Email"}
                </button>

              )}

            </div>

          )}

          {/* ==================================
              SUCCESS MESSAGE
          ================================== */}

          {resendMessage && (

            <div className="auth-success">

              ✅ {resendMessage}

            </div>

          )}

          {/* ==================================
              LOGIN BUTTON
          ================================== */}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >

            {loading
              ? "Logging in..."
              : "Login to Moodify →"}

          </button>

        </form>

        {/* ==================================
            REGISTER
        ================================== */}

        <div className="auth-switch">

          <span>
            Don't have an account?
          </span>

          <button
            type="button"
            onClick={() =>
              navigate("/register")
            }
          >
            Create Account
          </button>

        </div>

      </div>

    </div>
  );
}