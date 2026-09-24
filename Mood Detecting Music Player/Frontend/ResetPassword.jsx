import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";
import { auth } from "./firebase";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const oobCode = searchParams.get("oobCode");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!oobCode) {
      // If user comes from email link where password was already set:
      navigate("/login", {
        replace: true,
        state: {
          message: "Password changed successfully! You can login now."
        }
      });
      return;
    }

    // Verify code on mount
    verifyPasswordResetCode(auth, oobCode)
      .then(() => {
        setVerifying(false);
      })
      .catch((err) => {
        console.warn("Reset code already used or expired:", err.message);
        // Code already consumed or invalid -> take user directly to Login page with success notice
        navigate("/login", {
          replace: true,
          state: {
            message: "Password changed successfully! You can login now."
          }
        });
      });
  }, [oobCode, navigate]);

  const handleResetPassword = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!password || !confirmPassword) {
      setError("Please fill in both password fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      await confirmPasswordReset(auth, oobCode, password);

      // Redirect immediately to login with success message state
      navigate("/login", {
        replace: true,
        state: {
          message: "Password changed successfully! You can login now."
        }
      });
    } catch (err) {
      console.error("Confirm password reset error:", err);
      if (err.code === "auth/invalid-action-code") {
        setError("This reset link has expired or has already been used.");
      } else if (err.code === "auth/weak-password") {
        setError("Password must contain at least 6 characters.");
      } else {
        setError(err.message || "Failed to reset password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
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
            Reset Your
            <br />
            <span className="gradient-text">Password</span>
          </h1>
          <p>Set a new secure password for your Moodify account.</p>
        </div>
      </div>

      <div className="auth-box glass">
        <div style={{ fontSize: "50px", marginBottom: "15px" }}>🔑</div>
        <h2>Create New Password</h2>
        <p className="auth-subtitle">Enter your new password below.</p>

        {verifying ? (
          <div style={{ textAlign: "center", padding: "20px 0", color: "#8b5cf6" }}>
            Verifying reset link...
          </div>
        ) : (
          <form onSubmit={handleResetPassword}>
            <div className="form-group">
              <label>New Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                disabled={loading || Boolean(error && !oobCode)}
                required
              />
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError("");
                }}
                disabled={loading || Boolean(error && !oobCode)}
                required
              />
            </div>

            {error && <div className="auth-error">⚠️ {error}</div>}

            <button
              type="submit"
              className="auth-submit"
              disabled={loading || Boolean(error && !oobCode)}
              style={{ marginTop: "15px" }}
            >
              {loading ? "Updating..." : "Reset Password & Login →"}
            </button>
          </form>
        )}

        <div className="auth-bottom" style={{ marginTop: "20px" }}>
          <Link to="/login">← Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
