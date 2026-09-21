import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:8000";

export default function Profile() {
  const navigate = useNavigate();

  // ============================================================
  // USER STATE
  // ============================================================

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
  // SETTINGS STATE
  // ============================================================

  const [openSetting, setOpenSetting] = useState(null);

  const [notificationsEnabled, setNotificationsEnabled] =
    useState(() => {
      const saved =
        localStorage.getItem(
          "moodifyNotificationsEnabled"
        );

      return saved !== "false";
    });

  const [selectedGenre, setSelectedGenre] = useState(() => {
    const saved =
      localStorage.getItem("moodifyFavoriteGenre");

    return saved || "";
  });

  const [selectedMood, setSelectedMood] = useState(() => {
    return (
      localStorage.getItem("moodifyFavoriteMood") || ""
    );
  });

  // ============================================================
  // LOAD PROFILE
  // ============================================================

  useEffect(() => {
    const loadProfile = async () => {
      const token =
        localStorage.getItem("moodifyToken");

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
        const response = await fetch(
          `${API}/auth/me`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        console.log(
          "Profile response status:",
          response.status
        );

        const data = await response.json();

        console.log(
          "Profile response:",
          data
        );

        if (!response.ok) {
          console.error(
            "Failed to load profile:",
            data
          );

          setLoading(false);
          return;
        }

        // ======================================================
        // NAME
        // ======================================================

        const localName =
          localStorage.getItem(
            "moodifyUserName"
          ) || "";

        const email =
          data.email ||
          localStorage.getItem(
            "moodifyEmail"
          ) ||
          "";

        const backendName =
          data.name || "";

        let resolvedName =
          backendName;

        const isEmailPrefix =
          backendName &&
          email &&
          backendName.toLowerCase() ===
            email
              .split("@")[0]
              .toLowerCase();

        if (
          localName &&
          isEmailPrefix
        ) {
          resolvedName =
            localName;
        }

        if (!resolvedName) {
          resolvedName =
            localName ||
            (email
              ? email.split("@")[0]
              : "User");
        }

        // ======================================================
        // FAVORITE GENRE
        // ======================================================

        let favoriteGenre = [];

        if (
          Array.isArray(
            data.favorite_genre
          )
        ) {
          favoriteGenre =
            data.favorite_genre;
        } else if (
          typeof data.favorite_genre ===
          "string"
        ) {
          favoriteGenre = [
            data.favorite_genre,
          ];
        }

        // ======================================================
        // FAVORITE MOOD
        // ======================================================

        const favoriteMood =
          data.favorite_mood || "";

        console.log(
          "Favorite Genre:",
          favoriteGenre
        );

        console.log(
          "Favorite Mood:",
          favoriteMood
        );

        // ======================================================
        // UPDATE STATE
        // ======================================================

        setUser({
          name: resolvedName,
          email: email,
          favorite_genre:
            favoriteGenre,
          favorite_mood:
            favoriteMood,
        });

        // ======================================================
        // UPDATE MUSIC SETTINGS
        // ======================================================

        if (
          favoriteGenre.length > 0
        ) {
          setSelectedGenre(
            favoriteGenre[0]
          );

          localStorage.setItem(
            "moodifyFavoriteGenre",
            favoriteGenre[0]
          );
        }

        if (favoriteMood) {
          setSelectedMood(
            favoriteMood
          );

          localStorage.setItem(
            "moodifyFavoriteMood",
            favoriteMood
          );
        }

        // ======================================================
        // LOCAL STORAGE
        // ======================================================

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

        console.log(
          "Profile loaded successfully"
        );
      } catch (error) {
        console.error(
          "Profile loading error:",
          error
        );
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
    const trimmed =
      nameInput.trim();

    if (!trimmed) {
      alert(
        "Please enter your name."
      );
      return;
    }

    setSaving(true);

    const token =
      localStorage.getItem(
        "moodifyToken"
      );

    try {
      if (token) {
        const response =
          await fetch(
            `${API}/auth/me`,
            {
              method: "PUT",
              headers: {
                "Content-Type":
                  "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                name: trimmed,
              }),
            }
          );

        const data =
          await response.json();

        console.log(
          "Save profile response:",
          response.status,
          data
        );

        if (!response.ok) {
          throw new Error(
            data.detail ||
              "Failed to update profile"
          );
        }

        console.log(
          "Name saved to MongoDB"
        );
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

      alert(
        "Name updated successfully!"
      );
    } catch (error) {
      console.error(
        "Save profile error:",
        error
      );

      alert(
        "Unable to save your name. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // SAVE MUSIC PREFERENCES
  // ============================================================

  const saveMusicPreferences = () => {
    localStorage.setItem(
      "moodifyFavoriteGenre",
      selectedGenre
    );

    localStorage.setItem(
      "moodifyFavoriteMood",
      selectedMood
    );

    setUser((prev) => ({
      ...prev,
      favorite_genre: selectedGenre
        ? [selectedGenre]
        : [],
      favorite_mood:
        selectedMood,
    }));

    alert(
      "Music preferences saved successfully!"
    );

    setOpenSetting(null);
  };

  // ============================================================
  // NOTIFICATION TOGGLE
  // ============================================================

  const handleNotificationToggle =
    () => {
      const newValue =
        !notificationsEnabled;

      setNotificationsEnabled(
        newValue
      );

      localStorage.setItem(
        "moodifyNotificationsEnabled",
        String(newValue)
      );
    };

  // ============================================================
  // LOGOUT
  // ============================================================

  const logout = () => {
    localStorage.removeItem(
      "moodifyToken"
    );

    localStorage.removeItem(
      "moodifyLoggedIn"
    );

    localStorage.removeItem(
      "moodifyUser"
    );

    localStorage.removeItem(
      "moodifyUserName"
    );

    localStorage.removeItem(
      "moodifyEmail"
    );

    localStorage.removeItem(
      "moodifyLoginMethod"
    );

    localStorage.removeItem(
      "moodify_mood"
    );

    localStorage.removeItem(
      "moodify_recommendations"
    );

    localStorage.removeItem(
      "moodify_current_track"
    );

    localStorage.removeItem(
      "moodifyFavoriteGenre"
    );

    localStorage.removeItem(
      "moodifyFavoriteMood"
    );

    navigate("/login");
  };

  // ============================================================
  // DISPLAY VALUES
  // ============================================================

  const userName =
    user.name || "User";

  const userEmail =
    user.email || "No email";

  const userInitial =
    userName
      .charAt(0)
      .toUpperCase();

  const genreDisplay =
    Array.isArray(
      user.favorite_genre
    ) &&
    user.favorite_genre.length > 0
      ? user.favorite_genre.join(
          " • "
        )
      : "Not set";

  const moodDisplay =
    user.favorite_mood ||
    "Not set";

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
          <h2>
            Loading your profile...
          </h2>
        </div>
      </div>
    );
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="profile-page">

      {/* PAGE TITLE */}

      <div className="page-title">
        Your Profile 👤
      </div>

      <p className="page-description">
        Manage your Moodify account and
        personalize your music experience.
      </p>

      {/* ======================================================
          PROFILE HEADER
      ====================================================== */}

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
                  setNameInput(
                    e.target.value
                  )
                }
                placeholder="Enter your name"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSaveName();
                  }

                  if (
                    e.key === "Escape"
                  ) {
                    setIsEditing(false);
                  }
                }}
                style={{
                  padding:
                    "10px 14px",
                  borderRadius:
                    "10px",
                  background:
                    "rgba(255,255,255,0.1)",
                  border:
                    "1px solid rgba(139,92,246,0.5)",
                  color: "#fff",
                  fontSize:
                    "1.1rem",
                  fontWeight: "700",
                  outline: "none",
                }}
              />

              <button
                onClick={
                  handleSaveName
                }
                disabled={saving}
                style={{
                  padding:
                    "10px 16px",
                  borderRadius:
                    "10px",
                  background:
                    "linear-gradient(135deg,#8b5cf6,#ec4899)",
                  color: "#fff",
                  border: "none",
                  fontWeight: "700",
                  cursor: saving
                    ? "not-allowed"
                    : "pointer",
                  opacity: saving
                    ? 0.7
                    : 1,
                }}
              >
                {saving
                  ? "Saving..."
                  : "Save"}
              </button>

              <button
                onClick={() => {
                  setIsEditing(false);
                  setNameInput("");
                }}
                style={{
                  padding:
                    "10px 14px",
                  borderRadius:
                    "10px",
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
              setNameInput(
                userName
              );
              setIsEditing(true);
            }}
          >
            ✨ Edit Name
          </button>
        )}

      </div>

      {/* ======================================================
          DETAILS
      ====================================================== */}

      <div className="profile-grid">

        {/* PERSONAL INFORMATION */}

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

        {/* MUSIC PROFILE */}

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

      {/* ======================================================
          ACCOUNT SETTINGS
      ====================================================== */}

      <div className="profile-section glass">

        <h2>
          Account Settings
        </h2>

        <div className="settings-list">

          {/* ==================================================
              CHANGE PASSWORD
          ================================================== */}

         <button
  onClick={() =>
    navigate("/forgot-password", {
      state: {
        from: "profile",
      },
    })
  }
>
  🔒
  <span>Change Password</span>
  <b>→</b>
</button>

          {/* ==================================================
              MUSIC PREFERENCES
          ================================================== */}

          <button
            onClick={() =>
              setOpenSetting(
                openSetting ===
                  "music"
                  ? null
                  : "music"
              )
            }
          >
            🎵
            <span>
              Music Preferences
            </span>
            <b>
              {openSetting ===
              "music"
                ? "↓"
                : "→"}
            </b>
          </button>

          {openSetting ===
            "music" && (
            <div
              style={{
                padding: "20px",
                margin:
                  "0 0 10px 0",
                borderRadius:
                  "12px",
                background:
                  "rgba(255,255,255,0.04)",
                border:
                  "1px solid rgba(255,255,255,0.08)",
              }}
            >

              <h3
                style={{
                  marginTop: 0,
                }}
              >
                🎵 Music Preferences
              </h3>

              <div
                style={{
                  marginBottom:
                    "15px",
                }}
              >
                <label
                  style={{
                    display:
                      "block",
                    marginBottom:
                      "7px",
                    color: "#aaa",
                  }}
                >
                  Favorite Genre
                </label>

                <select
                  value={
                    selectedGenre
                  }
                  onChange={(e) =>
                    setSelectedGenre(
                      e.target.value
                    )
                  }
                  style={{
                    width: "100%",
                    padding:
                      "11px",
                    borderRadius:
                      "8px",
                    background:
                      "#171522",
                    color: "#fff",
                    border:
                      "1px solid rgba(139,92,246,0.4)",
                  }}
                >
                  <option value="">
                    Select Genre
                  </option>
                  <option value="Pop">
                    Pop
                  </option>
                  <option value="Rock">
                    Rock
                  </option>
                  <option value="Hip Hop">
                    Hip Hop
                  </option>
                  <option value="Classical">
                    Classical
                  </option>
                  <option value="Jazz">
                    Jazz
                  </option>
                  <option value="Lo-fi">
                    Lo-fi
                  </option>
                  <option value="EDM">
                    EDM
                  </option>
                  <option value="R&B">
                    R&B
                  </option>
                </select>
              </div>

              <div
                style={{
                  marginBottom:
                    "15px",
                }}
              >
                <label
                  style={{
                    display:
                      "block",
                    marginBottom:
                      "7px",
                    color: "#aaa",
                  }}
                >
                  Favorite Mood
                </label>

                <select
                  value={
                    selectedMood
                  }
                  onChange={(e) =>
                    setSelectedMood(
                      e.target.value
                    )
                  }
                  style={{
                    width: "100%",
                    padding:
                      "11px",
                    borderRadius:
                      "8px",
                    background:
                      "#171522",
                    color: "#fff",
                    border:
                      "1px solid rgba(139,92,246,0.4)",
                  }}
                >
                  <option value="">
                    Select Mood
                  </option>
                  <option value="Happy">
                    Happy
                  </option>
                  <option value="Sad">
                    Sad
                  </option>
                  <option value="Relaxed">
                    Relaxed
                  </option>
                  <option value="Energetic">
                    Energetic
                  </option>
                  <option value="Calm">
                    Calm
                  </option>
                  <option value="Romantic">
                    Romantic
                  </option>
                  <option value="Focused">
                    Focused
                  </option>
                </select>
              </div>

              <button
                type="button"
                onClick={
                  saveMusicPreferences
                }
                style={{
                  padding:
                    "10px 18px",
                  borderRadius:
                    "8px",
                  border: "none",
                  background:
                    "linear-gradient(135deg,#8b5cf6,#ec4899)",
                  color: "#fff",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                Save Preferences
              </button>

            </div>
          )}

          {/* ==================================================
              NOTIFICATIONS
          ================================================== */}

          <button
            onClick={() =>
              setOpenSetting(
                openSetting ===
                  "notifications"
                  ? null
                  : "notifications"
              )
            }
          >
            🔔
            <span>
              Notifications
            </span>
            <b>
              {openSetting ===
              "notifications"
                ? "↓"
                : "→"}
            </b>
          </button>

          {openSetting ===
            "notifications" && (
            <div
              style={{
                padding: "20px",
                margin:
                  "0 0 10px 0",
                borderRadius:
                  "12px",
                background:
                  "rgba(255,255,255,0.04)",
                border:
                  "1px solid rgba(255,255,255,0.08)",
              }}
            >

              <h3
                style={{
                  marginTop: 0,
                }}
              >
                🔔 Notification Settings
              </h3>

              <div
                style={{
                  display:
                    "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "space-between",
                  gap: "20px",
                }}
              >

                <div>
                  <strong>
                    Moodify Notifications
                  </strong>

                  <p
                    style={{
                      margin:
                        "5px 0 0",
                      color: "#999",
                      fontSize:
                        "14px",
                    }}
                  >
                    Receive updates and
                    music recommendations.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    handleNotificationToggle
                  }
                  style={{
                    padding:
                      "8px 16px",
                    borderRadius:
                      "20px",
                    border: "none",
                    background:
                      notificationsEnabled
                        ? "#22c55e"
                        : "#444",
                    color: "#fff",
                    cursor:
                      "pointer",
                    fontWeight:
                      "700",
                  }}
                >
                  {notificationsEnabled
                    ? "ON"
                    : "OFF"}
                </button>

              </div>

            </div>
          )}

          {/* ==================================================
              PRIVACY & SECURITY
          ================================================== */}

          <button
            onClick={() =>
              setOpenSetting(
                openSetting ===
                  "privacy"
                  ? null
                  : "privacy"
              )
            }
          >
            🛡️
            <span>
              Privacy & Security
            </span>
            <b>
              {openSetting ===
              "privacy"
                ? "↓"
                : "→"}
            </b>
          </button>

          {openSetting ===
            "privacy" && (
            <div
              style={{
                padding: "20px",
                margin:
                  "0 0 10px 0",
                borderRadius:
                  "12px",
                background:
                  "rgba(255,255,255,0.04)",
                border:
                  "1px solid rgba(255,255,255,0.08)",
              }}
            >

              <h3
                style={{
                  marginTop: 0,
                }}
              >
                🛡️ Privacy & Security
              </h3>

              <div
                style={{
                  lineHeight: "1.8",
                  color: "#aaa",
                }}
              >

                <p>
                  🔐 Your password is securely
                  managed by Firebase
                  Authentication.
                </p>

                <p>
                  📧 Your account email:
                  <br />
                  <strong
                    style={{
                      color: "#fff",
                    }}
                  >
                    {userEmail}
                  </strong>
                </p>

                <p>
                  🛡️ Your Moodify session is
                  protected using your
                  authentication token.
                </p>

              </div>

              <button
                type="button"
                onClick={logout}
                style={{
                  marginTop:
                    "10px",
                  padding:
                    "10px 18px",
                  borderRadius:
                    "8px",
                  border:
                    "1px solid rgba(239,68,68,0.5)",
                  background:
                    "rgba(239,68,68,0.1)",
                  color:
                    "#f87171",
                  fontWeight:
                    "700",
                  cursor:
                    "pointer",
                }}
              >
                🚪 Sign Out
              </button>

            </div>
          )}

        </div>

      </div>

      {/* ======================================================
          LOGOUT
      ====================================================== */}

      <button
        className="profile-logout"
        onClick={logout}
      >
        🚪 Logout from Moodify
      </button>

    </div>
  );
}