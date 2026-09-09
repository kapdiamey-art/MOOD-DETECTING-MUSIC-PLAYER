import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";


export default function Profile() {

  const navigate = useNavigate();


  const [user, setUser] = useState(() => {
    const email = localStorage.getItem("moodifyEmail") || "";
    const name = localStorage.getItem("moodifyUserName") || (email ? email.split("@")[0] : "User");
    return { name, email, favorite_genre: [], favorite_mood: "" };
  });

  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("moodifyToken");
    if (!token) return;
    fetch("http://localhost:8000/auth/me", {
      headers: { "Authorization": `Bearer ${token}` }
    })
    .then(r => r.json())
    .then(data => {
      if (data && (data.email || data.name)) {
        const localName = localStorage.getItem("moodifyUserName");
        const isEmailPrefix = data.name && data.email && data.name.toLowerCase() === data.email.split("@")[0].toLowerCase();
        const resolvedName = (localName && isEmailPrefix) ? localName : (data.name || localName || "User");
        setUser(prev => ({
          ...prev,
          name: resolvedName,
          email: data.email || prev.email,
          favorite_genre: data.favorite_genre || [],
          favorite_mood: data.favorite_mood || ""
        }));
      }
    })
    .catch(err => console.log(err));
  }, []);

  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    setSaving(true);
    const token = localStorage.getItem("moodifyToken");
    if (token) {
      try {
        await fetch("http://localhost:8000/auth/me", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ name: trimmed })
        });
      } catch (err) {
        console.error("Save profile error:", err);
      }
    }
    setUser(prev => ({ ...prev, name: trimmed }));
    localStorage.setItem("moodifyUserName", trimmed);
    localStorage.setItem("moodifyUser", JSON.stringify({ name: trimmed, email: user.email }));
    setSaving(false);
    setIsEditing(false);
  };


  const userName    = user.name;
  const userEmail   = user.email;
  const userInitial = userName.charAt(0).toUpperCase();

  // Format genre list from array → "Pop • Lo-fi" style
  const genreDisplay = Array.isArray(user.favorite_genre) && user.favorite_genre.length > 0
    ? user.favorite_genre.join(" • ")
    : "Not set";

  const moodDisplay = user.favorite_mood || "Not set";

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
    navigate("/login");
  };


  return (

    <div className="profile-page">


      <div className="page-title">

        Your Profile 👤

      </div>


      <p className="page-description">

        Manage your Moodify account and
        personalize your music experience.

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
            <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "8px 0" }}>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Enter your name"
                autoFocus
                style={{
                  padding: "8px 14px",
                  borderRadius: "10px",
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(139, 92, 246, 0.5)",
                  color: "#fff",
                  fontSize: "1.2rem",
                  fontWeight: "700",
                  outline: "none"
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveName();
                  if (e.key === "Escape") setIsEditing(false);
                }}
              />
              <button
                onClick={handleSaveName}
                disabled={saving}
                style={{
                  padding: "8px 16px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
                  color: "#fff",
                  border: "none",
                  fontWeight: "700",
                  cursor: "pointer"
                }}
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                style={{
                  padding: "8px 14px",
                  borderRadius: "10px",
                  background: "rgba(255, 255, 255, 0.1)",
                  color: "#aaa",
                  border: "none",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <h1>
              {userName}
            </h1>
          )}

          <p>
            {userEmail}
          </p>

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


        <div className="profile-section glass">

          <h2>
            Personal Information
          </h2>


          <div className="profile-field">

            <span>
              Full Name
            </span>

            <strong>
              {userName}
            </strong>

          </div>


          <div className="profile-field">

            <span>
              Email
            </span>

            <strong>
              {userEmail}
            </strong>

          </div>


        </div>


        <div className="profile-section glass">

          <h2>
            Your Music Profile
          </h2>


          <div className="profile-preference">

            <span>
              🎵 Favorite Genre
            </span>

            <strong>
              {genreDisplay}
            </strong>

          </div>


          <div className="profile-preference">

            <span>
              😌 Favorite Mood
            </span>

            <strong>
              {moodDisplay}
            </strong>

          </div>


        </div>


      </div>


      {/* SETTINGS */}

      <div className="profile-section glass">

        <h2>
          Account Settings
        </h2>


        <div className="settings-list">


          <button>
            🔒
            <span>
              Change Password
            </span>

            <b>
              →
            </b>
          </button>


          <button>
            🎵
            <span>
              Music Preferences
            </span>

            <b>
              →
            </b>
          </button>


          <button>
            🔔
            <span>
              Notifications
            </span>

            <b>
              →
            </b>
          </button>


          <button>
            🛡️
            <span>
              Privacy & Security
            </span>

            <b>
              →
            </b>
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