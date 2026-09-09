import { useState, useEffect } from "react";

import AppLayout from "./AppLayout";
import { usePlayer } from "./PlayerContext";

export default function MyMusic() {

  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayer();

  const [stats, setStats] = useState({ liked_songs: 0, playlists: 0, recently_played: 0, listening_hours: 0 });

  // *******************************************c*******************************************
  // LIKED SONGS STATE — fetched from MongoDB backend via GET /mymusic/liked
  const [likedSongs, setLikedSongs] = useState([]);
  // *******************************************c*******************************************

  useEffect(() => {
    const token = localStorage.getItem("moodifyToken");
    if (!token) return;

    const h = { "Authorization": `Bearer ${token}` };

    // Fetch stats
    fetch("http://localhost:8000/mymusic/stats", { headers: h })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setStats(data); })
      .catch(err => console.log(err));

    // *******************************************c*******************************************
    // FETCH LIKED SONGS — loads real songs saved to MongoDB
    fetch("http://localhost:8000/mymusic/liked", { headers: h })
      .then(r => r.ok ? r.json() : [])
      .then(data => setLikedSongs(Array.isArray(data) ? data : []))
      .catch(err => console.log("Liked songs fetch error:", err));
    // *******************************************c*******************************************

  }, []);


  // UNLIKE a song — calls DELETE /mymusic/liked/{id} and removes from state instantly
  const unlikeSong = async (songId, idx) => {
    const token = localStorage.getItem("moodifyToken");
    if (!token) return;

    try {
      const res = await fetch(`http://localhost:8000/mymusic/liked/${songId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setLikedSongs(prev => prev.filter((_, i) => i !== idx));
        setStats(prev => ({ ...prev, liked_songs: Math.max(0, prev.liked_songs - 1) }));
      }
    } catch (err) {
      console.error("Unlike failed:", err);
    }
  };


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

      {/* ──────────────────────────────────────────────── */}
      {/* *******************************************c******************************************* */}
      {/* LIKED SONGS SECTION — real data from MongoDB backend */}
      <div className="section-header" style={{ marginTop: "30px" }}>
        <h2>❤️ Liked Songs</h2>
        <span className="artist">{likedSongs.length} songs</span>
      </div>

      {likedSongs.length > 0 ? (
        <div className="song-grid">
          {likedSongs.map((song, idx) => {
            // Map DB fields to what PlayerContext expects
            const trackObj = {
              track_name:  song.song_title,
              artists:     song.artist,
              preview_url: song.preview_url  || null,
              album_image: song.album_image  || null,
              spotify_url: song.spotify_url  || null,
              mood_tag:    song.mood_tag,
            };

            const isCurrent      = currentTrack?.track_name === trackObj.track_name && currentTrack?.artists === trackObj.artists;
            const isCurrentPlaying = isCurrent && isPlaying;
            const hasPreview     = !!song.preview_url;

            return (
              <div
                className={`song-card ${isCurrent ? "song-card-active" : ""}`}
                key={song._id || idx}
                style={{ cursor: "pointer", position: "relative", transition: "all 0.2s ease" }}
                onClick={() => {
                  if (isCurrent) togglePlay();
                  else playTrack(trackObj, likedSongs.map(s => ({
                    track_name:  s.song_title,
                    artists:     s.artist,
                    preview_url: s.preview_url || null,
                    album_image: s.album_image || null,
                    spotify_url: s.spotify_url || null,
                  })));
                }}
              >
                {/* Album art */}
                <div className="song-cover" style={{ position: "relative", overflow: "hidden" }}>
                  {song.album_image ? (
                    <img
                      src={song.album_image}
                      alt={song.song_title}
                      style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "12px", display: "block" }}
                      onError={(e) => { e.target.style.display = "none"; if (e.target.nextSibling) e.target.nextSibling.style.display = "grid"; }}
                    />
                  ) : null}
                  <div style={{
                    height: "100%",
                    display: song.album_image ? "none" : "grid",
                    placeItems: "center",
                    fontSize: "50px",
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: "12px"
                  }}>
                    🎵
                  </div>

                  {/* Play / Pause button */}
                  <button
                    className="play-small"
                    title={hasPreview ? (isCurrentPlaying ? "Pause" : "Play preview") : "No preview – opens Spotify"}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isCurrent) togglePlay();
                      else playTrack(trackObj, likedSongs.map(s => ({
                        track_name:  s.song_title,
                        artists:     s.artist,
                        preview_url: s.preview_url || null,
                        album_image: s.album_image || null,
                        spotify_url: s.spotify_url || null,
                      })));
                    }}
                    style={{
                      background: isCurrentPlaying ? "#22c55e" : hasPreview ? undefined : "rgba(30,215,96,0.2)",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
                    }}
                  >
                    {isCurrentPlaying ? "❚❚" : hasPreview ? "▶" : "↗"}
                  </button>
                </div>

                {/* Song info */}
                <div className="song-info">
                  <div className="song-title">{song.song_title}</div>
                  <div className="artist">{song.artist}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--primary)", marginTop: "4px", fontWeight: "600" }}>
                    {song.mood_tag}
                  </div>

                  {/* Unlike button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      unlikeSong(song._id, idx);
                    }}
                    title="Remove from liked songs"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "1.3rem",
                      marginTop: "6px",
                      transition: "transform 0.2s",
                    }}
                  >
                    ❤️
                  </button>
                </div>
              </div>
            );
          })}
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