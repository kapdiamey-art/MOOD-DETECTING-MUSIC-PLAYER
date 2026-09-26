import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import {
  signInWithEmailAndPassword,
  sendEmailVerification,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  getAdditionalUserInfo,
  signOut
} from "firebase/auth";

import { auth } from "../services/firebase";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  // =====================================================
  // STATES
  // =====================================================

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showResend, setShowResend] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (location.state?.message) {
      setMessage(location.state.message);
    } else if (params.get("mode") === "resetPassword") {
      setMessage("Password changed successfully! You can login now.");
    }
  }, [location.search, location.state]);

  // =====================================================
  // EMAIL VALIDATION
  // =====================================================

  const isValidEmail = (value) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  // =====================================================
  // SAVE FIREBASE SESSION
  // =====================================================

  const saveFirebaseSession = async (user, cleanEmail) => {
    const firebaseToken = await user.getIdToken(true);

    if (!firebaseToken) {
      throw new Error("Firebase authentication token was not created.");
    }

    const savedName =
      user.displayName ||
      localStorage.getItem("moodifyUserName") ||
      cleanEmail.split("@")[0];

    localStorage.setItem("moodifyToken", firebaseToken);
    localStorage.setItem("moodifyLoggedIn", "true");
    localStorage.setItem("moodifyEmail", cleanEmail);
    localStorage.setItem("moodifyUserName", savedName);
    localStorage.setItem(
      "moodifyUser",
      JSON.stringify({
        name: savedName,
        email: cleanEmail,
      })
    );
    localStorage.setItem("moodifyLoginMethod", "password");

    return firebaseToken;
  };

  // =====================================================
  // GOOGLE SSO LOGIN
  // =====================================================
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      await saveFirebaseSession(user, user.email || "");
      setMessage("Google sign-in successful! Redirecting...");
      setTimeout(() => navigate("/mood"), 500);
    } catch (err) {
      console.error("Google SSO error:", err);
      if (err.code !== "auth/popup-closed-by-user") {
        setError("Google authentication failed: " + (err.message || "Please try again."));
      }
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // MICROSOFT SSO LOGIN
  // =====================================================
  const handleMicrosoftLogin = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");
      const provider = new OAuthProvider("microsoft.com");
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      await saveFirebaseSession(user, user.email || "");
      setMessage("Microsoft sign-in successful! Redirecting...");
      setTimeout(() => navigate("/mood"), 500);
    } catch (err) {
      console.error("Microsoft SSO error:", err);
      if (err.code !== "auth/popup-closed-by-user") {
        setError("Microsoft authentication failed: " + (err.message || "Please try again."));
      }
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // NORMAL LOGIN
  // =====================================================

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");
    setShowResend(false);

    const cleanEmail = email.trim().toLowerCase();

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

      const userCredential = await signInWithEmailAndPassword(
        auth,
        cleanEmail,
        password
      );

      const user = userCredential.user;

      if (!user.emailVerified) {
        setError("Please verify your email before continuing.");
        setShowResend(true);
        return;
      }

      await saveFirebaseSession(user, cleanEmail);

      setMessage("Login successful! Redirecting...");
      setTimeout(() => {
        navigate("/mood");
      }, 500);
    } catch (error) {
      console.error("Login error:", error);

      if (error.code === "auth/invalid-credential") {
        setError("Incorrect email or password.");
      } else if (error.code === "auth/user-not-found") {
        setError("No account found. Please register first.");
      } else if (error.code === "auth/wrong-password") {
        setError("Incorrect email or password.");
      } else if (error.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (error.code === "auth/too-many-requests") {
        setError("Too many login attempts. Please try again later.");
      } else if (error.code === "auth/user-disabled") {
        setError("This account has been disabled.");
      } else {
        setError(error.message || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // RESEND EMAIL VERIFICATION
  // =====================================================

  const handleResendVerification = async () => {
    setError("");
    setMessage("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setError("Enter your email and password first.");
      return;
    }

    try {
      setResending(true);

      const userCredential = await signInWithEmailAndPassword(
        auth,
        cleanEmail,
        password
      );

      const user = userCredential.user;

      if (user.emailVerified) {
        setMessage("Your email is already verified. Please login again.");
        setShowResend(false);
        return;
      }

      await sendEmailVerification(user);

      setMessage("Verification email sent! Check your inbox and spam folder.");
    } catch (error) {
      console.error("Resend verification error:", error);
      setError(error.message || "Could not send verification email.");
    } finally {
      setResending(false);
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
          <span className="auth-badge">🎧 WELCOME BACK</span>
          <h1>Welcome back</h1>
          <p>Your mood. Your music. Your moment.</p>
        </div>

        {/* LOGIN FORM */}
        <form onSubmit={handleLogin}>
          {/* EMAIL */}
          <div className="form-group">
            <label>Email Address</label>
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
            <label>Password</label>
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

            {/* FORGOT PASSWORD */}
            <div style={{ textAlign: "right", marginTop: "8px" }}>
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  color: "#8b5cf6",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                Forgot Password?
              </button>
            </div>
          </div>

          {/* ERROR */}
          {error && (
            <div className="auth-error">
              ⚠️ {error}
              {showResend && (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resending}
                  style={{
                    display: "block",
                    marginTop: "12px",
                    width: "100%",
                  }}
                >
                  {resending ? "Sending..." : "Resend Verification Email"}
                </button>
              )}
            </div>
          )}

          {/* SUCCESS */}
          {message && <div className="auth-success">✅ {message}</div>}

          {/* LOGIN BUTTON */}
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "Checking..." : "Login →"}
          </button>

          {/* DIVIDER */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              margin: "20px 0",
              color: "#888",
            }}
          >
            <div style={{ flex: 1, height: "1px", background: "#ddd" }} />
            <span>OR</span>
            <div style={{ flex: 1, height: "1px", background: "#ddd" }} />
          </div>

          {/* GOOGLE & MICROSOFT SSO BUTTONS */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                width: "100%",
                padding: "12px 16px",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(255,255,255,0.06)",
                color: "#fff",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Continue with Google
            </button>

            <button
              type="button"
              onClick={handleMicrosoftLogin}
              disabled={loading}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                width: "100%",
                padding: "12px 16px",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(255,255,255,0.06)",
                color: "#fff",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 23 23">
                <path fill="#f35325" d="M1 1h10v10H1z" />
                <path fill="#81bc06" d="M12 1h10v10H12z" />
                <path fill="#05a6f0" d="M1 12h10v10H1z" />
                <path fill="#ffba08" d="M12 12h10v10H12z" />
              </svg>
              Continue with Microsoft
            </button>
          </div>
        </form>

        {/* REGISTER LINK */}
        <div className="auth-switch">
          <span>Don't have an account?</span>
          <button type="button" onClick={() => navigate("/register")}>
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
}