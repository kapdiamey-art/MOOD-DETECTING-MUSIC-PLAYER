import { useEffect, useState } from "react";
import { usePlayer } from "./PlayerContext";

const API = "http://127.0.0.1:8000";

const categories = [
  {
    emoji: "🔥",
    name: "Trending",
    query: "popular songs",
  },
  {
    emoji: "😊",
    name: "Feel Good",
    query: "happy songs",
  },
  {
    emoji: "😌",
    name: "Chill",
    query: "chill music",
  },
  {
    emoji: "⚡",
    name: "Energy",
    query: "workout songs",
  },
  {
    emoji: "🌙",
    name: "Late Night",
    query: "late night music",
  },
  {
    emoji: "💖",
    name: "Romantic",
    query: "romantic songs",
  },
];

export default function Discover() {
  const {
    currentTrack,
    isPlaying,
    playTrack,
    searchQuery,
  } = usePlayer();

  // Filter displayed songs by local or global search query
  const filterBySearch = (list) => {
    const q = (search || searchQuery || "").trim().toLowerCase();
    if (!q) return list;
    const filtered = list.filter(
      (s) =>
        ((s.track_name || s.song_title || s.title || s.name || "")).toLowerCase().includes(q) ||
        ((s.artists || s.artist || "")).toLowerCase().includes(q) ||
        ((s.genre || "")).toLowerCase().includes(q) ||
        ((s.album || "")).toLowerCase().includes(q)
    );
    return filtered.length > 0 ? filtered : list;
  };

  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState("Trending");
  const [search, setSearch] = useState("");

  // =====================================================
  // LOAD SONGS
  // =====================================================

  async function loadSongs(query) {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API}/spotify/search?q=${encodeURIComponent(query)}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail || "Could not load songs"
        );
      }

      const results = Array.isArray(data?.results)
        ? data.results
        : [];

      setSongs(results);

      if (results.length === 0) {
        setError(
          "No songs found. Try another mood."
        );
      }
    } catch (err) {
      console.error(err);

      setSongs([]);

      setError(
        "Could not load songs. Make sure your backend is running."
      );
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    loadSongs("popular songs");
  }, []);

  // =====================================================
  // CATEGORY
  // =====================================================

  function selectCategory(category) {
    setSelectedCategory(category.name);
    setSearch("");

    loadSongs(category.query);
  }

  // Reactive automatic search as user types
  useEffect(() => {
    const q = (search || searchQuery || "").trim();
    if (!q) return;
    const timer = setTimeout(() => {
      setSelectedCategory("");
      loadSongs(q);
    }, 250);
    return () => clearTimeout(timer);
  }, [search, searchQuery]);

  // =====================================================
  // PLAY SONG
  // =====================================================

  function handlePlay(song) {
    if (!song) return;

    playTrack(song, songs);
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="discover-page">

      {/* HEADER */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "20px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 className="page-title">
            Discover 🎵
          </h1>

          <p className="page-description">
            Find your next favorite song.
          </p>
        </div>

        {/* SEARCH */}

        <div
          style={{
            width: "min(340px, 100%)",
          }}
        >
          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search songs or artists..."
            style={{
              width: "100%",
              padding: "12px 18px",
              borderRadius: "14px",
              border:
                "1px solid rgba(255,255,255,0.18)",
              background:
                "rgba(255,255,255,0.06)",
              color: "white",
              outline: "none",
              fontSize: "0.95rem",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      {/* MOODS */}

      <div
        className="section-header"
        style={{
          marginTop: "30px",
        }}
      >
        <h2>
          Explore by mood
        </h2>
      </div>

      <div className="song-grid">

        {categories.map((category) => {

          const active =
            selectedCategory === category.name;

          return (
            <div
              key={category.name}
              className="glass"
              onClick={() =>
                selectCategory(category)
              }
              style={{
                padding: "25px",
                borderRadius: "20px",
                cursor: "pointer",
                border: active
                  ? "1px solid #8b5cf6"
                  : "1px solid rgba(255,255,255,0.08)",
                transform: active
                  ? "translateY(-3px)"
                  : "none",
                transition:
                  "0.2s ease",
              }}
            >

              <div
                style={{
                  fontSize: "42px",
                  marginBottom: "12px",
                }}
              >
                {category.emoji}
              </div>

              <h3>
                {category.name}
              </h3>

              <p className="artist">
                Click to explore →
              </p>

            </div>
          );
        })}

      </div>

      {/* SONG SECTION */}

      <div
        className="section-header"
        style={{
          marginTop: "35px",
        }}
      >
        <h2>
          {selectedCategory
            ? `${selectedCategory} Songs`
            : "Search Results"}
        </h2>
      </div>

      {/* LOADING */}

      {loading && (
        <div
          className="dashboard-hero"
          style={{
            textAlign: "center",
            padding: "50px",
          }}
        >
          <div style={{ fontSize: "40px" }}>
            🎧
          </div>

          <h3>
            Finding songs...
          </h3>

          <p>
            Loading music for you.
          </p>
        </div>
      )}

      {/* ERROR */}

      {!loading && error && (
        <div
          className="dashboard-hero"
          style={{
            textAlign: "center",
            padding: "50px",
          }}
        >
          <div style={{ fontSize: "40px" }}>
            😕
          </div>

          <h3>
            Unable to load songs
          </h3>

          <p>
            {error}
          </p>

          <button
            onClick={() =>
              loadSongs("popular songs")
            }
            style={{
              marginTop: "15px",
              padding: "11px 20px",
              border: "none",
              borderRadius: "10px",
              background:
                "linear-gradient(135deg,#8b5cf6,#ec4899)",
              color: "white",
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* SONG CARDS */}

      {!loading &&
        !error &&
        songs.length > 0 && (

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill,minmax(210px,1fr))",
              gap: "20px",
              paddingBottom: "130px",
            }}
          >

            {filterBySearch(songs).length === 0 && searchQuery ? (
              <div style={{ gridColumn: "1/-1", textAlign: "center", color: "var(--text-secondary)", padding: "40px 0" }}>
                No songs match &ldquo;<strong>{searchQuery}</strong>&rdquo;
              </div>
            ) : null}
            {filterBySearch(songs).map((song, index) => {

              const title =
                song.track_name ||
                song.name ||
                "Unknown Song";

              const artist =
                song.artists ||
                song.artist ||
                "Unknown Artist";

              const image =
                song.album_image ||
                song.image ||
                song.album_art;

              const isCurrent =
                currentTrack?.track_name ===
                  song.track_name &&
                currentTrack?.artists ===
                  song.artists;

              return (
                <div
                  className="glass"
                  key={`${title}-${artist}-${index}`}
                  style={{
                    padding: "14px",
                    borderRadius: "18px",
                    overflow: "hidden",
                    border: isCurrent
                      ? "1px solid #8b5cf6"
                      : "1px solid rgba(255,255,255,0.08)",
                  }}
                >

                  {/* ALBUM IMAGE */}

                  <div
                    style={{
                      width: "100%",
                      aspectRatio: "1",
                      borderRadius: "14px",
                      overflow: "hidden",
                      background:
                        "linear-gradient(135deg,#8b5cf6,#ec4899)",
                      marginBottom: "14px",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >

                    {image ? (
                      <img
                        src={image}
                        alt={title}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          fontSize: "55px",
                        }}
                      >
                        🎵
                      </span>
                    )}

                  </div>

                  {/* SONG TITLE */}

                  <h3
                    style={{
                      margin: "0 0 6px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                    title={title}
                  >
                    {title}
                  </h3>

                  {/* ARTIST */}

                  <p
                    className="artist"
                    style={{
                      margin: "0 0 15px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                    title={artist}
                  >
                    {artist}
                  </p>

                  {/* PLAY BUTTON */}

                  <button
                    onClick={() =>
                      handlePlay(song)
                    }
                    style={{
                      width: "100%",
                      padding: "11px",
                      border: "none",
                      borderRadius: "10px",
                      background:
                        isCurrent && isPlaying
                          ? "rgba(236,72,153,0.25)"
                          : "linear-gradient(135deg,#8b5cf6,#ec4899)",
                      color: "white",
                      cursor: "pointer",
                      fontWeight: "600",
                    }}
                  >
                    {isCurrent && isPlaying
                      ? "⏸ Playing"
                      : "▶ Play Song"}
                  </button>

                </div>
              );
            })}

          </div>
        )}

    </div>
  );
}