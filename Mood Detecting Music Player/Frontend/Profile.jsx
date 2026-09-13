import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:8000";

export default function Profile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    const email = localStorage.getItem("moodifyEmail") || "";

    const savedName =
      localStorage.getItem("moodifyUserName") ||
      (email ? email.split("@")[0] : "User");

    return {
      name: savedName,
      email: email,
      favorite_genre: [],
      favorite_mood: "",
    };
  });

  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // ============================================================
  // LOAD PROFILE
  // ============================================================

  useEffect(() => {
    const loadProfile = async () => {
      const token = localStorage.getItem("moodifyToken");

      console.log("=================================");
      console.log("PROFILE: Loading user profile");
      console.log("Token exists:", !!token);
      console.log("=================================");

      if (!token) {
        console.warn("No moodifyToken found.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API}/auth/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        console.log("Profile response status:", response.status);

        const data = await response.json();

        console.log("Profile response:", data);

        if (!response.ok) {
          console.error("Failed to load profile:", data);
          setLoading(false);
          return;
        }

        const localName =
          localStorage.getItem("moodifyUserName") || "";

        const email =
          data.email ||
          localStorage.getItem("moodifyEmail") ||
          "";

        const backendName = data.name || "";

        let resolvedName = backendName;

        const isEmailPrefix =
          backendName &&
          email &&
          backendName.toLowerCase() ===
            email.split("@")[0].toLowerCase();

        if (localName && isEmailPrefix) {
          resolvedName = localName;
        }

        if (!resolvedName) {
          resolvedName =
            localName ||
            (email ? email.split("@")[0] : "User");
        }

        // ========================================================
        // FAVORITE GENRE
        // ========================================================

        let favoriteGenre = [];

        if (Array.isArray(data.favorite_genre)) {
          favoriteGenre = data.favorite_genre;
        } else if (typeof data.favorite_genre === "string") {
          favoriteGenre = [data.favorite_genre];
        }

        // ========================================================
        // FAVORITE MOOD
        // ========================================================

        const favoriteMood = data.favorite_mood || "";

        console.log("Favorite Genre:", favoriteGenre);
        console.log("Favorite Mood:", favoriteMood);

        // ========================================================
        // UPDATE STATE
        // ========================================================

        setUser({
          name: resolvedName,
          email: email,
          favorite_genre: favoriteGenre,
          favorite_mood: favoriteMood,
        });

        // ========================================================
        // LOCAL STORAGE
        // ========================================================

        localStorage.setItem(
          "moodifyUserName",
          resolvedName
        );

        localStorage.setItem(
          "moodifyEmail",
          email
        );

        localStorage.setItem(
          "moodifyUser",
          JSON.stringify({
            name: resolvedName,
            email: email,
          })
        );

        console.log("Profile loaded successfully");
      } catch (error) {
        console.error("Profile loading error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  // ============================================================
  // SAVE NAME
  // ============================================================

  const handleSaveName = async () => {
    const trimmed = nameInput.trim();

    if (!trimmed) {
      alert("Please enter your name.");
      return;
    }

    setSaving(true);

    const token = localStorage.getItem("moodifyToken");

    try {
      if (token) {
        const response = await fetch(`${API}/auth/me`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: trimmed,
          }),
        });

        const data = await response.json();

        console.log(
          "Save profile response:",
          response.status,
          data
        );

        if (!response.ok) {
          throw new Error(
            data.detail || "Failed to update profile"
          );
        }

        console.log("Name saved to MongoDB");
      }

      setUser((prev) => ({
        ...prev,
        name: trimmed,
      }));

      localStorage.setItem(
        "moodifyUserName",
        trimmed
      );

      localStorage.setItem(
        "moodifyUser",
        JSON.stringify({
          name: trimmed,
          email: user.email,
        })
      );

      setIsEditing(false);

      alert("Name updated successfully!");
    } catch (error) {
      console.error("Save profile error:", error);

      alert(
        "Unable to save your name. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // LOGOUT
  // ============================================================

  const logout = () => {
    localStorage.removeItem("moodifyToken");
    localStorage.removeItem("moodifyLoggedIn");
    localStorage.removeItem("moodifyUser");
    localStorage.removeItem("moodifyUserName");
    localStorage.removeItem("moodifyEmail");
    localStorage.removeItem("moodifyLoginMethod");

    localStorage.removeItem("moodify_mood");
    localStorage.removeItem("moodify_recommendations");
    localStorage.removeItem("moodify_current_track");

    localStorage.removeItem("moodifyFavoriteGenre");
    localStorage.removeItem("moodifyFavoriteMood");

    navigate("/login");
  };

  // ============================================================
  // DISPLAY VALUES
  // ============================================================

  const userName = user.name || "User";
  const userEmail = user.email || "No email";

  const userInitial =
    userName.charAt(0).toUpperCase();

  const genreDisplay =
    Array.isArray(user.favorite_genre) &&
    user.favorite_genre.length > 0
      ? user.favorite_genre.join(" • ")
      : "Not set";

  const moodDisplay =
    user.favorite_mood || "Not set";

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="profile-page">
        <div
          className="glass"
          style={{
            padding: "40px",
            textAlign: "center",
          }}
        >
          <h2>Loading your profile...</h2>
        </div>
      </div>
    );
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="profile-page">

      <div className="page-title">
        Your Profile 👤
      </div>

      <p className="page-description">
        Manage your Moodify account and personalize your
        music experience.
      </p>

      {/* PROFILE HEADER */}

      <div className="profile-card glass">

        <div className="profile-avatar-large">
          {userInitial}
        </div>

        <div className="profile-main-info">

          <div className="profile-member">
            ✨ MOODIFY MEMBER
          </div>

          {isEditing ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                margin: "8px 0",
                flexWrap: "wrap",
              }}
            >

              <input
                type="text"
                value={nameInput}
                onChange={(e) =>
                  setNameInput(e.target.value)
                }
                placeholder="Enter your name"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSaveName();
                  }

                  if (e.key === "Escape") {
                    setIsEditing(false);
                  }
                }}
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.1)",
                  border:
                    "1px solid rgba(139,92,246,0.5)",
                  color: "#fff",
                  fontSize: "1.1rem",
                  fontWeight: "700",
                  outline: "none",
                }}
              />

              <button
                onClick={handleSaveName}
                disabled={saving}
                style={{
                  padding: "10px 16px",
                  borderRadius: "10px",
                  background:
                    "linear-gradient(135deg,#8b5cf6,#ec4899)",
                  color: "#fff",
                  border: "none",
                  fontWeight: "700",
                  cursor: saving
                    ? "not-allowed"
                    : "pointer",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? "Saving..." : "Save"}
              </button>

              <button
                onClick={() => {
                  setIsEditing(false);
                  setNameInput("");
                }}
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  background:
                    "rgba(255,255,255,0.1)",
                  color: "#aaa",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>

            </div>
          ) : (
            <h1>{userName}</h1>
          )}

          <p>{userEmail}</p>

          <div className="profile-status">
            ● Account Active
          </div>

        </div>

        {!isEditing && (
          <button
            className="profile-edit-btn"
            onClick={() => {
              setNameInput(userName);
              setIsEditing(true);
            }}
          >
            ✨ Edit Name
          </button>
        )}

      </div>

      {/* DETAILS */}

      <div className="profile-grid">

        {/* PERSONAL INFORMATION */}

        <div className="profile-section glass">

          <h2>Personal Information</h2>

          <div className="profile-field">
            <span>Full Name</span>
            <strong>{userName}</strong>
          </div>

          <div className="profile-field">
            <span>Email</span>
            <strong>{userEmail}</strong>
          </div>

        </div>

        {/* MUSIC PROFILE */}

        <div className="profile-section glass">

          <h2>Your Music Profile</h2>

          <div className="profile-preference">

            <span>🎵 Favorite Genre</span>

            <strong>
              {genreDisplay}
            </strong>

          </div>

          <div className="profile-preference">

            <span>😌 Favorite Mood</span>

            <strong>
              {moodDisplay}
            </strong>

          </div>

        </div>

      </div>

      {/* ACCOUNT SETTINGS */}

      <div className="profile-section glass">

        <h2>Account Settings</h2>

        <div className="settings-list">

          <button
            onClick={() =>
              alert(
                "Password is managed securely by Firebase. Use Forgot Password from the Login page."
              )
            }
          >
            🔒
            <span>Change Password</span>
            <b>→</b>
          </button>

          <button
            onClick={() =>
              alert(
                "Music preferences will be available here."
              )
            }
          >
            🎵
            <span>Music Preferences</span>
            <b>→</b>
          </button>

          <button
            onClick={() =>
              alert(
                "Notification settings will be available here."
              )
            }
          >
            🔔
            <span>Notifications</span>
            <b>→</b>
          </button>

          <button
            onClick={() =>
              alert(
                "Your account authentication is protected by Firebase."
              )
            }
          >
            🛡️
            <span>Privacy & Security</span>
            <b>→</b>
          </button>

        </div>

      </div>

      {/* LOGOUT */}

      <button
        className="profile-logout"
        onClick={logout}
      >
        🚪 Logout from Moodify
      </button>

    </div>
  );
}