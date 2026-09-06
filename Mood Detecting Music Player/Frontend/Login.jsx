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

  // OTP mode is FALSE by default.
  // Therefore the normal login screen opens first.
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
  // NORMAL LOGIN WITH EMAIL + PASSWORD
  // =====================================================
  // IMPORTANT:
  // Password login does NOT send OTP.
  // Successful password login goes directly to /mood.
  // =====================================================

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");
    setShowResend(false);

    const cleanEmail = email.trim().toLowerCase();

    // -------------------------------------------------
    // VALIDATION
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
      // FIREBASE EMAIL + PASSWORD LOGIN
      // =================================================

      const userCredential =
        await signInWithEmailAndPassword(
          auth,
          cleanEmail,
          password
        );

      const user = userCredential.user;

      console.log("Firebase user:", user.email);
      console.log(
        "Email verified:",
        user.emailVerified
      );

      // =================================================
      // CHECK EMAIL VERIFICATION
      // =================================================

      if (!user.emailVerified) {
        setError(
          "Please verify your email before continuing."
        );

        setShowResend(true);

        return;
      }

      // =================================================
      // PASSWORD LOGIN SUCCESS
      // NO OTP HERE
      // =================================================

      console.log(
        "✅ Email + password login successful"
      );

      localStorage.setItem(
        "moodifyLoggedIn",
        "true"
      );

      localStorage.setItem(
        "moodifyEmail",
        cleanEmail
      );

      localStorage.setItem(
        "moodifyLoginMethod",
        "password"
      );

      setMessage(
        "Login successful! Redirecting..."
      );

      // Small delay so user can see success message
      setTimeout(() => {
        navigate("/mood");
      }, 500);

    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      // =================================================
      // FIREBASE ERROR HANDLING
      // =================================================

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
  // OPEN OTP LOGIN
  // =====================================================
  // This function ONLY opens the OTP screen.
  // It does NOT send OTP yet.
  // =====================================================

  const handleOpenOTPLogin = () => {
    setOtpMode(true);

    setOtp("");
    setOtpSent(false);

    setError("");
    setMessage("");
    setShowResend(false);
  };

  // =====================================================
  // SEND OTP
  // =====================================================

  const handleSendOTP = async () => {
    setError("");
    setMessage("");
    setOtp("");

    const cleanEmail =
      email.trim().toLowerCase();

    // -------------------------------------------------
    // VALIDATE EMAIL
    // -------------------------------------------------

    if (!cleanEmail) {
      setError(
        "Please enter your email address."
      );
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setError(
        "Please enter a valid email address."
      );
      return;
    }

    try {
      setOtpLoading(true);

      console.log(
        "Sending OTP to:",
        cleanEmail
      );

      // =================================================
      // SEND OTP TO BACKEND
      // =================================================

      const response = await fetch(
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
        "Send OTP response:",
        data
      );

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
          "Failed to send OTP."
        );
      }

      // =================================================
      // OTP SENT
      // =================================================

      console.log("✅ OTP sent");

      setOtpSent(true);

      setMessage(
        "OTP sent successfully! Check your email."
      );

    } catch (error) {
      console.error(
        "Send OTP error:",
        error
      );

      setError(
        error.message ||
        "Failed to send OTP. Please try again."
      );

    } finally {
      setOtpLoading(false);
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

    if (!isValidEmail(cleanEmail)) {
      setError(
        "Please enter a valid email address."
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
      // VERIFY OTP WITH BACKEND
      // =================================================

      const response = await fetch(
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
      // LOGIN SUCCESS
      // =================================================

      localStorage.setItem(
        "moodifyLoggedIn",
        "true"
      );

      localStorage.setItem(
        "moodifyEmail",
        cleanEmail
      );

      localStorage.setItem(
        "moodifyLoginMethod",
        "otp"
      );

      setMessage(
        "OTP verified successfully! Redirecting..."
      );

      // =================================================
      // GO TO MOOD PAGE
      // =================================================

      setTimeout(() => {
        navigate("/mood");
      }, 500);

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

      console.log(
        "Resending OTP to:",
        cleanEmail
      );

      const response = await fetch(
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

      setOtpSent(true);

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
  // BACK TO NORMAL LOGIN
  // =====================================================

  const handleBack = () => {
    setOtpMode(false);

    setOtpSent(false);
    setOtp("");

    setError("");
    setMessage("");
    setShowResend(false);
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
            NORMAL LOGIN SCREEN
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
                  setEmail(e.target.value);
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
                  setPassword(e.target.value);
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


            {/* SUCCESS */}

            {message && (

              <div className="auth-success">
                ✅ {message}
              </div>

            )}


            {/* =================================================
                NORMAL LOGIN BUTTON
            ================================================= */}

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >

              {loading
                ? "Checking..."
                : "Login →"}

            </button>


            {/* =================================================
                DIVIDER
            ================================================= */}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                margin: "20px 0",
                color: "#888",
              }}
            >

              <div
                style={{
                  flex: 1,
                  height: "1px",
                  background: "#ddd",
                }}
              />

              <span>
                OR
              </span>

              <div
                style={{
                  flex: 1,
                  height: "1px",
                  background: "#ddd",
                }}
              />

            </div>


            {/* =================================================
                LOGIN WITH OTP BUTTON
            ================================================= */}

            <button
              type="button"
              className="auth-submit"
              onClick={handleOpenOTPLogin}
              disabled={loading}
              style={{
                background: "transparent",
                color: "inherit",
                border: "1px solid currentColor",
              }}
            >

              Login with OTP

            </button>

          </form>

        )}


        {/* =================================================
            OTP LOGIN SCREEN
        ================================================= */}

        {otpMode && (

          <div>

            {/* =================================================
                OTP HEADER
            ================================================= */}

            <div
              style={{
                marginBottom: "20px",
                textAlign: "center",
              }}
            >

              <h2>
                Login with OTP
              </h2>

              <p>
                Enter your email to receive a
                6-digit OTP.
              </p>

            </div>


            {/* =================================================
                EMAIL
            ================================================= */}

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
                  setMessage("");
                  setOtpSent(false);
                  setOtp("");
                }}
                disabled={otpSent}
              />

            </div>


            {/* =================================================
                SEND OTP BUTTON
            ================================================= */}

            {!otpSent && (

              <button
                type="button"
                className="auth-submit"
                onClick={handleSendOTP}
                disabled={otpLoading}
              >

                {otpLoading
                  ? "Sending OTP..."
                  : "Send OTP →"}

              </button>

            )}


            {/* =================================================
                OTP SENT MESSAGE
            ================================================= */}

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


            {/* =================================================
                OTP INPUT
            ================================================= */}

            {otpSent && (

              <>

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
                      setMessage("");

                    }}
                  />

                </div>


                {/* =================================================
                    ERROR
                ================================================= */}

                {error && (

                  <div className="auth-error">

                    ⚠️ {error}

                  </div>

                )}


                {/* =================================================
                    SUCCESS
                ================================================= */}

                {message && (

                  <div className="auth-success">

                    ✅ {message}

                  </div>

                )}


                {/* =================================================
                    VERIFY OTP
                ================================================= */}

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


                {/* =================================================
                    RESEND OTP
                ================================================= */}

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

              </>

            )}


            {/* =================================================
                BACK TO NORMAL LOGIN
            ================================================= */}

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