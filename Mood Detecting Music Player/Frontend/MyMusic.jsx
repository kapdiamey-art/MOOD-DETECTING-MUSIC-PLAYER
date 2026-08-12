import AppLayout from "./AppLayout";

export default function MyMusic() {

  return (
    <AppLayout>

      <h1 className="page-title">
        Your Music ❤️
      </h1>

      <p className="page-description">
        Everything you've saved, liked and played.
      </p>

      <div className="stats-grid">

        <div className="stat-card glass">
          <div className="stat-label">
            Liked Songs
          </div>
          <div className="stat-value">
            128
          </div>
        </div>

        <div className="stat-card glass">
          <div className="stat-label">
            Playlists
          </div>
          <div className="stat-value">
            12
          </div>
        </div>

        <div className="stat-card glass">
          <div className="stat-label">
            Recently Played
          </div>
          <div className="stat-value">
            46
          </div>
        </div>

        <div className="stat-card glass">
          <div className="stat-label">
            Listening Hours
          </div>
          <div className="stat-value">
            32h
          </div>
        </div>

      </div>

      <div className="section-header">
        <h2>Continue listening</h2>
      </div>

      <div className="dashboard-hero">

        <h2>
          🎧 Midnight Dreams
        </h2>

        <p>
          Luna Waves · Chill
        </p>

        <button
          className="primary-btn"
          style={{marginTop:"20px"}}
        >
          ▶ Continue
        </button>

      </div>

      <div className="section-header">
        <h2>Your playlists</h2>
      </div>

      <div className="song-grid">

        {[
          ["🌙","Late Night"],
          ["📚","Study Focus"],
          ["☀️","Morning Energy"],
          ["💜","My Favorites"]
        ].map(([emoji,name]) => (

          <div className="song-card" key={name}>

            <div className="song-cover">

              <div style={{
                height:"100%",
                display:"grid",
                placeItems:"center",
                fontSize:"55px"
              }}>
                {emoji}
              </div>

            </div>

            <div className="song-info">
              <div className="song-title">
                {name}
              </div>

              <div className="artist">
                Playlist · 18 songs
              </div>
            </div>

          </div>

        ))}

      </div>

    </AppLayout>
  );
}