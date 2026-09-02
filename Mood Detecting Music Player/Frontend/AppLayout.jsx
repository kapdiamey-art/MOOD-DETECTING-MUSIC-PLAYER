import {
  Link,
  useLocation,
  useNavigate
} from "react-router-dom";

export default function AppLayout({ children }) {

  const location = useLocation();
  const navigate = useNavigate();

  // ================= USER =================

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


  // ================= NAVIGATION =================

  const links = [

    ["🧠", "Mood", "/mood"],

    ["🎧", "Recommendations", "/recommendations"],

    ["🔎", "Discover", "/discover"],

    ["❤️", "My Music", "/my-music"],

    ["📊", "Analytics", "/analytics"],

    ["👤", "Profile", "/profile"]

  ];


  // ================= LOGOUT =================

  const handleLogout = () => {

    localStorage.removeItem(
      "moodifyLoggedIn"
    );

    navigate("/login");

  };


  return (

    <div className="app-layout">


      {/* =================================================
          DESKTOP TOP NAVIGATION
          ================================================= */}

      <nav className="top-navigation">

        {/* LOGO */}

        <Link
          to="/mood"
          className="top-logo"
        >

          <div className="top-logo-icon">
            ♫
          </div>

          <span>
            Moodify
          </span>

        </Link>


        {/* DESKTOP NAVIGATION */}

        <div className="top-navigation-links">

          {links.map(
            ([icon, title, path]) => (

              <Link
                key={path}
                to={path}

                className={
                  `top-navigation-link ${
                    location.pathname === path
                      ? "active"
                      : ""
                  }`
                }
              >

                <span className="nav-icon">
                  {icon}
                </span>

                <span className="nav-title">
                  {title}
                </span>

              </Link>

            )
          )}

        </div>


        {/* USER */}

        <div
          className="top-user"

          onClick={() =>
            navigate("/profile")
          }

          title={userName}
        >

          <div className="top-user-avatar">
            {userInitial}
          </div>

          <div className="top-user-info">

            <strong>
              {userName}
            </strong>

            <small>
              {userEmail}
            </small>

          </div>

        </div>

      </nav>


      {/* =================================================
          NEW RESPONSIVE NAVIGATION
          iPHONE / PIXEL / iPAD / SURFACE
          ================================================= */}

      <div className="responsive-navigation">

        {links.map(
          ([icon, title, path]) => (

            <Link
              key={path}
              to={path}

              className={
                location.pathname === path
                  ? "responsive-nav-item active"
                  : "responsive-nav-item"
              }
            >

              <span className="responsive-nav-icon">
                {icon}
              </span>

              <span className="responsive-nav-text">
                {title === "Recommendations"
                  ? "Recommend"
                  : title}
              </span>

            </Link>

          )
        )}

      </div>


      {/* =================================================
          MAIN CONTENT
          ================================================= */}

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

        </div>


        {/* CURRENT PAGE */}

        {children}

      </main>


      {/* =================================================
          MUSIC PLAYER
          ================================================= */}

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