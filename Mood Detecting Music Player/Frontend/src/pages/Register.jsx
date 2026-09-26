
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  updateProfile
} from "firebase/auth";

import { auth } from "../services/firebase";

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

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setOtpLoading(true);

      const response = await fetch("http://localhost:5000/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email,
          type: "register"
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send OTP.");
      }

      setOtpSent(true);
      setOtp("");
      setMessage("OTP sent successfully. Please check your email inbox.");
    } catch (error) {
      console.error("Send OTP Error:", error);
      setError(
        error.message ||
          "Unable to send OTP. Make sure the OTP server is running."
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

    if (!enteredOTP) {
      setError("Please enter the 6-digit OTP.");
      return;
    }

    if (!/^\d{6}$/.test(enteredOTP)) {
      setError("OTP must contain exactly 6 digits.");
      return;
    }

    try {
      setOtpLoading(true);

      const response = await fetch("http://localhost:5000/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email,
          otp: enteredOTP
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "OTP verification failed.");
      }

      setOtpVerified(true);
      setMessage("✅ OTP verified successfully! Now set your password below to create your account.");
    } catch (error) {
      console.error("Verify OTP Error:", error);
      setError(error.message || "Invalid OTP.");
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

    if (!name || !email || !form.password || !form.confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!otpVerified) {
      setError("Please verify the OTP sent to your email before creating your account.");
      return;
    }

    try {
      setLoading(true);

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        form.password
      );

      const user = userCredential.user;

      if (name) {
        try {
          await updateProfile(user, { displayName: name });
        } catch (profileErr) {
          console.log("Setting display name failed:", profileErr);
        }
      }

      await sendEmailVerification(user);

      // Sync registration record
      fetch("http://localhost:8000/auth/register-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name })
      }).catch(() => {});

      localStorage.setItem("moodifyRegistered_" + email, "true");
      localStorage.setItem("moodifyUserName", name);
      localStorage.setItem("moodifyEmail", email);
      localStorage.setItem("moodifyUser", JSON.stringify({ name, email }));

      localStorage.removeItem("moodifyLoggedIn");
      localStorage.removeItem("moodifyIdToken");

      await signOut(auth);

      alert(
        "Account created successfully!\n\n" +
          "A Firebase verification email link has been sent to:\n" +
          email +
          "\n\n" +
          "Please check your email, click the verification link once, and then log in."
      );

      navigate("/login");
    } catch (error) {
      console.error("Registration Error:", error);

      if (error.code === "auth/email-already-in-use") {
        setError("This email is already registered. Please login instead.");
      } else if (error.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (error.code === "auth/weak-password") {
        setError("Password must contain at least 6 characters.");
      } else if (error.code === "auth/too-many-requests") {
        setError("Too many requests. Please try again later.");
      } else if (error.code === "auth/network-request-failed") {
        setError("Network error. Please check your internet connection.");
      } else {
        setError(error.message || "Registration failed. Please try again.");
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
      <div className="auth-card glass">
        {/* LOGO */}
        <div className="auth-logo">
          <div className="auth-logo-icon">♫</div>
          <span>Moodify</span>
        </div>

        {/* HEADER */}
        <div className="auth-header">
          <span className="auth-badge">✨ JOIN MOODIFY</span>
          <h1>Create your account</h1>
          <p>Start your personalized music journey.</p>
        </div>

        {/* FORM */}
        <form onSubmit={handleRegister}>
          {/* NAME */}
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              placeholder="Enter your full name"
              value={form.name}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          {/* EMAIL */}
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              disabled={otpVerified || loading}
              required
            />
          </div>

          {/* SEND OTP BUTTON */}
          {!otpVerified && (
            <button
              type="button"
              className="auth-submit"
              onClick={handleSendOTP}
              disabled={otpLoading || loading}
              style={{ marginBottom: "15px" }}
            >
              {otpLoading ? "Sending OTP..." : otpSent ? "Resend OTP" : "Send OTP"}
            </button>
          )}

          {/* ENTER OTP SECTION */}
          {otpSent && !otpVerified && (
            <div className="form-group">
              <label>Enter 6-digit OTP</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  setOtp(value);
                  setError("");
                  setMessage("");
                }}
                disabled={otpLoading || loading}
              />

              <button
                type="button"
                className="auth-submit"
                onClick={handleVerifyOTP}
                disabled={otpLoading || loading || otp.length !== 6}
                style={{ marginTop: "10px" }}
              >
                {otpLoading ? "Verifying..." : "Verify OTP →"}
              </button>
            </div>
          )}

          {/* OTP VERIFIED BADGE */}
          {otpVerified && (
            <div
              style={{
                padding: "10px",
                marginBottom: "15px",
                borderRadius: "8px",
                background: "rgba(34, 197, 94, 0.15)",
                border: "1px solid rgba(34, 197, 94, 0.3)",
                color: "#4ade80",
                textAlign: "center",
                fontWeight: "600"
              }}
            >
              ✅ OTP Verified Successfully
            </div>
          )}

          {/* PASSWORD SECTION (UNLOCKED ONLY AFTER OTP VERIFIED) */}
          {otpVerified && (
            <>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  placeholder="Create a password"
                  value={form.password}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>

              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>
            </>
          )}

          {/* ERROR */}
          {error && (
            <div className="auth-error">
              ⚠️ {error}
              {error.includes("already registered") && (
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  style={{
                    display: "block",
                    marginTop: "10px",
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    background: "rgba(139, 92, 246, 0.3)",
                    border: "1px solid rgba(139, 92, 246, 0.5)",
                    color: "#fff",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  Go to Login →
                </button>
              )}
            </div>
          )}

          {/* SUCCESS MESSAGE */}
          {message && !error && (
            <div style={{ marginBottom: "15px", color: "#4ade80", fontSize: "14px" }}>
              {message}
            </div>
          )}

          {/* CREATE ACCOUNT SUBMIT BUTTON */}
          <button
            type="submit"
            className="auth-submit"
            disabled={loading || !otpVerified}
          >
            {loading ? "Creating Account..." : "Create My Account →"}
          </button>
        </form>

        {/* LOGIN LINK */}
        <div className="auth-switch">
          <span>Already have an account?</span>
          <button type="button" onClick={() => navigate("/login")}>
            Login
          </button>
        </div>
      </div>
    </div>
  );
}



