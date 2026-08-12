import {
  Link,
  useLocation,
  useNavigate
} from "react-router-dom";


export default function AppLayout({ children }) {

  const location = useLocation();

  const navigate = useNavigate();


  // Get registered user

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


  const links = [

    ["🏠", "Home", "/mood"],

    ["🧠", "Mood Detection", "/mood"],

    ["🎧", "Recommendations", "/recommendations"],

    ["🔎", "Discover", "/discover"],

    ["❤️", "My Music", "/my-music"],

    ["📊", "Mood Analytics", "/analytics"],

    ["👤", "Profile", "/profile"]

  ];


  const handleLogout = () => {

    localStorage.removeItem(
      "moodifyLoggedIn"
    );

    navigate("/login");

  };


  return (

    <div className="app-layout">


      {/* ================= SIDEBAR ================= */}

      <aside className="sidebar">


        <div className="sidebar-logo">

          <div className="logo">

            <div className="logo-icon">
              ♫
            </div>

            <span className="logo-text">
              Moodify
            </span>

          </div>

        </div>


        <div className="sidebar-section">

          <div className="sidebar-title">
            MENU
          </div>


          {links.map(
            ([icon, title, path]) => (

              <Link
                key={path}
                to={path}
                className={
                  `sidebar-link ${
                    location.pathname === path
                      ? "active"
                      : ""
                  }`
                }
              >

                <span>
                  {icon}
                </span>

                <span>
                  {title}
                </span>

              </Link>

            )
          )}

        </div>


        {/* USER */}

        <div className="sidebar-user">

          <div className="sidebar-user-avatar">

            {userInitial}

          </div>


          <div className="sidebar-user-info">

            <strong>
              {userName}
            </strong>

            <small>
              {userEmail}
            </small>

          </div>

        </div>


        <button
          className="logout-btn"
          onClick={handleLogout}
        >
          🚪 Logout
        </button>


      </aside>


      {/* ================= MAIN ================= */}

      <main className="main-content">


        {/* TOPBAR */}

        <div className="topbar">


          <div className="search">

            <span>
              🔎
            </span>

            <input
              placeholder="Search music..."
            />

          </div>


          <div
            className="avatar"
            onClick={() =>
              navigate("/profile")
            }
            title={userName}
          >

            {userInitial}

          </div>


        </div>


        {/* PAGE */}

        {children}


      </main>


      {/* ================= MUSIC PLAYER ================= */}

      <div className="music-player glass">


        <div className="now-playing">

          <div className="player-cover">
            🎵
          </div>


          <div>

            <div className="song-name">
              Midnight Dreams
            </div>

            <div className="artist">
              Luna Waves
            </div>

          </div>

        </div>


        <div className="player-controls">

          <button>
            ↶
          </button>

          <button className="player-play">
            ▶
          </button>

          <button>
            ↷
          </button>

        </div>


        <div className="player-progress">

          <span>
            1:24
          </span>

          <div className="progress">

            <div
              className="progress-fill"
              style={{
                width: "42%"
              }}
            />

          </div>

          <span>
            3:42
          </span>

        </div>


      </div>

    </div>

  );
}