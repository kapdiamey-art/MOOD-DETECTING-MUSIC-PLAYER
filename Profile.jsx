import {
  useNavigate
} from "react-router-dom";


export default function Profile() {

  const navigate = useNavigate();


  const savedUser =
    JSON.parse(
      localStorage.getItem("moodifyUser")
    );


  const userName =
    savedUser?.name || "User";


  const userEmail =
    savedUser?.email || "";


  const userInitial =
    userName.charAt(0).toUpperCase();


  const logout = () => {

    localStorage.removeItem(
      "moodifyLoggedIn"
    );

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


          <h1>
            {userName}
          </h1>


          <p>
            {userEmail}
          </p>


          <div className="profile-status">
            ● Account Active
          </div>

        </div>


        <button
          className="profile-edit-btn"
        >
          ✨ Edit Profile
        </button>


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
              Pop • Lo-fi
            </strong>

          </div>


          <div className="profile-preference">

            <span>
              😌 Favorite Mood
            </span>

            <strong>
              Calm
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