import { useState, useEffect } from "react";

import AppLayout from "./AppLayout";

export default function MyMusic() {

  const [stats, setStats] = useState({ liked_songs: 0, playlists: 0, recently_played: 0, listening_hours: 0 });

  // *******************************************c*******************************************
  // LIKED SONGS STATE — fetched from MongoDB backend via GET /mymusic/liked
  const [likedSongs, setLikedSongs] = useState([]);
  // *******************************************c*******************************************

  useEffect(() => {
    const token = localStorage.getItem("moodifyToken");
    if (!token) return;

    // Fetch stats
    fetch("http://localhost:8000/mymusic/stats", {
      headers: { "Authorization": `Bearer ${token}` }
    })
    .then(r => r.json())
    .then(data => setStats(data))
    .catch(err => console.log(err));

    // *******************************************c*******************************************
    // FETCH LIKED SONGS — loads real songs saved to MongoDB
    fetch("http://localhost:8000/mymusic/liked", {
      headers: { "Authorization": `Bearer ${token}` }
    })
    .then(r => r.json())
    .then(data => setLikedSongs(Array.isArray(data) ? data : []))
    .catch(err => console.log("Liked songs fetch error:", err));
    // *******************************************c*******************************************

  }, []);


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
            {stats.liked_songs}
          </div>
        </div>

        <div className="stat-card glass">
          <div className="stat-label">
            Playlists
          </div>
          <div className="stat-value">
            {stats.playlists}
          </div>
        </div>

        <div className="stat-card glass">
          <div className="stat-label">
            Recently Played
          </div>
          <div className="stat-value">
            {stats.recently_played}
          </div>
        </div>

        <div className="stat-card glass">
          <div className="stat-label">
            Listening Hours
          </div>
          <div className="stat-value">
            {stats.listening_hours}h
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

      {/* ──────────────────────────────────────────────── */}
      {/* *******************************************c******************************************* */}
      {/* LIKED SONGS SECTION — real data from MongoDB backend */}
      <div className="section-header" style={{ marginTop: "30px" }}>
        <h2>❤️ Liked Songs</h2>
        <span className="artist">{likedSongs.length} songs</span>
      </div>

      {likedSongs.length > 0 ? (
        <div className="song-grid">
          {likedSongs.map((song, idx) => (
            <div className="song-card" key={idx}>

              <div className="song-cover">
                <div style={{
                  height: "100%",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "55px"
                }}>
                  🎵
                </div>
              </div>

              <div className="song-info">
                <div className="song-title">{song.song_title}</div>
                <div className="artist">{song.artist}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--primary)", marginTop: "4px", fontWeight: "600" }}>
                  {song.mood_tag}
                </div>
              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="dashboard-hero" style={{ textAlign: "center", padding: "20px" }}>
          <p>No liked songs yet. Go to Recommendations and ❤️ your favourite songs!</p>
        </div>
      )}
      {/* *******************************************c******************************************* */}
      {/* ──────────────────────────────────────────────── */}

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