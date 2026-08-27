import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  signInWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";

import { auth } from "./firebase";

export default function Login() {
  const navigate = useNavigate();

  // =====================================================
  // STATES
  // =====================================================

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [otpMode, setOtpMode] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showResend, setShowResend] = useState(false);

  // =====================================================
  // EMAIL VALIDATION
  // =====================================================

  const isValidEmail = (value) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  // =====================================================
  // LOGIN WITH EMAIL + PASSWORD
  // =====================================================

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");
    setShowResend(false);

    const cleanEmail = email.trim().toLowerCase();

    // -------------------------------------------------
    // VALIDATE
    // -------------------------------------------------

    if (!cleanEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);

      console.log("Logging in:", cleanEmail);

      // =================================================
      // STEP 1: FIREBASE EMAIL + PASSWORD
      // =================================================

      const userCredential =
        await signInWithEmailAndPassword(
          auth,
          cleanEmail,
          password
        );

      const user = userCredential.user;

      console.log(
        "Firebase user:",
        user.email
      );

      console.log(
        "Email verified:",
        user.emailVerified
      );

      // =================================================
      // STEP 2: CHECK EMAIL VERIFICATION
      // =================================================

      if (!user.emailVerified) {

        setError(
          "Please verify your email before continuing."
        );

        setShowResend(true);

        return;
      }

      console.log("✅ Email verified");

      // =================================================
      // STEP 3: SEND OTP
      // =================================================

      const response = await fetch(
        "http://localhost:5000/send-otp",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: cleanEmail,
          }),
        }
      );

      const data = await response.json();

      console.log(
        "Send OTP response:",
        data
      );

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
          "Failed to send OTP."
        );
      }

      console.log("✅ OTP sent");

      // =================================================
      // STEP 4: SHOW OTP SCREEN
      // =================================================

      setOtpMode(true);
      setOtpSent(true);

      setMessage(
        "OTP sent successfully! Check your email."
      );

    } catch (error) {

      console.error(
        "Login error:",
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

  // =====================================================
  // VERIFY OTP
  // =====================================================

  const handleVerifyOTP = async () => {

    setError("");
    setMessage("");

    const cleanEmail =
      email.trim().toLowerCase();

    const cleanOTP =
      otp.trim();

    // -------------------------------------------------
    // VALIDATE EMAIL
    // -------------------------------------------------

    if (!cleanEmail) {

      setError(
        "Email is required."
      );

      return;
    }

    // -------------------------------------------------
    // VALIDATE OTP
    // -------------------------------------------------

    if (!cleanOTP) {

      setError(
        "Please enter the OTP."
      );

      return;
    }

    if (!/^\d{6}$/.test(cleanOTP)) {

      setError(
        "OTP must contain exactly 6 digits."
      );

      return;
    }

    try {

      setOtpLoading(true);

      console.log(
        "Verifying OTP for:",
        cleanEmail
      );

      // =================================================
      // SEND OTP + EMAIL TO BACKEND
      // =================================================

      const response =
        await fetch(
          "http://localhost:5000/verify-otp",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              email: cleanEmail,
              otp: cleanOTP,
            }),
          }
        );

      const data =
        await response.json();

      console.log(
        "Verify OTP response:",
        data
      );

      // =================================================
      // CHECK OTP
      // =================================================

      if (
        !response.ok ||
        !data.success
      ) {

        throw new Error(
          data.message ||
          "Invalid OTP."
        );
      }

      console.log(
        "✅ OTP verified successfully"
      );

      // =================================================
      // FINAL LOGIN
      // =================================================

      localStorage.setItem(
        "moodifyLoggedIn",
        "true"
      );

      localStorage.setItem(
        "moodifyEmail",
        cleanEmail
      );

      // =================================================
      // SUCCESS
      // =================================================

      setMessage(
        "OTP verified successfully!"
      );

      alert(
        "Login successful!"
      );

      navigate("/mood");

    } catch (error) {

      console.error(
        "OTP verification error:",
        error
      );

      setError(
        error.message ||
        "Invalid OTP. Please try again."
      );

    } finally {

      setOtpLoading(false);

    }
  };

  // =====================================================
  // RESEND OTP
  // =====================================================

  const handleResendOTP = async () => {

    setError("");
    setMessage("");
    setOtp("");

    const cleanEmail =
      email.trim().toLowerCase();

    if (!cleanEmail) {

      setError(
        "Email is required."
      );

      return;
    }

    try {

      setOtpLoading(true);

      const response =
        await fetch(
          "http://localhost:5000/send-otp",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              email: cleanEmail,
            }),
          }
        );

      const data =
        await response.json();

      console.log(
        "Resend OTP response:",
        data
      );

      if (
        !response.ok ||
        !data.success
      ) {

        throw new Error(
          data.message ||
          "Failed to resend OTP."
        );
      }

      setMessage(
        "New OTP sent successfully!"
      );

    } catch (error) {

      console.error(
        "Resend OTP error:",
        error
      );

      setError(
        error.message ||
        "Unable to resend OTP."
      );

    } finally {

      setOtpLoading(false);

    }
  };

  // =====================================================
  // RESEND EMAIL VERIFICATION
  // =====================================================

  const handleResendVerification =
    async () => {

      setError("");
      setMessage("");

      const cleanEmail =
        email.trim().toLowerCase();

      if (!cleanEmail || !password) {

        setError(
          "Enter your email and password first."
        );

        return;
      }

      try {

        setResending(true);

        const userCredential =
          await signInWithEmailAndPassword(
            auth,
            cleanEmail,
            password
          );

        const user =
          userCredential.user;

        // -------------------------------------------------
        // ALREADY VERIFIED
        // -------------------------------------------------

        if (user.emailVerified) {

          setMessage(
            "Your email is already verified. Please login again."
          );

          setShowResend(false);

          return;
        }

        // -------------------------------------------------
        // SEND VERIFICATION EMAIL
        // -------------------------------------------------

        await sendEmailVerification(
          user
        );

        setMessage(
          "Verification email sent! Check your inbox and spam folder."
        );

      } catch (error) {

        console.error(
          "Resend verification error:",
          error
        );

        setError(
          error.message ||
          "Could not send verification email."
        );

      } finally {

        setResending(false);

      }
    };

  // =====================================================
  // BACK TO EMAIL + PASSWORD
  // =====================================================

  const handleBack = () => {

    setOtpMode(false);

    setOtpSent(false);

    setOtp("");

    setError("");

    setMessage("");

  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="auth-page">

      <div className="auth-card">

        {/* =================================================
            LOGO
        ================================================= */}

        <div className="auth-logo">

          <div className="auth-logo-icon">
            ♫
          </div>

          <span>
            Moodify
          </span>

        </div>


        {/* =================================================
            HEADER
        ================================================= */}

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


        {/* =================================================
            EMAIL + PASSWORD SCREEN
        ================================================= */}

        {!otpMode && (

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

                  setEmail(
                    e.target.value
                  );

                  setError("");
                  setMessage("");
                  setShowResend(false);

                }}
                required
              />

            </div>


            {/* PASSWORD */}

            <div className="form-group">

              <label>
                Password
              </label>

              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {

                  setPassword(
                    e.target.value
                  );

                  setError("");
                  setMessage("");
                  setShowResend(false);

                }}
                required
              />

            </div>


            {/* ERROR */}

            {error && (

              <div className="auth-error">

                ⚠️ {error}

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


            {/* MESSAGE */}

            {message && (

              <div className="auth-success">

                ✅ {message}

              </div>

            )}


            {/* LOGIN BUTTON */}

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >

              {loading
                ? "Checking..."
                : "Login →"}

            </button>

          </form>

        )}


        {/* =================================================
            OTP SCREEN
        ================================================= */}

        {otpMode && (

          <div>

            {/* EMAIL DISPLAY */}

            <div className="form-group">

              <label>
                Email Address
              </label>

              <input
                type="email"
                value={email}
                disabled
              />

            </div>


            {/* OTP MESSAGE */}

            {otpSent && !error && (

              <div
                className="auth-success"
                style={{
                  marginBottom: "15px",
                }}
              >

                📧 OTP sent to {email}

              </div>

            )}


            {/* OTP INPUT */}

            <div className="form-group">

              <label>
                Enter OTP
              </label>

              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter 6-digit OTP"
                value={otp}

                onChange={(e) => {

                  const value =
                    e.target.value.replace(
                      /\D/g,
                      ""
                    );

                  setOtp(value);
                  setError("");

                }}

                required
              />

            </div>


            {/* ERROR */}

            {error && (

              <div className="auth-error">

                ⚠️ {error}

              </div>

            )}


            {/* SUCCESS */}

            {message && (

              <div className="auth-success">

                ✅ {message}

              </div>

            )}


            {/* VERIFY OTP */}

            <button
              type="button"
              className="auth-submit"
              onClick={handleVerifyOTP}
              disabled={
                otpLoading ||
                otp.length !== 6
              }
            >

              {otpLoading
                ? "Verifying..."
                : "Verify OTP →"}

            </button>


            {/* RESEND OTP */}

            <button
              type="button"
              className="auth-submit"
              onClick={handleResendOTP}
              disabled={otpLoading}
              style={{
                marginTop: "10px",
              }}
            >

              {otpLoading
                ? "Sending..."
                : "Resend OTP"}

            </button>


            {/* BACK */}

            <button
              type="button"
              className="auth-submit"
              onClick={handleBack}
              disabled={otpLoading}
              style={{
                marginTop: "10px",
              }}
            >

              ← Back to Login

            </button>

          </div>

        )}


        {/* =================================================
            REGISTER
        ================================================= */}

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