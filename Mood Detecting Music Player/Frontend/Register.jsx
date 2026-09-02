import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut
} from "firebase/auth";

import { auth } from "./firebase";

export default function Register() {
  const navigate = useNavigate();

  // =====================================================
  // FORM STATES
  // =====================================================

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  // =====================================================
  // OTP STATES
  // =====================================================

  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  // =====================================================
  // GENERAL STATES
  // =====================================================

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  // =====================================================
  // HANDLE INPUT
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value
    }));

    setError("");
    setMessage("");
  };

  // =====================================================
  // EMAIL VALIDATION
  // =====================================================

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return emailRegex.test(email);
  };

  // =====================================================
  // SEND BREVO OTP
  // =====================================================

  const handleSendOTP = async () => {
    setError("");
    setMessage("");

    const email = form.email.trim().toLowerCase();

    // Check email
    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    // Validate email
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setOtpLoading(true);

      const response = await fetch(
        "http://localhost:5000/send-otp",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            email: email
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to send OTP."
        );
      }

      // OTP sent successfully
      setOtpSent(true);
      setOtp("");

      setMessage(
        "OTP sent successfully. Check your email."
      );

    } catch (error) {
      console.error(
        "Send OTP Error:",
        error
      );

      setError(
        error.message ||
        "Unable to send OTP. Make sure the backend is running."
      );

    } finally {
      setOtpLoading(false);
    }
  };

  // =====================================================
  // VERIFY BREVO OTP
  // =====================================================

  const handleVerifyOTP = async () => {
    setError("");
    setMessage("");

    const email = form.email.trim().toLowerCase();
    const enteredOTP = otp.trim();

    // Check OTP
    if (!enteredOTP) {
      setError("Please enter the OTP.");
      return;
    }

    // Check OTP format
    if (!/^\d{6}$/.test(enteredOTP)) {
      setError(
        "OTP must contain exactly 6 digits."
      );
      return;
    }

    try {
      setOtpLoading(true);

      const response = await fetch(
        "http://localhost:5000/verify-otp",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            email: email,
            otp: enteredOTP
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "OTP verification failed."
        );
      }

      // =================================================
      // OTP VERIFIED
      // =================================================

      setOtpVerified(true);

      setMessage(
        "OTP verified successfully! You can now create your account."
      );

    } catch (error) {
      console.error(
        "Verify OTP Error:",
        error
      );

      setError(
        error.message ||
        "Invalid OTP."
      );

    } finally {
      setOtpLoading(false);
    }
  };

  // =====================================================
  // REGISTER USER
  // =====================================================

  const handleRegister = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();

    // =================================================
    // CHECK ALL FIELDS
    // =================================================

    if (
      !name ||
      !email ||
      !form.password ||
      !form.confirmPassword
    ) {
      setError("Please fill in all fields.");
      return;
    }

    // =================================================
    // EMAIL VALIDATION
    // =================================================

    if (!isValidEmail(email)) {
      setError(
        "Please enter a valid email address."
      );
      return;
    }

    // =================================================
    // PASSWORD LENGTH
    // =================================================

    if (form.password.length < 6) {
      setError(
        "Password must contain at least 6 characters."
      );
      return;
    }

    // =================================================
    // PASSWORD MATCH
    // =================================================

    if (
      form.password !==
      form.confirmPassword
    ) {
      setError(
        "Passwords do not match."
      );
      return;
    }

    // =================================================
    // OTP MUST BE VERIFIED
    // =================================================

    if (!otpVerified) {
      setError(
        "Please verify the OTP before creating your account."
      );
      return;
    }

    try {
      setLoading(true);

      // =================================================
      // STEP 1
      // CREATE FIREBASE ACCOUNT
      // =================================================

      console.log(
        "Creating Firebase account..."
      );

      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          email,
          form.password
        );

      const user =
        userCredential.user;

      console.log(
        "Firebase account created:",
        user.email
      );

      // =================================================
      // STEP 2
      // SEND FIREBASE EMAIL VERIFICATION
      // =================================================

      console.log(
        "Sending Firebase verification email..."
      );

      await sendEmailVerification(user);

      console.log(
        "Firebase verification email sent."
      );

      // =================================================
      // STEP 3
      // SAVE USER INFORMATION
      // =================================================

      localStorage.setItem(
        "moodifyUserName",
        name
      );

      localStorage.setItem(
        "moodifyEmail",
        email
      );

      // User is NOT logged in yet
      localStorage.removeItem(
        "moodifyLoggedIn"
      );

      localStorage.removeItem(
        "moodifyIdToken"
      );

      // =================================================
      // STEP 4
      // SIGN OUT FIREBASE USER
      // =================================================

      /*
        createUserWithEmailAndPassword()
        automatically signs the user in.

        But your required flow is:

        Register
          ↓
        Verification email
          ↓
        User verifies email
          ↓
        Login

        Therefore we sign them out here.
      */

      await signOut(auth);

      console.log(
        "Firebase user signed out after registration."
      );

      // =================================================
      // STEP 5
      // SUCCESS MESSAGE
      // =================================================

      alert(
        "Account created successfully!\n\n" +
        "A Firebase verification email has been sent to:\n" +
        email +
        "\n\n" +
        "Please open the NEWEST verification email, " +
        "click the verification link once, and then login."
      );

      // =================================================
      // GO TO LOGIN
      // =================================================

      navigate("/login");

    } catch (error) {
      console.error(
        "Registration Error:",
        error
      );

      // =================================================
      // FIREBASE ERRORS
      // =================================================

      if (
        error.code ===
        "auth/email-already-in-use"
      ) {
        setError(
          "This email is already registered. Please login instead."
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
        "auth/weak-password"
      ) {
        setError(
          "Password must contain at least 6 characters."
        );

      } else if (
        error.code ===
        "auth/too-many-requests"
      ) {
        setError(
          "Too many requests. Please try again later."
        );

      } else if (
        error.code ===
        "auth/network-request-failed"
      ) {
        setError(
          "Network error. Please check your internet connection."
        );

      } else {
        setError(
          error.message ||
          "Registration failed. Please try again."
        );
      }

    } finally {
      setLoading(false);
    }
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
            ✨ JOIN MOODIFY
          </span>

          <h1>
            Create your account
          </h1>

          <p>
            Start your personalized music journey.
          </p>

        </div>

        {/* =================================================
            FORM
        ================================================= */}

        <form onSubmit={handleRegister}>

          {/* =================================================
              NAME
          ================================================= */}

          <div className="form-group">

            <label>
              Full Name
            </label>

            <input
              type="text"
              name="name"
              placeholder="Enter your full name"
              value={form.name}
              onChange={handleChange}
              disabled={loading}
            />

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
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              disabled={
                otpVerified ||
                loading
              }
            />

          </div>

          {/* =================================================
              SEND OTP
          ================================================= */}

          {!otpVerified && (
            <button
              type="button"
              className="auth-submit"
              onClick={handleSendOTP}
              disabled={otpLoading || loading}
              style={{
                marginBottom: "15px"
              }}
            >

              {otpLoading
                ? "Sending OTP..."
                : otpSent
                ? "Resend OTP"
                : "Send OTP"}

            </button>
          )}

          {/* =================================================
              ENTER OTP
          ================================================= */}

          {otpSent &&
            !otpVerified && (
              <div className="form-group">

                <label>
                  Enter OTP
                </label>

                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
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
                  disabled={
                    otpLoading ||
                    loading
                  }
                />

                <button
                  type="button"
                  className="auth-submit"
                  onClick={
                    handleVerifyOTP
                  }
                  disabled={
                    otpLoading ||
                    loading
                  }
                  style={{
                    marginTop: "10px"
                  }}
                >

                  {otpLoading
                    ? "Verifying..."
                    : "Verify OTP →"}

                </button>

              </div>
            )}

          {/* =================================================
              OTP VERIFIED
          ================================================= */}

          {otpVerified && (
            <div
              style={{
                padding: "10px",
                marginBottom: "15px",
                borderRadius: "8px",
                background: "#e8f7ee",
                color: "#16803c",
                textAlign: "center",
                fontWeight: "500"
              }}
            >
              ✅ OTP verified successfully
            </div>
          )}

  {/* =================================================
    PASSWORD SECTION
    SHOW ONLY AFTER OTP IS VERIFIED
================================================= */}

{otpVerified && (
  <>
    <div className="form-group">
      <label>
        Password
      </label>

      <input
        type="password"
        name="password"
        placeholder="Create a password"
        value={form.password}
        onChange={handleChange}
        disabled={loading}
      />
    </div>

    <div className="form-group">
      <label>
        Confirm Password
      </label>

      <input
        type="password"
        name="confirmPassword"
        placeholder="Confirm your password"
        value={form.confirmPassword}
        onChange={handleChange}
        disabled={loading}
      />
    </div>
  </>
)}

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div className="auth-error">
              ⚠️ {error}
            </div>
          )}

          {/* =================================================
              SUCCESS MESSAGE
          ================================================= */}

          {message && !error && (
            <div
              style={{
                marginBottom: "15px",
                color: "#16803c"
              }}
            >
              {message}
            </div>
          )}

          {/* =================================================
              CREATE ACCOUNT
          ================================================= */}

          <button
            type="submit"
            className="auth-submit"
            disabled={
              loading ||
              !otpVerified
            }
          >

            {loading
              ? "Creating Account..."
              : "Create My Account →"}

          </button>

        </form>

        {/* =================================================
            LOGIN LINK
        ================================================= */}

        <div className="auth-switch">

          <span>
            Already have an account?
          </span>

          <button
            type="button"
            onClick={() =>
              navigate("/login")
            }
          >
            Login
          </button>

        </div>

      </div>

    </div>
  );
}