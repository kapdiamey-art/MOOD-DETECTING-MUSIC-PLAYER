import { useEffect, useState } from "react";
import { usePlayer } from "./PlayerContext";

const API = "http://localhost:8000";

const PLAYLISTS = [
  {
    id: "late-night",
    name: "Late Night",
    emoji: "🌙",
    description: "Relaxing songs for late nights",
    search: "late night chill music",
  },
  {
    id: "study",
    name: "Study Focus",
    emoji: "📚",
    description: "Music for concentration",
    search: "study focus lofi music",
  },
  {
    id: "morning",
    name: "Morning Energy",
    emoji: "☀️",
    description: "Start your morning with energy",
    search: "happy morning energy music",
  },
  {
    id: "favorites",
    name: "My Favorites",
    emoji: "💜",
    description: "Your liked songs",
    search: "",
  },
];

export default function MyMusic() {
  const {
    currentTrack,
    isPlaying,
    playTrack,
    togglePlay,
  } = usePlayer();

  const [likedSongs, setLikedSongs] =
    useState([]);

  const [stats, setStats] = useState({
    liked_songs: 0,
    playlists: 4,
    recently_played: 0,
    listening_hours: 0,
  });

  const [playlistSongs, setPlaylistSongs] =
    useState({
      "late-night": [],
      study: [],
      morning: [],
    });

  const [loadingPlaylists, setLoadingPlaylists] =
    useState(true);

  const [selectedPlaylist, setSelectedPlaylist] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  // =====================================================
  // LOAD EVERYTHING
  // =====================================================

  useEffect(() => {
    loadMyMusic();
  }, []);

  useEffect(() => {
    loadPlaylistSongs();
  }, []);

  // =====================================================
  // LOAD LIKED SONGS + STATS
  // =====================================================

  async function loadMyMusic() {
    const token =
      localStorage.getItem("moodifyToken");

    if (!token) {
      console.log(
        "No moodifyToken found"
      );

      setLoading(false);
      return;
    }

    try {
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      // -------------------------------------------------
      // LIKED SONGS
      // -------------------------------------------------

      console.log(
        "Loading liked songs..."
      );

      const likedResponse =
        await fetch(
          `${API}/mymusic/liked`,
          {
            method: "GET",
            headers,
          }
        );

      console.log(
        "Liked response:",
        likedResponse.status
      );

      if (likedResponse.ok) {
        const data =
          await likedResponse.json();

        console.log(
          "❤️ LIKED SONGS FROM BACKEND:",
          data
        );

        setLikedSongs(
          Array.isArray(data)
            ? data
            : []
        );
      } else if (
        likedResponse.status === 401
      ) {
        console.error(
          "Authentication failed."
        );
      } else {
        console.error(
          "Failed to load liked songs"
        );
      }

      // -------------------------------------------------
      // STATS
      // -------------------------------------------------

      const statsResponse =
        await fetch(
          `${API}/mymusic/stats`,
          {
            method: "GET",
            headers,
          }
        );

      console.log(
        "Stats response:",
        statsResponse.status
      );

      if (statsResponse.ok) {
        const data =
          await statsResponse.json();

        console.log(
          "MY MUSIC STATS:",
          data
        );

        setStats({
          liked_songs:
            Number(
              data.liked_songs
            ) || 0,

          playlists: 4,

          recently_played:
            Number(
              data.recently_played
            ) || 0,

          listening_hours:
            Number(
              data.listening_hours
            ) || 0,
        });
      }
    } catch (error) {
      console.error(
        "My Music error:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // LOAD PLAYLIST SONGS
  // =====================================================

  async function loadPlaylistSongs() {
    setLoadingPlaylists(true);

    try {
      const results = {};

      for (const playlist of PLAYLISTS) {
        // Favorites come from MongoDB,
        // not Spotify
        if (!playlist.search) {
          continue;
        }

        try {
          const response =
            await fetch(
              `${API}/spotify/search?q=${encodeURIComponent(
                playlist.search
              )}`
            );

          if (!response.ok) {
            console.error(
              "Playlist search failed:",
              playlist.name
            );

            results[playlist.id] =
              [];

            continue;
          }

          const data =
            await response.json();

          results[playlist.id] =
            Array.isArray(
              data.results
            )
              ? data.results
              : [];
        } catch (error) {
          console.error(
            `Error loading ${playlist.name}:`,
            error
          );

          results[playlist.id] =
            [];
        }
      }

      setPlaylistSongs(results);
    } catch (error) {
      console.error(
        "Playlist loading error:",
        error
      );
    } finally {
      setLoadingPlaylists(false);
    }
  }

  // =====================================================
  // CONVERT SONG TO PLAYER FORMAT
  // =====================================================

  function convertSong(song) {
    return {
      ...song,

      track_name:
        song.track_name ||
        song.song_title ||
        song.name ||
        song.title ||
        "Unknown Song",

      artists:
        song.artists ||
        song.artist ||
        "Unknown Artist",

      preview_url:
        song.preview_url ||
        null,

      album_image:
        song.album_image ||
        song.album_art ||
        song.image ||
        null,

      spotify_url:
        song.spotify_url ||
        song.external_url ||
        null,

      mood_tag:
        song.mood_tag ||
        "",
    };
  }

  // =====================================================
  // PLAY SONG
  // =====================================================

  function handlePlay(
    song,
    songs
  ) {
    const track =
      convertSong(song);

    const current =
      currentTrack?.track_name ===
        track.track_name &&
      currentTrack?.artists ===
        track.artists;

    if (current) {
      togglePlay();
      return;
    }

    if (track.preview_url) {
      const queue =
        songs.map(
          convertSong
        );

      playTrack(
        track,
        queue
      );

      return;
    }

    if (track.spotify_url) {
      window.open(
        track.spotify_url,
        "_blank",
        "noopener,noreferrer"
      );

      return;
    }

    alert(
      "Preview is not available for this song."
    );
  }

  // =====================================================
  // REMOVE FROM FAVORITES
  // =====================================================

  async function unlikeSong(
    songId
  ) {
    const token =
      localStorage.getItem(
        "moodifyToken"
      );

    if (!token || !songId) {
      return;
    }

    try {
      const response =
        await fetch(
          `${API}/mymusic/liked/${songId}`,
          {
            method: "DELETE",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      const data =
        await response.json();

      console.log(
        "UNLIKE RESPONSE:",
        response.status,
        data
      );

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Failed to remove song"
        );
      }

      // Remove from screen immediately
      setLikedSongs(
        (previous) =>
          previous.filter(
            (song) =>
              String(
                song._id
              ) !==
              String(songId)
          )
      );

      setStats(
        (previous) => ({
          ...previous,

          liked_songs:
            Math.max(
              0,
              previous.liked_songs -
                1
            ),
        })
      );

      // If favorites playlist is open,
      // it automatically updates because
      // selectedSongs uses likedSongs.
    } catch (error) {
      console.error(
        "Unlike error:",
        error
      );

      alert(
        "Could not remove the song."
      );
    }
  }

  // =====================================================
  // SONG CARD
  // =====================================================

  function SongCard({
    song,
    songs,
    liked = false,
    onUnlike,
  }) {
    const track =
      convertSong(song);

    const isCurrent =
      currentTrack?.track_name ===
        track.track_name &&
      currentTrack?.artists ===
        track.artists;

    const isCurrentlyPlaying =
      isCurrent && isPlaying;

    const hasPreview =
      Boolean(
        track.preview_url
      );

    return (
      <div
        className={`song-card ${
          isCurrent
            ? "song-card-active"
            : ""
        }`}
        style={{
          position:
            "relative",
        }}
      >

        {/* ALBUM COVER */}

        <div
          className="song-cover"
          style={{
            position:
              "relative",
            overflow:
              "hidden",
          }}
        >

          {track.album_image ? (
            <img
              src={
                track.album_image
              }
              alt={
                track.track_name
              }
              style={{
                width: "100%",
                height: "100%",
                objectFit:
                  "cover",
                display:
                  "block",
              }}
              onError={(e) => {
                e.currentTarget.style.display =
                  "none";

                if (
                  e.currentTarget
                    .nextSibling
                ) {
                  e.currentTarget
                    .nextSibling
                    .style.display =
                    "grid";
                }
              }}
            />
          ) : null}

          <div
            style={{
              width: "100%",
              height: "100%",
              display:
                track.album_image
                  ? "none"
                  : "grid",
              placeItems:
                "center",
              fontSize: "50px",
              background:
                "rgba(255,255,255,0.04)",
            }}
          >
            🎵
          </div>

          {/* PLAY BUTTON */}

          <button
            type="button"
            className="play-small"
            onClick={(e) => {
              e.stopPropagation();

              handlePlay(
                song,
                songs
              );
            }}
            title={
              hasPreview
                ? isCurrentlyPlaying
                  ? "Pause"
                  : "Play"
                : "Open Spotify"
            }
            style={{
              display: "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
              position:
                "relative",
              zIndex: 20,
              cursor:
                "pointer",
            }}
          >
            {isCurrentlyPlaying
              ? "❚❚"
              : hasPreview
              ? "▶"
              : "↗"}
          </button>
        </div>

        {/* SONG DETAILS */}

        <div className="song-info">

          <div className="song-title">
            {
              track.track_name
            }
          </div>

          <div className="artist">
            {
              track.artists
            }
          </div>

          {track.mood_tag && (
            <div
              style={{
                fontSize:
                  "0.8rem",
                color:
                  "var(--primary)",
                marginTop:
                  "4px",
              }}
            >
              {
                track.mood_tag
              }
            </div>
          )}

          <div
            style={{
              display:
                "flex",
              gap: "8px",
              marginTop:
                "9px",
            }}
          >

            {/* PLAY */}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();

                handlePlay(
                  song,
                  songs
                );
              }}
              style={{
                flex: 1,
                padding:
                  "8px",
                border: "none",
                borderRadius:
                  "8px",
                background:
                  "linear-gradient(135deg,#8b5cf6,#ec4899)",
                color: "#fff",
                cursor:
                  "pointer",
                fontWeight:
                  "600",
              }}
            >
              {isCurrentlyPlaying
                ? "❚❚ Pause"
                : hasPreview
                ? "▶ Play"
                : "↗ Open"}
            </button>

            {/* REMOVE FROM FAVORITES */}

            {liked && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();

                  onUnlike(
                    song._id
                  );
                }}
                title="Remove from favorites"
                style={{
                  width: "42px",
                  border:
                    "1px solid rgba(255,255,255,0.12)",
                  borderRadius:
                    "8px",
                  background:
                    "rgba(255,255,255,0.05)",
                  cursor:
                    "pointer",
                  fontSize:
                    "18px",
                }}
              >
                ❤️
              </button>
            )}

          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div
        style={{
          textAlign:
            "center",
          padding:
            "70px 20px",
        }}
      >
        <div
          style={{
            fontSize:
              "50px",
          }}
        >
          🎵
        </div>

        <h2>
          Loading your music...
        </h2>
      </div>
    );
  }

  // =====================================================
  // SELECTED PLAYLIST SONGS
  // =====================================================

  let selectedSongs = [];

  if (selectedPlaylist) {
    if (
      selectedPlaylist.id ===
      "favorites"
    ) {
      // IMPORTANT:
      // Favorites = songs from MongoDB
      selectedSongs =
        likedSongs;
    } else {
      selectedSongs =
        playlistSongs[
          selectedPlaylist.id
        ] || [];
    }
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div
      style={{
        paddingBottom:
          "120px",
      }}
    >

      {/* HEADER */}

      <h1 className="page-title">
        Your Music ❤️
      </h1>

      <p className="page-description">
        Everything you've saved, liked and
        played.
      </p>

      {/* =================================================
          STATS
      ================================================= */}

      <div className="stats-grid">

        <div className="stat-card glass">
          <div className="stat-label">
            Liked Songs
          </div>

          <div className="stat-value">
            {
              likedSongs.length
            }
          </div>
        </div>

        <div className="stat-card glass">
          <div className="stat-label">
            Playlists
          </div>

          <div className="stat-value">
            4
          </div>
        </div>

        <div className="stat-card glass">
          <div className="stat-label">
            Recently Played
          </div>

          <div className="stat-value">
            {
              stats.recently_played
            }
          </div>
        </div>

        <div className="stat-card glass">
          <div className="stat-label">
            Listening Hours
          </div>

          <div className="stat-value">
            {
              stats.listening_hours
            }
            h
          </div>
        </div>

      </div>

      {/* =================================================
          LIKED SONGS
      ================================================= */}

      <div
        className="section-header"
        style={{
          marginTop:
            "40px",
        }}
      >
        <h2>
          ❤️ Liked Songs
        </h2>

        <span className="artist">
          {
            likedSongs.length
          } songs
        </span>
      </div>

      {likedSongs.length === 0 ? (
        <div
          className="dashboard-hero"
          style={{
            textAlign:
              "center",
            padding:
              "35px 20px",
          }}
        >
          <div
            style={{
              fontSize:
                "50px",
            }}
          >
            💜
          </div>

          <h3>
            No liked songs yet
          </h3>

          <p className="artist">
            Go to Recommendations
            and click ❤️ on a song
            to add it to your favorites.
          </p>
        </div>
      ) : (
        <div className="song-grid">
          {likedSongs.map(
            (song, index) => (
              <SongCard
                key={
                  song._id ||
                  index
                }
                song={song}
                songs={
                  likedSongs
                }
                liked={true}
                onUnlike={
                  unlikeSong
                }
              />
            )
          )}
        </div>
      )}

      {/* =================================================
          YOUR PLAYLISTS
      ================================================= */}

      <div
        className="section-header"
        style={{
          marginTop:
            "50px",
        }}
      >
        <h2>
          Your playlists
        </h2>

        <span className="artist">
          4 playlists
        </span>
      </div>

      <div className="song-grid">

        {PLAYLISTS.map(
          (playlist) => {
            const playlistSongList =
              playlist.id ===
              "favorites"
                ? likedSongs
                : playlistSongs[
                    playlist.id
                  ] || [];

            return (
              <div
                className="song-card"
                key={
                  playlist.id
                }
                onClick={() =>
                  setSelectedPlaylist(
                    playlist
                  )
                }
                style={{
                  cursor:
                    "pointer",
                }}
              >

                {/* COVER */}

                <div
                  className="song-cover"
                  style={{
                    background:
                      "linear-gradient(135deg,#7c3aed,#db2777)",
                    display:
                      "grid",
                    placeItems:
                      "center",
                    fontSize:
                      "55px",
                  }}
                >
                  {
                    playlist.emoji
                  }
                </div>

                {/* INFO */}

                <div className="song-info">

                  <div className="song-title">
                    {
                      playlist.name
                    }
                  </div>

                  <div className="artist">
                    {loadingPlaylists &&
                    playlist.id !==
                      "favorites"
                      ? "Loading songs..."
                      : `${playlistSongList.length} songs`}
                  </div>

                  <div
                    className="artist"
                    style={{
                      marginTop:
                        "5px",
                      fontSize:
                        "0.82rem",
                    }}
                  >
                    {
                      playlist.description
                    }
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();

                      setSelectedPlaylist(
                        playlist
                      );
                    }}
                    style={{
                      width: "100%",
                      marginTop:
                        "10px",
                      padding:
                        "9px",
                      border:
                        "none",
                      borderRadius:
                        "9px",
                      background:
                        "rgba(139,92,246,0.2)",
                      color:
                        "inherit",
                      cursor:
                        "pointer",
                      fontWeight:
                        "600",
                    }}
                  >
                    Open Playlist →
                  </button>

                </div>
              </div>
            );
          }
        )}

      </div>

      {/* =================================================
          SELECTED PLAYLIST
      ================================================= */}

      {selectedPlaylist && (
        <div
          className="dashboard-hero"
          style={{
            marginTop:
              "40px",
            padding:
              "25px",
          }}
        >

          {/* HEADER */}

          <div
            style={{
              display:
                "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center",
              marginBottom:
                "25px",
              gap:
                "15px",
              flexWrap:
                "wrap",
            }}
          >

            <div>

              <h2
                style={{
                  margin: 0,
                }}
              >
                {
                  selectedPlaylist.emoji
                }{" "}
                {
                  selectedPlaylist.name
                }
              </h2>

              <p
                className="artist"
                style={{
                  marginTop:
                    "5px",
                }}
              >
                {
                  selectedSongs.length
                } songs
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                setSelectedPlaylist(
                  null
                )
              }
              style={{
                padding:
                  "9px 16px",
                border:
                  "1px solid rgba(255,255,255,0.15)",
                borderRadius:
                  "10px",
                background:
                  "rgba(255,255,255,0.05)",
                color:
                  "inherit",
                cursor:
                  "pointer",
              }}
            >
              ✕ Close
            </button>

          </div>

          {/* LOADING */}

          {loadingPlaylists &&
          selectedPlaylist.id !==
            "favorites" ? (
            <div
              style={{
                textAlign:
                  "center",
                padding:
                  "40px",
              }}
            >
              <div
                style={{
                  fontSize:
                    "40px",
                }}
              >
                🎵
              </div>

              <p>
                Finding songs...
              </p>
            </div>
          ) : selectedSongs.length ===
            0 ? (
            <div
              style={{
                textAlign:
                  "center",
                padding:
                  "40px 20px",
              }}
            >
              <div
                style={{
                  fontSize:
                    "45px",
                }}
              >
                🎵
              </div>

              <h3>
                {selectedPlaylist.id ===
                "favorites"
                  ? "No favorite songs yet"
                  : "No songs found"}
              </h3>

              <p className="artist">
                {selectedPlaylist.id ===
                "favorites"
                  ? "Like a song from Recommendations and it will appear here."
                  : "Try again after restarting the backend."}
              </p>
            </div>
          ) : (
            <div className="song-grid">

              {selectedSongs.map(
                (song, index) => (
                  <SongCard
                    key={
                      song.track_id ||
                      song._id ||
                      index
                    }
                    song={song}
                    songs={
                      selectedSongs
                    }
                    liked={
                      selectedPlaylist.id ===
                      "favorites"
                    }
                    onUnlike={
                      unlikeSong
                    }
                  />
                )
              )}

            </div>
          )}

        </div>
      )}

    </div>
  );
}