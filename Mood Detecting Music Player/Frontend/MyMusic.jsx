import { useEffect, useState } from "react";
import { usePlayer } from "./PlayerContext";

const API = "http://localhost:8000";

const DEFAULT_PLAYLISTS = [
  {
    id: "late-night",
    name: "Late Night",
    emoji: "🌙",
    description: "Relaxing songs for late nights",
    search: "late night chill music",
    custom: false,
  },
  {
    id: "study",
    name: "Study Focus",
    emoji: "📚",
    description: "Music for concentration",
    search: "study focus lofi music",
    custom: false,
  },
  {
    id: "morning",
    name: "Morning Energy",
    emoji: "☀️",
    description: "Start your morning with energy",
    search: "happy morning energy music",
    custom: false,
  },
  {
    id: "favorites",
    name: "My Favorites",
    emoji: "💜",
    description: "Your liked songs",
    search: "",
    custom: false,
  },
];

export default function MyMusic() {
  const {
    currentTrack,
    isPlaying,
    playTrack,
    togglePlay,
    searchQuery,
  } = usePlayer();

  // Filter any song list by the global search query
  const filterBySearch = (list) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (s) =>
        ((s.track_name || s.song_title || s.title || "")).toLowerCase().includes(q) ||
        ((s.artists || s.artist || "")).toLowerCase().includes(q)
    );
  };

  // Dynamic playlist list (default + user-created)
  const [playlists, setPlaylists] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("moodify_custom_playlists") || "null");
      return saved || DEFAULT_PLAYLISTS;
    } catch {
      return DEFAULT_PLAYLISTS;
    }
  });

  const [likedSongs, setLikedSongs] = useState([]);

  const [stats, setStats] = useState({
    liked_songs: 0,
    playlists: 4,
    recently_played: 0,
    listening_hours: 0,
  });

  const [playlistSongs, setPlaylistSongs] = useState({
    "late-night": [],
    study: [],
    morning: [],
  });

  const [loadingPlaylists, setLoadingPlaylists] = useState(true);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAllPlaylists, setShowAllPlaylists] = useState(false);

  // Create Playlist & Add Songs modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddSongsModal, setShowAddSongsModal] = useState(false);
  const [targetPlaylistForAdd, setTargetPlaylistForAdd] = useState(null);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistEmoji, setNewPlaylistEmoji] = useState("🎵");
  const [availableSongs, setAvailableSongs] = useState([]);
  const [selectedSongIds, setSelectedSongIds] = useState([]);
  const [songPickerQuery, setSongPickerQuery] = useState("");
  const [artistDropdownList, setArtistDropdownList] = useState([
    "Arijit Singh",
    "Taylor Swift",
    "The Weeknd",
    "Coldplay",
    "Drake",
    "Ed Sheeran",
    "Pritam",
    "A.R. Rahman",
    "Dua Lipa",
    "Justin Bieber",
    "Post Malone",
    "Billie Eilish",
    "Bruno Mars",
    "Katy Perry",
    "Imagine Dragons",
    "Shreya Ghoshal",
    "Badshah"
  ]);
  const [selectedArtist, setSelectedArtist] = useState("");

  useEffect(() => {
    async function fetchArtists() {
      try {
        const res = await fetch(`${API}/mood/artists`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.artists) && data.artists.length > 0) {
            setArtistDropdownList((prev) => Array.from(new Set([...prev, ...data.artists])));
          }
        }
      } catch (err) {
        // Fallback to initial artist dropdown list
      }
    }
    fetchArtists();
  }, []);

  // Reactive song search in modal as user types
  useEffect(() => {
    if (!songPickerQuery.trim()) return;
    const timer = setTimeout(() => {
      openSongPicker(songPickerQuery.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [songPickerQuery]);

  // =====================================================
  // LOAD EVERYTHING
  // =====================================================

  useEffect(() => {
    loadMyMusic();
  }, []);

  useEffect(() => {
    loadPlaylistSongs();
  }, [playlists]);  // reload whenever playlists change

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

      for (const playlist of playlists) {
        if (!playlist.search) continue;

        // Custom playlists with pre-saved songs don't need a search fetch
        if (playlist.custom && playlist.songs) {
          results[playlist.id] = playlist.songs;
          continue;
        }

        try {
          const response = await fetch(
            `${API}/spotify/search?q=${encodeURIComponent(playlist.search)}&limit=15`
          );

          if (!response.ok) {
            results[playlist.id] = [];
            continue;
          }

          const data = await response.json();
          results[playlist.id] = Array.isArray(data.results) ? data.results : [];
        } catch (error) {
          console.error(`Error loading ${playlist.name}:`, error);
          results[playlist.id] = [];
        }
      }

      setPlaylistSongs(results);
    } catch (error) {
      console.error("Playlist loading error:", error);
    } finally {
      setLoadingPlaylists(false);
    }
  }

  // =====================================================
  // CUSTOM PLAYLIST MANAGEMENT
  // =====================================================

  async function openSongPicker(query = "popular songs") {
    try {
      const res = await fetch(`${API}/spotify/search?q=${encodeURIComponent(query)}&limit=30`);
      const data = await res.json();
      setAvailableSongs(Array.isArray(data.results) ? data.results : []);
    } catch {
      setAvailableSongs([]);
    }
  }

  function toggleSongSelection(song) {
    const id = song.track_name + "|" + song.artists;
    setSelectedSongIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function createPlaylist() {
    if (!newPlaylistName.trim()) return;
    const picked = availableSongs.filter((s) =>
      selectedSongIds.includes(s.track_name + "|" + s.artists)
    );
    const newPl = {
      id: "custom-" + Date.now(),
      name: newPlaylistName.trim(),
      emoji: newPlaylistEmoji,
      description: `${picked.length} songs`,
      search: "",
      custom: true,
      songs: picked,
    };
    const updated = [...playlists, newPl];
    setPlaylists(updated);
    localStorage.setItem("moodify_custom_playlists", JSON.stringify(updated));
    setPlaylistSongs((prev) => ({ ...prev, [newPl.id]: picked }));
    // reset modal
    setShowCreateModal(false);
    setNewPlaylistName("");
    setNewPlaylistEmoji("🎵");
    setSelectedSongIds([]);
    setAvailableSongs([]);
    setSongPickerQuery("");
  }

  function deletePlaylist(playlistId) {
    if (!window.confirm("Delete this playlist?")) return;
    const updated = playlists.filter((p) => p.id !== playlistId);
    setPlaylists(updated);
    localStorage.setItem("moodify_custom_playlists", JSON.stringify(updated));
    if (selectedPlaylist?.id === playlistId) setSelectedPlaylist(null);
  }

  function openAddSongsModal(playlist) {
    setTargetPlaylistForAdd(playlist);
    setSelectedSongIds([]);
    setSelectedArtist("");
    openSongPicker(playlist.name || "popular songs");
    setShowAddSongsModal(true);
  }

  function addSongsToExistingPlaylist() {
    if (!targetPlaylistForAdd) return;
    const picked = availableSongs.filter((s) =>
      selectedSongIds.includes(s.track_name + "|" + s.artists)
    );
    if (picked.length === 0) {
      setShowAddSongsModal(false);
      return;
    }

    const playlistId = targetPlaylistForAdd.id;

    if (targetPlaylistForAdd.custom) {
      const updatedPlaylists = playlists.map((p) => {
        if (p.id === playlistId) {
          const existingSongs = p.songs || [];
          const newSongs = [...existingSongs];
          picked.forEach((song) => {
            if (!newSongs.some((s) => (s.track_name || s.title) === (song.track_name || song.title))) {
              newSongs.push(song);
            }
          });
          return { ...p, songs: newSongs, description: `${newSongs.length} songs` };
        }
        return p;
      });
      setPlaylists(updatedPlaylists);
      localStorage.setItem("moodify_custom_playlists", JSON.stringify(updatedPlaylists));

      if (selectedPlaylist?.id === playlistId) {
        const targetPl = updatedPlaylists.find((p) => p.id === playlistId);
        if (targetPl) setSelectedPlaylist(targetPl);
      }
    } else {
      setPlaylistSongs((prev) => {
        const existing = prev[playlistId] || [];
        const newSongs = [...existing];
        picked.forEach((song) => {
          if (!newSongs.some((s) => (s.track_name || s.title) === (song.track_name || song.title))) {
            newSongs.push(song);
          }
        });
        return { ...prev, [playlistId]: newSongs };
      });
    }

    setShowAddSongsModal(false);
    setSelectedSongIds([]);
    setTargetPlaylistForAdd(null);
  }


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
          {filterBySearch(likedSongs).length === 0 && searchQuery ? (
            <div style={{ gridColumn: "1/-1", textAlign: "center", color: "var(--text-secondary)", padding: "40px 0" }}>
              No songs match &ldquo;<strong>{searchQuery}</strong>&rdquo;
            </div>
          ) : null}
          {filterBySearch(likedSongs).map(
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
        style={{ marginTop: "50px" }}
      >
        <h2>Your playlists</h2>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {playlists.length > 4 && (
            <button
              type="button"
              onClick={() => setShowAllPlaylists((prev) => !prev)}
              style={{
                padding: "6px 12px", border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "8px", background: "rgba(255,255,255,0.05)",
                color: "#aaa", cursor: "pointer", fontSize: "0.82rem",
                fontWeight: "600"
              }}
            >
              {showAllPlaylists ? "Show Less ↑" : `Show All (${playlists.length}) ↓`}
            </button>
          )}
          <span className="artist">{playlists.length} playlists</span>
          <button
            type="button"
            onClick={() => {
              setShowCreateModal(true);
              openSongPicker("popular songs");
            }}
            style={{
              padding: "7px 14px", border: "none", borderRadius: "10px",
              background: "linear-gradient(135deg,#8b5cf6,#ec4899)",
              color: "#fff", cursor: "pointer", fontWeight: "700",
              fontSize: "0.82rem",
            }}
          >
            + New Playlist
          </button>
        </div>
      </div>

      <div className="song-grid">
        {(showAllPlaylists ? playlists : playlists.slice(0, 4)).map((playlist) => {
            const playlistSongList =
              playlist.id === "favorites"
                ? likedSongs
                : playlistSongs[playlist.id] || [];

            return (
              <div
                className="song-card"
                key={playlist.id}
                onClick={() => setSelectedPlaylist(playlist)}
                style={{ cursor: "pointer", position: "relative" }}
              >
                {/* DELETE button for custom playlists */}
                {playlist.custom && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); deletePlaylist(playlist.id); }}
                    title="Delete playlist"
                    style={{
                      position: "absolute", top: 8, right: 8, zIndex: 10,
                      background: "rgba(239,68,68,0.85)", border: "none",
                      borderRadius: "50%", width: 26, height: 26, cursor: "pointer",
                      color: "#fff", fontWeight: "700", fontSize: "0.75rem",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >✕</button>
                )}

                {/* COVER */}
                <div
                  className="song-cover"
                  style={{
                    background: playlist.custom
                      ? "linear-gradient(135deg,#0ea5e9,#6366f1)"
                      : "linear-gradient(135deg,#7c3aed,#db2777)",
                    display: "grid", placeItems: "center", fontSize: "55px",
                  }}
                >
                  {playlist.emoji}
                </div>

                {/* INFO */}
                <div className="song-info">
                  <div className="song-title">{playlist.name}</div>

                  <div className="artist">
                    {loadingPlaylists && playlist.id !== "favorites" && !playlist.custom
                      ? "Loading songs..."
                      : `${playlistSongList.length} songs`}
                  </div>

                  <div className="artist" style={{ marginTop: "5px", fontSize: "0.82rem" }}>
                    {playlist.description}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setSelectedPlaylist(playlist); }}
                    style={{
                      width: "100%", marginTop: "10px", padding: "9px",
                      border: "none", borderRadius: "9px",
                      background: "rgba(139,92,246,0.2)",
                      color: "inherit", cursor: "pointer", fontWeight: "600",
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

      {playlists.length > 4 && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: "18px" }}>
          <button
            type="button"
            onClick={() => setShowAllPlaylists((prev) => !prev)}
            style={{
              padding: "8px 22px", border: "1px solid rgba(139,92,246,0.4)",
              borderRadius: "10px", background: "rgba(139,92,246,0.15)",
              color: "#a855f7", cursor: "pointer", fontSize: "0.88rem",
              fontWeight: "600"
            }}
          >
            {showAllPlaylists ? "Show Less Playlists ↑" : `Show All ${playlists.length} Playlists ↓`}
          </button>
        </div>
      )}

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

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={() => openAddSongsModal(selectedPlaylist)}
                style={{
                  padding: "9px 18px",
                  borderRadius: "10px",
                  border: "none",
                  background: "linear-gradient(135deg, #a855f7, #6366f1)",
                  color: "#fff",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                + Add Songs
              </button>
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

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(14px)",
            zIndex: 100000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            style={{
              backgroundColor: "#161b22",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "20px",
              padding: "24px 28px",
              maxWidth: "520px",
              width: "100%",
              maxHeight: "78vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 25px 60px rgba(0,0,0,0.8)",
              color: "#fff",
              boxSizing: "border-box",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexShrink: 0 }}>
              <h2 style={{ fontSize: "20px", fontWeight: "700", margin: 0 }}>Create New Playlist</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: "none", border: "none", color: "#aaa", fontSize: "22px", cursor: "pointer", padding: "4px" }}
              >
                ✕
              </button>
            </div>

            <div style={{ overflowY: "auto", flex: 1, paddingRight: "4px" }}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "13px", color: "#aaa", display: "block", marginBottom: "6px" }}>Playlist Name</label>
                <input
                  type="text"
                  placeholder="e.g. Chill Vibes, Workout Mix..."
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid rgba(255,255,255,0.2)",
                    background: "rgba(255,255,255,0.05)",
                    color: "#fff",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "13px", color: "#aaa", display: "block", marginBottom: "6px" }}>Choose Emoji</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {["🎵", "🎧", "🔥", "🌙", "⚡", "💖", "🎷", "🎸", "🌊", "☕"].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setNewPlaylistEmoji(emoji)}
                      style={{
                        fontSize: "18px",
                        padding: "6px 10px",
                        borderRadius: "8px",
                        border: newPlaylistEmoji === emoji ? "2px solid #a855f7" : "1px solid rgba(255,255,255,0.1)",
                        background: newPlaylistEmoji === emoji ? "rgba(168,85,247,0.2)" : "rgba(255,255,255,0.05)",
                        cursor: "pointer",
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "13px", color: "#aaa", display: "block", marginBottom: "6px" }}>🎤 Pick Artist (Dropdown)</label>
                <select
                  value={selectedArtist}
                  onChange={(e) => {
                    const art = e.target.value;
                    setSelectedArtist(art);
                    if (art) {
                      openSongPicker(art);
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid rgba(255,255,255,0.2)",
                    background: "#1e293b",
                    color: "#fff",
                    fontSize: "14px",
                    boxSizing: "border-box",
                    cursor: "pointer",
                    marginBottom: "10px",
                  }}
                >
                  <option value="">-- Choose Artist Dropdown --</option>
                  {artistDropdownList.map((art) => (
                    <option key={art} value={art}>
                      🎤 {art}
                    </option>
                  ))}
                </select>

                <label style={{ fontSize: "13px", color: "#aaa", display: "block", marginBottom: "6px" }}>Or Search Songs</label>
                <div style={{ marginBottom: "10px" }}>
                  <input
                    type="text"
                    placeholder="Search songs to add..."
                    value={songPickerQuery}
                    onChange={(e) => setSongPickerQuery(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      border: "1px solid rgba(255,255,255,0.15)",
                      background: "rgba(255,255,255,0.05)",
                      color: "#fff",
                      fontSize: "13px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {availableSongs.length > 0 && (
                  <div style={{ maxHeight: "160px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "5px" }}>
                    {availableSongs.map((song, i) => {
                      const songId = song.track_name + "|" + song.artists;
                      const isSelected = selectedSongIds.includes(songId);
                      return (
                        <div
                          key={i}
                          onClick={() => toggleSongSelection(song)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "7px 10px",
                            borderRadius: "7px",
                            background: isSelected ? "rgba(168,85,247,0.25)" : "rgba(255,255,255,0.03)",
                            border: isSelected ? "1px solid #a855f7" : "1px solid transparent",
                            cursor: "pointer",
                          }}
                        >
                          <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, paddingRight: "8px" }}>
                            <span style={{ fontSize: "13px", fontWeight: "600", color: "#fff" }}>{song.track_name}</span>
                            <span style={{ fontSize: "11px", color: "#aaa", marginLeft: "6px" }}>- {song.artists}</span>
                          </div>
                          <span style={{ color: isSelected ? "#a855f7" : "#666", fontWeight: "bold", fontSize: "14px" }}>
                            {isSelected ? "✓" : "+"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
                paddingTop: "14px",
                marginTop: "10px",
                borderTop: "1px solid rgba(255,255,255,0.1)",
                flexShrink: 0,
              }}
            >
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  padding: "9px 18px",
                  borderRadius: "9px",
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "transparent",
                  color: "#ccc",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={createPlaylist}
                disabled={!newPlaylistName.trim()}
                style={{
                  padding: "9px 20px",
                  borderRadius: "9px",
                  border: "none",
                  background: newPlaylistName.trim() ? "linear-gradient(135deg, #a855f7, #6366f1)" : "#444",
                  color: "#fff",
                  fontWeight: "700",
                  fontSize: "13px",
                  cursor: newPlaylistName.trim() ? "pointer" : "not-allowed",
                  opacity: newPlaylistName.trim() ? 1 : 0.5,
                }}
              >
                Create Playlist ({selectedSongIds.length} songs)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Songs to Existing Playlist Modal */}
      {showAddSongsModal && targetPlaylistForAdd && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(14px)",
            zIndex: 100000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            style={{
              backgroundColor: "#161b22",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "20px",
              padding: "24px 28px",
              maxWidth: "520px",
              width: "100%",
              maxHeight: "78vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 25px 60px rgba(0,0,0,0.8)",
              color: "#fff",
              boxSizing: "border-box",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexShrink: 0 }}>
              <h2 style={{ fontSize: "20px", fontWeight: "700", margin: 0 }}>
                Add Songs to "{targetPlaylistForAdd.name}"
              </h2>
              <button
                onClick={() => setShowAddSongsModal(false)}
                style={{ background: "none", border: "none", color: "#aaa", fontSize: "22px", cursor: "pointer", padding: "4px" }}
              >
                ✕
              </button>
            </div>

            <div style={{ overflowY: "auto", flex: 1, paddingRight: "4px" }}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "13px", color: "#aaa", display: "block", marginBottom: "6px" }}>🎤 Pick Artist (Dropdown)</label>
                <select
                  value={selectedArtist}
                  onChange={(e) => {
                    const art = e.target.value;
                    setSelectedArtist(art);
                    if (art) {
                      openSongPicker(art);
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid rgba(255,255,255,0.2)",
                    background: "#1e293b",
                    color: "#fff",
                    fontSize: "14px",
                    boxSizing: "border-box",
                    cursor: "pointer",
                    marginBottom: "10px",
                  }}
                >
                  <option value="">-- Choose Artist Dropdown --</option>
                  {artistDropdownList.map((art) => (
                    <option key={art} value={art}>
                      🎤 {art}
                    </option>
                  ))}
                </select>

                <label style={{ fontSize: "13px", color: "#aaa", display: "block", marginBottom: "6px" }}>Or Search Songs</label>
                <div style={{ marginBottom: "10px" }}>
                  <input
                    type="text"
                    placeholder="Search songs or artist..."
                    value={songPickerQuery}
                    onChange={(e) => setSongPickerQuery(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      border: "1px solid rgba(255,255,255,0.15)",
                      background: "rgba(255,255,255,0.05)",
                      color: "#fff",
                      fontSize: "13px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {availableSongs.length > 0 && (
                  <div style={{ maxHeight: "180px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "5px" }}>
                    {availableSongs.map((song, i) => {
                      const songId = song.track_name + "|" + song.artists;
                      const isSelected = selectedSongIds.includes(songId);
                      return (
                        <div
                          key={i}
                          onClick={() => toggleSongSelection(song)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "7px 10px",
                            borderRadius: "7px",
                            background: isSelected ? "rgba(168,85,247,0.25)" : "rgba(255,255,255,0.03)",
                            border: isSelected ? "1px solid #a855f7" : "1px solid transparent",
                            cursor: "pointer",
                          }}
                        >
                          <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, paddingRight: "8px" }}>
                            <span style={{ fontSize: "13px", fontWeight: "600", color: "#fff" }}>{song.track_name}</span>
                            <span style={{ fontSize: "11px", color: "#aaa", marginLeft: "6px" }}>- {song.artists}</span>
                          </div>
                          <span style={{ color: isSelected ? "#a855f7" : "#666", fontWeight: "bold", fontSize: "14px" }}>
                            {isSelected ? "✓" : "+"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
                paddingTop: "14px",
                marginTop: "10px",
                borderTop: "1px solid rgba(255,255,255,0.1)",
                flexShrink: 0,
              }}
            >
              <button
                onClick={() => setShowAddSongsModal(false)}
                style={{
                  padding: "9px 18px",
                  borderRadius: "9px",
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "transparent",
                  color: "#ccc",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={addSongsToExistingPlaylist}
                disabled={selectedSongIds.length === 0}
                style={{
                  padding: "9px 20px",
                  borderRadius: "9px",
                  border: "none",
                  background: selectedSongIds.length > 0 ? "linear-gradient(135deg, #a855f7, #6366f1)" : "#444",
                  color: "#fff",
                  fontWeight: "700",
                  fontSize: "13px",
                  cursor: selectedSongIds.length > 0 ? "pointer" : "not-allowed",
                  opacity: selectedSongIds.length > 0 ? 1 : 0.5,
                }}
              >
                Add {selectedSongIds.length} Songs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}